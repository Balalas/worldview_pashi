import { create } from 'zustand';
import { WeatherAlert, VolcanoData } from '@/services/weatherService';
import { CountryData } from '@/services/countryService';
import { GlobalCamera } from '@/services/cameraService';
import { ConflictIntel, MissileActivity } from '@/services/conflictIntelService';

export interface NewsHotspot {
  id: string;
  lat: number;
  lon: number;
  radius: number;
  intensity: 'critical' | 'high' | 'medium';
  label: string;
  newsCount: number;
  categories: string[];
  timestamp: Date;
}

export type LayerType =
  | 'aircraft' | 'satellites' | 'cameras' | 'militaryFlights'
  | 'vessels' | 'nuclearSites' | 'underseaCables' | 'conflicts'
  | 'protests' | 'earthquakes' | 'fires' | 'outages'
  | 'pipelines' | 'datacenters' | 'volcanoes' | 'weather'
  | 'militaryBases' | 'spaceports' | 'chokepoints' | 'criticalMinerals';

export type HudLayout = 'full' | 'tactical' | 'clean';

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
  missionType?: 'Tanker/Transport' | 'VIP Transport' | 'Surveillance' | 'Medical Evacuation' | 'Classified' | 'Military';
  squawk?: string;
  lastContact?: number;
}

export interface Satellite {
  name: string;
  lat: number;
  lon: number;
  alt: number;
  velocity: number;
  category: 'station' | 'starlink' | 'military' | 'active';
  noradId?: string;
  tle1?: string;
  tle2?: string;
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
  felt?: number;
  tsunami?: number;
  alert?: string;
  significance?: number;
  mmi?: number;
  status?: string;
  type?: string;
}

export interface Vessel {
  id: string;
  name: string;
  type: 'yacht' | 'cargo' | 'tanker' | 'military' | 'fishing' | 'passenger' | 'container';
  lat: number;
  lon: number;
  heading: number;
  speedKnots: number;
  flag: string;
  length: number; // meters
  destination?: string;
  mmsi?: string;
}

export interface ProtestEvent {
  id: string;
  title: string;
  lat: number;
  lon: number;
  country: string;
  intensity: 'large' | 'medium' | 'small';
  source: string;
  time: Date;
  link?: string;
}

export interface OutageEvent {
  id: string;
  title: string;
  lat: number;
  lon: number;
  type: 'internet' | 'power' | 'cyber' | 'telecom' | 'ddos' | 'ransomware';
  severity: 'critical' | 'major' | 'minor';
  source: string;
  time: Date;
  affected?: string;
  link?: string;
}

export interface FireEvent {
  id: string;
  title: string;
  lat: number;
  lon: number;
  brightness: number;    // Kelvin (VIIRS bright_ti4 or MODIS brightness)
  frp: number;           // Fire Radiative Power in MW
  confidence: string;    // 'low' | 'nominal' | 'high' (VIIRS) or percentage (MODIS)
  acq_date: string;      // 'YYYY-MM-DD'
  acq_time: string;      // 'HHMM' (UTC)
  date: string;
  source: string;
  link?: string;
  category: 'wildfire' | 'volcano' | 'storm' | 'flood' | 'earthquake' | 'drought' | 'landslide' | 'other';
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  tier: 1 | 2 | 3 | 4;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  time: Date;
  isStateMedia?: boolean;
  link?: string;
  category?: 'general' | 'protest' | 'cyber' | 'military' | 'conflict';
  country?: string;
  image?: string;
}

export interface GeoEvent {
  id: string;
  title: string;
  lat: number;
  lon: number;
  country: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  source: string;
  time: string;
  type: string;
}

export interface DetailPanel {
  type: 'aircraft' | 'satellite' | 'earthquake' | 'volcano' | 'weather' | 'cable' | 'vessel' | 'protest' | 'outage' | 'camera' | 'fire' | 'country' | 'conflict' | 'none';
  data: any;
}

export interface FollowTarget {
  type: 'aircraft' | 'satellite' | 'vessel';
  id: string; // callsign, name, or vessel id
  lat: number;
  lon: number;
  heading: number;
  altitude: number; // meters
  speed: number; // km/h or knots depending on type
}

export interface CountryInstability {
  country: string;
  flag: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  level: 'critical' | 'high' | 'medium' | 'low';
}

