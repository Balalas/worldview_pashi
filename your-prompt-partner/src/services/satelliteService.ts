import { Satellite } from '@/store/worldview';
import * as satellite from 'satellite.js';

// ── TLE Fetching Pipeline ──

interface TLEEntry {
  name: string;
  line1: string;
  line2: string;
  satelliteId: number;
}

let cachedTLEs: TLEEntry[] = [];
let lastFetchTime = 0;
const TLE_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// Batched executor with controlled concurrency
async function runBatched<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(fn => fn()));
    results.push(...batchResults);
  }
  return results;
}

async function fetchTLEPage(page: number, pageSize: number): Promise<TLEEntry[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(
      `https://tle.ivanstanojevic.me/api/tle?page=${page}&page_size=${pageSize}&sort=popularity&sort-dir=desc`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.member || []).map((e: any) => ({
      name: e.name || '',
      line1: e.line1 || '',
      line2: e.line2 || '',
      satelliteId: e.satelliteId || 0,
    }));
  } catch {
    clearTimeout(timer);
    return [];
  }
}

async function fetchTLESearch(query: string, maxPages: number): Promise<TLEEntry[]> {
  const results: TLEEntry[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(
        `https://tle.ivanstanojevic.me/api/tle?search=${encodeURIComponent(query)}&page=${page}&page_size=100`,
        { signal: controller.signal }
      );
      clearTimeout(timer);
      if (!res.ok) break;
      const data = await res.json();
      const entries = (data.member || []).map((e: any) => ({
        name: e.name || '',
        line1: e.line1 || '',
        line2: e.line2 || '',
        satelliteId: e.satelliteId || 0,
      }));
      results.push(...entries);
      if (entries.length < 100) break;
    } catch {
      clearTimeout(timer);
      break;
    }
  }
  return results;
}

const CONSTELLATION_SEARCHES: { query: string; maxPages: number }[] = [
  { query: 'STARLINK', maxPages: 3 },
  { query: 'GPS', maxPages: 2 },
  { query: 'GLONASS', maxPages: 1 },
  { query: 'GALILEO', maxPages: 1 },
  { query: 'BEIDOU', maxPages: 1 },
  { query: 'IRIDIUM', maxPages: 1 },
  { query: 'COSMOS', maxPages: 2 },
  { query: 'NOAA', maxPages: 1 },
  { query: 'GOES', maxPages: 1 },
  { query: 'INTELSAT', maxPages: 1 },
];

async function fetchAllTLEs(): Promise<TLEEntry[]> {
  // Phase 1: Popularity pages (8 pages × 100)
  const pageTasks = Array.from({ length: 8 }, (_, i) => () => fetchTLEPage(i + 1, 100));
  const pageResults = await runBatched(pageTasks, 3);

  const seen = new Set<string>();
  const allEntries: TLEEntry[] = [];

  const addUnique = (entries: TLEEntry[]) => {
    for (const entry of entries) {
      if (!entry.line1 || !entry.line2) continue;
      const noradId = entry.line1.slice(2, 7).trim();
      if (seen.has(noradId)) continue;
      seen.add(noradId);
      allEntries.push(entry);
    }
  };

  for (const result of pageResults) {
    if (result.status === 'fulfilled') addUnique(result.value);
  }

  // Phase 2: Constellation searches
  const searchTasks = CONSTELLATION_SEARCHES.map(s => () => fetchTLESearch(s.query, s.maxPages));
  const searchResults = await runBatched(searchTasks, 2);
  for (const result of searchResults) {
    if (result.status === 'fulfilled') addUnique(result.value);
  }

  console.log(`[SAT] Fetched ${allEntries.length} unique TLEs`);
  return allEntries;
}

// ── Classification ──

function classifySat(name: string): 'station' | 'starlink' | 'military' | 'active' {
  const n = name.toUpperCase();
  if (n.includes('ISS') || n.includes('ZARYA') || n.includes('NAUKA') ||
      n.includes('CSS') || n.includes('TIANHE') || n.includes('TIANGONG')) return 'station';
  if (n.includes('STARLINK') || n.includes('ONEWEB') || n.includes('KUIPER')) return 'starlink';
  if (n.includes('USA ') || n.includes('COSMOS') || n.includes('NROL') ||
      n.includes('MILSTAR') || n.includes('SBIRS') || n.includes('AEHF') ||
      n.includes('WGS') || n.includes('MUOS') || n.includes('YAOGAN') || n.includes('HAWK')) return 'military';
  return 'active';
}

// ── SGP4 Propagation ──

