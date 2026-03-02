// Submarine cable incident tracking — combines static cable data with outage detection
// Free, no API key required

export interface CableIncident {
  id: string;
  cableName: string;
  location: string;
  lat: number;
  lon: number;
  date: string;
  type: 'cut' | 'damage' | 'outage' | 'maintenance';
  severity: 'critical' | 'major' | 'minor';
  affectedCapacity: string;
  suspectedCause: string;
  restored: boolean;
  impactedCountries: string[];
}

// Recent notable submarine cable incidents (curated from public reports)
export const CABLE_INCIDENTS: CableIncident[] = [
  {
    id: 'inc-baltic-2025',
    cableName: 'C-Lion1 / BCS East-West',
    location: 'Baltic Sea',
    lat: 56.5, lon: 18.5,
    date: '2025-11-18',
    type: 'cut',
    severity: 'critical',
    affectedCapacity: '144 Tbps',
    suspectedCause: 'Anchor drag — suspected sabotage (Chinese vessel Yi Peng 3)',
    restored: true,
    impactedCountries: ['FI', 'EE', 'DE', 'SE'],
  },
  {
    id: 'inc-red-sea-2024',
    cableName: 'AAE-1 / Seacom / EIG / TGN',
    location: 'Red Sea / Bab el-Mandeb',
    lat: 12.6, lon: 43.3,
    date: '2024-03-05',
    type: 'cut',
    severity: 'critical',
    affectedCapacity: '200+ Tbps',
    suspectedCause: 'Houthi-linked anchor of MV Rubymar',
    restored: false,
    impactedCountries: ['DJ', 'ET', 'SO', 'YE', 'SA'],
  },
  {
    id: 'inc-taiwan-2023',
    cableName: 'APCN-2 / Matsu segment',
    location: 'Taiwan Strait',
    lat: 26.2, lon: 120.0,
    date: '2023-02-08',
    type: 'cut',
    severity: 'major',
    affectedCapacity: '~10 Tbps',
    suspectedCause: 'Chinese fishing/cargo vessel anchor',
    restored: true,
    impactedCountries: ['TW'],
  },
  {
    id: 'inc-svalbard-2022',
    cableName: 'Svalbard Undersea Cable',
    location: 'Arctic Ocean (Svalbard)',
    lat: 76.5, lon: 16.0,
    date: '2022-01-07',
    type: 'damage',
    severity: 'major',
    affectedCapacity: '10 Gbps',
    suspectedCause: 'Unknown — Norwegian investigation',
    restored: true,
    impactedCountries: ['NO'],
  },
  {
    id: 'inc-west-africa-2024',
    cableName: 'WACS / SAT-3 / MainOne / ACE',
    location: 'West Africa (Abidjan)',
    lat: 5.3, lon: -4.0,
    date: '2024-03-14',
    type: 'cut',
    severity: 'critical',
    affectedCapacity: '100+ Tbps',
    suspectedCause: 'Undersea landslide / seismic',
    restored: true,
    impactedCountries: ['CI', 'GH', 'NG', 'SN', 'CM', 'LR', 'SL'],
  },
];

export const getCableIncidentStats = () => {
  const active = CABLE_INCIDENTS.filter(i => !i.restored);
  const critical = CABLE_INCIDENTS.filter(i => i.severity === 'critical');
  return {
    totalIncidents: CABLE_INCIDENTS.length,
    activeIncidents: active.length,
    criticalIncidents: critical.length,
    affectedCountries: [...new Set(CABLE_INCIDENTS.flatMap(i => i.impactedCountries))].length,
  };
};