export type BottomPanelTab = 'news' | 'livestream' | 'radio' | 'pizza' | 'weather' | 'stats' | 'posture' | 'instability' | 'risk' | 'indexes' | 'markets' | 'trending' | 'convergence' | 'sources' | 'predictions';
export type MapMode = '2d' | 'google3d';
export type DashboardMode = 'WORLD' | 'TECH' | 'FINANCE';
export type VisualStyle = 'normal' | 'crt' | 'nvg' | 'flir' | 'anime' | 'noir' | 'snow' | 'ai';
export type DetectionMode = 'full' | 'sparse';

export interface MapCenter {
  lat: number;
  lon: number;
  zoom: number;
}

export interface RegionPreset {
  label: string;
  emoji: string;
  lat: number;
  lon: number;
  zoom: number;
}

export const REGION_PRESETS: RegionPreset[] = [
  { label: 'GLOBAL', emoji: '🌍', lat: 20, lon: 0, zoom: 3 },
  { label: 'AMERICAS', emoji: '🌎', lat: 15, lon: -80, zoom: 4 },
  { label: 'EUROPE', emoji: '🌍', lat: 50, lon: 15, zoom: 5 },
  { label: 'MENA', emoji: '🕌', lat: 28, lon: 40, zoom: 5 },
  { label: 'ASIA', emoji: '🌏', lat: 30, lon: 105, zoom: 4 },
  { label: 'AFRICA', emoji: '🌍', lat: 0, lon: 20, zoom: 4 },
  { label: 'ARCTIC', emoji: '🧊', lat: 75, lon: 0, zoom: 4 },
  { label: 'PACIFIC', emoji: '🌊', lat: 0, lon: -160, zoom: 3 },
];

