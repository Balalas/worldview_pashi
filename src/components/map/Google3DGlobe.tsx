import { useEffect, useRef, memo, useCallback } from 'react';
import { useWorldViewStore, NUCLEAR_SITES } from '@/store/worldview';
import { CONFLICT_ZONES } from '@/components/map/GlobeContainer';
import { SUBMARINE_CABLES } from '@/data/submarineCables';
import { MILITARY_BASES, SPACEPORTS, CHOKEPOINTS, DATACENTERS, CRITICAL_MINERALS } from '@/data/staticLayers';
import { PUBLIC_CAMERAS, PublicCamera } from '@/data/publicCameras';

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

// ── SVG Marker Factory ──

function svgEl(svgStr: string): SVGElement {
  return new DOMParser().parseFromString(svgStr, 'image/svg+xml').documentElement as unknown as SVGElement;
}

function aircraftSvg(heading: number, color: string, callsign: string) {
  const w = 80, h = 54;
  return svgEl(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <g transform="translate(40,18) rotate(${heading})">
      <path d="M0,-14 L-5,8 L-14,12 L-14,14 L-5,10 L-3,16 L-6,18 L-6,20 L0,18 L6,20 L6,18 L3,16 L5,10 L14,14 L14,12 L5,8 Z"
        fill="${color}" stroke="#000" stroke-width="0.8" opacity="0.95"/>
    </g>
    <rect x="4" y="38" width="${w-8}" height="14" rx="2" fill="#000" fill-opacity="0.7"/>
    <text x="${w/2}" y="49" text-anchor="middle" font-family="monospace" font-size="9" fill="${color}" font-weight="bold">${callsign}</text>
  </svg>`);
}

function satelliteSvg(color: string, name: string, isISS: boolean) {
  const s = isISS ? 100 : 50;
  const iconSize = isISS ? 22 : 10;
  return svgEl(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <circle cx="${s/2}" cy="${isISS?20:14}" r="${iconSize/2}" fill="${color}" opacity="0.9">
      <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${s/2}" cy="${isISS?20:14}" r="${iconSize}" fill="none" stroke="${color}" stroke-width="1" opacity="0.3">
      <animate attributeName="r" values="${iconSize};${iconSize*2};${iconSize}" dur="3s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite"/>
    </circle>
    ${isISS ? `
      <line x1="${s/2-16}" y1="20" x2="${s/2+16}" y2="20" stroke="${color}" stroke-width="2" opacity="0.7"/>
      <rect x="${s/2-3}" y="38" width="${s-s/2+6}" height="14" rx="2" fill="#000" fill-opacity="0.7" transform="translate(${-s/2+s/2-3},0)"/>
      <text x="${s/2}" y="49" text-anchor="middle" font-family="monospace" font-size="10" fill="#ff6600" font-weight="bold">ISS ●LIVE</text>
    ` : `
      <text x="${s/2}" y="${s-4}" text-anchor="middle" font-family="monospace" font-size="6" fill="${color}" opacity="0.7">${name.substring(0,12)}</text>
    `}
  </svg>`);
}

function quakeSvg(mag: number, color: string) {
  const s = Math.max(mag * 8, 28);
  return svgEl(`<svg xmlns="http://www.w3.org/2000/svg" width="${s+20}" height="${s+20}" viewBox="0 0 ${s+20} ${s+20}">
    <circle cx="${(s+20)/2}" cy="${(s+20)/2-4}" r="${s/2}" fill="${color}" opacity="0.35">
      <animate attributeName="r" values="${s/2};${s};${s/2}" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${(s+20)/2}" cy="${(s+20)/2-4}" r="${s/4}" fill="${color}" opacity="0.8"/>
    <text x="${(s+20)/2}" y="${s+16}" text-anchor="middle" font-family="monospace" font-size="10" fill="${color}" font-weight="bold">M${mag}</text>
  </svg>`);
}

function vesselSvg(heading: number, color: string, name: string, type: string) {
  const emoji = type === 'yacht' ? '🛥' : type === 'military' ? '⚓' : '🚢';
  return svgEl(`<svg xmlns="http://www.w3.org/2000/svg" width="70" height="50" viewBox="0 0 70 50">
    <g transform="translate(35,16) rotate(${heading})">
      <path d="M0,-10 L-6,8 L0,6 L6,8 Z" fill="${color}" stroke="#000" stroke-width="0.6" opacity="0.9"/>
    </g>
    <rect x="2" y="34" width="66" height="14" rx="2" fill="#000" fill-opacity="0.7"/>
    <text x="35" y="45" text-anchor="middle" font-family="monospace" font-size="8" fill="${color}">${emoji} ${name.substring(0,10)}</text>
  </svg>`);
}

