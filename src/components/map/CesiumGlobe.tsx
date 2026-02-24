import { useEffect, useRef, memo, useCallback, useState } from 'react';
import { useWorldViewStore, NUCLEAR_SITES, FollowTarget, LANDMARK_PRESETS } from '@/store/worldview';
import { CONFLICT_ZONES } from '@/components/map/GlobeContainer';
import { SUBMARINE_CABLES } from '@/data/submarineCables';
import { MILITARY_BASES, SPACEPORTS, CHOKEPOINTS, DATACENTERS, CRITICAL_MINERALS } from '@/data/staticLayers';
import { PUBLIC_CAMERAS, PublicCamera } from '@/data/publicCameras';
import { PIPELINES } from '@/data/pipelines';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const CESIUM_ION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1MTc3NzFmNC00YjIzLTRiOTMtOWIyOS0xMTk1ODc2ZTFhMzMiLCJpZCI6MzkyNzUzLCJpYXQiOjE3NzE2ODU5MTF9.p0XfsErBiodr_aoqJrP94tujxAupsPU2TRxPJO56dkM';

Cesium.Ion.defaultAccessToken = CESIUM_ION_TOKEN;

const CesiumGlobe = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entitiesRef = useRef<Cesium.Entity[]>([]);
  const [ready, setReady] = useState(false);

  const {
    layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels,
    protests, outages, fires, setDetailPanel, setActiveLivestream, mapCenter,
    followTarget, setFollowTarget, layerSubFilters
  } = useWorldViewStore();

  // Initialize Cesium viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      vrButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      creditContainer: document.createElement('div'),
      msaaSamples: 4,
      skyAtmosphere: new Cesium.SkyAtmosphere(),
    });

    // Add Google Photorealistic 3D Tiles + OSM Buildings
    const add3DTiles = async () => {
      try {
        // Google Photorealistic 3D Tiles — shows real-world buildings, terrain, vegetation
        const googleTileset = await Cesium.createGooglePhotorealistic3DTileset();
        viewer.scene.primitives.add(googleTileset);
        // Hide the default globe since Google tiles cover everything
        viewer.scene.globe.show = false;
      } catch (err) {
        console.warn('Google 3D Tiles failed, falling back to OSM Buildings:', err);
        // Fallback: Cesium OSM Buildings (free via Ion)
        try {
          const osmBuildings = await Cesium.createOsmBuildingsAsync();
          viewer.scene.primitives.add(osmBuildings);
        } catch (e2) {
          console.warn('OSM Buildings also failed:', e2);
        }
      }
    };
    add3DTiles();

    // Scene settings
    try {
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.atmosphereLightIntensity = 8.0;
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0002;
      viewer.scene.skyBox.show = true;
    } catch {}

    // Darker background for night side
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0a0a');

    // Set initial camera position — global view
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, 25000000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
    });

    // Click handler for entities
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: any) => {
      const picked = viewer.scene.pick(movement.position);
      if (Cesium.defined(picked) && picked.id && picked.id._customData) {
        const data = picked.id._customData;
        if (data.onClick) data.onClick();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;
    setReady(true);

    return () => {
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Fly to mapCenter
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !mapCenter) return;

    const altitude = mapCenter.zoom ? Math.max(1000, Math.pow(2, 22 - mapCenter.zoom)) : 25000000;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(mapCenter.lon, mapCenter.lat, altitude * 4),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-55),
        roll: 0,
      },
      duration: 2.5,
    });
  }, [mapCenter]);

  // Follow target
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !followTarget) return;

    const range = followTarget.type === 'satellite' ? 150000 : followTarget.type === 'aircraft' ? 8000 : 3000;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(followTarget.lon, followTarget.lat, followTarget.altitude + range),
      orientation: {
        heading: Cesium.Math.toRadians(followTarget.heading),
        pitch: Cesium.Math.toRadians(-55),
        roll: 0,
      },
      duration: 3,
    });

    const interval = setInterval(() => {
      const ft = useWorldViewStore.getState().followTarget;
      if (!ft) { clearInterval(interval); return; }
      const state = useWorldViewStore.getState();
      let lat = ft.lat, lon = ft.lon, alt = ft.altitude;
      if (ft.type === 'aircraft') {
        const ac = state.aircraft.find(a => a.callsign === ft.id);
        if (ac) { lat = ac.lat; lon = ac.lon; alt = Math.max(ac.altitudeFt * 0.3048, 500); }
      } else if (ft.type === 'satellite') {
        const sat = state.satellites.find(s => s.name === ft.id);
        if (sat) { lat = sat.lat; lon = sat.lon; alt = sat.alt * 1000; }
      } else if (ft.type === 'vessel') {
        const v = state.vessels.find(v => v.id === ft.id);
        if (v) { lat = v.lat; lon = v.lon; }
      }
      viewer.camera.lookAt(
        Cesium.Cartesian3.fromDegrees(lon, lat, alt),
        new Cesium.HeadingPitchRange(viewer.camera.heading, viewer.camera.pitch, range)
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [followTarget?.id, followTarget?.type]);

  // Render all data entities
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Clear previous entities
    entitiesRef.current.forEach(e => {
      try { viewer.entities.remove(e); } catch {}
    });
    entitiesRef.current = [];

    const addPoint = (lat: number, lon: number, color: string, size: number, label: string, alt: number = 0, onClick?: () => void) => {
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
        point: {
          pixelSize: size,
          color: Cesium.Color.fromCssColorString(color),
          outlineColor: Cesium.Color.fromCssColorString(color).withAlpha(0.3),
          outlineWidth: 3,
          heightReference: alt > 100 ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1.5, 5000000, 0.4),
        },
        label: {
          text: label,
          font: '10px monospace',
          fillColor: Cesium.Color.fromCssColorString(color),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -size - 4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1, 5000000, 0.3),
          showBackground: true,
          backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
          backgroundPadding: new Cesium.Cartesian2(4, 2),
        },
      });
      (entity as any)._customData = { onClick };
      entitiesRef.current.push(entity);
      return entity;
    };

    const addBillboard = (lat: number, lon: number, text: string, color: string, label: string, alt: number = 0, onClick?: () => void) => {
      // Use a canvas to render emoji as billboard
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d')!;
      ctx.font = '36px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 24, 24);

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
        billboard: {
          image: canvas.toDataURL(),
          width: 32,
          height: 32,
          heightReference: alt > 100 ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1.5, 5000000, 0.4),
        },
        label: {
          text: label,
          font: '9px monospace',
          fillColor: Cesium.Color.fromCssColorString(color),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -24),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1, 5000000, 0.3),
          showBackground: true,
          backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
          backgroundPadding: new Cesium.Cartesian2(4, 2),
        },
      });
      (entity as any)._customData = { onClick };
      entitiesRef.current.push(entity);
      return entity;
    };

    // Aircraft
    if (layers.aircraft) {
      let filtered = aircraft.filter(ac => {
        if (!layers.militaryFlights && ac.isMilitary) return false;
        if (!layerSubFilters.showMilitaryAC && ac.isMilitary) return false;
        if (!layerSubFilters.showCivilian && !ac.isMilitary) return false;
        return true;
      });
      if (layerSubFilters.maxAircraft < 100) {
        filtered = filtered.slice(0, Math.round(filtered.length * (layerSubFilters.maxAircraft / 100)));
      }
      filtered.forEach(ac => {
        const color = ac.isMilitary ? '#ff6b35' : '#00ff88';
        const alt = Math.max(ac.altitudeFt * 0.3048, 500);
        addPoint(ac.lat, ac.lon, color, ac.isMilitary ? 8 : 6, `✈ ${ac.callsign}`, alt, () => {
          setDetailPanel({ type: 'aircraft', data: ac });
          setFollowTarget({ type: 'aircraft', id: ac.callsign, lat: ac.lat, lon: ac.lon, heading: ac.heading, altitude: alt, speed: ac.speedKts * 1.852 });
        });
      });
    }

    // Satellites
    if (layers.satellites) {
      satellites.forEach(sat => {
        const isISS = sat.name.includes('ISS');
        const isMil = sat.name.includes('COSMOS') || sat.name.includes('USA-') || sat.name.includes('MUOS') || sat.name.includes('NROL');
        const isStarlink = sat.name.includes('STARLINK');
        const isDebris = sat.name.includes('DEBRIS');
        if (isStarlink && !layerSubFilters.showStarlink) return;
        if (isMil && !layerSubFilters.showMilitarySats) return;
        if (isDebris && !layerSubFilters.showDebris) return;
        if (!isISS && !isMil && !isStarlink && !isDebris && !layerSubFilters.showCommSats) return;
        const color = isStarlink ? '#a855f7' : isMil ? '#ff6b35' : isISS ? '#ff6600' : isDebris ? '#666666' : '#00d4ff';
        const alt = sat.alt * 1000;
        addPoint(sat.lat, sat.lon, color, isISS ? 12 : 5, isISS ? '🛰 ISS' : sat.name.substring(0, 12), alt, () => {
          setDetailPanel({ type: 'satellite', data: sat });
          setFollowTarget({ type: 'satellite', id: sat.name, lat: sat.lat, lon: sat.lon, heading: 0, altitude: alt, speed: sat.velocity * 3600 });
        });
      });
    }

    // Earthquakes
    if (layers.earthquakes) {
      earthquakes.filter(eq => eq.magnitude >= layerSubFilters.minMagnitude).forEach(eq => {
        const color = eq.magnitude >= 6 ? '#ff0044' : eq.magnitude >= 4.5 ? '#ff6600' : '#aa44ff';
        addPoint(eq.lat, eq.lon, color, Math.max(eq.magnitude * 3, 6), `M${eq.magnitude}`, 0, () => {
          setDetailPanel({ type: 'earthquake', data: eq });
        });
      });
    }

    // Conflict zones
    if (layers.conflicts) {
      CONFLICT_ZONES.forEach(cz => {
        const color = cz.intensity >= 8 ? '#ff0044' : cz.intensity >= 6 ? '#ff6b35' : '#ffb000';
        addBillboard(cz.lat, cz.lon, '⚔️', color, cz.name.split('–')[0]);
      });
    }

    // Volcanoes
    if (layers.volcanoes) {
      volcanoes.forEach(v => {
        const color = v.status === 'erupting' ? '#ff0044' : v.status === 'warning' ? '#ff6b35' : '#ffb000';
        addBillboard(v.lat, v.lon, '🌋', color, v.name, v.elevation, () => {
          setDetailPanel({ type: 'volcano', data: v });
        });
      });
    }

    // Vessels
    if (layers.vessels) {
      const vesselTypeMap: Record<string, keyof typeof layerSubFilters> = {
        yacht: 'showYachts', cargo: 'showCargo', tanker: 'showTankers',
        military: 'showMilVessels', fishing: 'showFishing', passenger: 'showPassenger',
      };
      vessels.forEach(v => {
        const filterKey = vesselTypeMap[v.type];
        if (filterKey && !layerSubFilters[filterKey]) return;
        const colors: Record<string, string> = { yacht: '#FFD700', cargo: '#4488ff', tanker: '#ff8800', military: '#ff0044', fishing: '#44ff88', passenger: '#ff44ff', container: '#00aaff' };
        const emoji = v.type === 'yacht' ? '🛥' : v.type === 'military' ? '⚓' : '🚢';
        addPoint(v.lat, v.lon, colors[v.type] || '#4488ff', 6, `${emoji} ${v.name.substring(0, 10)}`, 0, () => {
          setDetailPanel({ type: 'vessel', data: v });
          setFollowTarget({ type: 'vessel', id: v.id, lat: v.lat, lon: v.lon, heading: v.heading, altitude: 0, speed: v.speedKnots * 1.852 });
        });
      });
    }

    // Protests
    if (layers.protests) {
      protests.forEach(p => {
        addBillboard(p.lat, p.lon, '✊', '#ff0088', p.country, 0, () => {
          setDetailPanel({ type: 'protest', data: p });
        });
      });
    }

    // Outages
    if (layers.outages) {
      const icons: Record<string, string> = { internet: '🌐', power: '⚡', cyber: '🔒', telecom: '📡', ddos: '💀', ransomware: '🔐' };
      outages.forEach(o => {
        addBillboard(o.lat, o.lon, icons[o.type] || '⚠', '#ff6b35', o.type.toUpperCase(), 0, () => {
          setDetailPanel({ type: 'outage', data: o });
        });
      });
    }

    // Weather
    if (layers.weather) {
      weatherAlerts.filter(w => !layerSubFilters.showExtremeOnly || w.isExtreme).forEach(w => {
        const color = w.isExtreme ? '#ff0044' : w.temp > 35 ? '#ff6b35' : w.temp < 0 ? '#00d4ff' : '#ffb000';
        addBillboard(w.lat, w.lon, w.isExtreme ? '⚠️' : '🌡', color, `${Math.round(w.temp)}°C`, 0, () => {
          setDetailPanel({ type: 'weather', data: w });
        });
      });
    }

    // Nuclear sites
    if (layers.nuclearSites) {
      NUCLEAR_SITES.forEach(site => {
        const isWeapon = site.type === 'weapons';
        const isPower = site.type === 'power' || site.type === 'enrichment' || site.type === 'reprocessing';
        if (isWeapon && !layerSubFilters.showWeapons) return;
        if (isPower && !layerSubFilters.showPower) return;
        addBillboard(site.lat, site.lon, '☢️', '#bbff00', site.name);
      });
    }

    // Submarine cables as polylines
    if (layers.underseaCables) {
      SUBMARINE_CABLES.forEach(cable => {
        const positions = cable.coordinates.flatMap(([lat, lon]: [number, number]) =>
          [lon, lat, 0]
        );
        const entity = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
            width: 2,
            material: Cesium.Color.fromCssColorString(cable.color).withAlpha(0.7),
            clampToGround: true,
          },
        });
        entitiesRef.current.push(entity);
      });
    }

    // Fires
    if (layers.fires) {
      fires.forEach(f => {
        const isWildfire = f.category === 'wildfire' || f.category === 'volcano';
        const isStorm = f.category === 'storm' || f.category === 'flood';
        if (isWildfire && !layerSubFilters.showWildfires) return;
        if (isStorm && !layerSubFilters.showStorms) return;
        const icons: Record<string, string> = { wildfire: '🔥', volcano: '🌋', storm: '🌀', flood: '🌊', earthquake: '💥', drought: '☀️', landslide: '⛰️', other: '⚠️' };
        const colors: Record<string, string> = { wildfire: '#ff4400', volcano: '#ff0044', storm: '#00d4ff', flood: '#4488ff', earthquake: '#ff6600', drought: '#ffb000', landslide: '#aa6633', other: '#ff6b35' };
        addBillboard(f.lat, f.lon, icons[f.category] || '🔥', colors[f.category] || '#ff4400', f.title.substring(0, 16), 0, () => {
          setDetailPanel({ type: 'fire', data: f });
        });
      });
    }

    // Pipelines
    if (layers.pipelines) {
      PIPELINES.forEach(pipe => {
        const positions = pipe.coordinates.flatMap(([lat, lon]) => [lon, lat, 0]);
        const entity = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
            width: 3,
            material: Cesium.Color.fromCssColorString(pipe.color).withAlpha(0.7),
            clampToGround: true,
          },
        });
        entitiesRef.current.push(entity);
      });
    }

    // Cameras
    if (layers.cameras) {
      PUBLIC_CAMERAS.forEach(cam => {
        addBillboard(cam.lat, cam.lon, '📹', '#fbbf24', cam.name.substring(0, 14), 0, () => {
          setDetailPanel({ type: 'camera', data: cam });
          setActiveLivestream(cam.feedType === 'snapshot' ? (cam.snapshotUrl || 'snapshot') : cam.embedUrl);
        });
      });
    }

    // Static layers
    MILITARY_BASES.forEach(b => addBillboard(b.lat, b.lon, '🎖️', '#ff6b35', b.name));
    SPACEPORTS.forEach(s => addBillboard(s.lat, s.lon, '🚀', '#00d4ff', s.name));
    CHOKEPOINTS.forEach(c => addBillboard(c.lat, c.lon, '⚓', '#ff0088', c.name));
    if (layers.datacenters) DATACENTERS.forEach(d => addBillboard(d.lat, d.lon, '🖥️', '#5ab4ff', d.name));
    CRITICAL_MINERALS.forEach(m => addBillboard(m.lat, m.lon, '💎', '#ffb000', m.mineral));

  }, [layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, fires, setDetailPanel, setActiveLivestream, setFollowTarget, layerSubFilters]);

  // Auto-orbit when idle
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;

    let idleTimer: ReturnType<typeof setTimeout>;
    let orbitInterval: ReturnType<typeof setInterval> | null = null;
    let idx = 0;

    const ORBIT_LOCS = LANDMARK_PRESETS.filter(l =>
      ['NEW YORK', 'TOKYO', 'DUBAI', 'PARIS', 'SYDNEY', 'PYRAMIDS', 'SINGAPORE', 'LONDON'].includes(l.label)
    );

    const startOrbit = () => {
      if (followTarget || orbitInterval) return;
      const flyNext = () => {
        const loc = ORBIT_LOCS[idx % ORBIT_LOCS.length];
        idx++;
        const alt = Math.max(2000, Math.pow(2, 22 - loc.zoom) * 2);
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat, alt),
          orientation: { heading: Cesium.Math.toRadians(Math.random() * 360), pitch: Cesium.Math.toRadians(-55), roll: 0 },
          duration: 5,
        });
      };
      flyNext();
      orbitInterval = setInterval(flyNext, 20000);
    };

    const stopOrbit = () => {
      if (orbitInterval) { clearInterval(orbitInterval); orbitInterval = null; }
    };

    const resetIdle = () => {
      stopOrbit();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(startOrbit, 25000);
    };

    const events = ['click', 'mousedown', 'wheel', 'touchstart', 'keydown'];
    events.forEach(e => containerRef.current?.addEventListener(e, resetIdle, { passive: true }));
    idleTimer = setTimeout(startOrbit, 25000);

    return () => {
      stopOrbit();
      clearTimeout(idleTimer);
      events.forEach(e => containerRef.current?.removeEventListener(e, resetIdle));
    };
  }, [ready, followTarget]);

  return (
    <div className="w-full h-full relative bg-background">
      <div ref={containerRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-3">
              <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-2 border border-primary/10 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <span className="text-[11px] font-display tracking-[0.25em] text-primary glow-green">INITIALIZING CESIUM GLOBE</span>
            <div className="text-[8px] font-data text-muted-foreground/60 mt-1 tracking-wider">CESIUM ION 3D TILES</div>
          </div>
        </div>
      )}
    </div>
  );
});

CesiumGlobe.displayName = 'CesiumGlobe';
export default CesiumGlobe;