export const LANDMARK_PRESETS: RegionPreset[] = [
  // Wonders & Icons
  { label: 'GREAT WALL', emoji: '🏯', lat: 40.4319, lon: 116.5704, zoom: 12 },
  { label: 'PYRAMIDS', emoji: '🔺', lat: 29.9792, lon: 31.1342, zoom: 15 },
  { label: 'MACHU PICCHU', emoji: '🏔️', lat: -13.1631, lon: -72.5450, zoom: 15 },
  { label: 'TAJ MAHAL', emoji: '🕌', lat: 27.1751, lon: 78.0421, zoom: 17 },
  { label: 'COLOSSEUM', emoji: '🏛️', lat: 41.8902, lon: 12.4922, zoom: 17 },
  { label: 'PETRA', emoji: '🏜️', lat: 30.3285, lon: 35.4444, zoom: 15 },
  { label: 'CHRIST REDEEMER', emoji: '✝️', lat: -22.9519, lon: -43.2105, zoom: 16 },
  { label: 'CHICHEN ITZA', emoji: '🛕', lat: 20.6843, lon: -88.5678, zoom: 16 },
  // Cities & Skylines
  { label: 'NEW YORK', emoji: '🗽', lat: 40.6892, lon: -74.0445, zoom: 14 },
  { label: 'LONDON', emoji: '🇬🇧', lat: 51.5014, lon: -0.1419, zoom: 14 },
  { label: 'PARIS', emoji: '🗼', lat: 48.8584, lon: 2.2945, zoom: 16 },
  { label: 'TOKYO', emoji: '🗼', lat: 35.6586, lon: 139.7454, zoom: 14 },
  { label: 'DUBAI', emoji: '🏙️', lat: 25.1972, lon: 55.2744, zoom: 15 },
  { label: 'SYDNEY', emoji: '🦘', lat: -33.8568, lon: 151.2153, zoom: 16 },
  { label: 'MOSCOW', emoji: '🏰', lat: 55.7539, lon: 37.6208, zoom: 15 },
  { label: 'HONG KONG', emoji: '🌃', lat: 22.2783, lon: 114.1747, zoom: 14 },
  { label: 'SINGAPORE', emoji: '🌴', lat: 1.2834, lon: 103.8607, zoom: 15 },
  { label: 'SAN FRANCISCO', emoji: '🌉', lat: 37.8199, lon: -122.4783, zoom: 15 },
  { label: 'ISTANBUL', emoji: '🕌', lat: 41.0082, lon: 28.9784, zoom: 14 },
  { label: 'ROME', emoji: '🏛️', lat: 41.9028, lon: 12.4964, zoom: 14 },
  { label: 'BEIJING', emoji: '🏯', lat: 39.9163, lon: 116.3972, zoom: 15 },
  { label: 'CAIRO', emoji: '🏛️', lat: 30.0444, lon: 31.2357, zoom: 13 },
  // Natural Wonders
  { label: 'GRAND CANYON', emoji: '🏜️', lat: 36.1069, lon: -112.1129, zoom: 13 },
  { label: 'NIAGARA FALLS', emoji: '💧', lat: 43.0962, lon: -79.0377, zoom: 15 },
  { label: 'MT EVEREST', emoji: '🏔️', lat: 27.9881, lon: 86.9250, zoom: 14 },
  { label: 'MT FUJI', emoji: '🗻', lat: 35.3606, lon: 138.7274, zoom: 13 },
  { label: 'VICTORIA FALLS', emoji: '💧', lat: -17.9243, lon: 25.8572, zoom: 15 },
  { label: 'ULURU', emoji: '🪨', lat: -25.3444, lon: 131.0369, zoom: 14 },
  { label: 'AURORA / TROMSØ', emoji: '🌌', lat: 69.6496, lon: 18.9560, zoom: 12 },
  { label: 'AMAZON RIVER', emoji: '🌿', lat: -3.1190, lon: -60.0217, zoom: 10 },
  { label: 'SAHARA DESERT', emoji: '🏜️', lat: 23.4162, lon: 25.6628, zoom: 6 },
  { label: 'GREAT BARRIER REEF', emoji: '🐠', lat: -18.2871, lon: 147.6992, zoom: 8 },
  { label: 'YELLOWSTONE', emoji: '♨️', lat: 44.4280, lon: -110.5885, zoom: 11 },
  { label: 'DEAD SEA', emoji: '🌊', lat: 31.5, lon: 35.5, zoom: 11 },
  // Military & Strategic
  { label: 'PENTAGON', emoji: '⭐', lat: 38.8719, lon: -77.0563, zoom: 17 },
  { label: 'AREA 51', emoji: '👽', lat: 37.2431, lon: -115.7930, zoom: 13 },
  { label: 'KREMLIN', emoji: '🏰', lat: 55.7520, lon: 37.6175, zoom: 17 },
  { label: 'DMZ KOREA', emoji: '⚠️', lat: 37.9567, lon: 126.6778, zoom: 12 },
  { label: 'DIEGO GARCIA', emoji: '🏝️', lat: -7.3195, lon: 72.4229, zoom: 12 },
  { label: 'RAMSTEIN AFB', emoji: '✈️', lat: 49.4369, lon: 7.6003, zoom: 14 },
  { label: 'GUANTÁNAMO', emoji: '🔒', lat: 19.9023, lon: -75.0961, zoom: 13 },
  // Space & Tech
  { label: 'CAPE CANAVERAL', emoji: '🚀', lat: 28.3922, lon: -80.6077, zoom: 14 },
  { label: 'BAIKONUR', emoji: '🚀', lat: 45.9646, lon: 63.3052, zoom: 12 },
  { label: 'CERN', emoji: '⚛️', lat: 46.2330, lon: 6.0557, zoom: 14 },
  { label: 'SILICON VALLEY', emoji: '💻', lat: 37.3875, lon: -122.0575, zoom: 12 },
  // Historical
  { label: 'ACROPOLIS', emoji: '🏛️', lat: 37.9715, lon: 23.7267, zoom: 17 },
  { label: 'ANGKOR WAT', emoji: '🛕', lat: 13.4125, lon: 103.8670, zoom: 16 },
  { label: 'STONEHENGE', emoji: '🪨', lat: 51.1789, lon: -1.8262, zoom: 16 },
  { label: 'POMPEII', emoji: '🌋', lat: 40.7484, lon: 14.4848, zoom: 16 },
  { label: 'EASTER ISLAND', emoji: '🗿', lat: -27.1127, lon: -109.3497, zoom: 13 },
  { label: 'FORBIDDEN CITY', emoji: '🏯', lat: 39.9163, lon: 116.3972, zoom: 17 },
  { label: 'VERSAILLES', emoji: '👑', lat: 48.8049, lon: 2.1204, zoom: 16 },
  { label: 'AUSCHWITZ', emoji: '🕯️', lat: 50.0343, lon: 19.1784, zoom: 16 },
  { label: 'HIROSHIMA', emoji: '☮️', lat: 34.3955, lon: 132.4536, zoom: 16 },
];

export interface LayerSubFilters {
  // Satellites
  showStarlink: boolean;
  showMilitarySats: boolean;
  showDebris: boolean;
  showCommSats: boolean;
  // Aircraft
  showCivilian: boolean;
  showMilitaryAC: boolean;
  showHelicopters: boolean;
  maxAircraft: number; // 0-100 slider
  // Vessels
  showYachts: boolean;
  showCargo: boolean;
  showTankers: boolean;
  showMilVessels: boolean;
  showFishing: boolean;
  showPassenger: boolean;
  // Earthquakes
  minMagnitude: number;
  earthquakeTimeWindow: '1H' | '6H' | '24H' | '48H' | '7D';
  // Weather
  showExtremeOnly: boolean;
  showClouds: boolean;
  showRadar: boolean;
  cloudOpacity: number; // 0-100
  // Fires
  showWildfires: boolean;
  showStorms: boolean;
  // Nuclear
  showWeapons: boolean;
  showPower: boolean;
  // Traffic
  trafficDensity: number; // 0-100
  showTraffic: boolean;
  // Cables
  showLandCables: boolean;
}

