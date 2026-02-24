import { useEffect, useRef, memo, useCallback } from 'react';
import { useWorldViewStore, NUCLEAR_SITES, FollowTarget } from '@/store/worldview';
import { CONFLICT_ZONES } from '@/components/map/GlobeContainer';
import { SUBMARINE_CABLES } from '@/data/submarineCables';
import { MILITARY_BASES, SPACEPORTS, CHOKEPOINTS, DATACENTERS, CRITICAL_MINERALS } from '@/data/staticLayers';
import { PUBLIC_CAMERAS, PublicCamera } from '@/data/publicCameras';
import { PIPELINES } from '@/data/pipelines';

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

function cameraSvg(name: string, official?: boolean) {
  const badge = official ? `<rect x="52" y="2" width="22" height="9" rx="2" fill="#fbbf24" fill-opacity="0.9"/><text x="63" y="9" text-anchor="middle" font-family="monospace" font-size="6" fill="#000" font-weight="bold">DOT</text>` : '';
  return svgEl(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="44" viewBox="0 0 80 44">
    <circle cx="40" cy="14" r="12" fill="#fbbf2430" stroke="#fbbf24" stroke-width="1.5"/>
    <text x="40" y="18" text-anchor="middle" font-size="12">📹</text>
    <circle cx="40" cy="14" r="14" fill="none" stroke="#fbbf24" stroke-width="0.5" opacity="0.4">
      <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
    </circle>
    ${badge}
    <rect x="2" y="28" width="76" height="13" rx="2" fill="#000" fill-opacity="0.7"/>
    <text x="40" y="38" text-anchor="middle" font-family="monospace" font-size="7" fill="#fbbf24">${name.substring(0,14)}</text>
  </svg>`);
}

// ── Trajectory helpers ──

/** Generate a projected trajectory path (past + future) from heading & speed */
function generateTrajectory(
  lat: number, lon: number, headingDeg: number, speedKmh: number, altitudeM: number,
  type: 'aircraft' | 'satellite' | 'vessel'
): { lat: number; lng: number; altitude: number }[] {
  const points: { lat: number; lng: number; altitude: number }[] = [];
  const R = 6371; // earth radius km
  const hdgRad = (headingDeg * Math.PI) / 180;

  // How far to project (in km) — satellites get full orbital arc
  const durationHours = type === 'satellite' ? 4 : type === 'aircraft' ? 0.5 : 2;
  const totalDist = speedKmh * durationHours;
  const steps = type === 'satellite' ? 200 : 60;

  // Past trajectory (reverse heading)
  const pastDist = totalDist * 0.3;
  for (let i = steps / 3; i >= 0; i--) {
    const d = (pastDist * i) / (steps / 3);
    const lat2 = Math.asin(
      Math.sin((lat * Math.PI) / 180) * Math.cos(d / R) +
      Math.cos((lat * Math.PI) / 180) * Math.sin(d / R) * Math.cos(hdgRad + Math.PI)
    );
    const lon2 =
      ((lon * Math.PI) / 180) +
      Math.atan2(
        Math.sin(hdgRad + Math.PI) * Math.sin(d / R) * Math.cos((lat * Math.PI) / 180),
        Math.cos(d / R) - Math.sin((lat * Math.PI) / 180) * Math.sin(lat2)
      );
    points.push({ lat: (lat2 * 180) / Math.PI, lng: (lon2 * 180) / Math.PI, altitude: altitudeM });
  }

  // Future trajectory
  for (let i = 1; i <= steps; i++) {
    const d = (totalDist * i) / steps;
    const lat2 = Math.asin(
      Math.sin((lat * Math.PI) / 180) * Math.cos(d / R) +
      Math.cos((lat * Math.PI) / 180) * Math.sin(d / R) * Math.cos(hdgRad)
    );
    const lon2 =
      ((lon * Math.PI) / 180) +
      Math.atan2(
        Math.sin(hdgRad) * Math.sin(d / R) * Math.cos((lat * Math.PI) / 180),
        Math.cos(d / R) - Math.sin((lat * Math.PI) / 180) * Math.sin(lat2)
      );
    points.push({ lat: (lat2 * 180) / Math.PI, lng: (lon2 * 180) / Math.PI, altitude: altitudeM });
  }

  return points;
}

// ── Major cities for traffic simulation ──
const TRAFFIC_CITIES = [
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'Istanbul', lat: 41.0082, lon: 28.9784 },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173 },
  { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
  { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
  { name: 'Berlin', lat: 52.52, lon: 13.405 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Lagos', lat: 6.5244, lon: 3.3792 },
  { name: 'Mexico City', lat: 19.4326, lon: -99.1332 },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
  { name: 'Seoul', lat: 37.5665, lon: 126.978 },
  { name: 'Bangkok', lat: 13.7563, lon: 100.5018 },
];

function carSvg(color: string, heading: number) {
  return svgEl(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <g transform="translate(8,8) rotate(${heading})">
      <rect x="-2.5" y="-5" width="5" height="10" rx="1.5" fill="${color}" opacity="0.85"/>
      <rect x="-2" y="-4" width="4" height="2" rx="0.5" fill="#ffffff30"/>
    </g>
  </svg>`);
}

