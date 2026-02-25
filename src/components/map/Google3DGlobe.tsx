import { useEffect, useRef, memo, useCallback, useState } from 'react';
import { useWorldViewStore, NUCLEAR_SITES, FollowTarget, LANDMARK_PRESETS } from '@/store/worldview';
import { CONFLICT_ZONES } from '@/data/conflictZones';
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=beta&libraries=maps3d`;
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


function carSvg(color: string, heading: number) {
  return svgEl(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <g transform="rotate(${heading}, 10, 10)">
      <rect x="6" y="2" width="8" height="16" rx="3" fill="${color}" opacity="0.92" stroke="#000" stroke-width="0.5"/>
      <rect x="7" y="4" width="6" height="3" rx="1" fill="#000" opacity="0.45"/>
      <rect x="7" y="12" width="6" height="2" rx="0.5" fill="#000" opacity="0.3"/>
      <circle cx="7.5" cy="2.5" r="1.2" fill="#ffffaa" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="12.5" cy="2.5" r="1.2" fill="#ffffaa" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="7.5" cy="17" r="0.9" fill="#ff3333" opacity="0.8"/>
      <circle cx="12.5" cy="17" r="0.9" fill="#ff3333" opacity="0.8"/>
    </g>
  </svg>`);
}

/** Compute heading between two lat/lng points in degrees */
function bearingBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x = Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

interface RoadCar {
  marker: any;
  path: { lat: number; lng: number }[];
  progress: number; // 0..1
  speed: number; // progress per tick
  color: string;
  forward: boolean;
}

/** Fetch real road geometries from OpenStreetMap via Overpass edge function */
const roadCache = new Map<string, { lat: number; lng: number }[][]>();
let lastOverpassCall = 0;
let overpassCooldown = 0; // backoff ms after 429
const OVERPASS_MIN_INTERVAL = 4000; // minimum 4s between calls