export const DEFAULT_SUB_FILTERS: LayerSubFilters = {
  showStarlink: false,
  showMilitarySats: true,
  showDebris: false,
  showCommSats: false,
  showCivilian: true,
  showMilitaryAC: true,
  showHelicopters: true,
  maxAircraft: 50,
  showYachts: true,
  showCargo: true,
  showTankers: true,
  showMilVessels: true,
  showFishing: true,
  showPassenger: true,
  minMagnitude: 2.5,
  earthquakeTimeWindow: '24H' as const,
  showExtremeOnly: false,
  showClouds: true,
  showRadar: false,
  cloudOpacity: 50,
  showWildfires: true,
  showStorms: true,
  showWeapons: true,
  showPower: true,
  trafficDensity: 50,
  showTraffic: true,
  showLandCables: false,
};

export interface WorldViewState {
  layers: Record<LayerType, boolean>;
  toggleLayer: (layer: LayerType) => void;

  layerSubFilters: LayerSubFilters;
  setSubFilter: <K extends keyof LayerSubFilters>(key: K, value: LayerSubFilters[K]) => void;
  toggleSubFilter: (key: keyof LayerSubFilters) => void;

  aircraft: Aircraft[];
  setAircraft: (a: Aircraft[]) => void;

  satellites: Satellite[];
  setSatellites: (s: Satellite[]) => void;

  earthquakes: Earthquake[];
  setEarthquakes: (e: Earthquake[]) => void;

  vessels: Vessel[];
  setVessels: (v: Vessel[]) => void;

  protests: ProtestEvent[];
  setProtests: (p: ProtestEvent[]) => void;

  outages: OutageEvent[];
  setOutages: (o: OutageEvent[]) => void;

  fires: FireEvent[];
  setFires: (f: FireEvent[]) => void;

  news: NewsItem[];
  setNews: (n: NewsItem[]) => void;

  geoEvents: GeoEvent[];
  setGeoEvents: (e: GeoEvent[]) => void;

  liveCameras: GlobalCamera[];
  setLiveCameras: (c: GlobalCamera[]) => void;

  weatherAlerts: WeatherAlert[];
  setWeatherAlerts: (w: WeatherAlert[]) => void;

  volcanoes: VolcanoData[];
  setVolcanoes: (v: VolcanoData[]) => void;

  detailPanel: DetailPanel;
  setDetailPanel: (p: DetailPanel) => void;
  closeDetailPanel: () => void;

  lastRefresh: Date;
  setLastRefresh: (d: Date) => void;

  leftPanelOpen: boolean;
  toggleLeftPanel: () => void;

  bottomPanelCollapsed: boolean;
  toggleBottomPanel: () => void;

  bottomPanelExpanded: boolean;
  setBottomPanelExpanded: (v: boolean) => void;

  bottomTab: BottomPanelTab;
  setBottomTab: (tab: BottomPanelTab) => void;

  activeLivestream: string | null;
  setActiveLivestream: (id: string | null) => void;

  newsLoading: boolean;
  setNewsLoading: (b: boolean) => void;

  mapMode: MapMode;
  setMapMode: (mode: MapMode) => void;

  dashboardMode: DashboardMode;
  setDashboardMode: (mode: DashboardMode) => void;

  mapCenter: MapCenter | null;
  setMapCenter: (center: MapCenter) => void;

  activeRegion: string;
  setActiveRegion: (region: string) => void;

  followTarget: FollowTarget | null;
  setFollowTarget: (target: FollowTarget | null) => void;

  visualStyle: VisualStyle;
  setVisualStyle: (style: VisualStyle) => void;

  filterParams: Record<string, number>;
  setFilterParam: (key: string, value: number) => void;
  resetFilterParams: () => void;

  detectionMode: DetectionMode;
  setDetectionMode: (mode: DetectionMode) => void;
  toggleDetectionMode: () => void;

  leftPanelFloating: boolean;
  toggleLeftPanelFloating: () => void;

  isScreensaver: boolean;
  setScreensaver: (v: boolean) => void;

