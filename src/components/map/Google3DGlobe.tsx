import { useEffect, useRef, memo, useCallback } from 'react';
import { useWorldViewStore, NUCLEAR_SITES } from '@/store/worldview';
import { CONFLICT_ZONES } from '@/components/map/GlobeContainer';
import { SUBMARINE_CABLES } from '@/data/submarineCables';
import { MILITARY_BASES, SPACEPORTS, CHOKEPOINTS, DATACENTERS, CRITICAL_MINERALS } from '@/data/staticLayers';
import { PUBLIC_CAMERAS } from '@/data/publicCameras';

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

// Build an SVG string that renders text/emoji as a marker label
function makeSvgMarker(opts: {
  icon?: string;
  label?: string;
  sublabel?: string;
  color: string;
  size?: number;
  shape?: 'circle' | 'diamond' | 'pin';
  rotate?: number;
}): SVGElement {
  const { icon, label, sublabel, color, size = 24, shape, rotate } = opts;
  const parser = new DOMParser();
  const w = Math.max(size, (label?.length || 0) * 7 + 16);
  const h = size + (label ? 14 : 0) + (sublabel ? 10 : 0);

  let shapeStr = '';
  if (shape === 'circle') {
    const r = size / 2;
    shapeStr = `<circle cx="${w/2}" cy="${r}" r="${r}" fill="${color}" fill-opacity="0.8" stroke="${color}" stroke-width="1"/>`;
  } else if (shape === 'diamond') {
    const cx = w/2, cy = size/2, s = size/2;
    shapeStr = `<polygon points="${cx},${cy-s} ${cx+s},${cy} ${cx},${cy+s} ${cx-s},${cy}" fill="${color}" fill-opacity="0.7" stroke="${color}" stroke-width="1"/>`;
  }

  // Aircraft/vessel triangle
  let triangleStr = '';
  if (rotate !== undefined) {
    const cx = w / 2, cy = size / 2;
    triangleStr = `<g transform="rotate(${rotate}, ${cx}, ${cy})">
      <polygon points="${cx},${cy - size/2} ${cx - size/3},${cy + size/2} ${cx + size/3},${cy + size/2}" fill="${color}" fill-opacity="0.85" stroke="${color}" stroke-width="0.5"/>
    </g>`;
  }

  let iconStr = '';
  if (icon) {
    iconStr = `<text x="${w/2}" y="${size/2 + 5}" text-anchor="middle" font-size="${size * 0.7}px">${icon}</text>`;
  }

  let labelStr = '';
  if (label) {
    labelStr = `<text x="${w/2}" y="${size + 10}" text-anchor="middle" font-family="monospace" font-size="8px" fill="${color}">${label}</text>`;
  }

  let sublabelStr = '';
  if (sublabel) {
    sublabelStr = `<text x="${w/2}" y="${size + (label ? 20 : 10)}" text-anchor="middle" font-family="monospace" font-size="6px" fill="${color}" opacity="0.7">${sublabel}</text>`;
  }

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${shapeStr}${triangleStr}${iconStr}${labelStr}${sublabelStr}
  </svg>`;

  return parser.parseFromString(svgString, 'image/svg+xml').documentElement as unknown as SVGElement;
}

const Google3DGlobe = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const initRef = useRef(false);

  const { layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, setDetailPanel, setActiveLivestream, mapCenter } = useWorldViewStore();

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

  // Render all data layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach(m => { try { m.remove(); } catch {} });
    markersRef.current = [];

    const addMarker = async (
      lat: number, lng: number,
      svgEl: SVGElement,
      altitude: number = 0,
      onClick?: () => void
    ) => {
      try {
        const MarkerClass = onClick
          ? (await (google.maps as any).importLibrary('maps3d')).Marker3DInteractiveElement
          : (await (google.maps as any).importLibrary('maps3d')).Marker3DElement;

        const marker = new MarkerClass({
          position: { lat, lng, altitude },
          altitudeMode: altitude > 100 ? 'ABSOLUTE' : 'CLAMP_TO_GROUND',
        });

        const template = document.createElement('template');
        template.content.append(svgEl);
        marker.append(template);

        if (onClick) {
          marker.addEventListener('gmp-click', (e: any) => {
            if (e?.stopPropagation) e.stopPropagation();
            onClick();
          });
        }

        map.append(marker);
        markersRef.current.push(marker);
      } catch (err) {
        console.warn('Marker creation failed:', err);
      }
    };

    // Aircraft
    if (layers.aircraft) {
      aircraft.forEach((ac) => {
        if (!layers.militaryFlights && ac.isMilitary) return;
        const color = ac.isMilitary ? '#ff6b35' : '#00ff88';
        const altMeters = ac.altitudeFt * 0.3048;
        addMarker(ac.lat, ac.lon,
          makeSvgMarker({ color, size: 20, rotate: ac.heading, label: ac.callsign }),
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
        const altMeters = sat.alt * 1000;
        addMarker(sat.lat, sat.lon,
          makeSvgMarker({ color, size: isISS ? 14 : 8, shape: 'circle', label: isISS ? 'ISS ●LIVE' : undefined }),
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
        addMarker(eq.lat, eq.lon,
          makeSvgMarker({ color, size: Math.max(size, 12), shape: 'circle', label: `M${eq.magnitude}` }),
          0,
          () => setDetailPanel({ type: 'earthquake', data: eq })
        );
      });
    }

    // Conflict zones
    if (layers.conflicts) {
      CONFLICT_ZONES.forEach((cz) => {
        const color = cz.intensity >= 8 ? '#ff0044' : cz.intensity >= 6 ? '#ff6b35' : '#ffb000';
        addMarker(cz.lat, cz.lon,
          makeSvgMarker({ icon: '⚔', color, size: cz.intensity * 4, label: cz.name.split('–')[0] }),
          0
        );
      });
    }

    // Volcanoes
    if (layers.volcanoes) {
      volcanoes.forEach((v) => {
        const color = v.status === 'erupting' ? '#ff0044' : v.status === 'warning' ? '#ff6b35' : '#ffb000';
        addMarker(v.lat, v.lon,
          makeSvgMarker({ icon: '🌋', color, size: 18, label: v.name }),
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
        addMarker(v.lat, v.lon,
          makeSvgMarker({ color, size: 14, rotate: v.heading, label: v.name }),
          0,
          () => setDetailPanel({ type: 'vessel', data: v })
        );
      });
    }

    // Protests
    if (layers.protests) {
      protests.forEach((p) => {
        const color = p.intensity === 'large' ? '#ff0088' : '#ff44aa';
        addMarker(p.lat, p.lon,
          makeSvgMarker({ icon: '✊', color, size: 16, label: p.country }),
          0,
          () => setDetailPanel({ type: 'protest', data: p })
        );
      });
    }

    // Outages
    if (layers.outages) {
      const typeIcons: Record<string, string> = { internet: '🌐', power: '⚡', cyber: '🔒', telecom: '📡', ddos: '💀', ransomware: '🔐' };
      outages.forEach((o) => {
        addMarker(o.lat, o.lon,
          makeSvgMarker({ icon: typeIcons[o.type] || '⚠', color: '#ff6b35', size: 14, label: o.type.toUpperCase() }),
          0,
          () => setDetailPanel({ type: 'outage', data: o })
        );
      });
    }

    // Weather alerts
    if (layers.weather) {
      weatherAlerts.forEach((w) => {
        const color = w.isExtreme ? '#ff0044' : w.temp > 35 ? '#ff6b35' : w.temp < 0 ? '#00d4ff' : '#ffb000';
        addMarker(w.lat, w.lon,
          makeSvgMarker({ color, size: 14, label: `${Math.round(w.temp)}°C`, sublabel: w.city }),
          0,
          () => setDetailPanel({ type: 'weather', data: w })
        );
      });
    }

    // Nuclear sites
    if (layers.nuclearSites) {
      NUCLEAR_SITES.forEach((site) => {
        addMarker(site.lat, site.lon,
          makeSvgMarker({ icon: '☢', color: '#bbff00', size: 16, label: site.name }),
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
            polyline.path = cable.coordinates.map(([lat, lon]: [number, number]) => ({ lat, lng: lon, altitude: 0 }));
            map.append(polyline);
            markersRef.current.push(polyline);
          });
        } catch (err) {
          console.warn('Polyline3D not available:', err);
        }
      })();
    }

    // Military bases
    MILITARY_BASES.forEach((base) => {
      addMarker(base.lat, base.lon,
        makeSvgMarker({ icon: '🎖', color: '#ff6b35', size: 14, label: base.name }),
        0
      );
    });

    // Spaceports
    SPACEPORTS.forEach((sp) => {
      addMarker(sp.lat, sp.lon,
        makeSvgMarker({ icon: '🚀', color: '#00d4ff', size: 14, label: sp.name }),
        0
      );
    });

    // Chokepoints
    CHOKEPOINTS.forEach((cp) => {
      addMarker(cp.lat, cp.lon,
        makeSvgMarker({ icon: '⚓', color: '#ff0088', size: 14, label: cp.name, sublabel: cp.flow }),
        0
      );
    });

    // Datacenters
    if (layers.datacenters) {
      DATACENTERS.forEach((dc) => {
        addMarker(dc.lat, dc.lon,
          makeSvgMarker({ icon: '🖥', color: '#5ab4ff', size: 14, label: dc.name }),
          0
        );
      });
    }

    // Critical minerals
    CRITICAL_MINERALS.forEach((m) => {
      addMarker(m.lat, m.lon,
        makeSvgMarker({ icon: '💎', color: '#ffb000', size: 12, label: m.mineral }),
        0
      );
    });

    // Public CCTV cameras
    if (layers.cameras) {
      PUBLIC_CAMERAS.forEach((cam) => {
        addMarker(cam.lat, cam.lon,
          makeSvgMarker({ icon: '📹', color: '#00ff88', size: 14, label: cam.name }),
          0,
          () => setActiveLivestream(cam.embedUrl)
        );
      });
    }
  }, [layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, setDetailPanel, setActiveLivestream]);

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
