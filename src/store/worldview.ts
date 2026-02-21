import { create } from 'zustand';

export type LayerType =
  | 'aircraft' | 'satellites' | 'cameras' | 'militaryFlights'
  | 'vessels' | 'nuclearSites' | 'underseaCables' | 'conflicts'
  | 'protests' | 'earthquakes' | 'fires' | 'outages'
  | 'pipelines' | 'datacenters';

export interface Aircraft {
  icao24: string;
  callsign: string;
  country: string;
  lat: number;
  lon: number;
  altitude: number;
  altitudeFt: number;
  speedKts: number;
  heading: number;
  verticalRate: number;
  onGround: boolean;
  isMilitary: boolean;
}

export interface Satellite {
  name: string;
  lat: number;
  lon: number;
  alt: number;
  velocity: number;
}

export interface Earthquake {
  id: string;
  title: string;
  lat: number;
  lon: number;
  magnitude: number;
  depth: number;
  time: number;
  place: string;
  url: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  tier: 1 | 2 | 3 | 4;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  time: Date;
  isStateMedia?: boolean;
}

export interface DetailPanel {
  type: 'aircraft' | 'satellite' | 'earthquake' | 'none';
  data: any;
}

export interface CountryInstability {
  country: string;
  flag: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  level: 'critical' | 'high' | 'medium' | 'low';
}

export interface WorldViewState {
  layers: Record<LayerType, boolean>;
  toggleLayer: (layer: LayerType) => void;

  aircraft: Aircraft[];
  setAircraft: (a: Aircraft[]) => void;

  satellites: Satellite[];
  setSatellites: (s: Satellite[]) => void;

  earthquakes: Earthquake[];
  setEarthquakes: (e: Earthquake[]) => void;

  news: NewsItem[];
  setNews: (n: NewsItem[]) => void;

  detailPanel: DetailPanel;
  setDetailPanel: (p: DetailPanel) => void;
  closeDetailPanel: () => void;

  lastRefresh: Date;
  setLastRefresh: (d: Date) => void;

  leftPanelOpen: boolean;
  toggleLeftPanel: () => void;
}

export const useWorldViewStore = create<WorldViewState>((set) => ({
  layers: {
    aircraft: true,
    satellites: true,
    cameras: false,
    militaryFlights: true,
    vessels: true,
    nuclearSites: false,
    underseaCables: true,
    conflicts: true,
    protests: false,
    earthquakes: true,
    fires: true,
    outages: false,
    pipelines: false,
    datacenters: false,
  },
  toggleLayer: (layer) => set((s) => ({
    layers: { ...s.layers, [layer]: !s.layers[layer] }
  })),

  aircraft: [],
  setAircraft: (aircraft) => set({ aircraft }),

  satellites: [],
  setSatellites: (satellites) => set({ satellites }),

  earthquakes: [],
  setEarthquakes: (earthquakes) => set({ earthquakes }),

  news: [],
  setNews: (news) => set({ news }),

  detailPanel: { type: 'none', data: null },
  setDetailPanel: (detailPanel) => set({ detailPanel }),
  closeDetailPanel: () => set({ detailPanel: { type: 'none', data: null } }),

  lastRefresh: new Date(),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),

  leftPanelOpen: true,
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
}));

// Keyboard shortcuts
export const LAYER_SHORTCUTS: Record<string, LayerType> = {
  'a': 'aircraft',
  's': 'satellites',
  'c': 'cameras',
  'm': 'militaryFlights',
  'v': 'vessels',
  'n': 'nuclearSites',
  'u': 'underseaCables',
  'f': 'fires',
  'e': 'earthquakes',
  'p': 'protests',
  'o': 'outages',
};

// Mock CII data
export const INSTABILITY_DATA: CountryInstability[] = [
  { country: 'Syria', flag: '🇸🇾', score: 89, trend: 'up', level: 'critical' },
  { country: 'Ukraine', flag: '🇺🇦', score: 73, trend: 'stable', level: 'high' },
  { country: 'Sudan', flag: '🇸🇩', score: 71, trend: 'up', level: 'high' },
  { country: 'Yemen', flag: '🇾🇪', score: 68, trend: 'stable', level: 'high' },
  { country: 'Haiti', flag: '🇭🇹', score: 55, trend: 'down', level: 'medium' },
  { country: 'Myanmar', flag: '🇲🇲', score: 52, trend: 'stable', level: 'medium' },
  { country: 'Somalia', flag: '🇸🇴', score: 64, trend: 'up', level: 'high' },
  { country: 'Libya', flag: '🇱🇾', score: 48, trend: 'down', level: 'medium' },
];

// Mock news
export const MOCK_NEWS: NewsItem[] = [
  { id: '1', title: 'Explosion reported near Damascus suburb — casualties feared', source: 'Al Jazeera', tier: 2, severity: 'critical', time: new Date(Date.now() - 120000) },
  { id: '2', title: 'USS Gerald Ford carrier group enters Eastern Mediterranean', source: 'Reuters', tier: 1, severity: 'high', time: new Date(Date.now() - 420000) },
  { id: '3', title: 'Internet disruption reported across Kharkiv region', source: 'BBC', tier: 1, severity: 'high', time: new Date(Date.now() - 900000) },
  { id: '4', title: 'Taiwan Strait: Chinese military drills enter day 3', source: 'AP News', tier: 1, severity: 'high', time: new Date(Date.now() - 1800000) },
  { id: '5', title: 'Oil prices surge 2.4% on Middle East escalation fears', source: 'Bloomberg', tier: 2, severity: 'medium', time: new Date(Date.now() - 3600000) },
  { id: '6', title: 'USGS reports M5.2 earthquake near Istanbul', source: 'USGS', tier: 1, severity: 'medium', time: new Date(Date.now() - 5400000) },
  { id: '7', title: 'Russian naval vessels detected in Norwegian Sea', source: 'Defense One', tier: 3, severity: 'medium', time: new Date(Date.now() - 7200000) },
  { id: '8', title: 'Stablecoin USDT briefly depegs to $0.997 — market watches closely', source: 'CoinDesk', tier: 3, severity: 'low', time: new Date(Date.now() - 9000000) },
];

// Mock market data
export const MARKET_DATA = [
  { symbol: 'S&P 500', value: '5,423.11', change: '+0.42%', up: true },
  { symbol: 'VIX', value: '18.32', change: '-1.2%', up: false, label: 'FEAR' },
  { symbol: 'GOLD', value: '2,145/oz', change: '+0.8%', up: true },
  { symbol: 'OIL WTI', value: '$78.44', change: '-0.3%', up: false },
  { symbol: 'EUR/USD', value: '1.0842', change: '+0.1%', up: true },
  { symbol: 'BTC', value: '$97,412', change: '+2.1%', up: true },
  { symbol: 'NASDAQ', value: '17,129', change: '+0.67%', up: true },
  { symbol: 'DJIA', value: '39,142', change: '+0.31%', up: true },
];