  immersiveMode: boolean;
  toggleImmersiveMode: () => void;

  hudLayout: HudLayout;
  cycleHudLayout: () => void;

  panopticEnabled: boolean;
  togglePanoptic: () => void;
  panopticDensity: number;
  setPanopticDensity: (n: number) => void;

  circularViewport: boolean;
  toggleCircularViewport: () => void;

  warMode: boolean;
  toggleWarMode: () => void;
  preWarLayers: Record<LayerType, boolean> | null;
  preWarSubFilters: LayerSubFilters | null;

  countryDossier: CountryData | null;
  openCountryDossier: (country: CountryData) => void;
  closeCountryDossier: () => void;

  conflictIntel: ConflictIntel | null;
  setConflictIntel: (intel: ConflictIntel | null) => void;
  missileArcs: MissileActivity[];
  setMissileArcs: (arcs: MissileActivity[]) => void;

  manualRefresh: number;
  triggerManualRefresh: () => void;

  // Drone fly mode
  droneMode: boolean;
  toggleDroneMode: () => void;

  // Epstein mode
  epsteinMode: boolean;
  toggleEpsteinMode: () => void;

  // Twitter OSINT geo markers
  twitterGeoMarkers: TwitterGeoMarker[];
  setTwitterGeoMarkers: (markers: TwitterGeoMarker[]) => void;

  // Full Twitter OSINT posts (for X card + country dossier)
  twitterPosts: TwitterOsintPost[];
  setTwitterPosts: (posts: TwitterOsintPost[]) => void;
  twitterLastFetch: string | null;
  setTwitterLastFetch: (ts: string) => void;

  // News-driven hotspots
  newsHotspots: NewsHotspot[];
  setNewsHotspots: (hotspots: NewsHotspot[]) => void;
}

export interface TwitterGeoMarker {
  id: string;
  lat: number;
  lon: number;
  place: string;
  text: string;
  account: string;
  url: string;
  createdAt: string;
}

export interface TwitterOsintPost {
  id: string;
  account: string;
  text: string;
  createdAt: string;
  url: string;
  geo: { lat: number; lon: number; place: string } | null;
  metrics: { like_count?: number; retweet_count?: number; reply_count?: number };
}