function iconSvg(icon: string, color: string, label: string, sublabel?: string) {
  const w = Math.max(70, label.length * 6 + 16);
  const h = sublabel ? 52 : 40;
  return svgEl(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <text x="${w/2}" y="16" text-anchor="middle" font-size="16">${icon}</text>
    <rect x="2" y="22" width="${w-4}" height="13" rx="2" fill="#000" fill-opacity="0.7"/>
    <text x="${w/2}" y="32" text-anchor="middle" font-family="monospace" font-size="7" fill="${color}">${label}</text>
    ${sublabel ? `<text x="${w/2}" y="${h-4}" text-anchor="middle" font-family="monospace" font-size="6" fill="${color}" opacity="0.6">${sublabel}</text>` : ''}
  </svg>`);
}

function cameraSvg(name: string) {
  return svgEl(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="44" viewBox="0 0 80 44">
    <circle cx="40" cy="14" r="12" fill="#00ff8830" stroke="#00ff88" stroke-width="1.5"/>
    <text x="40" y="18" text-anchor="middle" font-size="12">📹</text>
    <circle cx="40" cy="14" r="14" fill="none" stroke="#00ff88" stroke-width="0.5" opacity="0.4">
      <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
    </circle>
    <rect x="2" y="28" width="76" height="13" rx="2" fill="#000" fill-opacity="0.7"/>
    <text x="40" y="38" text-anchor="middle" font-family="monospace" font-size="7" fill="#00ff88">${name.substring(0,14)}</text>
  </svg>`);
}

// ── Component ──

