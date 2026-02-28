// OpenSanctions.org — Global sanctions, PEPs, and watchlist data
// Free tier available, no API key for basic search

export interface SanctionEntity {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'vessel' | 'aircraft' | 'unknown';
  country: string;
  datasets: string[];
  firstSeen: string;
  lastSeen: string;
  topics: string[];
  properties?: Record<string, string[]>;
}

export interface SanctionsSnapshot {
  recentEntities: SanctionEntity[];
  totalEntities: number;
  lastUpdated: string;
  topCountries: { country: string; count: number }[];
}

export const searchSanctions = async (query: string): Promise<SanctionEntity[]> => {
  try {
    const res = await fetch(
      `https://api.opensanctions.org/search/default?q=${encodeURIComponent(query)}&limit=20`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map((r: any) => ({
      id: r.id || '',
      name: r.caption || r.name || '',
      type: mapSchemaToType(r.schema),
      country: r.properties?.country?.[0] || '',
      datasets: r.datasets || [],
      firstSeen: r.first_seen || '',
      lastSeen: r.last_seen || '',
      topics: r.properties?.topics || [],
    }));
  } catch (e) {
    console.warn('Failed to search sanctions:', e);
    return [];
  }
};

function mapSchemaToType(schema: string): SanctionEntity['type'] {
  if (!schema) return 'unknown';
  if (schema.includes('Person')) return 'person';
  if (schema.includes('Organization') || schema.includes('Company')) return 'organization';
  if (schema.includes('Vessel')) return 'vessel';
  if (schema.includes('Aircraft') || schema.includes('Airplane')) return 'aircraft';
  return 'unknown';
}

// Major active sanctions regimes
export const ACTIVE_SANCTIONS_REGIMES = [
  { regime: 'Russia/Belarus', authority: 'US/EU/UK/JP/AU', entities: 16500, description: 'Full economic sanctions, energy restrictions, asset freezes' },
  { regime: 'Iran', authority: 'US/EU/UN', entities: 4200, description: 'Nuclear proliferation, missile program, human rights' },
  { regime: 'North Korea', authority: 'UN/US/EU', entities: 1800, description: 'WMD program, missile tests, human rights' },
  { regime: 'Syria', authority: 'US/EU', entities: 2100, description: 'Civil war, chemical weapons, human rights' },
  { regime: 'China (Xinjiang/HK)', authority: 'US/EU/UK', entities: 850, description: 'Human rights, technology restrictions, military entities' },
  { regime: 'Myanmar', authority: 'US/EU/UK', entities: 620, description: 'Military coup, human rights violations' },
  { regime: 'Venezuela', authority: 'US/EU', entities: 480, description: 'Democratic crisis, corruption, narcotics' },
  { regime: 'Yemen (Houthis)', authority: 'US/UN', entities: 350, description: 'Terrorism, shipping attacks, arms embargo' },
];