export const useWorldViewStore = create<WorldViewState>((set) => ({
  layers: {
    aircraft: true,
    satellites: true,
    cameras: false,
    militaryFlights: true,
    vessels: false,
    nuclearSites: false,
    underseaCables: true,
    conflicts: true,
    protests: false,
    earthquakes: false,
    fires: false,
    outages: false,
    pipelines: false,
    datacenters: false,
    volcanoes: false,
    weather: false,
    militaryBases: false,
    spaceports: false,
    chokepoints: false,
    criticalMinerals: false,
  },
  toggleLayer: (layer) => set((s) => ({
    layers: { ...s.layers, [layer]: !s.layers[layer] }
  })),

  layerSubFilters: { ...DEFAULT_SUB_FILTERS },
  setSubFilter: (key, value) => set((s) => ({ layerSubFilters: { ...s.layerSubFilters, [key]: value } })),
  toggleSubFilter: (key) => set((s) => {
    const current = s.layerSubFilters[key];
    if (typeof current === 'boolean') {
      return { layerSubFilters: { ...s.layerSubFilters, [key]: !current } };
    }
    return {};
  }),

  aircraft: [],
  setAircraft: (aircraft) => set({ aircraft }),

  satellites: [],
  setSatellites: (satellites) => set({ satellites }),

  earthquakes: [],
  setEarthquakes: (earthquakes) => set({ earthquakes }),

  vessels: [],
  setVessels: (vessels) => set({ vessels }),

  protests: [],
  setProtests: (protests) => set({ protests }),

  outages: [],
  setOutages: (outages) => set({ outages }),

  fires: [],
  setFires: (fires) => set({ fires }),

  news: [],
  setNews: (news) => set({ news }),

  geoEvents: [],
  setGeoEvents: (geoEvents) => set({ geoEvents }),

  liveCameras: [],
  setLiveCameras: (liveCameras) => set({ liveCameras }),

  weatherAlerts: [],
  setWeatherAlerts: (weatherAlerts) => set({ weatherAlerts }),

  volcanoes: [],
  setVolcanoes: (volcanoes) => set({ volcanoes }),

  detailPanel: { type: 'none', data: null },
  setDetailPanel: (detailPanel) => set({ detailPanel }),
  closeDetailPanel: () => set({ detailPanel: { type: 'none', data: null } }),

  lastRefresh: new Date(),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),

  leftPanelOpen: true,
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),

  bottomPanelCollapsed: false,
  toggleBottomPanel: () => set((s) => ({ bottomPanelCollapsed: !s.bottomPanelCollapsed })),

  bottomPanelExpanded: false,
  setBottomPanelExpanded: (v) => set({ bottomPanelExpanded: v }),

  bottomTab: 'news',
  setBottomTab: (bottomTab) => set({ bottomTab }),

  activeLivestream: null,
  setActiveLivestream: (activeLivestream) => set({ activeLivestream }),

  newsLoading: false,
  setNewsLoading: (newsLoading) => set({ newsLoading }),

  mapMode: '2d',
  setMapMode: (mapMode) => set({ mapMode }),

  dashboardMode: 'WORLD',
  setDashboardMode: (dashboardMode) => set({ dashboardMode }),

  mapCenter: null,
  setMapCenter: (mapCenter) => set({ mapCenter }),

  activeRegion: 'GLOBAL',
  setActiveRegion: (activeRegion) => set({ activeRegion }),

  followTarget: null,
  setFollowTarget: (followTarget) => set({ followTarget }),

  visualStyle: 'normal',
  setVisualStyle: (visualStyle) => set({ visualStyle, filterParams: {} }),

  filterParams: {},
  setFilterParam: (key, value) => set((s) => ({ filterParams: { ...s.filterParams, [key]: value } })),
  resetFilterParams: () => set({ filterParams: {} }),

  detectionMode: 'full',
  setDetectionMode: (detectionMode) => set({ detectionMode }),
  toggleDetectionMode: () => set((s) => ({ detectionMode: s.detectionMode === 'full' ? 'sparse' : 'full' })),

  leftPanelFloating: true,
  toggleLeftPanelFloating: () => set((s) => ({ leftPanelFloating: !s.leftPanelFloating })),

  isScreensaver: false,
  setScreensaver: (isScreensaver) => set({ isScreensaver }),

  immersiveMode: false,
  toggleImmersiveMode: () => set((s) => ({ immersiveMode: !s.immersiveMode })),

  hudLayout: 'full' as HudLayout,
  cycleHudLayout: () => set((s) => {
    const order: HudLayout[] = ['full', 'tactical', 'clean'];
    const next = order[(order.indexOf(s.hudLayout) + 1) % order.length];
    return { hudLayout: next };
  }),

  panopticEnabled: false,
  togglePanoptic: () => set((s) => ({ panopticEnabled: !s.panopticEnabled })),
  panopticDensity: 50,
  setPanopticDensity: (panopticDensity) => set({ panopticDensity }),

  circularViewport: false,
  toggleCircularViewport: () => set((s) => ({ circularViewport: !s.circularViewport })),

  warMode: false,
  preWarLayers: null,
  preWarSubFilters: null,
  toggleWarMode: () => set((s) => {
    if (s.warMode) {
      // Restore previous layers
      return {
        warMode: false,
        layers: s.preWarLayers || s.layers,
        layerSubFilters: s.preWarSubFilters || s.layerSubFilters,
        preWarLayers: null,
        preWarSubFilters: null,
      };
    }
    // Engage war mode — save current state, force military-only
    return {
      warMode: true,
      preWarLayers: { ...s.layers },
      preWarSubFilters: { ...s.layerSubFilters },
      layers: {
        ...s.layers,
        aircraft: true,
        militaryFlights: true,
        conflicts: true,
        satellites: false,
        cameras: false,
        vessels: false,
        nuclearSites: false,
        underseaCables: false,
        protests: false,
        earthquakes: false,
        fires: false,
        outages: false,
        pipelines: false,
        datacenters: false,
        volcanoes: false,
        weather: false,
        militaryBases: true,
        spaceports: false,
        chokepoints: true,
        criticalMinerals: false,
      },
      layerSubFilters: {
        ...s.layerSubFilters,
        showCivilian: false,
        showMilitaryAC: true,
        showHelicopters: true,
        maxAircraft: 100,
      },
      bottomTab: 'news' as BottomPanelTab,
    };
  }),

  countryDossier: null,
  openCountryDossier: (country) => set({ countryDossier: country }),
  closeCountryDossier: () => set({ countryDossier: null }),

  conflictIntel: null,
  setConflictIntel: (conflictIntel) => set({ conflictIntel }),
  missileArcs: [],
  setMissileArcs: (missileArcs) => set({ missileArcs }),

  manualRefresh: 0,
  triggerManualRefresh: () => set((s) => ({ manualRefresh: s.manualRefresh + 1 })),

  droneMode: false,
  toggleDroneMode: () => set((s) => ({ droneMode: !s.droneMode })),

  epsteinMode: false,
  toggleEpsteinMode: () => set((s) => ({ epsteinMode: !s.epsteinMode })),

  twitterGeoMarkers: [],
  setTwitterGeoMarkers: (twitterGeoMarkers) => set({ twitterGeoMarkers }),

  twitterPosts: [],
  setTwitterPosts: (twitterPosts) => set({ twitterPosts }),
  twitterLastFetch: null,
  setTwitterLastFetch: (twitterLastFetch) => set({ twitterLastFetch }),

  newsHotspots: [],
  setNewsHotspots: (newsHotspots) => set({ newsHotspots }),
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
  'w': 'weather',
};

