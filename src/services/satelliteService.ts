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

// Enhanced satellite dataset with realistic orbital parameters
const SAT_CATALOG = [
  { name: 'ISS (ZARYA)', type: 'station', alt: 408, vel: 7.66, inc: 51.6 },
  { name: 'TIANGONG', type: 'station', alt: 389, vel: 7.68, inc: 41.5 },
  { name: 'HUBBLE', type: 'science', alt: 540, vel: 7.59, inc: 28.5 },
  // Starlink constellation (sampling)
  ...Array.from({ length: 40 }, (_, i) => ({ name: `STARLINK-${1000 + i * 47}`, type: 'comms', alt: 550, vel: 7.59, inc: 53 + (i % 5) * 4 })),
  // GPS
  ...['IIF-1', 'IIF-2', 'IIF-3', 'IIF-4', 'IIF-5', 'IIF-6', 'IIF-7', 'IIF-8', 'IIF-9', 'IIF-10', 'IIF-11', 'IIF-12'].map(n => ({ name: `GPS ${n}`, type: 'navigation', alt: 20200, vel: 3.87, inc: 55 })),
  // Military / Recon
  { name: 'USA-326', type: 'military', alt: 270, vel: 7.73, inc: 97.4 },
  { name: 'USA-314', type: 'military', alt: 265, vel: 7.73, inc: 97.9 },
  { name: 'COSMOS 2558', type: 'military', alt: 430, vel: 7.65, inc: 97.3 },
  { name: 'COSMOS 2542', type: 'military', alt: 620, vel: 7.56, inc: 82.4 },
  { name: 'NROL-82', type: 'military', alt: 300, vel: 7.73, inc: 63 },
  // Weather
  { name: 'NOAA-20', type: 'weather', alt: 824, vel: 7.45, inc: 98.7 },
  { name: 'GOES-18', type: 'weather', alt: 35786, vel: 3.07, inc: 0.1 },
  { name: 'METEOSAT-12', type: 'weather', alt: 35786, vel: 3.07, inc: 0.5 },
  { name: 'FENGYUN-4B', type: 'weather', alt: 35786, vel: 3.07, inc: 0.2 },
  // Earth observation
  { name: 'SENTINEL-2A', type: 'earth_obs', alt: 786, vel: 7.45, inc: 98.6 },
  { name: 'SENTINEL-2B', type: 'earth_obs', alt: 786, vel: 7.45, inc: 98.6 },
  { name: 'LANDSAT-9', type: 'earth_obs', alt: 705, vel: 7.5, inc: 98.2 },
  { name: 'TERRA', type: 'earth_obs', alt: 705, vel: 7.5, inc: 98.1 },
  { name: 'AQUA', type: 'earth_obs', alt: 705, vel: 7.5, inc: 98.2 },
  // Communication GEO
  { name: 'INTELSAT 39', type: 'comms', alt: 35786, vel: 3.07, inc: 0.1 },
  { name: 'SES-17', type: 'comms', alt: 35786, vel: 3.07, inc: 0.2 },
  { name: 'VIASAT-3', type: 'comms', alt: 35786, vel: 3.07, inc: 0.1 },
  // OneWeb
  ...Array.from({ length: 15 }, (_, i) => ({ name: `ONEWEB-${i * 23 + 100}`, type: 'comms', alt: 1200, vel: 7.32, inc: 87.9 })),
  // Iridium
  ...Array.from({ length: 10 }, (_, i) => ({ name: `IRIDIUM ${150 + i}`, type: 'comms', alt: 780, vel: 7.46, inc: 86.4 })),
  // MUOS military comms
  { name: 'MUOS-5', type: 'military', alt: 35786, vel: 3.07, inc: 5 },
  { name: 'MUOS-4', type: 'military', alt: 35786, vel: 3.07, inc: 5 },
  // Scientific
  { name: 'JASON-3', type: 'science', alt: 1336, vel: 7.2, inc: 66 },
  { name: 'ICESat-2', type: 'science', alt: 496, vel: 7.61, inc: 92 },
  { name: 'CBERS-4A', type: 'earth_obs', alt: 628, vel: 7.55, inc: 98.5 },
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
    const period = 2 * Math.PI * Math.sqrt(Math.pow((6371 + sat.alt) * 1000, 3) / (3.986e14)); // seconds
    const meanMotion = (2 * Math.PI) / period;
    const elapsed = (now / 1000) % period;
    const phase = Math.random() * 2 * Math.PI; // random phase offset per satellite

    const trueAnomaly = meanMotion * elapsed + phase;
    const incRad = (sat.inc * Math.PI) / 180;

    // Position in orbital plane
    const lat = Math.asin(Math.sin(incRad) * Math.sin(trueAnomaly)) * (180 / Math.PI);
    // Add Earth's rotation for longitude
    const raanDrift = (now / 86400000) * 0.9856 * (Math.random() * 2 - 1); // rough RAAN
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
