import { useEffect, useRef, memo, useCallback } from 'react';
import { useWorldViewStore, NUCLEAR_SITES } from '@/store/worldview';
import { CONFLICT_ZONES } from '@/components/map/GlobeContainer';
import { SUBMARINE_CABLES } from '@/data/submarineCables';
import { MILITARY_BASES, SPACEPORTS, CHOKEPOINTS, DATACENTERS, CRITICAL_MINERALS } from '@/data/staticLayers';

declare const google: any;

const GOOGLE_MAPS_API_KEY = 'AIzaSyDrustkDU3XpRzb7bvKXaZ4NJE9e9TwE2o';

let googleMapsLoaded = false;
let googleMapsLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (googleMapsLoaded) return Promise.resolve();
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=alpha&libraries=maps3d`;
    script.async = true;
    script.defer = true;
    script.onload = () => { googleMapsLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

const Google3DGlobe = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const initRef = useRef(false);

  const { layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, setDetailPanel, mapCenter } = useWorldViewStore();

  const initMap = useCallback(async () => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    try {
      await loadGoogleMaps();
      const { Map3DElement, MapMode } = await (google.maps as any).importLibrary('maps3d');

      const map = new Map3DElement({
        center: { lat: 20, lng: 0, altitude: 0 },
        range: 25000000,
        tilt: 30,
        heading: 0,
        mode: MapMode.SATELLITE,
      });

      map.style.width = '100%';
      map.style.height = '100%';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(map);
      mapRef.current = map;
    } catch (err) {
      console.error('Google Maps 3D init failed:', err);
      initRef.current = false;
    }
  }, []);

  useEffect(() => { initMap(); }, [initMap]);

  // Fly to location when mapCenter changes
  useEffect(() => {
    if (!mapRef.current || !mapCenter) return;
    const altitude = mapCenter.zoom ? Math.max(1000, Math.pow(2, 22 - mapCenter.zoom)) : 0;
    mapRef.current.center = { lat: mapCenter.lat, lng: mapCenter.lon, altitude: 0 };
    mapRef.current.range = altitude * 4;
    mapRef.current.tilt = 55;
  }, [mapCenter]);

  // Render all data layers as HTML overlay markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach(m => { try { m.remove(); } catch {} });
    markersRef.current = [];

    const addMarker3D = async (lat: number, lng: number, html: string, altitude: number = 0, onClick?: () => void) => {
      try {
        const { Marker3DElement } = await (google.maps as any).importLibrary('maps3d');
        const marker = new Marker3DElement({
          position: { lat, lng, altitude },
          altitudeMode: altitude > 100 ? 'ABSOLUTE' : 'CLAMP_TO_GROUND',
        });

        // Create custom label
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        const el = template.content.firstChild as HTMLElement;
        if (el) {
          marker.append(el);
        }

        if (onClick) {
          marker.addEventListener('gmp-click', (e: any) => {
            if (e?.stopPropagation) e.stopPropagation();
            onClick();
          });
        }

        map.append(marker);
        markersRef.current.push(marker);
      } catch {}
    };

    // Aircraft
    if (layers.aircraft) {
      aircraft.forEach((ac) => {
        if (!layers.militaryFlights && ac.isMilitary) return;
        const color = ac.isMilitary ? '#ff6b35' : '#00ff88';
        const altMeters = ac.altitudeFt * 0.3048;
        addMarker3D(ac.lat, ac.lon,
          `<div style="cursor:pointer;filter:drop-shadow(0 0 6px ${color});">
            <svg width="20" height="20" viewBox="0 0 24 24" style="transform:rotate(${ac.heading}deg);">
              <path d="M12 2L8 10H3L5 13H9L12 22L15 13H19L21 10H16L12 2Z" fill="${color}" stroke="${color}" stroke-width="0.5"/>
            </svg>
            <div style="font-size:8px;font-family:monospace;color:${color};text-align:center;text-shadow:0 0 4px #000;white-space:nowrap;">${ac.callsign}</div>
          </div>`,
          Math.max(altMeters, 500),
          () => setDetailPanel({ type: 'aircraft', data: ac })
        );
      });
    }

    // Satellites
    if (layers.satellites) {
      satellites.forEach((sat) => {
        const isISS = sat.name.includes('ISS');
        const isMil = sat.name.includes('COSMOS') || sat.name.includes('USA-') || sat.name.includes('MUOS');
        const color = isMil ? '#ff6b35' : isISS ? '#ff6600' : '#00d4ff';
        const altMeters = sat.alt * 1000; // km to m
        const size = isISS ? 14 : 8;
        addMarker3D(sat.lat, sat.lon,
          `<div style="cursor:pointer;text-align:center;filter:drop-shadow(0 0 8px ${color});">
            <div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;box-shadow:0 0 12px ${color};margin:0 auto;"></div>
            ${isISS ? `<div style="font-size:9px;font-family:monospace;color:#ff6600;text-shadow:0 0 4px #000;margin-top:2px;">ISS ●LIVE</div>` : ''}
          </div>`,
          Math.min(altMeters, 600000),
          () => setDetailPanel({ type: 'satellite', data: sat })
        );
      });
    }

    // Earthquakes
    if (layers.earthquakes) {
      earthquakes.forEach((eq) => {
        const color = eq.magnitude >= 6 ? '#ff0044' : eq.magnitude >= 4.5 ? '#ff6600' : '#aa44ff';
        const size = Math.pow(eq.magnitude, 1.3) * 4;
        addMarker3D(eq.lat, eq.lon,
          `<div style="cursor:pointer;position:relative;">
            <div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;opacity:0.7;box-shadow:0 0 ${size}px ${color};animation:ping-ring 2s ease-out infinite;"></div>
            <div style="font-size:8px;font-family:monospace;color:${color};text-shadow:0 0 3px #000;text-align:center;">M${eq.magnitude}</div>
          </div>`,
          0,
          () => setDetailPanel({ type: 'earthquake', data: eq })
        );
      });
    }

    // Conflict zones
    if (layers.conflicts) {
      CONFLICT_ZONES.forEach((cz) => {
        const color = cz.intensity >= 8 ? '#ff0044' : cz.intensity >= 6 ? '#ff6b35' : '#ffb000';
        addMarker3D(cz.lat, cz.lon,
          `<div style="position:relative;text-align:center;">
            <div style="width:${cz.intensity * 4}px;height:${cz.intensity * 4}px;border:2px solid ${color};border-radius:50%;opacity:0.5;animation:ping-ring 3s ease-out infinite;margin:0 auto;"></div>
            <div style="font-size:8px;font-family:monospace;color:${color};text-shadow:0 0 3px #000;white-space:nowrap;">⚔ ${cz.name.split('–')[0]}</div>
          </div>`,
          0
        );
      });
    }

    // Volcanoes
    if (layers.volcanoes) {
      volcanoes.forEach((v) => {
        const color = v.status === 'erupting' ? '#ff0044' : v.status === 'warning' ? '#ff6b35' : '#ffb000';
        addMarker3D(v.lat, v.lon,
          `<div style="cursor:pointer;text-align:center;filter:drop-shadow(0 0 4px ${color});">
            <div style="font-size:16px;">🌋</div>
            <div style="font-size:7px;font-family:monospace;color:${color};text-shadow:0 0 3px #000;">${v.name}</div>
          </div>`,
          v.elevation,
          () => setDetailPanel({ type: 'volcano', data: v })
        );
      });
    }

    // Vessels
    if (layers.vessels) {
      vessels.forEach((v) => {
        const colors: Record<string, string> = { yacht: '#FFD700', cargo: '#4488ff', tanker: '#ff8800', military: '#ff0044', fishing: '#44ff88', passenger: '#ff44ff', container: '#00aaff' };
        const color = colors[v.type] || '#4488ff';
        const emoji = v.type === 'yacht' ? '🛥' : v.type === 'military' ? '⚓' : '🚢';
        addMarker3D(v.lat, v.lon,
          `<div style="cursor:pointer;text-align:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" style="transform:rotate(${v.heading}deg);filter:drop-shadow(0 0 3px ${color}80);">
              <path d="M12 2L6 18H18L12 2Z" fill="${color}" fill-opacity="0.85" stroke="${color}" stroke-width="0.5"/>
            </svg>
            <div style="font-size:7px;font-family:monospace;color:${color};text-shadow:0 0 3px #000;white-space:nowrap;">${emoji} ${v.name}</div>
          </div>`,
          0,
          () => setDetailPanel({ type: 'vessel', data: v })
        );
      });
    }

    // Protests
    if (layers.protests) {
      protests.forEach((p) => {
        const color = p.intensity === 'large' ? '#ff0088' : '#ff44aa';
        addMarker3D(p.lat, p.lon,
          `<div style="cursor:pointer;text-align:center;">
            <div style="font-size:14px;">✊</div>
            <div style="font-size:7px;font-family:monospace;color:${color};text-shadow:0 0 3px #000;">${p.country}</div>
          </div>`,
          0,
          () => setDetailPanel({ type: 'protest', data: p })
        );
      });
    }

    // Outages
    if (layers.outages) {
      const typeIcons: Record<string, string> = { internet: '🌐', power: '⚡', cyber: '🔒', telecom: '📡', ddos: '💀', ransomware: '🔐' };
      outages.forEach((o) => {
        addMarker3D(o.lat, o.lon,
          `<div style="cursor:pointer;text-align:center;">
            <div style="font-size:12px;">${typeIcons[o.type] || '⚠'}</div>
            <div style="font-size:7px;font-family:monospace;color:#ff6b35;text-shadow:0 0 3px #000;white-space:nowrap;">${o.type.toUpperCase()}</div>
          </div>`,
          0,
          () => setDetailPanel({ type: 'outage', data: o })
        );
      });
    }

    // Weather alerts
    if (layers.weather) {
      weatherAlerts.forEach((w) => {
        const color = w.isExtreme ? '#ff0044' : w.temp > 35 ? '#ff6b35' : w.temp < 0 ? '#00d4ff' : '#ffb000';
        addMarker3D(w.lat, w.lon,
          `<div style="cursor:pointer;text-align:center;">
            <div style="background:${color}30;border:1px solid ${color}80;border-radius:4px;padding:1px 4px;font-size:9px;font-family:monospace;color:${color};white-space:nowrap;">${Math.round(w.temp)}°C</div>
            <div style="font-size:6px;font-family:monospace;color:${color}aa;text-shadow:0 0 3px #000;">${w.city}</div>
          </div>`,
          0,
          () => setDetailPanel({ type: 'weather', data: w })
        );
      });
    }

    // Nuclear sites
    if (layers.nuclearSites) {
      NUCLEAR_SITES.forEach((site) => {
        addMarker3D(site.lat, site.lon,
          `<div style="text-align:center;filter:drop-shadow(0 0 4px #bbff00);">
            <div style="font-size:14px;">☢️</div>
            <div style="font-size:6px;font-family:monospace;color:#bbff00;text-shadow:0 0 3px #000;white-space:nowrap;">${site.name}</div>
          </div>`,
          0
        );
      });
    }

    // Submarine cables as polylines
    if (layers.underseaCables) {
      (async () => {
        try {
          const { Polyline3DElement } = await (google.maps as any).importLibrary('maps3d');
          SUBMARINE_CABLES.forEach((cable) => {
            const polyline = new Polyline3DElement({
              strokeColor: cable.color,
              strokeWidth: 3,
              altitudeMode: 'CLAMP_TO_GROUND',
            });
            polyline.coordinates = cable.coordinates.map(([lat, lon]: [number, number]) => ({ lat, lng: lon, altitude: 0 }));
            map.append(polyline);
            markersRef.current.push(polyline);
          });
        } catch (err) {
          console.warn('Polyline3D not available, skipping cables:', err);
        }
      })();
    }

    // Military bases (static)
    MILITARY_BASES.forEach((base) => {
      addMarker3D(base.lat, base.lon,
        `<div style="text-align:center;filter:drop-shadow(0 0 4px #ff6b35);">
          <div style="font-size:12px;">🎖</div>
          <div style="font-size:6px;font-family:monospace;color:#ff6b35;text-shadow:0 0 3px #000;white-space:nowrap;">${base.name}</div>
        </div>`,
        0
      );
    });

    // Spaceports
    SPACEPORTS.forEach((sp) => {
      addMarker3D(sp.lat, sp.lon,
        `<div style="text-align:center;filter:drop-shadow(0 0 4px #00d4ff);">
          <div style="font-size:12px;">🚀</div>
          <div style="font-size:6px;font-family:monospace;color:#00d4ff;text-shadow:0 0 3px #000;white-space:nowrap;">${sp.name}</div>
        </div>`,
        0
      );
    });

    // Chokepoints
    CHOKEPOINTS.forEach((cp) => {
      addMarker3D(cp.lat, cp.lon,
        `<div style="text-align:center;">
          <div style="font-size:11px;">⚓</div>
          <div style="font-size:6px;font-family:monospace;color:#ff0088;text-shadow:0 0 3px #000;white-space:nowrap;">${cp.name}</div>
          <div style="font-size:5px;font-family:monospace;color:#ff008880;text-shadow:0 0 2px #000;">${cp.flow}</div>
        </div>`,
        0
      );
    });

    // Datacenters
    if (layers.datacenters) {
      DATACENTERS.forEach((dc) => {
        addMarker3D(dc.lat, dc.lon,
          `<div style="text-align:center;filter:drop-shadow(0 0 4px #5ab4ff);">
            <div style="font-size:11px;">🖥</div>
            <div style="font-size:6px;font-family:monospace;color:#5ab4ff;text-shadow:0 0 3px #000;white-space:nowrap;">${dc.name}</div>
          </div>`,
          0
        );
      });
    }

    // Critical minerals
    CRITICAL_MINERALS.forEach((m) => {
      addMarker3D(m.lat, m.lon,
        `<div style="text-align:center;filter:drop-shadow(0 0 3px #ffb000);">
          <div style="font-size:10px;">💎</div>
          <div style="font-size:5px;font-family:monospace;color:#ffb000;text-shadow:0 0 2px #000;white-space:nowrap;">${m.mineral}</div>
        </div>`,
        0
      );
    });
  }, [layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, setDetailPanel]);

  return (
    <div ref={containerRef} className="w-full h-full bg-background">
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-[11px] font-display tracking-wider text-muted-foreground">LOADING 3D GLOBE...</span>
        </div>
      </div>
    </div>
  );
});

Google3DGlobe.displayName = 'Google3DGlobe';
export default Google3DGlobe;