// Mock CII data
export const INSTABILITY_DATA: CountryInstability[] = [
  { country: 'Syria', flag: '🇸🇾', score: 89, trend: 'up', level: 'critical' },
  { country: 'Ukraine', flag: '🇺🇦', score: 73, trend: 'stable', level: 'high' },
  { country: 'Sudan', flag: '🇸🇩', score: 71, trend: 'up', level: 'high' },
  { country: 'Yemen', flag: '🇾🇪', score: 68, trend: 'stable', level: 'high' },
  { country: 'Somalia', flag: '🇸🇴', score: 64, trend: 'up', level: 'high' },
  { country: 'DR Congo', flag: '🇨🇩', score: 62, trend: 'up', level: 'high' },
  { country: 'Afghanistan', flag: '🇦🇫', score: 60, trend: 'stable', level: 'high' },
  { country: 'Iraq', flag: '🇮🇶', score: 57, trend: 'down', level: 'medium' },
  { country: 'Haiti', flag: '🇭🇹', score: 55, trend: 'down', level: 'medium' },
  { country: 'Myanmar', flag: '🇲🇲', score: 52, trend: 'stable', level: 'medium' },
  { country: 'Libya', flag: '🇱🇾', score: 48, trend: 'down', level: 'medium' },
  { country: 'Lebanon', flag: '🇱🇧', score: 47, trend: 'up', level: 'medium' },
  { country: 'Ethiopia', flag: '🇪🇹', score: 45, trend: 'stable', level: 'medium' },
  { country: 'Pakistan', flag: '🇵🇰', score: 43, trend: 'up', level: 'medium' },
  { country: 'Venezuela', flag: '🇻🇪', score: 41, trend: 'stable', level: 'medium' },
  { country: 'North Korea', flag: '🇰🇵', score: 40, trend: 'stable', level: 'medium' },
  { country: 'Cyprus', flag: '🇨🇾', score: 32, trend: 'up', level: 'low' },
  { country: 'Iran', flag: '🇮🇷', score: 38, trend: 'up', level: 'medium' },
  { country: 'Nigeria', flag: '🇳🇬', score: 36, trend: 'stable', level: 'medium' },
  { country: 'Mali', flag: '🇲🇱', score: 44, trend: 'up', level: 'medium' },
  { country: 'Burkina Faso', flag: '🇧🇫', score: 42, trend: 'up', level: 'medium' },
  { country: 'Niger', flag: '🇳🇪', score: 39, trend: 'stable', level: 'medium' },
  { country: 'Mozambique', flag: '🇲🇿', score: 37, trend: 'up', level: 'medium' },
  { country: 'Colombia', flag: '🇨🇴', score: 34, trend: 'down', level: 'low' },
  { country: 'Tunisia', flag: '🇹🇳', score: 30, trend: 'stable', level: 'low' },
  { country: 'Georgia', flag: '🇬🇪', score: 29, trend: 'up', level: 'low' },
  { country: 'Egypt', flag: '🇪🇬', score: 28, trend: 'stable', level: 'low' },
  { country: 'Turkey', flag: '🇹🇷', score: 27, trend: 'stable', level: 'low' },
  { country: 'Taiwan', flag: '🇹🇼', score: 25, trend: 'up', level: 'low' },
];

// Market data
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