function propagateSatellites(tles: TLEEntry[], timestamp: Date): Satellite[] {
  const results: Satellite[] = [];

  for (const entry of tles) {
    try {
      const satrec = satellite.twoline2satrec(entry.line1, entry.line2);
      const posVel = satellite.propagate(satrec, timestamp);
      if (!posVel || !posVel.position || typeof posVel.position === 'boolean') continue;
      if (!posVel.velocity || typeof posVel.velocity === 'boolean') continue;

      const gmst = satellite.gstime(timestamp);
      const geo = satellite.eciToGeodetic(posVel.position as satellite.EciVec3<number>, gmst);

      const lat = satellite.degreesLat(geo.latitude);
      const lon = satellite.degreesLong(geo.longitude);
      const alt = geo.height; // km
      const vel = posVel.velocity as satellite.EciVec3<number>;
      const velocity = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
      const noradId = entry.line1.slice(2, 7).trim();

      results.push({
        name: entry.name,
        lat: Math.max(-85, Math.min(85, lat)),
        lon,
        alt,
        velocity,
        category: classifySat(entry.name),
        noradId,
        tle1: entry.line1,
        tle2: entry.line2,
      });
    } catch {
      continue;
    }
  }

  return results;
}

// ── Orbit Trajectory Computation ──

export function computeOrbitTrajectory(
  tle1: string, tle2: string, steps = 360
): { lon: number; lat: number; alt: number }[] {
  try {
    const satrec = satellite.twoline2satrec(tle1, tle2);
    const meanMotion = satrec.no * (1440 / (2 * Math.PI));
    const periodMin = 1440 / meanMotion;
    const now = new Date();
    const points: { lon: number; lat: number; alt: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = new Date(now.getTime() + (i / steps) * periodMin * 60 * 1000);
      const posVel = satellite.propagate(satrec, t);
      if (!posVel || !posVel.position || typeof posVel.position === 'boolean') continue;
      const gmst = satellite.gstime(t);
      const geo = satellite.eciToGeodetic(posVel.position as satellite.EciVec3<number>, gmst);
      points.push({
        lon: satellite.degreesLong(geo.longitude),
        lat: satellite.degreesLat(geo.latitude),
        alt: geo.height,
      });
    }
    return points;
  } catch {
    return [];
  }
}

// ── Forward Trajectory Projection (for aircraft) ──

export function projectAircraftPath(
  lat: number, lon: number, altMeters: number,
  headingDeg: number, speedKts: number,
  durationMin = 30, steps = 60
): { lon: number; lat: number; alt: number }[] {
  if (speedKts < 10) return [];
  const R = 6371;
  const speedKmH = speedKts * 1.852;
  const brng = (headingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;
  const points: { lon: number; lat: number; alt: number }[] = [];

  for (let i = 1; i <= steps; i++) {
    const hours = (i / steps) * durationMin / 60;
    const d = (speedKmH * hours) / R;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
    );
    const lon2 = lon1 + Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
    points.push({
      lat: (lat2 * 180) / Math.PI,
      lon: (lon2 * 180) / Math.PI,
      alt: altMeters,
    });
  }
  return points;
}

// ── Public API ──

export const fetchISSPosition = async (): Promise<{ lat: number; lon: number; alt: number; velocity: number } | null> => {
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    if (!res.ok) return null;
    const data = await res.json();
    return { lat: data.latitude, lon: data.longitude, alt: data.altitude, velocity: data.velocity / 1000 };
  } catch {
    return null;
  }
};

export const fetchSatellites = async (): Promise<Satellite[]> => {
  const now = Date.now();
  if (now - lastFetchTime > TLE_CACHE_DURATION || cachedTLEs.length === 0) {
    cachedTLEs = await fetchAllTLEs();
    lastFetchTime = now;
  }
  return propagateSatellites(cachedTLEs, new Date());
};

// Keep backward compatibility
export const generateRealisticSatellites = (issPos?: { lat: number; lon: number; alt: number; velocity: number } | null): Satellite[] => {
  // If we have cached TLEs, use SGP4 propagation
  if (cachedTLEs.length > 0) {
    const sats = propagateSatellites(cachedTLEs, new Date());
    // Override ISS with real position if available
    if (issPos) {
      const issIdx = sats.findIndex(s => s.name.includes('ISS') || s.name.includes('ZARYA'));
      if (issIdx >= 0) {
        sats[issIdx] = { ...sats[issIdx], lat: issPos.lat, lon: issPos.lon, alt: issPos.alt, velocity: issPos.velocity };
      }
    }
    return sats;
  }
  // Initial load — trigger TLE fetch and return empty until ready
  fetchSatellites().catch(() => {});
  return [];
};
