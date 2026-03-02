// IODA (Internet Outage Detection & Analysis) — Georgia Tech / CAIDA
// Free, no API key required

export interface InternetOutage {
  country: string;
  countryCode: string;
  severity: 'critical' | 'major' | 'minor' | 'normal';
  score: number; // 0-100 (100 = fully connected)
  normalScore: number;
  dropPercent: number;
  timestamp: string;
  lat: number;
  lon: number;
}

// ISO alpha-2 → approximate centroid coordinates
const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  AF: { lat: 33.93, lon: 67.71 }, AL: { lat: 41.15, lon: 20.17 }, DZ: { lat: 28.03, lon: 1.66 },
  AO: { lat: -11.20, lon: 17.87 }, AR: { lat: -38.42, lon: -63.62 }, AM: { lat: 40.07, lon: 45.04 },
  AU: { lat: -25.27, lon: 133.78 }, AT: { lat: 47.52, lon: 14.55 }, AZ: { lat: 40.14, lon: 47.58 },
  BD: { lat: 23.68, lon: 90.36 }, BY: { lat: 53.71, lon: 27.95 }, BE: { lat: 50.50, lon: 4.47 },
  BJ: { lat: 9.31, lon: 2.32 }, BO: { lat: -16.29, lon: -63.59 }, BA: { lat: 43.92, lon: 17.68 },
  BR: { lat: -14.24, lon: -51.93 }, BG: { lat: 42.73, lon: 25.49 }, BF: { lat: 12.24, lon: -1.56 },
  BI: { lat: -3.37, lon: 29.92 }, KH: { lat: 12.57, lon: 104.99 }, CM: { lat: 7.37, lon: 12.35 },
  CA: { lat: 56.13, lon: -106.35 }, CF: { lat: 6.61, lon: 20.94 }, TD: { lat: 15.45, lon: 18.73 },
  CL: { lat: -35.68, lon: -71.54 }, CN: { lat: 35.86, lon: 104.20 }, CO: { lat: 4.57, lon: -74.30 },
  CD: { lat: -4.04, lon: 21.76 }, CG: { lat: -0.23, lon: 15.83 }, CR: { lat: 9.75, lon: -83.75 },
  CI: { lat: 7.54, lon: -5.55 }, HR: { lat: 45.10, lon: 15.20 }, CU: { lat: 21.52, lon: -77.78 },
  CY: { lat: 35.13, lon: 33.43 }, CZ: { lat: 49.82, lon: 15.47 }, DK: { lat: 56.26, lon: 9.50 },
  DJ: { lat: 11.83, lon: 42.59 }, DO: { lat: 18.74, lon: -70.16 }, EC: { lat: -1.83, lon: -78.18 },
  EG: { lat: 26.82, lon: 30.80 }, SV: { lat: 13.79, lon: -88.90 }, GQ: { lat: 1.65, lon: 10.27 },
  ER: { lat: 15.18, lon: 39.78 }, EE: { lat: 58.60, lon: 25.01 }, ET: { lat: 9.15, lon: 40.49 },
  FI: { lat: 61.92, lon: 25.75 }, FR: { lat: 46.23, lon: 2.21 }, GA: { lat: -0.80, lon: 11.61 },
  GM: { lat: 13.44, lon: -15.31 }, GE: { lat: 42.32, lon: 43.36 }, DE: { lat: 51.17, lon: 10.45 },
  GH: { lat: 7.95, lon: -1.02 }, GR: { lat: 39.07, lon: 21.82 }, GT: { lat: 15.78, lon: -90.23 },
  GN: { lat: 9.95, lon: -9.70 }, GW: { lat: 11.80, lon: -15.18 }, GY: { lat: 4.86, lon: -58.93 },
  HT: { lat: 18.97, lon: -72.29 }, HN: { lat: 15.20, lon: -86.24 }, HU: { lat: 47.16, lon: 19.50 },
  IS: { lat: 64.96, lon: -19.02 }, IN: { lat: 20.59, lon: 78.96 }, ID: { lat: -0.79, lon: 113.92 },
  IR: { lat: 32.43, lon: 53.69 }, IQ: { lat: 33.22, lon: 43.68 }, IE: { lat: 53.14, lon: -7.69 },
  IL: { lat: 31.05, lon: 34.85 }, IT: { lat: 41.87, lon: 12.57 }, JM: { lat: 18.11, lon: -77.30 },
  JP: { lat: 36.20, lon: 138.25 }, JO: { lat: 30.59, lon: 36.24 }, KZ: { lat: 48.02, lon: 66.92 },
  KE: { lat: -0.02, lon: 37.91 }, KW: { lat: 29.31, lon: 47.48 }, KG: { lat: 41.20, lon: 74.77 },
  LA: { lat: 19.86, lon: 102.50 }, LV: { lat: 56.88, lon: 24.60 }, LB: { lat: 33.85, lon: 35.86 },
  LR: { lat: 6.43, lon: -9.43 }, LY: { lat: 26.34, lon: 17.23 }, LT: { lat: 55.17, lon: 23.88 },
  MG: { lat: -18.77, lon: 46.87 }, MW: { lat: -13.25, lon: 34.30 }, MY: { lat: 4.21, lon: 101.98 },
  ML: { lat: 17.57, lon: -4.00 }, MR: { lat: 21.01, lon: -10.94 }, MX: { lat: 23.63, lon: -102.55 },
  MD: { lat: 47.41, lon: 28.37 }, MN: { lat: 46.86, lon: 103.85 }, ME: { lat: 42.71, lon: 19.37 },
  MA: { lat: 31.79, lon: -7.09 }, MZ: { lat: -18.67, lon: 35.53 }, MM: { lat: 21.91, lon: 95.96 },
  NA: { lat: -22.96, lon: 18.49 }, NP: { lat: 28.39, lon: 84.12 }, NL: { lat: 52.13, lon: 5.29 },
  NZ: { lat: -40.90, lon: 174.89 }, NI: { lat: 12.87, lon: -85.21 }, NE: { lat: 17.61, lon: 8.08 },
  NG: { lat: 9.08, lon: 8.68 }, KP: { lat: 40.34, lon: 127.51 }, NO: { lat: 60.47, lon: 8.47 },
  OM: { lat: 21.47, lon: 55.98 }, PK: { lat: 30.38, lon: 69.35 }, PA: { lat: 8.54, lon: -80.78 },
  PG: { lat: -6.31, lon: 143.96 }, PY: { lat: -23.44, lon: -58.44 }, PE: { lat: -9.19, lon: -75.02 },
  PH: { lat: 12.88, lon: 121.77 }, PL: { lat: 51.92, lon: 19.15 }, PT: { lat: 39.40, lon: -8.22 },
  QA: { lat: 25.35, lon: 51.18 }, RO: { lat: 45.94, lon: 24.97 }, RU: { lat: 61.52, lon: 105.32 },
  RW: { lat: -1.94, lon: 29.87 }, SA: { lat: 23.89, lon: 45.08 }, SN: { lat: 14.50, lon: -14.45 },
  RS: { lat: 44.02, lon: 21.01 }, SL: { lat: 8.46, lon: -11.78 }, SG: { lat: 1.35, lon: 103.82 },
  SK: { lat: 48.67, lon: 19.70 }, SI: { lat: 46.15, lon: 14.99 }, SO: { lat: 5.15, lon: 46.20 },
  ZA: { lat: -30.56, lon: 22.94 }, KR: { lat: 35.91, lon: 127.77 }, SS: { lat: 6.88, lon: 31.31 },
  ES: { lat: 40.46, lon: -3.75 }, LK: { lat: 7.87, lon: 80.77 }, SD: { lat: 12.86, lon: 30.22 },
  SE: { lat: 60.13, lon: 18.64 }, CH: { lat: 46.82, lon: 8.23 }, SY: { lat: 34.80, lon: 39.00 },
  TW: { lat: 23.70, lon: 120.96 }, TJ: { lat: 38.86, lon: 71.28 }, TZ: { lat: -6.37, lon: 34.89 },
  TH: { lat: 15.87, lon: 100.99 }, TG: { lat: 8.62, lon: 1.21 }, TN: { lat: 33.89, lon: 9.54 },
  TR: { lat: 38.96, lon: 35.24 }, TM: { lat: 38.97, lon: 59.56 }, UG: { lat: 1.37, lon: 32.29 },
  UA: { lat: 48.38, lon: 31.17 }, AE: { lat: 23.42, lon: 53.85 }, GB: { lat: 55.38, lon: -3.44 },
  US: { lat: 37.09, lon: -95.71 }, UY: { lat: -32.52, lon: -55.77 }, UZ: { lat: 41.38, lon: 64.59 },
  VE: { lat: 6.42, lon: -66.59 }, VN: { lat: 14.06, lon: 108.28 }, YE: { lat: 15.55, lon: 48.52 },
  ZM: { lat: -13.13, lon: 27.85 }, ZW: { lat: -19.02, lon: 29.15 },
  PS: { lat: 31.95, lon: 35.23 }, XK: { lat: 42.60, lon: 20.90 }, MK: { lat: 41.51, lon: 21.75 },
};