// Nuclear sites for the map
export const NUCLEAR_SITES = [
  { name: 'Dimona', lat: 31.0, lon: 35.15, country: 'Israel', type: 'weapons' },
  { name: 'Natanz', lat: 33.73, lon: 51.73, country: 'Iran', type: 'enrichment' },
  { name: 'Fordow', lat: 34.88, lon: 51.58, country: 'Iran', type: 'enrichment' },
  { name: 'Yongbyon', lat: 39.80, lon: 125.75, country: 'North Korea', type: 'reactor' },
  { name: 'Sellafield', lat: 54.42, lon: -3.50, country: 'UK', type: 'reprocessing' },
  { name: 'La Hague', lat: 49.68, lon: -1.88, country: 'France', type: 'reprocessing' },
  { name: 'Zaporizhzhia', lat: 47.51, lon: 34.58, country: 'Ukraine', type: 'power' },
  { name: 'Chernobyl', lat: 51.39, lon: 30.10, country: 'Ukraine', type: 'exclusion' },
  { name: 'Fukushima Daiichi', lat: 37.42, lon: 141.03, country: 'Japan', type: 'decommission' },
  { name: 'Bushehr', lat: 28.83, lon: 50.89, country: 'Iran', type: 'power' },
  { name: 'Barakah', lat: 23.96, lon: 52.26, country: 'UAE', type: 'power' },
  { name: 'Kudankulam', lat: 8.17, lon: 77.71, country: 'India', type: 'power' },
];

// Epstein network — known locations, properties, and flight destinations
export interface EpsteinLocation {
  name: string;
  lat: number;
  lon: number;
  type: 'property' | 'flight_dest' | 'associate' | 'island';
  description: string;
  icon: string;
}

export const EPSTEIN_LOCATIONS: EpsteinLocation[] = [
  // Properties
  { name: 'Little St. James Island', lat: 18.300, lon: -64.825, type: 'island', description: 'Private island ("Pedophile Island"), US Virgin Islands', icon: '🏝️' },
  { name: 'Great St. James Island', lat: 18.319, lon: -64.854, type: 'property', description: 'Second private island, USVI', icon: '🏝️' },
  { name: 'Manhattan Townhouse', lat: 40.7691, lon: -73.9653, type: 'property', description: '9 E 71st St, New York — primary residence', icon: '🏠' },
  { name: 'Palm Beach Estate', lat: 26.6975, lon: -80.0356, type: 'property', description: '358 El Brillo Way, Palm Beach, FL', icon: '🏠' },
  { name: 'Zorro Ranch', lat: 35.05, lon: -105.95, type: 'property', description: '10,000-acre ranch near Stanley, New Mexico', icon: '🏠' },
  { name: 'Paris Apartment', lat: 48.8616, lon: 2.3052, type: 'property', description: 'Avenue Foch apartment, Paris, France', icon: '🏠' },
  // Known flight destinations (Lolita Express routes)
  { name: 'Teterboro Airport', lat: 40.8501, lon: -74.0608, type: 'flight_dest', description: 'Private jet hub, NJ — frequent departure point', icon: '✈️' },
  { name: 'Cyril E. King Airport (STT)', lat: 18.3373, lon: -64.9734, type: 'flight_dest', description: 'St. Thomas, USVI — transfer to island', icon: '✈️' },
  { name: 'Columbus Airport (CMH)', lat: 39.998, lon: -82.892, type: 'flight_dest', description: 'Columbus, OH — Les Wexner connection', icon: '✈️' },
  { name: 'Santa Fe Airport', lat: 35.617, lon: -106.089, type: 'flight_dest', description: 'Near Zorro Ranch, NM', icon: '✈️' },
  { name: 'Palm Beach Intl (PBI)', lat: 26.683, lon: -80.096, type: 'flight_dest', description: 'Near Palm Beach estate', icon: '✈️' },
  { name: 'Ben Gurion Airport', lat: 32.011, lon: 34.887, type: 'flight_dest', description: 'Tel Aviv, Israel — documented flights', icon: '✈️' },
  { name: 'Narita / Tokyo', lat: 35.764, lon: 140.386, type: 'flight_dest', description: 'Tokyo, Japan — flight logs', icon: '✈️' },
  { name: 'London Stansted', lat: 51.885, lon: 0.235, type: 'flight_dest', description: 'UK — Ghislaine Maxwell connections', icon: '✈️' },
  { name: 'Rabat-Salé Airport', lat: 34.051, lon: -6.751, type: 'flight_dest', description: 'Morocco — documented visits', icon: '✈️' },
  // Key associate locations
  { name: 'Ghislaine Maxwell — London', lat: 51.509, lon: -0.118, type: 'associate', description: 'Ghislaine Maxwell primary residence area', icon: '👤' },
  { name: 'Les Wexner — New Albany, OH', lat: 40.079, lon: -82.789, type: 'associate', description: 'Les Wexner estate, New Albany', icon: '👤' },
  { name: 'MCC New York', lat: 40.7168, lon: -74.0012, type: 'associate', description: 'Metropolitan Correctional Center — death location', icon: '⚫' },
];
