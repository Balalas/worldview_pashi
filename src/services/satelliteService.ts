import { Satellite } from '@/store/worldview';

// Real ISS position from free API
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

// Comprehensive satellite catalog
const SAT_CATALOG = [
  // ── Space Stations ──
  { name: 'ISS (ZARYA)', type: 'station', alt: 408, vel: 7.66, inc: 51.6 },
  { name: 'TIANGONG', type: 'station', alt: 389, vel: 7.68, inc: 41.5 },

  // ── Science & Telescopes ──
  { name: 'HUBBLE', type: 'science', alt: 540, vel: 7.59, inc: 28.5 },
  { name: 'JAMES WEBB', type: 'science', alt: 1500000, vel: 0.03, inc: 0 },
  { name: 'CHANDRA X-RAY', type: 'science', alt: 133000, vel: 1.5, inc: 28.5 },
  { name: 'JASON-3', type: 'science', alt: 1336, vel: 7.2, inc: 66 },
  { name: 'ICESat-2', type: 'science', alt: 496, vel: 7.61, inc: 92 },
  { name: 'GRACE-FO 1', type: 'science', alt: 490, vel: 7.61, inc: 89 },
  { name: 'GRACE-FO 2', type: 'science', alt: 490, vel: 7.61, inc: 89 },
  { name: 'SWOT', type: 'science', alt: 891, vel: 7.42, inc: 77.6 },

  // ── Starlink constellation ──
  ...Array.from({ length: 80 }, (_, i) => ({ name: `STARLINK-${1000 + i * 47}`, type: 'comms', alt: 550, vel: 7.59, inc: 53 + (i % 5) * 4 })),

  // ── GPS constellation (31 operational) ──
  ...Array.from({ length: 31 }, (_, i) => ({ name: `GPS ${i < 12 ? 'IIF' : 'III'}-${i + 1}`, type: 'navigation', alt: 20200, vel: 3.87, inc: 55 })),

  // ── GLONASS (24 operational) ──
  ...Array.from({ length: 24 }, (_, i) => ({ name: `GLONASS-K${i + 1}`, type: 'navigation', alt: 19130, vel: 3.95, inc: 64.8 })),

  // ── Galileo (24 operational) ──
  ...Array.from({ length: 24 }, (_, i) => ({ name: `GALILEO-${i + 1}`, type: 'navigation', alt: 23222, vel: 3.6, inc: 56 })),

  // ── BeiDou ──
  ...Array.from({ length: 15 }, (_, i) => ({ name: `BEIDOU-3 M${i + 1}`, type: 'navigation', alt: 21528, vel: 3.7, inc: 55 })),

  // ── Military / Recon ──
  { name: 'USA-326', type: 'military', alt: 270, vel: 7.73, inc: 97.4 },
  { name: 'USA-314', type: 'military', alt: 265, vel: 7.73, inc: 97.9 },
  { name: 'USA-325', type: 'military', alt: 280, vel: 7.72, inc: 97.5 },
  { name: 'USA-338', type: 'military', alt: 260, vel: 7.74, inc: 97.8 },
  { name: 'COSMOS 2558', type: 'military', alt: 430, vel: 7.65, inc: 97.3 },
  { name: 'COSMOS 2542', type: 'military', alt: 620, vel: 7.56, inc: 82.4 },
  { name: 'COSMOS 2573', type: 'military', alt: 350, vel: 7.69, inc: 67.1 },
  { name: 'NROL-82', type: 'military', alt: 300, vel: 7.73, inc: 63 },
  { name: 'NROL-87', type: 'military', alt: 290, vel: 7.72, inc: 97 },
  { name: 'NROL-107', type: 'military', alt: 500, vel: 7.61, inc: 63.4 },
  { name: 'YAOGAN-39A', type: 'military', alt: 500, vel: 7.61, inc: 35 },
  { name: 'YAOGAN-39B', type: 'military', alt: 500, vel: 7.61, inc: 35 },
  { name: 'YAOGAN-39C', type: 'military', alt: 500, vel: 7.61, inc: 35 },
  { name: 'MUOS-5', type: 'military', alt: 35786, vel: 3.07, inc: 5 },
  { name: 'MUOS-4', type: 'military', alt: 35786, vel: 3.07, inc: 5 },
  { name: 'MUOS-3', type: 'military', alt: 35786, vel: 3.07, inc: 5 },
  { name: 'WGS-11', type: 'military', alt: 35786, vel: 3.07, inc: 0 },
  { name: 'SBIRS GEO-5', type: 'military', alt: 35786, vel: 3.07, inc: 0 },
  { name: 'SBIRS GEO-6', type: 'military', alt: 35786, vel: 3.07, inc: 0 },

  // ── Weather ──
  { name: 'NOAA-20', type: 'weather', alt: 824, vel: 7.45, inc: 98.7 },
  { name: 'NOAA-21', type: 'weather', alt: 824, vel: 7.45, inc: 98.7 },
  { name: 'GOES-18', type: 'weather', alt: 35786, vel: 3.07, inc: 0.1 },
  { name: 'GOES-16', type: 'weather', alt: 35786, vel: 3.07, inc: 0.1 },
  { name: 'METEOSAT-12', type: 'weather', alt: 35786, vel: 3.07, inc: 0.5 },
  { name: 'METEOSAT-11', type: 'weather', alt: 35786, vel: 3.07, inc: 0.5 },
  { name: 'FENGYUN-4B', type: 'weather', alt: 35786, vel: 3.07, inc: 0.2 },
  { name: 'FENGYUN-4A', type: 'weather', alt: 35786, vel: 3.07, inc: 0.2 },
  { name: 'HIMAWARI-9', type: 'weather', alt: 35786, vel: 3.07, inc: 0.1 },
  { name: 'INSAT-3D', type: 'weather', alt: 35786, vel: 3.07, inc: 0.1 },
  { name: 'SUOMI NPP', type: 'weather', alt: 824, vel: 7.45, inc: 98.7 },

  // ── Earth observation ──
  { name: 'SENTINEL-1A', type: 'earth_obs', alt: 693, vel: 7.5, inc: 98.2 },
  { name: 'SENTINEL-2A', type: 'earth_obs', alt: 786, vel: 7.45, inc: 98.6 },
  { name: 'SENTINEL-2B', type: 'earth_obs', alt: 786, vel: 7.45, inc: 98.6 },
  { name: 'SENTINEL-3A', type: 'earth_obs', alt: 814, vel: 7.45, inc: 98.6 },
  { name: 'SENTINEL-3B', type: 'earth_obs', alt: 814, vel: 7.45, inc: 98.6 },
  { name: 'SENTINEL-5P', type: 'earth_obs', alt: 824, vel: 7.45, inc: 98.7 },
  { name: 'SENTINEL-6A', type: 'earth_obs', alt: 1336, vel: 7.2, inc: 66 },
  { name: 'LANDSAT-9', type: 'earth_obs', alt: 705, vel: 7.5, inc: 98.2 },
  { name: 'LANDSAT-8', type: 'earth_obs', alt: 705, vel: 7.5, inc: 98.2 },
  { name: 'TERRA', type: 'earth_obs', alt: 705, vel: 7.5, inc: 98.1 },
  { name: 'AQUA', type: 'earth_obs', alt: 705, vel: 7.5, inc: 98.2 },
  { name: 'CBERS-4A', type: 'earth_obs', alt: 628, vel: 7.55, inc: 98.5 },
  { name: 'SPOT-7', type: 'earth_obs', alt: 694, vel: 7.5, inc: 98.2 },
  { name: 'PLEIADES NEO-3', type: 'earth_obs', alt: 620, vel: 7.56, inc: 97.9 },
  { name: 'WORLDVIEW-3', type: 'earth_obs', alt: 617, vel: 7.56, inc: 97.2 },
  { name: 'PLANET DOVE-50', type: 'earth_obs', alt: 475, vel: 7.63, inc: 97.4 },

  // ── Communication GEO ──
  { name: 'INTELSAT 39', type: 'comms', alt: 35786, vel: 3.07, inc: 0.1 },
  { name: 'INTELSAT 40E', type: 'comms', alt: 35786, vel: 3.07, inc: 0.1 },
  { name: 'SES-17', type: 'comms', alt: 35786, vel: 3.07, inc: 0.2 },
  { name: 'SES-22', type: 'comms', alt: 35786, vel: 3.07, inc: 0.2 },
  { name: 'VIASAT-3', type: 'comms', alt: 35786, vel: 3.07, inc: 0.1 },
  { name: 'EUTELSAT 36D', type: 'comms', alt: 35786, vel: 3.07, inc: 0.1 },
  { name: 'TURKSAT 5B', type: 'comms', alt: 35786, vel: 3.07, inc: 0.1 },
  { name: 'ASTRA 1P', type: 'comms', alt: 35786, vel: 3.07, inc: 0.1 },

  // ── OneWeb ──
  ...Array.from({ length: 30 }, (_, i) => ({ name: `ONEWEB-${i * 23 + 100}`, type: 'comms', alt: 1200, vel: 7.32, inc: 87.9 })),

  // ── Iridium NEXT ──
  ...Array.from({ length: 66 }, (_, i) => ({ name: `IRIDIUM ${100 + i}`, type: 'comms', alt: 780, vel: 7.46, inc: 86.4 })),

  // ── Amazon Kuiper ──
  ...Array.from({ length: 20 }, (_, i) => ({ name: `KUIPER-${i + 1}`, type: 'comms', alt: 590, vel: 7.58, inc: 51.9 })),
];