const Google3DGlobe = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const initRef = useRef(false);

  const { layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, setDetailPanel, setActiveLivestream, mapCenter } = useWorldViewStore();

  // Fly camera to a CCTV location at street level (3D, not Street View)
  const flyToCamera = useCallback((cam: PublicCamera) => {
    const map = mapRef.current;
    if (!map) return;
    map.center = { lat: cam.lat, lng: cam.lon, altitude: 50 };
    map.range = 300;
    map.tilt = 75;
    map.heading = cam.heading || 0;
    // Open the camera detail panel
    setDetailPanel({ type: 'camera', data: cam });
  }, [setDetailPanel]);

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

  // Fly to location
  useEffect(() => {
    if (!mapRef.current || !mapCenter) return;
    const altitude = mapCenter.zoom ? Math.max(1000, Math.pow(2, 22 - mapCenter.zoom)) : 0;
    mapRef.current.center = { lat: mapCenter.lat, lng: mapCenter.lon, altitude: 0 };
    mapRef.current.range = altitude * 4;
    mapRef.current.tilt = 55;
  }, [mapCenter]);

  // ── Render markers ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => { try { m.remove(); } catch {} });
    markersRef.current = [];

    const addMarker = async (
      lat: number, lng: number, svg: SVGElement,
      altitude = 0, sizePreserved = false, onClick?: () => void
    ) => {
      try {
        const lib = await (google.maps as any).importLibrary('maps3d');
        const MarkerClass = onClick ? lib.Marker3DInteractiveElement : lib.Marker3DElement;
        const marker = new MarkerClass({
          position: { lat, lng, altitude },
          altitudeMode: altitude > 100 ? 'ABSOLUTE' : 'CLAMP_TO_GROUND',
          sizePreserved,
        });
        const template = document.createElement('template');
        template.content.append(svg);
        marker.append(template);
        if (onClick) {
          marker.addEventListener('gmp-click', (e: any) => {
            e?.stopPropagation?.();
            onClick();
          });
        }
        map.append(marker);
        markersRef.current.push(marker);
      } catch (err) {
        console.warn('Marker fail:', err);
      }
    };

    // Aircraft — big, sizePreserved
    if (layers.aircraft) {
      aircraft.forEach(ac => {
        if (!layers.militaryFlights && ac.isMilitary) return;
        const color = ac.isMilitary ? '#ff6b35' : '#00ff88';
        addMarker(ac.lat, ac.lon,
          aircraftSvg(ac.heading, color, ac.callsign),
          Math.max(ac.altitudeFt * 0.3048, 500), true,
          () => setDetailPanel({ type: 'aircraft', data: ac })
        );
      });
    }

    // Satellites — ALL visible, sizePreserved, bigger
    if (layers.satellites) {
      satellites.forEach(sat => {
        const isISS = sat.name.includes('ISS');
        const isMil = sat.name.includes('COSMOS') || sat.name.includes('USA-') || sat.name.includes('MUOS');
        const color = isMil ? '#ff6b35' : isISS ? '#ff6600' : '#00d4ff';
        addMarker(sat.lat, sat.lon,
          satelliteSvg(color, sat.name, isISS),
          Math.min(sat.alt * 1000, 600000), true,
          () => setDetailPanel({ type: 'satellite', data: sat })
        );
      });
    }

    // Earthquakes
    if (layers.earthquakes) {
      earthquakes.forEach(eq => {
        const color = eq.magnitude >= 6 ? '#ff0044' : eq.magnitude >= 4.5 ? '#ff6600' : '#aa44ff';
        addMarker(eq.lat, eq.lon,
          quakeSvg(eq.magnitude, color),
          0, true,
          () => setDetailPanel({ type: 'earthquake', data: eq })
        );
      });
    }

    // Conflict zones
    if (layers.conflicts) {
      CONFLICT_ZONES.forEach(cz => {
        const color = cz.intensity >= 8 ? '#ff0044' : cz.intensity >= 6 ? '#ff6b35' : '#ffb000';
        addMarker(cz.lat, cz.lon,
          iconSvg('⚔️', color, cz.name.split('–')[0]),
          0, true
        );
      });
    }

    // Volcanoes
    if (layers.volcanoes) {
      volcanoes.forEach(v => {
        const color = v.status === 'erupting' ? '#ff0044' : v.status === 'warning' ? '#ff6b35' : '#ffb000';
        addMarker(v.lat, v.lon,
          iconSvg('🌋', color, v.name),
          v.elevation, true,
          () => setDetailPanel({ type: 'volcano', data: v })
        );
      });
    }

    // Vessels
    if (layers.vessels) {
      vessels.forEach(v => {
        const colors: Record<string, string> = { yacht: '#FFD700', cargo: '#4488ff', tanker: '#ff8800', military: '#ff0044', fishing: '#44ff88', passenger: '#ff44ff', container: '#00aaff' };
        addMarker(v.lat, v.lon,
          vesselSvg(v.heading, colors[v.type] || '#4488ff', v.name, v.type),
          0, false,
          () => setDetailPanel({ type: 'vessel', data: v })
        );
      });
    }

    // Protests
    if (layers.protests) {
      protests.forEach(p => {
        const color = p.intensity === 'large' ? '#ff0088' : '#ff44aa';
        addMarker(p.lat, p.lon,
          iconSvg('✊', color, p.country),
          0, true,
          () => setDetailPanel({ type: 'protest', data: p })
        );
      });
    }

    // Outages
    if (layers.outages) {
      const icons: Record<string, string> = { internet: '🌐', power: '⚡', cyber: '🔒', telecom: '📡', ddos: '💀', ransomware: '🔐' };
      outages.forEach(o => {
        addMarker(o.lat, o.lon,
          iconSvg(icons[o.type] || '⚠', '#ff6b35', o.type.toUpperCase()),
          0, true,
          () => setDetailPanel({ type: 'outage', data: o })
        );
      });
    }

    // Weather
    if (layers.weather) {
      weatherAlerts.forEach(w => {
        const color = w.isExtreme ? '#ff0044' : w.temp > 35 ? '#ff6b35' : w.temp < 0 ? '#00d4ff' : '#ffb000';
        addMarker(w.lat, w.lon,
          iconSvg(w.isExtreme ? '⚠️' : '🌡', color, `${Math.round(w.temp)}°C`, w.city),
          0, false,
          () => setDetailPanel({ type: 'weather', data: w })
        );
      });
    }

    // Nuclear
    if (layers.nuclearSites) {
      NUCLEAR_SITES.forEach(site => {
        addMarker(site.lat, site.lon,
          iconSvg('☢️', '#bbff00', site.name),
          0, true
        );
      });
    }

    // Cables
    if (layers.underseaCables) {
      (async () => {
        try {
          const { Polyline3DElement } = await (google.maps as any).importLibrary('maps3d');
          SUBMARINE_CABLES.forEach(cable => {
            const polyline = new Polyline3DElement({ strokeColor: cable.color, strokeWidth: 3, altitudeMode: 'CLAMP_TO_GROUND' });
            polyline.path = cable.coordinates.map(([lat, lon]: [number, number]) => ({ lat, lng: lon, altitude: 0 }));
            map.append(polyline);
            markersRef.current.push(polyline);
          });
        } catch {}
      })();
    }

    // Static layers — all sizePreserved
    MILITARY_BASES.forEach(b => addMarker(b.lat, b.lon, iconSvg('🎖️', '#ff6b35', b.name), 0, true));
    SPACEPORTS.forEach(s => addMarker(s.lat, s.lon, iconSvg('🚀', '#00d4ff', s.name), 0, true));
    CHOKEPOINTS.forEach(c => addMarker(c.lat, c.lon, iconSvg('⚓', '#ff0088', c.name, c.flow), 0, true));
    if (layers.datacenters) DATACENTERS.forEach(d => addMarker(d.lat, d.lon, iconSvg('🖥️', '#5ab4ff', d.name), 0, true));
    CRITICAL_MINERALS.forEach(m => addMarker(m.lat, m.lon, iconSvg('💎', '#ffb000', m.mineral), 0, true));

    // CCTV cameras — click flies to 3D street level
    if (layers.cameras) {
      PUBLIC_CAMERAS.forEach(cam => {
        addMarker(cam.lat, cam.lon,
          cameraSvg(cam.name),
          0, true,
          () => flyToCamera(cam)
        );
      });
    }

  }, [layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, setDetailPanel, setActiveLivestream, flyToCamera]);

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
