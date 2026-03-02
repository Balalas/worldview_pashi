import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWorldViewStore, NUCLEAR_SITES } from '@/store/worldview';
import { CONFLICT_ZONES } from '@/data/conflictZones';
import { SUBMARINE_CABLES } from '@/data/submarineCables';
import { PUBLIC_CAMERAS } from '@/data/publicCameras';
import { COUNTRY_META } from '@/data/countryMeta';
import { getCameraSourceColor, getCameraSourceLabel } from '@/services/cameraService';
import * as topojson from 'topojson-client';

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

const MapContainer = memo(() => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Record<string, L.LayerGroup>>({});
  const geoLayerRef = useRef<L.GeoJSON | null>(null);

  const { layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, fires, liveCameras, setDetailPanel, setActiveLivestream, mapCenter, twitterGeoMarkers, news, setMapCenter } = useWorldViewStore();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [20, 0], zoom: 3, zoomControl: false, attributionControl: true, preferCanvas: true,
      doubleClickZoom: false,
      maxBoundsViscosity: 1.0,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    ['aircraft', 'satellites', 'earthquakes', 'conflicts', 'cables', 'weather', 'volcanoes', 'nuclear', 'vessels', 'protests', 'outages', 'cameras', 'fires', 'twitterOsint', 'newsMarkers'].forEach((key) => {
      layersRef.current[key] = L.layerGroup().addTo(map);
    });

    // Load country boundaries
    fetch(WORLD_TOPO_URL)
      .then(r => r.json())
      .then(topo => {
        const geojson = topojson.feature(topo, topo.objects.countries) as any;
        const geoLayer = L.geoJSON(geojson, {
          style: () => ({
            fillColor: 'transparent',
            fillOpacity: 0,
            color: 'hsl(var(--primary))',
            weight: 0.4,
            opacity: 0.3,
          }),
          onEachFeature: (feature, layer) => {
            const numericId = String(feature.id || feature.properties?.id);
            const meta = COUNTRY_META[numericId];
            const countryName = meta?.name || feature.properties?.name || 'Unknown';
            const flag = meta?.flag || '🏳';
            const code = meta?.code || 'XX';

            layer.on({
              mouseover: (e) => {
                const l = e.target;
                l.setStyle({
                  weight: 1.2,
                  opacity: 0.6,
                });
                l.bringToFront();
              },
              mouseout: (e) => {
                geoLayer.resetStyle(e.target);
              },
              click: () => {
                // Open the full Country Dossier overlay
                const state = useWorldViewStore.getState();
                // Try to find enriched country data
                import('@/services/countryService').then(({ searchCountries }) => {
                  const matches = searchCountries(countryName);
                  if (matches.length > 0) {
                    state.openCountryDossier(matches[0]);
                  } else {
                    // Fallback with minimal data
                    state.openCountryDossier({
                      name: countryName,
                      officialName: countryName,
                      code,
                      flag,
                      population: 0,
                      area: 0,
                      region: '',
                      subregion: '',
                      capital: '',
                      languages: [],
                      currencies: [],
                      timezones: [],
                      borders: [],
                      lat: 0,
                      lon: 0,
                      unMember: false,
                      landlocked: false,
                    });
                  }
                });
              },
            });

            layer.bindTooltip(`${flag} ${countryName}`, {
              sticky: true,
              className: 'country-tooltip',
              direction: 'top',
              offset: [0, -10],
            });
          },
        }).addTo(map);
        geoLayerRef.current = geoLayer;
      })
      .catch(err => console.warn('Failed to load country boundaries:', err));

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [setDetailPanel]);

  useEffect(() => {
    if (mapInstanceRef.current && mapCenter) {
      mapInstanceRef.current.flyTo([mapCenter.lat, mapCenter.lon], mapCenter.zoom, { duration: 1.5 });
    }
  }, [mapCenter]);

  // Render cameras — curated + live API cameras with FOV cones
  useEffect(() => {
    const group = layersRef.current['cameras'];
    if (!group) return;
    group.clearLayers();
    if (!layers.cameras) return;

    // FOV cone helper
    const addFovCone = (lat: number, lon: number, heading: number, color: string) => {
      const FOV_DEG = 70;
      const FOV_RANGE_KM = 0.35; // 350m in km
      const halfFov = FOV_DEG / 2;
      const steps = 12;
      const points: [number, number][] = [[lat, lon]];
      for (let i = 0; i <= steps; i++) {
        const angle = heading - halfFov + (FOV_DEG * i) / steps;
        const rad = (angle * Math.PI) / 180;
        const dlat = (FOV_RANGE_KM / 111) * Math.cos(rad);
        const dlon = (FOV_RANGE_KM / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(rad);
        points.push([lat + dlat, lon + dlon]);
      }
      points.push([lat, lon]);
      const polygon = L.polygon(points, { color, fillColor: color, fillOpacity: 0.12, weight: 1, opacity: 0.6, interactive: false });
      group.addLayer(polygon);
    };

    // Curated cameras (YouTube embeds)
    PUBLIC_CAMERAS.forEach(cam => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:16px;height:16px;">
          <div style="position:absolute;inset:0;border:1.5px solid #fbbf24;border-radius:50%;background:#fbbf2420;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;">📹</div>
          ${cam.official ? '<div style="position:absolute;top:-6px;right:-8px;font-size:5px;background:#fbbf24;color:#000;padding:0 2px;border-radius:2px;font-weight:bold;">DOT</div>' : ''}
        </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const marker = L.marker([cam.lat, cam.lon], { icon })
        .on('click', () => {
          setDetailPanel({ type: 'camera', data: cam });
          setActiveLivestream(cam.feedType === 'snapshot' ? (cam.snapshotUrl || 'snapshot') : cam.embedUrl);
        });
      marker.bindTooltip(`📹 ${cam.name} | ${cam.city}`, { direction: 'top', offset: [0, -10] });
      group.addLayer(marker);
      if (cam.heading != null) addFovCone(cam.lat, cam.lon, cam.heading, '#fbbf24');
    });

    // Live API cameras from aggregator
    liveCameras.forEach(cam => {
      const color = getCameraSourceColor(cam.source);
      const label = getCameraSourceLabel(cam.source);
      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:14px;height:14px;">
          <div style="position:absolute;inset:0;border:1.5px solid ${color};border-radius:50%;background:${color}20;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:4px;height:4px;background:${color};border-radius:50%;"></div>
          <div style="position:absolute;top:-7px;right:-10px;font-size:5px;background:${color};color:#000;padding:0 2px;border-radius:2px;font-weight:bold;font-family:monospace;">${label}</div>
        </div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = L.marker([cam.lat, cam.lon], { icon })
        .on('click', () => {
          setDetailPanel({ type: 'camera', data: { ...cam, feedType: 'snapshot', snapshotUrl: cam.imageUrl, name: cam.name, city: cam.region || cam.country } });
          setActiveLivestream(cam.imageUrl);
        });
      marker.bindTooltip(`📷 ${cam.name} | ${label}`, { direction: 'top', offset: [0, -10] });
      group.addLayer(marker);
      if (cam.heading != null) addFovCone(cam.lat, cam.lon, cam.heading, color);
    });
  }, [layers.cameras, liveCameras, setDetailPanel, setActiveLivestream]);

  // Render fires
  useEffect(() => {
    const group = layersRef.current['fires'];
    if (!group) return;
    group.clearLayers();
    if (!layers.fires || fires.length === 0) return;

    fires.forEach(f => {
      const icons: Record<string, string> = { wildfire: '🔥', volcano: '🌋', storm: '🌀', flood: '🌊', earthquake: '💥', drought: '☀️', landslide: '⛰️', other: '⚠️' };
      const colors: Record<string, string> = { wildfire: '#ff4400', volcano: '#ff0044', storm: '#00d4ff', flood: '#4488ff', earthquake: '#ff6600', drought: '#ffb000', landslide: '#aa6633', other: '#ff6b35' };
      const color = colors[f.category] || '#ff4400';
      const emoji = icons[f.category] || '🔥';

      const icon = L.divIcon({
        className: '',
        html: `<div style="font-size:12px;filter:drop-shadow(0 0 4px ${color});">${emoji}</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const marker = L.marker([f.lat, f.lon], { icon })
        .on('click', () => setDetailPanel({ type: 'fire', data: f }));
      marker.bindTooltip(`${emoji} ${f.title.substring(0, 40)}`, { direction: 'top' });
      group.addLayer(marker);
    });
  }, [fires, layers.fires, setDetailPanel]);

  // Render submarine cables
  useEffect(() => {
    const group = layersRef.current['cables'];
    if (!group) return;
    group.clearLayers();
    if (!layers.underseaCables) return;
    SUBMARINE_CABLES.forEach((cable) => {
      const latlngs = cable.coordinates.map(([lat, lon]) => [lat, lon] as [number, number]);
      const polyline = L.polyline(latlngs, { color: cable.color, weight: 1.5, opacity: 0.6, dashArray: '6,4' });
      polyline.bindTooltip(`🔌 ${cable.name} | ${cable.capacity} | ${cable.length}`, { sticky: true });
      polyline.on('click', () => setDetailPanel({ type: 'cable', data: cable }));
      group.addLayer(polyline);
    });
  }, [layers.underseaCables, setDetailPanel]);

  // Render vessels
  useEffect(() => {
    const group = layersRef.current['vessels'];
    if (!group) return;
    group.clearLayers();
    if (!layers.vessels || vessels.length === 0) return;

    vessels.forEach((v) => {
      const colors: Record<string, string> = { yacht: '#FFD700', cargo: '#4488ff', tanker: '#ff8800', military: '#ff0044', fishing: '#44ff88', passenger: '#ff44ff', container: '#00aaff' };
      const color = colors[v.type] || '#4488ff';
      const isYacht = v.type === 'yacht';
      const isMil = v.type === 'military';
      const size = isYacht ? 8 : isMil ? 9 : 6;

      const icon = L.divIcon({
        className: '',
        html: `<svg width="${size * 2}" height="${size * 2}" viewBox="0 0 24 24" style="transform: rotate(${v.heading}deg); filter: drop-shadow(0 0 3px ${color}80);">
          <path d="M12 2L6 18H18L12 2Z" fill="${color}" fill-opacity="0.85" stroke="${color}" stroke-width="0.5"/>
          <path d="M6 18Q12 22 18 18Z" fill="${color}" fill-opacity="0.5"/>
        </svg>`,
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size],
      });

      const marker = L.marker([v.lat, v.lon], { icon })
        .on('click', () => setDetailPanel({ type: 'vessel', data: v }));
      marker.bindTooltip(`${isYacht ? '🛥' : isMil ? '⚓' : '🚢'} ${v.name} | ${v.flag} | ${v.speedKnots}kts${v.destination ? ' → ' + v.destination : ''}`, { direction: 'top', offset: [0, -10] });
      group.addLayer(marker);
    });
  }, [vessels, layers.vessels, setDetailPanel]);

  // Render protests
  useEffect(() => {
    const group = layersRef.current['protests'];
    if (!group) return;
    group.clearLayers();
    if (!layers.protests || protests.length === 0) return;

    protests.forEach((p) => {
      const color = p.intensity === 'large' ? '#ff0088' : p.intensity === 'medium' ? '#ff44aa' : '#ff88cc';
      const size = p.intensity === 'large' ? 20 : p.intensity === 'medium' ? 14 : 10;

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:${size}px;height:${size}px;">
          <div style="position:absolute;inset:0;border:1.5px solid ${color};border-radius:50%;animation:ping-ring 2s ease-out infinite;opacity:0.5;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:${size * 0.7}px;">✊</div>
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([p.lat, p.lon], { icon })
        .on('click', () => setDetailPanel({ type: 'protest', data: p }));
      marker.bindTooltip(`✊ ${p.country} | ${p.intensity.toUpperCase()} | ${p.title.slice(0, 60)}...`, { direction: 'top', offset: [0, -10] });
      group.addLayer(marker);
    });
  }, [protests, layers.protests, setDetailPanel]);

  // Render outages
  useEffect(() => {
    const group = layersRef.current['outages'];
    if (!group) return;
    group.clearLayers();
    if (!layers.outages || outages.length === 0) return;

    outages.forEach((o) => {
      const typeIcons: Record<string, string> = { internet: '🌐', power: '⚡', cyber: '🔒', telecom: '📡', ddos: '💀', ransomware: '🔐' };
      const color = o.severity === 'critical' ? '#ff0044' : o.severity === 'major' ? '#ff6b35' : '#ffb000';

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:18px;height:18px;">
          <div style="position:absolute;inset:0;background:${color}20;border:1px solid ${color}60;border-radius:4px;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:11px;">${typeIcons[o.type] || '⚠'}</div>
        </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([o.lat, o.lon], { icon })
        .on('click', () => setDetailPanel({ type: 'outage', data: o }));
      marker.bindTooltip(`${typeIcons[o.type] || '⚠'} ${o.type.toUpperCase()} | ${o.severity} | ${o.title.slice(0, 60)}...`, { direction: 'top' });
      group.addLayer(marker);
    });
  }, [outages, layers.outages, setDetailPanel]);

  // Render aircraft
  useEffect(() => {
    const group = layersRef.current['aircraft'];
    if (!group) return;
    group.clearLayers();
    if (!layers.aircraft || aircraft.length === 0) return;
    aircraft.forEach((ac) => {
      if (!layers.militaryFlights && ac.isMilitary) return;
      const color = ac.isMilitary ? '#ff6b35' : '#00ff88';
      const size = ac.isMilitary ? 10 : 7;
      const icon = L.divIcon({
        className: '',
        html: `<svg width="${size * 2}" height="${size * 2}" viewBox="0 0 24 24" style="transform: rotate(${ac.heading}deg); filter: drop-shadow(0 0 3px ${color}80);"><path d="M12 2L8 10H3L5 13H9L12 22L15 13H19L21 10H16L12 2Z" fill="${color}" fill-opacity="0.9" stroke="${color}" stroke-width="0.5"/></svg>`,
        iconSize: [size * 2, size * 2], iconAnchor: [size, size],
      });
      const marker = L.marker([ac.lat, ac.lon], { icon }).on('click', () => setDetailPanel({ type: 'aircraft', data: ac }));
      marker.bindTooltip(`${ac.callsign} | FL${Math.round(ac.altitudeFt / 100)} | ${ac.speedKts}kts`, { direction: 'top', offset: [0, -10] });
      group.addLayer(marker);
    });
  }, [aircraft, layers.aircraft, layers.militaryFlights, setDetailPanel]);

  // Render satellites
  useEffect(() => {
    const group = layersRef.current['satellites'];
    if (!group) return;
    group.clearLayers();
    if (!layers.satellites || satellites.length === 0) return;
    satellites.forEach((sat) => {
      const isISS = sat.name.includes('ISS');
      const isMil = sat.name.includes('COSMOS') || sat.name.includes('USA-') || sat.name.includes('MUOS') || sat.name.includes('NROL');
      const isGPS = sat.name.includes('GPS');
      const color = isMil ? '#ff6b35' : isISS ? '#ff6600' : isGPS ? '#ffdd00' : '#00d4ff';
      const size = isISS ? 8 : 5;
      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:${size * 2}px;height:${size * 2}px;"><div style="position:absolute;inset:0;border:1px solid ${color};border-radius:50%;opacity:0.5;animation:ping-ring 3s ease-out infinite;"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size}px;height:${size}px;background:${color};border-radius:50%;box-shadow:0 0 6px ${color};"></div></div>`,
        iconSize: [size * 2, size * 2], iconAnchor: [size, size],
      });
      const marker = L.marker([sat.lat, sat.lon], { icon }).on('click', () => setDetailPanel({ type: 'satellite', data: sat }));
      if (isISS) marker.bindTooltip('ISS ●LIVE', { permanent: true, direction: 'right', offset: [10, 0], className: 'iss-label' });
      group.addLayer(marker);
    });
  }, [satellites, layers.satellites, setDetailPanel]);

  // Render earthquakes
  useEffect(() => {
    const group = layersRef.current['earthquakes'];
    if (!group) return;
    group.clearLayers();
    if (!layers.earthquakes || earthquakes.length === 0) return;
    earthquakes.forEach((eq) => {
      const radius = Math.pow(eq.magnitude, 1.5) * 3;
      const color = eq.magnitude >= 6 ? '#ff0044' : eq.magnitude >= 4.5 ? '#ff6600' : '#aa44ff';
      const circle = L.circleMarker([eq.lat, eq.lon], { radius, color, fillColor: color, fillOpacity: 0.3, weight: 1.5 }).on('click', () => setDetailPanel({ type: 'earthquake', data: eq }));
      if (eq.magnitude >= 4.0) {
        const pulseIcon = L.divIcon({ className: '', html: `<div style="width:${radius * 4}px;height:${radius * 4}px;border:1.5px solid ${color};border-radius:50%;animation:ping-ring 2s ease-out infinite;opacity:0.5;"></div>`, iconSize: [radius * 4, radius * 4], iconAnchor: [radius * 2, radius * 2] });
        group.addLayer(L.marker([eq.lat, eq.lon], { icon: pulseIcon, interactive: false }));
      }
      group.addLayer(circle);
    });
  }, [earthquakes, layers.earthquakes, setDetailPanel]);

  // Render conflict zones with explosion/missile hit animations
  useEffect(() => {
    const group = layersRef.current['conflicts'];
    if (!group) return;
    group.clearLayers();
    if (!layers.conflicts) return;
    CONFLICT_ZONES.forEach((cz) => {
      const color = cz.intensity >= 8 ? '#ff0044' : cz.intensity >= 6 ? '#ff6b35' : '#ffb000';
      const radius = cz.intensity * 3;
      const isWar = cz.type === 'war' || cz.intensity >= 8;
      const isHot = cz.intensity >= 6;

      // Outer blast radius
      group.addLayer(L.circleMarker([cz.lat, cz.lon], { radius: radius * 2, color, fillColor: color, fillOpacity: 0.08, weight: 0.5, interactive: false }));

      // Inner marker
      const inner = L.circleMarker([cz.lat, cz.lon], { radius, color, fillColor: color, fillOpacity: 0.25, weight: 1.5 });
      inner.bindTooltip(`🎯 ${cz.name} [${cz.intensity}/10]`, { direction: 'top', offset: [0, -10] });
      inner.on('click', () => setDetailPanel({ type: 'conflict', data: cz }));
      group.addLayer(inner);

      // Pulsing ring
      const pulseIcon = L.divIcon({ className: '', html: `<div style="width:${radius * 4}px;height:${radius * 4}px;border:1.5px solid ${color};border-radius:50%;animation:ping-ring 3s ease-out infinite;opacity:0.4;"></div>`, iconSize: [radius * 4, radius * 4], iconAnchor: [radius * 2, radius * 2] });
      group.addLayer(L.marker([cz.lat, cz.lon], { icon: pulseIcon, interactive: false }));

      // Explosion/missile-hit SVG animation for war zones
      if (isWar || isHot) {
        const explosionSize = isWar ? 48 : 32;
        const explosionHtml = `<div style="width:${explosionSize}px;height:${explosionSize}px;position:relative;">
          <svg viewBox="0 0 100 100" width="${explosionSize}" height="${explosionSize}" style="position:absolute;inset:0;">
            <!-- Shockwave rings -->
            <circle cx="50" cy="50" r="8" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.6">
              <animate attributeName="r" values="8;45" dur="2.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0" dur="2.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="50" cy="50" r="8" fill="none" stroke="${color}" stroke-width="1" opacity="0.4">
              <animate attributeName="r" values="8;45" dur="2.5s" begin="0.8s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.4;0" dur="2.5s" begin="0.8s" repeatCount="indefinite"/>
            </circle>
            <!-- Fire core -->
            <circle cx="50" cy="50" r="6" fill="${color}" opacity="0.7">
              <animate attributeName="r" values="4;8;4" dur="1.2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.7;1;0.7" dur="1.2s" repeatCount="indefinite"/>
            </circle>
            ${isWar ? `<!-- Secondary explosions -->
            <circle cx="38" cy="42" r="3" fill="${color}" opacity="0.5">
              <animate attributeName="r" values="2;5;2" dur="1.8s" begin="0.3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0.8;0.5" dur="1.8s" begin="0.3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="62" cy="55" r="3" fill="${color}" opacity="0.4">
              <animate attributeName="r" values="2;4;2" dur="2s" begin="0.6s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" begin="0.6s" repeatCount="indefinite"/>
            </circle>` : ''}
            <!-- Smoke plume -->
            <circle cx="50" cy="44" r="4" fill="${color}" opacity="0.15">
              <animate attributeName="cy" values="44;30" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="r" values="4;12" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.15;0" dur="3s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>`;
        const explosionIcon = L.divIcon({
          className: '',
          html: explosionHtml,
          iconSize: [explosionSize, explosionSize],
          iconAnchor: [explosionSize / 2, explosionSize / 2],
        });
        group.addLayer(L.marker([cz.lat, cz.lon], { icon: explosionIcon, interactive: false }));
      }
    });
  }, [layers.conflicts, setDetailPanel]);

  // Render weather
  useEffect(() => {
    const group = layersRef.current['weather'];
    if (!group) return;
    group.clearLayers();
    if (!layers.weather || weatherAlerts.length === 0) return;
    weatherAlerts.forEach((w) => {
      const color = w.isExtreme ? '#ff0044' : w.temp > 35 ? '#ff6b35' : w.temp < 0 ? '#00d4ff' : '#ffb000';
      const icon = L.divIcon({ className: '', html: `<div style="background:${color}20;border:1px solid ${color}60;border-radius:4px;padding:2px 4px;font-size:9px;font-family:monospace;color:${color};white-space:nowrap;">${Math.round(w.temp)}°C</div>`, iconSize: [40, 16], iconAnchor: [20, 8] });
      const marker = L.marker([w.lat, w.lon], { icon });
      marker.bindTooltip(`🌤 ${w.city}: ${w.description} | ${w.temp}°C | Wind: ${w.windSpeed}km/h`, { direction: 'top' });
      marker.on('click', () => setDetailPanel({ type: 'weather', data: w }));
      group.addLayer(marker);
    });
  }, [weatherAlerts, layers.weather, setDetailPanel]);

  // Render volcanoes
  useEffect(() => {
    const group = layersRef.current['volcanoes'];
    if (!group) return;
    group.clearLayers();
    if (!layers.volcanoes || volcanoes.length === 0) return;
    volcanoes.forEach((v) => {
      const color = v.status === 'erupting' ? '#ff0044' : v.status === 'warning' ? '#ff6b35' : '#ffb000';
      const icon = L.divIcon({ className: '', html: `<div style="font-size:14px;filter:drop-shadow(0 0 4px ${color});">🌋</div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
      const marker = L.marker([v.lat, v.lon], { icon });
      marker.bindTooltip(`🌋 ${v.name} | ${v.status.toUpperCase()} | ${v.elevation}m | ${v.country}`, { direction: 'top' });
      marker.on('click', () => setDetailPanel({ type: 'volcano', data: v }));
      group.addLayer(marker);
    });
  }, [volcanoes, layers.volcanoes, setDetailPanel]);

  // Render nuclear sites
  useEffect(() => {
    const group = layersRef.current['nuclear'];
    if (!group) return;
    group.clearLayers();
    if (!layers.nuclearSites) return;
    NUCLEAR_SITES.forEach((site) => {
      const icon = L.divIcon({ className: '', html: `<div style="font-size:12px;filter:drop-shadow(0 0 4px #bbff00);">☢️</div>`, iconSize: [16, 16], iconAnchor: [8, 8] });
      const marker = L.marker([site.lat, site.lon], { icon });
      marker.bindTooltip(`☢️ ${site.name} | ${site.type.toUpperCase()} | ${site.country}`, { direction: 'top' });
      group.addLayer(marker);
    });
  }, [layers.nuclearSites]);

  // Render Twitter/X OSINT geo markers
  useEffect(() => {
    const group = layersRef.current['twitterOsint'];
    if (!group) return;
    group.clearLayers();
    if (twitterGeoMarkers.length === 0) return;

    twitterGeoMarkers.forEach((m) => {
      const isConflict = /\b(strike|missile|attack|killed|bomb|explosion|war|troops|drone)\b/i.test(m.text);
      const color = isConflict ? '#ff0044' : '#00aaff';
      const size = isConflict ? 22 : 16;

      let html = `<div style="position:relative;width:${size}px;height:${size}px;">
        <div style="position:absolute;inset:0;border:1.5px solid ${color};border-radius:50%;animation:ping-ring 2.5s ease-out infinite;opacity:0.5;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size * 0.4}px;height:${size * 0.4}px;background:${color};border-radius:50%;box-shadow:0 0 8px ${color};"></div>
      </div>`;

      // Add explosion animation for conflict posts
      if (isConflict) {
        html = `<div style="position:relative;width:${size}px;height:${size}px;">
          <svg viewBox="0 0 100 100" width="${size}" height="${size}" style="position:absolute;inset:0;">
            <circle cx="50" cy="50" r="10" fill="none" stroke="${color}" stroke-width="2" opacity="0.6">
              <animate attributeName="r" values="10;45" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="50" cy="50" r="8" fill="${color}" opacity="0.8">
              <animate attributeName="r" values="5;10;5" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>`;
      }

      const icon = L.divIcon({
        className: '',
        html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([m.lat, m.lon], { icon });
      marker.bindTooltip(`𝕏 @${m.account} — ${m.text.substring(0, 80)}…`, { direction: 'top', offset: [0, -12] });
      marker.on('click', () => {
        setMapCenter({ lat: m.lat, lon: m.lon, zoom: 8 });
        window.open(m.url, '_blank');
      });
      group.addLayer(marker);
    });
  }, [twitterGeoMarkers, setMapCenter]);

  // Render news markers on countries — plot geolocated news with animated icons
  useEffect(() => {
    const group = layersRef.current['newsMarkers'];
    if (!group) return;
    group.clearLayers();
    if (news.length === 0) return;

    // Build country coords from CONFLICT_ZONES + known centroids
    const COUNTRY_CENTROIDS: Record<string, { lat: number; lon: number }> = {
      'united states': { lat: 39.8, lon: -98.5 }, 'usa': { lat: 39.8, lon: -98.5 }, 'us': { lat: 39.8, lon: -98.5 },
      'china': { lat: 35.8, lon: 104.1 }, 'cn': { lat: 35.8, lon: 104.1 },
      'russia': { lat: 61.5, lon: 105.3 }, 'ru': { lat: 61.5, lon: 105.3 },
      'ukraine': { lat: 48.3, lon: 31.1 }, 'ua': { lat: 48.3, lon: 31.1 },
      'iran': { lat: 32.4, lon: 53.6 }, 'ir': { lat: 32.4, lon: 53.6 },
      'israel': { lat: 31.0, lon: 34.8 }, 'il': { lat: 31.0, lon: 34.8 },
      'gaza': { lat: 31.35, lon: 34.31 }, 'palestine': { lat: 31.9, lon: 35.2 },
      'india': { lat: 20.6, lon: 78.9 }, 'in': { lat: 20.6, lon: 78.9 },
      'pakistan': { lat: 30.4, lon: 69.3 }, 'pk': { lat: 30.4, lon: 69.3 },
      'turkey': { lat: 38.9, lon: 35.2 }, 'tr': { lat: 38.9, lon: 35.2 },
      'iraq': { lat: 33.2, lon: 43.7 }, 'iq': { lat: 33.2, lon: 43.7 },
      'syria': { lat: 34.8, lon: 38.9 }, 'sy': { lat: 34.8, lon: 38.9 },
      'yemen': { lat: 15.5, lon: 48.5 }, 'ye': { lat: 15.5, lon: 48.5 },
      'sudan': { lat: 12.8, lon: 30.2 }, 'sd': { lat: 12.8, lon: 30.2 },
      'somalia': { lat: 5.1, lon: 46.2 }, 'so': { lat: 5.1, lon: 46.2 },
      'myanmar': { lat: 19.8, lon: 96.7 }, 'mm': { lat: 19.8, lon: 96.7 },
      'haiti': { lat: 19.0, lon: -72.3 }, 'ht': { lat: 19.0, lon: -72.3 },
      'congo': { lat: -4.0, lon: 21.7 }, 'cd': { lat: -4.0, lon: 21.7 },
      'ethiopia': { lat: 9.1, lon: 40.5 }, 'et': { lat: 9.1, lon: 40.5 },
      'nigeria': { lat: 9.1, lon: 8.7 }, 'ng': { lat: 9.1, lon: 8.7 },
      'lebanon': { lat: 33.8, lon: 35.8 }, 'lb': { lat: 33.8, lon: 35.8 },
      'libya': { lat: 26.3, lon: 17.2 }, 'ly': { lat: 26.3, lon: 17.2 },
      'mali': { lat: 17.6, lon: -4.0 }, 'ml': { lat: 17.6, lon: -4.0 },
      'taiwan': { lat: 23.7, lon: 120.9 }, 'tw': { lat: 23.7, lon: 120.9 },
      'north korea': { lat: 40.3, lon: 127.5 }, 'kp': { lat: 40.3, lon: 127.5 },
      'south korea': { lat: 35.9, lon: 127.8 }, 'kr': { lat: 35.9, lon: 127.8 },
      'japan': { lat: 36.2, lon: 138.2 }, 'jp': { lat: 36.2, lon: 138.2 },
      'germany': { lat: 51.2, lon: 10.4 }, 'de': { lat: 51.2, lon: 10.4 },
      'france': { lat: 46.2, lon: 2.2 }, 'fr': { lat: 46.2, lon: 2.2 },
      'united kingdom': { lat: 55.4, lon: -3.4 }, 'uk': { lat: 55.4, lon: -3.4 }, 'gb': { lat: 55.4, lon: -3.4 },
      'mexico': { lat: 23.6, lon: -102.5 }, 'mx': { lat: 23.6, lon: -102.5 },
      'brazil': { lat: -14.2, lon: -51.9 }, 'br': { lat: -14.2, lon: -51.9 },
      'egypt': { lat: 26.8, lon: 30.8 }, 'eg': { lat: 26.8, lon: 30.8 },
      'south africa': { lat: -30.6, lon: 22.9 }, 'za': { lat: -30.6, lon: 22.9 },
      'australia': { lat: -25.3, lon: 133.8 }, 'au': { lat: -25.3, lon: 133.8 },
      'canada': { lat: 56.1, lon: -106.3 }, 'ca': { lat: 56.1, lon: -106.3 },
      'saudi arabia': { lat: 23.9, lon: 45.1 }, 'sa': { lat: 23.9, lon: 45.1 },
      'mozambique': { lat: -18.7, lon: 35.5 }, 'mz': { lat: -18.7, lon: 35.5 },
      'burkina faso': { lat: 12.3, lon: -1.5 }, 'bf': { lat: 12.3, lon: -1.5 },
    };

    // Also add COUNTRY_META entries matched to centroids
    const countryCoords: Record<string, { lat: number; lon: number; name: string; flag: string }> = {};
    Object.values(COUNTRY_META).forEach(c => {
      const key = c.name.toLowerCase();
      const centroid = COUNTRY_CENTROIDS[key] || COUNTRY_CENTROIDS[c.code.toLowerCase()];
      if (centroid) {
        countryCoords[key] = { ...centroid, name: c.name, flag: c.flag };
        countryCoords[c.code.toLowerCase()] = { ...centroid, name: c.name, flag: c.flag };
      }
    });

    // Aggregate news per country — max 1 marker per country
    const countryNews: Record<string, { items: typeof news; coords: { lat: number; lon: number; name: string; flag: string } }> = {};

    news.slice(0, 200).forEach(n => {
      if (n.country) {
        const key = n.country.toLowerCase();
        const coords = countryCoords[key];
        if (coords && !countryNews[key]) {
          countryNews[key] = { items: [], coords };
        }
        if (countryNews[key]) {
          countryNews[key].items.push(n);
        }
      } else {
        // Try to match country name in title
        const titleLower = n.title.toLowerCase();
        for (const [key, coords] of Object.entries(countryCoords)) {
          if (key.length > 3 && titleLower.includes(key) && !countryNews[key]) {
            countryNews[key] = { items: [], coords };
          }
          if (countryNews[key] && key.length > 3 && titleLower.includes(key)) {
            countryNews[key].items.push(n);
            break;
          }
        }
      }
    });

    Object.entries(countryNews).forEach(([, { items, coords }]) => {
      if (items.length === 0) return;
      const hasCritical = items.some(i => i.severity === 'critical');
      const hasHigh = items.some(i => i.severity === 'high');
      const color = hasCritical ? '#ff0044' : hasHigh ? '#ff6b35' : '#00d4ff';
      const count = items.length;
      const dotSize = 10;

      // Small flashing circle for all news markers
      const markerHtml = `<div style="position:relative;width:${dotSize * 2}px;height:${dotSize * 2}px;">
        <div style="position:absolute;inset:0;border:1.5px solid ${color};border-radius:50%;animation:ping-ring 2.5s ease-out infinite;opacity:0.5;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${dotSize * 0.7}px;height:${dotSize * 0.7}px;background:${color};border-radius:50%;box-shadow:0 0 8px ${color};animation:pulse-dot 1.5s ease-in-out infinite;"></div>
        <div style="position:absolute;top:-7px;right:-8px;background:${color};color:#000;font-size:7px;font-weight:bold;font-family:'JetBrains Mono',monospace;padding:0 3px;border-radius:3px;min-width:12px;text-align:center;line-height:14px;">${count}</div>
      </div>`;

      const icon = L.divIcon({ className: '', html: markerHtml, iconSize: [dotSize * 2, dotSize * 2], iconAnchor: [dotSize, dotSize] });
      const topHeadline = items[0];
      const marker = L.marker([coords.lat + (Math.random() - 0.5) * 0.5, coords.lon + (Math.random() - 0.5) * 0.5], { icon });
      const tooltipText = `${coords.flag} ${coords.name} — ${count} report${count > 1 ? 's' : ''}\n${topHeadline.title.substring(0, 70)}`;
      marker.bindTooltip(tooltipText, { direction: 'top', offset: [0, -14] });
      marker.on('click', () => {
        // Open country dossier
        import('@/services/countryService').then(({ searchCountries }) => {
          const matches = searchCountries(coords.name);
          if (matches.length > 0) {
            useWorldViewStore.getState().openCountryDossier(matches[0]);
          }
        });
      });
      group.addLayer(marker);
    });
  }, [news]);

  return <div ref={mapRef} className="w-full h-full" />;
});

MapContainer.displayName = 'MapContainer';
export default MapContainer;