export const fetchInternetOutages = async (): Promise<InternetOutage[]> => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const hourAgo = now - 3600;
    const res = await fetch(
      `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/country?from=${hourAgo}&until=${now}&sourceParams=ping-slash24`
    );
    if (!res.ok) {
      console.warn('IODA API returned', res.status);
      return [];
    }
    const data = await res.json();
    if (!data?.data) return [];

    const outages: InternetOutage[] = [];
    for (const entity of data.data) {
      const values = entity.values || [];
      if (values.length === 0) continue;
      const normal = entity.normalizedValues?.[entity.normalizedValues.length - 1] ?? 100;
      const drop = Math.max(0, 100 - normal);
      if (drop > 5) {
        const code = (entity.entityCode || '').toUpperCase();
        const coords = COUNTRY_COORDS[code];
        if (!coords) continue; // skip unknown countries

        let severity: InternetOutage['severity'] = 'minor';
        if (drop > 50) severity = 'critical';
        else if (drop > 25) severity = 'major';

        outages.push({
          country: entity.entityName || entity.entityCode,
          countryCode: code,
          severity,
          score: Math.round(normal),
          normalScore: 100,
          dropPercent: Math.round(drop),
          timestamp: new Date(now * 1000).toISOString(),
          lat: coords.lat,
          lon: coords.lon,
        });
      }
    }
    return outages.sort((a, b) => b.dropPercent - a.dropPercent);
  } catch (e) {
    console.warn('Failed to fetch IODA outages:', e);
    return [];
  }
};