// Propagate satellite positions using simple Keplerian motion
export const generateRealisticSatellites = (issPos?: { lat: number; lon: number; alt: number; velocity: number } | null): Satellite[] => {
  const now = Date.now();

  return SAT_CATALOG.map((sat) => {
    // Use real ISS position if available
    if (sat.name === 'ISS (ZARYA)' && issPos) {
      return { name: sat.name, lat: issPos.lat, lon: issPos.lon, alt: issPos.alt, velocity: issPos.velocity };
    }

    // Simple orbital simulation
    const period = 2 * Math.PI * Math.sqrt(Math.pow((6371 + sat.alt) * 1000, 3) / (3.986e14));
    const meanMotion = (2 * Math.PI) / period;
    const elapsed = (now / 1000) % period;
    const phase = Math.random() * 2 * Math.PI;

    const trueAnomaly = meanMotion * elapsed + phase;
    const incRad = (sat.inc * Math.PI) / 180;

    const lat = Math.asin(Math.sin(incRad) * Math.sin(trueAnomaly)) * (180 / Math.PI);
    const raanDrift = (now / 86400000) * 0.9856 * (Math.random() * 2 - 1);
    const lon = ((Math.atan2(Math.cos(incRad) * Math.sin(trueAnomaly), Math.cos(trueAnomaly)) * (180 / Math.PI)) - raanDrift + 720) % 360 - 180;

    return {
      name: sat.name,
      lat: Math.max(-85, Math.min(85, lat)),
      lon,
      alt: sat.alt + (Math.random() - 0.5) * 10,
      velocity: sat.vel + (Math.random() - 0.5) * 0.1,
    };
  });
};