async function fetchRealRoads(centerLat: number, centerLng: number, range: number): Promise<{ lat: number; lng: number }[][]> {
  // Coarser grid for cache — snap to ~200m
  const keyLat = Math.round(centerLat * 50) / 50;
  const keyLng = Math.round(centerLng * 50) / 50;
  const cacheKey = `${keyLat},${keyLng},${Math.round(range / 100) * 100}`;
  if (roadCache.has(cacheKey)) return roadCache.get(cacheKey)!;

  // Also check nearby cache keys (within ~500m)
  for (const [k, v] of roadCache.entries()) {
    const [kLat, kLng] = k.split(',').map(Number);
    if (Math.abs(kLat - keyLat) < 0.006 && Math.abs(kLng - keyLng) < 0.006) return v;
  }

  // Rate-limit: respect cooldown after 429
  const now = Date.now();
  const minWait = Math.max(OVERPASS_MIN_INTERVAL, overpassCooldown);
  if (now - lastOverpassCall < minWait) {
    return roadCache.size > 0
      ? Array.from(roadCache.values())[roadCache.size - 1]
      : generateFallbackGrid(centerLat, centerLng, range);
  }
  lastOverpassCall = now;

  try {
    const radius = Math.min(Math.max(range * 0.8, 300), 1200);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const res = await fetch(`${supabaseUrl}/functions/v1/overpass-roads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ lat: centerLat, lng: centerLng, radius }),
    });
    if (res.status === 429) {
      overpassCooldown = Math.min((overpassCooldown || 5000) * 2, 60000);
      console.warn(`Overpass 429 — backing off ${overpassCooldown}ms`);
      return generateFallbackGrid(centerLat, centerLng, range);
    }
    if (!res.ok) throw new Error(`${res.status}`);
    overpassCooldown = 0; // reset on success
    const data = await res.json();
    const roads: { lat: number; lng: number }[][] = data.roads || [];
    roadCache.set(cacheKey, roads);
    // Keep cache at 100 entries
    if (roadCache.size > 100) {
      const firstKey = roadCache.keys().next().value;
      if (firstKey) roadCache.delete(firstKey);
    }
    return roads;
  } catch (err) {
    console.warn('Overpass fetch failed, using fallback grid:', err);
    return generateFallbackGrid(centerLat, centerLng, range);
  }
}

/** Fallback procedural grid if Overpass fails */
function generateFallbackGrid(centerLat: number, centerLng: number, range: number): { lat: number; lng: number }[][] {
  const roads: { lat: number; lng: number }[][] = [];
  const gridSpan = range < 1000 ? 0.004 : range < 2500 ? 0.012 : 0.025;
  const gridLines = range < 1000 ? 6 : 3;
  const pts = 10;
  for (let i = 0; i < gridLines; i++) {
    const lat = centerLat - gridSpan + (gridSpan * 2 * i) / (gridLines - 1);
    const path: { lat: number; lng: number }[] = [];
    for (let j = 0; j < pts; j++) {
      path.push({ lat: lat + Math.sin(j * 0.8 + i) * gridSpan * 0.02, lng: centerLng - gridSpan + (gridSpan * 2 * j) / (pts - 1) });
    }
    roads.push(path);
  }
  for (let i = 0; i < gridLines; i++) {
    const lng = centerLng - gridSpan + (gridSpan * 2 * i) / (gridLines - 1);
    const path: { lat: number; lng: number }[] = [];
    for (let j = 0; j < pts; j++) {
      path.push({ lat: centerLat - gridSpan + (gridSpan * 2 * j) / (pts - 1), lng: lng + Math.sin(j * 0.8 + i) * gridSpan * 0.02 });
    }
    roads.push(path);
  }
  return roads;
}

/** Interpolate along a path at a given progress (0..1) */
function interpolateAlongPath(path: { lat: number; lng: number }[], progress: number): { lat: number; lng: number; heading: number } {
  if (path.length < 2) return { lat: path[0]?.lat ?? 0, lng: path[0]?.lng ?? 0, heading: 0 };
  const totalSegments = path.length - 1;
  const exactIdx = progress * totalSegments;
  const idx = Math.min(Math.floor(exactIdx), totalSegments - 1);
  const t = exactIdx - idx;
  const p1 = path[idx];
  const p2 = path[Math.min(idx + 1, path.length - 1)];
  const lat = p1.lat + (p2.lat - p1.lat) * t;
  const lng = p1.lng + (p2.lng - p1.lng) * t;
  const heading = bearingBetween(p1.lat, p1.lng, p2.lat, p2.lng);
  return { lat, lng, heading };
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

  const { layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, fires, setDetailPanel, setActiveLivestream, mapCenter, followTarget, setFollowTarget, layerSubFilters } = useWorldViewStore();

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

  // Fly camera to a CCTV location — fly overhead first, don't go street-level
  const flyToCamera = useCallback((cam: PublicCamera) => {
    stopFollow();
    const map = mapRef.current;
    if (!map) return;

    // Draw highlighted FOV cone
    drawActiveCamCone(cam);

    // Cinematic fly to overhead view of the camera (not street-level)
    if (typeof map.flyCameraTo === 'function') {
      map.flyCameraTo({
        endCamera: {
          center: { lat: cam.lat, lng: cam.lon, altitude: 0 },
          range: 500,
          tilt: 55,
          heading: cam.heading || 0,
        },
        durationMillis: 2500,
      });
    } else {
      map.center = { lat: cam.lat, lng: cam.lon, altitude: 0 };
      map.range = 500;
      map.tilt = 55;
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
      // Append to the map-host div, not containerRef (which includes overlay)
      const host = containerRef.current?.querySelector('.map-host') as HTMLDivElement;
      if (host) {
        host.innerHTML = '';
        host.appendChild(map);
      }
      mapRef.current = map;
      setMapReady(true);
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

    // Periodic update: keep camera centered on target smoothly
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

      // Smooth camera follow using flyCameraTo for interpolation
      if (typeof map.flyCameraTo === 'function') {
        map.flyCameraTo({
          endCamera: {
            center: { lat: updatedLat, lng: updatedLon, altitude: updatedAlt },
            range: map.range ?? range,
            tilt: map.tilt ?? tilt,
            heading: map.heading ?? 0,
          },
          durationMillis: 1800,
        });
      } else {
        map.center = { lat: updatedLat, lng: updatedLon, altitude: updatedAlt };
      }

      // Redraw trajectory at new position
      drawTrajectory(updatedTarget);
    }, 2000);

    return () => {
      if (followIntervalRef.current) { clearInterval(followIntervalRef.current); followIntervalRef.current = null; }
    };
  }, [followTarget?.id, followTarget?.type]);

  // ── Seamless road-traffic simulation — real OSM roads with smooth animation ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const roadCars: RoadCar[] = [];
    let animFrame: number | null = null;
    let lastCenter = { lat: 0, lng: 0 };
    let lastRange = Infinity;
    let destroyed = false;
    let fetchingRoads = false;

    const CAR_COLORS = ['#e8e8e8', '#cccccc', '#ffdd44', '#ff4444', '#4488ff', '#222222', '#888888', '#ffffff', '#ff8800', '#00cc66', '#dddddd', '#aaaaaa', '#334455'];

    const clearCars = () => {
      roadCars.forEach(c => { try { c.marker.remove(); } catch {} });
      roadCars.length = 0;
    };

    const spawnCarsOnGrid = async () => {
      if (destroyed || fetchingRoads) return;
      const sf = useWorldViewStore.getState().layerSubFilters;
      if (!sf.showTraffic) { clearCars(); return; }

      const range = map.range ?? Infinity;
      if (range > 8000) { clearCars(); return; }

      const centerLat = map.center?.lat ?? 0;
      const centerLng = map.center?.lng ?? 0;

      // Don't respawn if camera hasn't moved much
      const dist = Math.abs(centerLat - lastCenter.lat) + Math.abs(centerLng - lastCenter.lng);
      if (dist < 0.003 && roadCars.length > 0 && Math.abs(range - lastRange) < 800) return;

      clearCars();
      lastCenter = { lat: centerLat, lng: centerLng };
      lastRange = range;

      fetchingRoads = true;
      try {
        const lib = await (google.maps as any).importLibrary('maps3d');
        const densityMult = sf.trafficDensity / 50;
        const roads = await fetchRealRoads(centerLat, centerLng, range);

        // More cars on longer roads, fewer on short ones
        roads.forEach(path => {
          if (path.length < 2) return;
          // Estimate road length in degrees
          let len = 0;
          for (let i = 1; i < path.length; i++) {
            len += Math.abs(path[i].lat - path[i-1].lat) + Math.abs(path[i].lng - path[i-1].lng);
          }
          const baseCars = Math.max(1, Math.round(len * 800 * densityMult));
          const carsOnRoad = Math.min(baseCars, 6);

          for (let i = 0; i < carsOnRoad; i++) {
            const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
            const progress = Math.random();
            const forward = Math.random() > 0.5;
            // Vary speed: some fast, some slow — feels more real
            const speed = 0.0005 + Math.random() * 0.004;

            const pos = interpolateAlongPath(path, progress);
            const marker = new lib.Marker3DElement({
              position: { lat: pos.lat, lng: pos.lng, altitude: 1 },
              altitudeMode: 'CLAMP_TO_GROUND',
              sizePreserved: false,
            });
            const template = document.createElement('template');
            template.content.append(carSvg(color, pos.heading));
            marker.append(template);
            map.append(marker);

            roadCars.push({ marker, path, progress, speed, color, forward });
          }
        });
      } catch {} finally {
        fetchingRoads = false;
      }
    };



    // Smooth animation loop using requestAnimationFrame for buttery smooth motion
    let frameCount = 0;
    let lastTime = 0;
    const tick = (timestamp: number) => {
      if (destroyed) return;
      // Throttle to ~60fps with delta-time based movement
      const delta = timestamp - lastTime;
      if (delta >= 16) { // ~60fps
        lastTime = timestamp;
        // Delta-time scaling for consistent speed regardless of frame rate
        const dtScale = Math.min(delta / 33, 3); // normalize to ~30fps baseline
        for (const car of roadCars) {
          car.progress += (car.forward ? car.speed : -car.speed) * dtScale;
          if (car.progress >= 1) car.progress = 0;
          if (car.progress <= 0) car.progress = 1;
          const pos = interpolateAlongPath(car.path, car.progress);
          try {
            car.marker.position = { lat: pos.lat, lng: pos.lng, altitude: 1 };
          } catch {}
        }
        // Update SVG heading every 8 frames to reduce DOM churn
        frameCount++;
        if (frameCount % 8 === 0) {
          for (const car of roadCars) {
            try {
              const pos = interpolateAlongPath(car.path, car.progress);
              car.marker.innerHTML = '';
              const template = document.createElement('template');
              template.content.append(carSvg(car.color, car.forward ? pos.heading : (pos.heading + 180) % 360));
              car.marker.append(template);
            } catch {}
          }
        }
      }
      animFrame = requestAnimationFrame(tick) as unknown as number;
    };
    const startTick = () => { animFrame = requestAnimationFrame(tick) as unknown as number; };

    const rangeCheck = setInterval(() => {
      if (destroyed) return;
      const range = map.range ?? Infinity;
      if (range < 8000) {
        spawnCarsOnGrid();
      } else if (roadCars.length > 0) {
        clearCars();
      }
    }, 4000);

    setTimeout(spawnCarsOnGrid, 1500);
    startTick();

    return () => {
      destroyed = true;
      clearInterval(rangeCheck);
      if (animFrame) cancelAnimationFrame(animFrame);
      clearCars();
    };
  }, [layerSubFilters.showTraffic, layerSubFilters.trafficDensity]);

  // ── Render markers (double-buffered to prevent flicker) ──
  const pendingMarkersRef = useRef<any[]>([]);
  const renderGenRef = useRef(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const thisGen = ++renderGenRef.current;
    const newMarkers: any[] = [];
    let addedCount = 0;
    let expectedCount = 0;
    let flushed = false;

    // Flush: swap old markers for new once all are ready
    const tryFlush = () => {
      if (flushed || thisGen !== renderGenRef.current) return;
      if (addedCount < expectedCount) return;
      flushed = true;
      // Remove old markers
      markersRef.current.forEach(m => { try { m.remove(); } catch {} });
      markersRef.current = newMarkers;
    };

    // Fallback: flush after timeout even if some markers failed
    const flushTimer = setTimeout(() => {
      if (!flushed && thisGen === renderGenRef.current) {
        flushed = true;
        markersRef.current.forEach(m => { try { m.remove(); } catch {} });
        markersRef.current = newMarkers;
      }
    }, 2000);

    const addMarker = async (
      lat: number, lng: number, svg: SVGElement,
      altitude = 0, sizePreserved = false, onClick?: () => void
    ) => {
      if (thisGen !== renderGenRef.current) return;
      try {
        const lib = await (google.maps as any).importLibrary('maps3d');
        if (thisGen !== renderGenRef.current) return;
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
        newMarkers.push(marker);
      } catch (err) {
        console.warn('Marker fail:', err);
      } finally {
        addedCount++;
        tryFlush();
      }
    };

    // Aircraft — filtered by sub-options
    if (layers.aircraft) {
      let filteredAircraft = aircraft.filter(ac => {
        if (!layers.militaryFlights && ac.isMilitary) return false;
        if (!layerSubFilters.showMilitaryAC && ac.isMilitary) return false;
        if (!layerSubFilters.showCivilian && !ac.isMilitary) return false;
        return true;
      });
      // Apply density cap
      if (layerSubFilters.maxAircraft < 100) {
        const maxCount = Math.round(filteredAircraft.length * (layerSubFilters.maxAircraft / 100));
        filteredAircraft = filteredAircraft.slice(0, maxCount);
      }
      filteredAircraft.forEach(ac => {
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

    // Satellites — filtered by sub-options
    if (layers.satellites) {
      satellites.forEach(sat => {
        const isISS = sat.name.includes('ISS');
        const isMil = sat.name.includes('COSMOS') || sat.name.includes('USA-') || sat.name.includes('MUOS') || sat.name.includes('NROL') || sat.name.includes('YAOGAN') || sat.name.includes('HAWK');
        const isStarlink = sat.name.includes('STARLINK');
        const isDebris = sat.name.includes('DEBRIS');

        // Apply sub-filters
        if (isStarlink && !layerSubFilters.showStarlink) return;
        if (isMil && !layerSubFilters.showMilitarySats) return;
        if (isDebris && !layerSubFilters.showDebris) return;
        if (!isISS && !isMil && !isStarlink && !isDebris && !layerSubFilters.showCommSats) return;

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

    // Earthquakes — filtered by min magnitude
    if (layers.earthquakes) {
      earthquakes
        .filter(eq => eq.magnitude >= layerSubFilters.minMagnitude)
        .forEach(eq => {
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

    // Vessels — filtered by type
    if (layers.vessels) {
      const vesselTypeMap: Record<string, keyof typeof layerSubFilters> = {
        yacht: 'showYachts', cargo: 'showCargo', tanker: 'showTankers',
        military: 'showMilVessels', fishing: 'showFishing', passenger: 'showPassenger',
      };
      vessels.forEach(v => {
        const filterKey = vesselTypeMap[v.type];
        if (filterKey && !layerSubFilters[filterKey]) return;
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

    // Weather — filtered
    if (layers.weather) {
      weatherAlerts
        .filter(w => !layerSubFilters.showExtremeOnly || w.isExtreme)
        .forEach(w => {
          const color = w.isExtreme ? '#ff0044' : w.temp > 35 ? '#ff6b35' : w.temp < 0 ? '#00d4ff' : '#ffb000';
          addMarker(w.lat, w.lon,
            iconSvg(w.isExtreme ? '⚠️' : '🌡', color, `${Math.round(w.temp)}°C`, w.city),
            0, false,
            () => { stopFollow(); setDetailPanel({ type: 'weather', data: w }); }
          );
        });
    }

    // Nuclear — filtered by type
    if (layers.nuclearSites) {
      NUCLEAR_SITES.forEach(site => {
        const isWeapon = site.type === 'weapons';
        const isPower = site.type === 'power' || site.type === 'enrichment' || site.type === 'reprocessing';
        if (isWeapon && !layerSubFilters.showWeapons) return;
        if (isPower && !layerSubFilters.showPower) return;
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
            newMarkers.push(polyline);
          });
        } catch {}
      })();
    }

    // Fires (NASA EONET) — filtered
    if (layers.fires) {
      fires.forEach(f => {
        const isWildfire = f.category === 'wildfire' || f.category === 'volcano';
        const isStorm = f.category === 'storm' || f.category === 'flood';
        if (isWildfire && !layerSubFilters.showWildfires) return;
        if (isStorm && !layerSubFilters.showStorms) return;
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
            newMarkers.push(polyline);
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
            const fovDeg = 70;
            const distKm = 0.10; // 100m cone — more visible
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
              fillColor: '#fbbf2470',
              strokeColor: '#fbbf24cc',
              strokeWidth: 2,
              altitudeMode: 'RELATIVE_TO_GROUND',
            });
            // Use 'path' (new API) with fallback to deprecated 'outerCoordinates'
            if ('path' in cone) {
              cone.path = conePoints;
            } else {
              (cone as any).outerCoordinates = conePoints;
            }
            map.append(cone);
            newMarkers.push(cone);
          });
        } catch (err) {
          console.warn('Camera FOV cone fail:', err);
        }
      })();
    }

    // Set expected count hint (not exact due to async polylines/cones, but flush timer handles that)
    expectedCount = 999999; // rely on flush timer for final swap
    // Trigger flush timer-based swap
    return () => { clearTimeout(flushTimer); };
  }, [layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, fires, setDetailPanel, setActiveLivestream, flyToCamera, setFollowTarget, stopFollow, layerSubFilters]);

  // ── Auto-orbit idle camera ──
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orbitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orbitIdxRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);

  // Mark map ready once initMap succeeds
  useEffect(() => {
    if (mapRef.current) setMapReady(true);
    const check = setInterval(() => {
      if (mapRef.current) { setMapReady(true); clearInterval(check); }
    }, 500);
    return () => clearInterval(check);
  }, []);

  // Auto-orbit: after 25s idle, start flying between landmarks
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const ORBIT_LOCATIONS = LANDMARK_PRESETS.filter(l =>
      ['NEW YORK', 'TOKYO', 'DUBAI', 'PARIS', 'SYDNEY', 'PYRAMIDS', 'GRAND CANYON', 'SINGAPORE', 'LONDON', 'SAN FRANCISCO', 'HONG KONG', 'ROME', 'MT FUJI', 'ISTANBUL'].includes(l.label)
    );

    const startOrbit = () => {
      if (followTarget || orbitIntervalRef.current) return;
      const flyNext = () => {
        const loc = ORBIT_LOCATIONS[orbitIdxRef.current % ORBIT_LOCATIONS.length];
        orbitIdxRef.current++;
        if (typeof map.flyCameraAround === 'function') {
          map.flyCameraAround({
            camera: {
              center: { lat: loc.lat, lng: loc.lon, altitude: 0 },
              range: Math.max(2000, Math.pow(2, 22 - loc.zoom) * 2),
              tilt: 60,
              heading: Math.random() * 360,
            },
            durationMillis: 18000,
            rounds: 0.4,
          });
        } else if (typeof map.flyCameraTo === 'function') {
          map.flyCameraTo({
            endCamera: {
              center: { lat: loc.lat, lng: loc.lon, altitude: 0 },
              range: Math.max(2000, Math.pow(2, 22 - loc.zoom) * 2),
              tilt: 60,
              heading: Math.random() * 360,
            },
            durationMillis: 5000,
          });
        }
      };
      flyNext();
      orbitIntervalRef.current = setInterval(flyNext, 20000);
    };

    const stopOrbit = () => {
      if (orbitIntervalRef.current) {
        clearInterval(orbitIntervalRef.current);
        orbitIntervalRef.current = null;
      }
    };

    const resetIdle = () => {
      stopOrbit();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(startOrbit, 25000);
    };

    // Listen for user interaction
    const events = ['click', 'mousedown', 'wheel', 'touchstart', 'keydown'];
    const container = containerRef.current;
    events.forEach(e => container?.addEventListener(e, resetIdle, { passive: true }));

    // Start idle timer initially
    idleTimerRef.current = setTimeout(startOrbit, 25000);

    return () => {
      stopOrbit();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach(e => container?.removeEventListener(e, resetIdle));
    };
  }, [mapReady, followTarget]);

  return (
    <div ref={containerRef} className="w-full h-full bg-background relative">
      <div className="map-host w-full h-full" />
      {!mapReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-3">
              <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-2 border border-primary/10 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <span className="text-[11px] font-display tracking-[0.25em] text-primary glow-green">INITIALIZING 3D GLOBE</span>
            <div className="text-[8px] font-data text-muted-foreground/60 mt-1 tracking-wider">GOOGLE MAPS 3D TILES</div>
          </div>
        </div>
      )}
    </div>
  );
});

Google3DGlobe.displayName = 'Google3DGlobe';
export default Google3DGlobe;