// ── Component ──

const Google3DGlobe = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const trajectoryRef = useRef<any[]>([]); // separate ref for trajectory polylines
  const activeCamConeRef = useRef<any[]>([]); // highlighted FOV cone for active camera
  const followIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initRef = useRef(false);

  const { layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, fires, setDetailPanel, setActiveLivestream, mapCenter, followTarget, setFollowTarget } = useWorldViewStore();

  // Start following a target with cinematic camera
  const startFollow = useCallback((target: FollowTarget) => {
    setFollowTarget(target);
    setDetailPanel({ type: target.type, data: null }); // will be set in the click handler
  }, [setFollowTarget, setDetailPanel]);

  // Stop following
  const stopFollow = useCallback(() => {
    setFollowTarget(null);
    if (followIntervalRef.current) {
      clearInterval(followIntervalRef.current);
      followIntervalRef.current = null;
    }
    // Clear trajectory lines
    trajectoryRef.current.forEach(p => { try { p.remove(); } catch {} });
    trajectoryRef.current = [];
  }, [setFollowTarget]);

  // Draw highlighted FOV cone for the active camera
  const drawActiveCamCone = useCallback(async (cam: PublicCamera) => {
    const map = mapRef.current;
    if (!map) return;
    // Clear previous highlighted cone
    activeCamConeRef.current.forEach(el => { try { el.remove(); } catch {} });
    activeCamConeRef.current = [];

    try {
      const { Polygon3DElement, Polyline3DElement } = await (google.maps as any).importLibrary('maps3d');
      const heading = cam.heading ?? 0;
      const fovDeg = 70; // wider highlight cone
      const distKm = 0.12; // 120m range — much larger
      const R = 6371;
      const latRad = (cam.lat * Math.PI) / 180;
      const lonRad = (cam.lon * Math.PI) / 180;

      const calcPt = (angleDeg: number, d: number) => {
        const a = (angleDeg * Math.PI) / 180;
        const lat2 = Math.asin(Math.sin(latRad) * Math.cos(d / R) + Math.cos(latRad) * Math.sin(d / R) * Math.cos(a));
        const lon2 = lonRad + Math.atan2(Math.sin(a) * Math.sin(d / R) * Math.cos(latRad), Math.cos(d / R) - Math.sin(latRad) * Math.sin(lat2));
        return { lat: (lat2 * 180) / Math.PI, lng: (lon2 * 180) / Math.PI, altitude: 3 };
      };

      // Bright filled cone
      const conePoints = [{ lat: cam.lat, lng: cam.lon, altitude: 3 }];
      const arcSteps = 12;
      for (let i = 0; i <= arcSteps; i++) {
        conePoints.push(calcPt(heading - fovDeg / 2 + (fovDeg * i) / arcSteps, distKm));
      }
      conePoints.push({ lat: cam.lat, lng: cam.lon, altitude: 3 });

      const cone = new Polygon3DElement({
        fillColor: '#fbbf2480',
        strokeColor: '#fbbf24',
        strokeWidth: 2,
        altitudeMode: 'RELATIVE_TO_GROUND',
      });
      if ('path' in cone) cone.path = conePoints;
      else (cone as any).outerCoordinates = conePoints;
      map.append(cone);
      activeCamConeRef.current.push(cone);

      // Center direction line
      const centerLine = new Polyline3DElement({
        strokeColor: '#fbbf24',
        strokeWidth: 3,
        altitudeMode: 'RELATIVE_TO_GROUND',
      });
      centerLine.path = [
        { lat: cam.lat, lng: cam.lon, altitude: 3 },
        calcPt(heading, distKm * 1.2),
      ];
      map.append(centerLine);
      activeCamConeRef.current.push(centerLine);
    } catch (err) {
      console.warn('Active cam cone fail:', err);
    }
  }, []);

  // Fly camera to a CCTV location — immediately show street-level 3D + start livestream
  const flyToCamera = useCallback((cam: PublicCamera) => {
    stopFollow();
    const map = mapRef.current;
    if (!map) return;

    // Draw highlighted FOV cone
    drawActiveCamCone(cam);

    // Cinematic fly to street-level POV
    if (typeof map.flyCameraTo === 'function') {
      map.flyCameraTo({
        endCamera: {
          center: { lat: cam.lat, lng: cam.lon, altitude: 5 },
          range: 50,
          tilt: 87,
          heading: cam.heading || 0,
        },
        durationMillis: 2500,
      });
    } else {
      map.center = { lat: cam.lat, lng: cam.lon, altitude: 5 };
      map.range = 50;
      map.tilt = 87;
      map.heading = cam.heading || 0;
    }
    setDetailPanel({ type: 'camera', data: cam });
    setActiveLivestream(cam.feedType === 'snapshot' ? (cam.snapshotUrl || 'snapshot') : cam.embedUrl);
  }, [setDetailPanel, stopFollow, setActiveLivestream, drawActiveCamCone]);

  const initMap = useCallback(async () => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;
    try {
      await loadGoogleMaps();
      const { Map3DElement, MapMode } = await (google.maps as any).importLibrary('maps3d');
      const map = new Map3DElement({
        center: { lat: 20, lng: 0, altitude: 0 },
        range: 200000000,
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

  // Cinematic fly to location
  useEffect(() => {
    if (!mapRef.current || !mapCenter) return;
    const map = mapRef.current;
    const altitude = mapCenter.zoom ? Math.max(1000, Math.pow(2, 22 - mapCenter.zoom)) : 0;
    const range = altitude * 4;

    // Use flyCameraTo for smooth cinematic transition
    if (typeof map.flyCameraTo === 'function') {
      map.flyCameraTo({
        endCamera: {
          center: { lat: mapCenter.lat, lng: mapCenter.lon, altitude: 0 },
          range,
          tilt: 55,
        },
        durationMillis: 2500,
      });
    } else {
      // Fallback: instant snap
      map.center = { lat: mapCenter.lat, lng: mapCenter.lon, altitude: 0 };
      map.range = range;
      map.tilt = 55;
    }
  }, [mapCenter]);

  // ── Follow effect: fly-to on click, then update trajectory + telemetry only ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !followTarget) return;

    // Draw trajectory polyline
    const drawTrajectory = async (ft: FollowTarget) => {
      try {
        trajectoryRef.current.forEach(p => { try { p.remove(); } catch {} });
        trajectoryRef.current = [];

        const { Polyline3DElement } = await (google.maps as any).importLibrary('maps3d');
        const pathPoints = generateTrajectory(ft.lat, ft.lon, ft.heading, ft.speed, ft.altitude, ft.type);
        const trailColor = ft.type === 'aircraft' ? '#ff4444' : ft.type === 'satellite' ? '#ff3333' : '#4488ff';

        // Thin trajectory line
        const core = new Polyline3DElement({
          strokeColor: trailColor, strokeWidth: 2,
          altitudeMode: ft.altitude > 100 ? 'ABSOLUTE' : 'CLAMP_TO_GROUND',
        });
        core.path = pathPoints;
        map.append(core);
        trajectoryRef.current.push(core);
      } catch (err) {
        console.warn('Trajectory polyline fail:', err);
      }
    };

    drawTrajectory(followTarget);

    // Cinematic initial fly-to
    const range = followTarget.type === 'satellite' ? 150000 : followTarget.type === 'aircraft' ? 8000 : 3000;
    const tilt = followTarget.type === 'satellite' ? 55 : 72;
    if (typeof map.flyCameraTo === 'function') {
      map.flyCameraTo({
        endCamera: {
          center: { lat: followTarget.lat, lng: followTarget.lon, altitude: followTarget.altitude },
          range,
          tilt,
          heading: (followTarget.heading + 180) % 360,
        },
        durationMillis: 3000,
      });
    } else {
      map.center = { lat: followTarget.lat, lng: followTarget.lon, altitude: followTarget.altitude };
      map.range = range;
      map.tilt = tilt;
      map.heading = (followTarget.heading + 180) % 360;
    }

    // Periodic update: keep camera centered on target but preserve user's heading/tilt/range
    followIntervalRef.current = setInterval(() => {
      const ft = useWorldViewStore.getState().followTarget;
      if (!ft) { if (followIntervalRef.current) clearInterval(followIntervalRef.current); return; }

      const state = useWorldViewStore.getState();
      let updatedLat = ft.lat, updatedLon = ft.lon, updatedAlt = ft.altitude, updatedHdg = ft.heading, updatedSpd = ft.speed;

      if (ft.type === 'aircraft') {
        const ac = state.aircraft.find(a => a.callsign === ft.id);
        if (ac) { updatedLat = ac.lat; updatedLon = ac.lon; updatedAlt = Math.max(ac.altitudeFt * 0.3048, 500); updatedHdg = ac.heading; updatedSpd = ac.speedKts * 1.852; }
      } else if (ft.type === 'satellite') {
        const sat = state.satellites.find(s => s.name === ft.id);
        if (sat) { updatedLat = sat.lat; updatedLon = sat.lon; updatedAlt = sat.alt * 1000; updatedSpd = sat.velocity * 3600; }
      } else if (ft.type === 'vessel') {
        const v = state.vessels.find(v => v.id === ft.id);
        if (v) { updatedLat = v.lat; updatedLon = v.lon; updatedHdg = v.heading; updatedSpd = v.speedKnots * 1.852; }
      }

      const updatedTarget: FollowTarget = { ...ft, lat: updatedLat, lon: updatedLon, altitude: updatedAlt, heading: updatedHdg, speed: updatedSpd };
      useWorldViewStore.getState().setFollowTarget(updatedTarget);

      // Keep camera centered on target — but preserve user's tilt, heading, range (orbit freedom)
      map.center = { lat: updatedLat, lng: updatedLon, altitude: updatedAlt };

      // Redraw trajectory at new position
      drawTrajectory(updatedTarget);
    }, 2500);

    return () => {
      if (followIntervalRef.current) { clearInterval(followIntervalRef.current); followIntervalRef.current = null; }
    };
  }, [followTarget?.id, followTarget?.type]);

  // ── Simulated city traffic when zoomed in ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const trafficMarkersRef: any[] = [];
    let trafficInterval: ReturnType<typeof setInterval> | null = null;
    let lastRange = Infinity;

    const spawnTraffic = async () => {
      // Remove old traffic
      trafficMarkersRef.forEach(m => { try { m.remove(); } catch {} });
      trafficMarkersRef.length = 0;

      const range = map.range;
      if (!range || range > 5000) return; // Only show when zoomed in close

      const centerLat = map.center?.lat ?? 0;
      const centerLng = map.center?.lng ?? 0;

      // Find nearby cities
      const nearbyCities = TRAFFIC_CITIES.filter(c => {
        const dlat = c.lat - centerLat;
        const dlon = c.lon - centerLng;
        return Math.sqrt(dlat * dlat + dlon * dlon) < 1.5; // within ~150km
      });

      if (nearbyCities.length === 0) return;

      try {
        const lib = await (google.maps as any).importLibrary('maps3d');
        const carCount = range < 1000 ? 60 : range < 2500 ? 35 : 15;
        const colors = ['#e8e8e8', '#cccccc', '#ffdd44', '#ff4444', '#4488ff', '#222222', '#888888', '#ffffff'];

        nearbyCities.forEach(city => {
          const spread = range < 1000 ? 0.008 : range < 2500 ? 0.02 : 0.04;
          for (let i = 0; i < carCount; i++) {
            const lat = city.lat + (Math.random() - 0.5) * spread;
            const lon = city.lon + (Math.random() - 0.5) * spread;
            const heading = Math.random() * 360;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const marker = new lib.Marker3DElement({
              position: { lat, lng: lon, altitude: 0 },
              altitudeMode: 'CLAMP_TO_GROUND',
              sizePreserved: false,
            });
            const template = document.createElement('template');
            template.content.append(carSvg(color, heading));
            marker.append(template);
            map.append(marker);
            trafficMarkersRef.push(marker);
          }
        });
      } catch {}
    };

    // Animate traffic: reposition cars slightly every 2 seconds
    const animateTraffic = () => {
      trafficMarkersRef.forEach(marker => {
        try {
          const pos = marker.position;
          if (!pos) return;
          const jitter = 0.0001;
          marker.position = {
            lat: pos.lat + (Math.random() - 0.5) * jitter,
            lng: pos.lng + (Math.random() - 0.5) * jitter,
            altitude: 0,
          };
        } catch {}
      });
    };

    // Check range periodically
    const rangeCheck = setInterval(() => {
      const range = map.range ?? Infinity;
      const rangeChanged = (range < 5000 && lastRange >= 5000) || (range >= 5000 && lastRange < 5000) ||
        (range < 1000 && lastRange >= 1000) || (range >= 1000 && lastRange < 1000);
      if (rangeChanged) {
        spawnTraffic();
      }
      lastRange = range;
      if (range < 5000) animateTraffic();
    }, 2000);

    // Initial spawn
    setTimeout(spawnTraffic, 2000);

    return () => {
      clearInterval(rangeCheck);
      if (trafficInterval) clearInterval(trafficInterval);
      trafficMarkersRef.forEach(m => { try { m.remove(); } catch {} });
    };
  }, []);

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
        const alt = Math.max(ac.altitudeFt * 0.3048, 500);
        addMarker(ac.lat, ac.lon,
          aircraftSvg(ac.heading, color, ac.callsign),
          alt, true,
          () => {
            setDetailPanel({ type: 'aircraft', data: ac });
            setFollowTarget({
              type: 'aircraft', id: ac.callsign,
              lat: ac.lat, lon: ac.lon,
              heading: ac.heading, altitude: alt,
              speed: ac.speedKts * 1.852,
            });
          }
        );
      });
    }

    // Satellites — ALL visible, sizePreserved, bigger
    if (layers.satellites) {
      satellites.forEach(sat => {
        const isISS = sat.name.includes('ISS');
        const isMil = sat.name.includes('COSMOS') || sat.name.includes('USA-') || sat.name.includes('MUOS') || sat.name.includes('NROL') || sat.name.includes('YAOGAN') || sat.name.includes('HAWK');
        const isStarlink = sat.name.includes('STARLINK');
        const isDebris = sat.name.includes('DEBRIS');
        const color = isStarlink ? '#a855f7' : isMil ? '#ff6b35' : isISS ? '#ff6600' : isDebris ? '#666666' : '#00d4ff';
        const alt = sat.alt * 1000;
        addMarker(sat.lat, sat.lon,
          satelliteSvg(color, sat.name, isISS),
          alt, true,
          () => {
            setDetailPanel({ type: 'satellite', data: sat });
            setFollowTarget({
              type: 'satellite', id: sat.name,
              lat: sat.lat, lon: sat.lon,
              heading: 0, altitude: alt,
              speed: sat.velocity * 3600,
            });
          }
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
          () => { stopFollow(); setDetailPanel({ type: 'earthquake', data: eq }); }
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
          () => { stopFollow(); setDetailPanel({ type: 'volcano', data: v }); }
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
          () => {
            setDetailPanel({ type: 'vessel', data: v });
            setFollowTarget({
              type: 'vessel', id: v.id,
              lat: v.lat, lon: v.lon,
              heading: v.heading, altitude: 0,
              speed: v.speedKnots * 1.852,
            });
          }
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
          () => { stopFollow(); setDetailPanel({ type: 'protest', data: p }); }
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
          () => { stopFollow(); setDetailPanel({ type: 'outage', data: o }); }
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
          () => { stopFollow(); setDetailPanel({ type: 'weather', data: w }); }
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

    // Fires (NASA EONET)
    if (layers.fires) {
      fires.forEach(f => {
        const icons: Record<string, string> = { wildfire: '🔥', volcano: '🌋', storm: '🌀', flood: '🌊', earthquake: '💥', drought: '☀️', landslide: '⛰️', other: '⚠️' };
        const colors: Record<string, string> = { wildfire: '#ff4400', volcano: '#ff0044', storm: '#00d4ff', flood: '#4488ff', earthquake: '#ff6600', drought: '#ffb000', landslide: '#aa6633', other: '#ff6b35' };
        addMarker(f.lat, f.lon,
          iconSvg(icons[f.category] || '🔥', colors[f.category] || '#ff4400', f.title.substring(0, 16)),
          0, true,
          () => { stopFollow(); setDetailPanel({ type: 'fire', data: f }); }
        );
      });
    }

    // Pipelines
    if (layers.pipelines) {
      (async () => {
        try {
          const { Polyline3DElement } = await (google.maps as any).importLibrary('maps3d');
          PIPELINES.forEach(pipe => {
            const polyline = new Polyline3DElement({ strokeColor: pipe.color + 'BB', strokeWidth: 4, altitudeMode: 'CLAMP_TO_GROUND' });
            polyline.path = pipe.coordinates.map(([lat, lon]) => ({ lat, lng: lon, altitude: 0 }));
            map.append(polyline);
            markersRef.current.push(polyline);
            // Add label marker at midpoint
            const mid = pipe.coordinates[Math.floor(pipe.coordinates.length / 2)];
            addMarker(mid[0], mid[1], iconSvg('🛢️', pipe.color, pipe.name.substring(0, 14), pipe.capacity), 0, true);
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

    // CCTV cameras — click flies to 3D street level + FOV cone
    if (layers.cameras) {
      (async () => {
        try {
          const { Polygon3DElement } = await (google.maps as any).importLibrary('maps3d');
          PUBLIC_CAMERAS.forEach(cam => {
            addMarker(cam.lat, cam.lon,
              cameraSvg(cam.name, cam.official),
              0, true,
              () => flyToCamera(cam)
            );

            // Draw FOV cone on the ground showing where camera looks
            const heading = cam.heading ?? 0;
            const fovDeg = 60;
            const distKm = 0.06; // 60m cone
            const R = 6371;
            const latRad = (cam.lat * Math.PI) / 180;
            const lonRad = (cam.lon * Math.PI) / 180;

            const calcPoint = (angleDeg: number) => {
              const a = (angleDeg * Math.PI) / 180;
              const lat2 = Math.asin(
                Math.sin(latRad) * Math.cos(distKm / R) +
                Math.cos(latRad) * Math.sin(distKm / R) * Math.cos(a)
              );
              const lon2 = lonRad + Math.atan2(
                Math.sin(a) * Math.sin(distKm / R) * Math.cos(latRad),
                Math.cos(distKm / R) - Math.sin(latRad) * Math.sin(lat2)
              );
              return { lat: (lat2 * 180) / Math.PI, lng: (lon2 * 180) / Math.PI, altitude: 2 };
            };

            const conePoints = [{ lat: cam.lat, lng: cam.lon, altitude: 2 }];
            const arcSteps = 8;
            for (let i = 0; i <= arcSteps; i++) {
              conePoints.push(calcPoint(heading - fovDeg / 2 + (fovDeg * i) / arcSteps));
            }
            conePoints.push({ lat: cam.lat, lng: cam.lon, altitude: 2 });

            const cone = new Polygon3DElement({
              fillColor: '#fbbf2440',
              strokeColor: '#fbbf2480',
              strokeWidth: 1,
              altitudeMode: 'RELATIVE_TO_GROUND',
            });
            // Use 'path' (new API) with fallback to deprecated 'outerCoordinates'
            if ('path' in cone) {
              cone.path = conePoints;
            } else {
              (cone as any).outerCoordinates = conePoints;
            }
            map.append(cone);
            markersRef.current.push(cone);
          });
        } catch (err) {
          console.warn('Camera FOV cone fail:', err);
        }
      })();
    }

  }, [layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, fires, setDetailPanel, setActiveLivestream, flyToCamera, setFollowTarget, stopFollow]);

  return (
    <div ref={containerRef} className="w-full h-full bg-background relative">
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
