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
}

export const fetchInternetOutages = async (): Promise<InternetOutage[]> => {
  try {
    // IODA API for country-level connectivity
    const now = Math.floor(Date.now() / 1000);
    const hourAgo = now - 3600;
    const res = await fetch(
      `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/country?from=${hourAgo}&until=${now}&sourceParams=ping-slash24`
    );
    if (!res.ok) {
      console.warn('IODA API returned', res.status);
      return getStaticOutageData();
    }
    const data = await res.json();
    if (!data?.data) return getStaticOutageData();

    const outages: InternetOutage[] = [];
    for (const entity of data.data) {
      const values = entity.values || [];
      if (values.length === 0) continue;
      const latest = values[values.length - 1];
      const normal = entity.normalizedValues?.[entity.normalizedValues.length - 1] ?? 100;
      const drop = Math.max(0, 100 - normal);
      if (drop > 5) {
        let severity: InternetOutage['severity'] = 'minor';
        if (drop > 50) severity = 'critical';
        else if (drop > 25) severity = 'major';
        outages.push({
          country: entity.entityName || entity.entityCode,
          countryCode: entity.entityCode || '',
          severity,
          score: Math.round(normal),
          normalScore: 100,
          dropPercent: Math.round(drop),
          timestamp: new Date(now * 1000).toISOString(),
        });
      }
    }
    return outages.sort((a, b) => b.dropPercent - a.dropPercent);
  } catch (e) {
    console.warn('Failed to fetch IODA outages:', e);
    return getStaticOutageData();
  }
};

// Fallback: Cloudflare Radar status (public, no key)
function getStaticOutageData(): InternetOutage[] {
  // Return empty — real data will come from IODA when available
  return [];
}
