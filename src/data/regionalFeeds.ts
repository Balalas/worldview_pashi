// Regional RSS feeds for region-specific news sections

export interface RegionalFeedConfig {
  region: string;
  emoji: string;
  feeds: { url: string; source: string }[];
}

export const REGIONAL_FEEDS: RegionalFeedConfig[] = [
  {
    region: 'US & AMERICAS',
    emoji: '🇺🇸',
    feeds: [
      { url: 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml', source: 'NYT' },
      { url: 'https://feeds.washingtonpost.com/rss/politics', source: 'WashPost' },
      { url: 'https://feeds.npr.org/1001/rss.xml', source: 'NPR' },
      { url: 'https://feeds.foxnews.com/foxnews/politics', source: 'Fox' },
    ],
  },
  {
    region: 'EUROPE',
    emoji: '🇪🇺',
    feeds: [
      { url: 'https://feeds.bbci.co.uk/news/uk/rss.xml', source: 'BBC UK' },
      { url: 'https://rss.dw.com/rdf/rss-en-eu', source: 'DW' },
      { url: 'https://www.france24.com/en/europe/rss', source: 'France24' },
      { url: 'https://www.theguardian.com/world/europe-news/rss', source: 'Guardian' },
    ],
  },
  {
    region: 'MIDDLE EAST',
    emoji: '🕌',
    feeds: [
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' },
      { url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx', source: 'JPost' },
      { url: 'https://www.middleeasteye.net/rss', source: 'MEE' },
    ],
  },
  {
    region: 'ASIA-PACIFIC',
    emoji: '🌏',
    feeds: [
      { url: 'https://www3.nhk.or.jp/rss/news/cat0.xml', source: 'NHK' },
      { url: 'https://www.scmp.com/rss/91/feed', source: 'SCMP' },
      { url: 'https://feeds.feedburner.com/ndaborsa/world', source: 'NDTV' },
    ],
  },
  {
    region: 'AFRICA',
    emoji: '🌍',
    feeds: [
      { url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', source: 'BBC Africa' },
      { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' },
    ],
  },
  {
    region: 'GOVERNMENT',
    emoji: '🏛️',
    feeds: [
      { url: 'https://www.state.gov/rss-feed/press-releases/feed/', source: 'State Dept' },
      { url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', source: 'UN News' },
    ],
  },
];

// Key global webcams for the webcam grid
export interface WebcamFeed {
  id: string;
  title: string;
  location: string;
  url: string;
  region: string;
  strategic: boolean; // high-interest locations
}

export const GLOBAL_WEBCAMS: WebcamFeed[] = [
  // Strategic / Conflict
  { id: 'wc-jerusalem', title: 'Jerusalem Old City', location: 'Israel', url: 'https://www.youtube.com/embed/UXZxE9VCSOE?autoplay=1&mute=1', region: 'Middle East', strategic: true },
  { id: 'wc-kyiv', title: 'Kyiv Independence Sq', location: 'Ukraine', url: 'https://www.youtube.com/embed/2cyQPN5xQKM?autoplay=1&mute=1', region: 'Europe', strategic: true },
  { id: 'wc-moscow', title: 'Red Square', location: 'Russia', url: 'https://www.youtube.com/embed/ryzJnLjb1ts?autoplay=1&mute=1', region: 'Europe', strategic: true },
  { id: 'wc-dc', title: 'Washington DC', location: 'USA', url: 'https://www.youtube.com/embed/2GVBcOeBWpE?autoplay=1&mute=1', region: 'Americas', strategic: true },
  { id: 'wc-beijing', title: 'Tiananmen Area', location: 'China', url: 'https://www.youtube.com/embed/BfcECkT77fI?autoplay=1&mute=1', region: 'Asia', strategic: true },
  { id: 'wc-taipei', title: 'Taipei 101', location: 'Taiwan', url: 'https://www.youtube.com/embed/EBXFNHh9jQ0?autoplay=1&mute=1', region: 'Asia', strategic: true },
  // Major Cities
  { id: 'wc-nyc', title: 'Times Square', location: 'NYC', url: 'https://www.youtube.com/embed/AdUw5RdyZxI?autoplay=1&mute=1', region: 'Americas', strategic: false },
  { id: 'wc-tokyo', title: 'Shibuya Crossing', location: 'Tokyo', url: 'https://www.youtube.com/embed/DjdUEyjx8GM?autoplay=1&mute=1', region: 'Asia', strategic: false },
  { id: 'wc-london', title: 'Abbey Road', location: 'London', url: 'https://www.youtube.com/embed/rPQbmaqzE3E?autoplay=1&mute=1', region: 'Europe', strategic: false },
  { id: 'wc-paris', title: 'Eiffel Tower', location: 'Paris', url: 'https://www.youtube.com/embed/vLfAtCbE_Jc?autoplay=1&mute=1', region: 'Europe', strategic: false },
  { id: 'wc-dubai', title: 'Burj Khalifa', location: 'Dubai', url: 'https://www.youtube.com/embed/5HCn1pYVQlo?autoplay=1&mute=1', region: 'Middle East', strategic: false },
  { id: 'wc-singapore', title: 'Marina Bay', location: 'Singapore', url: 'https://www.youtube.com/embed/pY_FqOSejgU?autoplay=1&mute=1', region: 'Asia', strategic: false },
  { id: 'wc-istanbul', title: 'Bosphorus', location: 'Istanbul', url: 'https://www.youtube.com/embed/LcqDdFQviR0?autoplay=1&mute=1', region: 'Europe', strategic: false },
  { id: 'wc-beirut', title: 'Beirut Skyline', location: 'Lebanon', url: 'https://www.youtube.com/embed/n5FhC7LRUNY?autoplay=1&mute=1', region: 'Middle East', strategic: false },
  { id: 'wc-seoul', title: 'Gangnam', location: 'Seoul', url: 'https://www.youtube.com/embed/WCfwXvHYCDo?autoplay=1&mute=1', region: 'Asia', strategic: false },
  { id: 'wc-rio', title: 'Copacabana', location: 'Rio', url: 'https://www.youtube.com/embed/hRCldyV1ays?autoplay=1&mute=1', region: 'Americas', strategic: false },
];

// Infrastructure cascade simulation data
export interface InfraNode {
  id: string;
  name: string;
  type: 'cable' | 'pipeline' | 'port' | 'datacenter' | 'chokepoint';
  lat: number;
  lon: number;
  dependents: string[]; // countries/regions affected
  criticality: 'critical' | 'high' | 'medium';
}

export const INFRA_NODES: InfraNode[] = [
  { id: 'suez', name: 'Suez Canal', type: 'chokepoint', lat: 30.58, lon: 32.27, dependents: ['Europe', 'Asia', 'Middle East'], criticality: 'critical' },
  { id: 'hormuz', name: 'Strait of Hormuz', type: 'chokepoint', lat: 26.56, lon: 56.25, dependents: ['Global Oil', 'Japan', 'South Korea', 'China', 'India'], criticality: 'critical' },
  { id: 'malacca', name: 'Strait of Malacca', type: 'chokepoint', lat: 2.5, lon: 101.5, dependents: ['China', 'Japan', 'South Korea', 'ASEAN'], criticality: 'critical' },
  { id: 'bosporus', name: 'Bosporus Strait', type: 'chokepoint', lat: 41.12, lon: 29.07, dependents: ['Russia', 'Ukraine', 'Black Sea states'], criticality: 'high' },
  { id: 'bab', name: 'Bab el-Mandeb', type: 'chokepoint', lat: 12.58, lon: 43.33, dependents: ['Europe', 'Asia', 'East Africa'], criticality: 'critical' },
  { id: 'panama', name: 'Panama Canal', type: 'chokepoint', lat: 9.08, lon: -79.68, dependents: ['US East Coast', 'Latin America', 'Asia'], criticality: 'high' },
  { id: 'nordstream', name: 'Nord Stream (disabled)', type: 'pipeline', lat: 54.3, lon: 12.1, dependents: ['Germany', 'EU Gas Supply'], criticality: 'high' },
  { id: 'turkstream', name: 'TurkStream Pipeline', type: 'pipeline', lat: 41.7, lon: 28.0, dependents: ['Turkey', 'SE Europe'], criticality: 'high' },
  { id: 'marea-cable', name: 'MAREA Cable', type: 'cable', lat: 37.0, lon: -50.0, dependents: ['US-EU Internet', 'Cloud Services'], criticality: 'critical' },
  { id: '2africa-cable', name: '2Africa Cable', type: 'cable', lat: -6.0, lon: 12.0, dependents: ['Africa Internet', '23 countries'], criticality: 'critical' },
  { id: 'singapore-port', name: 'Port of Singapore', type: 'port', lat: 1.26, lon: 103.84, dependents: ['Global Shipping', 'Asia'], criticality: 'critical' },
  { id: 'rotterdam-port', name: 'Port of Rotterdam', type: 'port', lat: 51.95, lon: 4.13, dependents: ['EU Trade', 'Energy Imports'], criticality: 'high' },
  { id: 'shanghai-port', name: 'Port of Shanghai', type: 'port', lat: 31.23, lon: 121.47, dependents: ['Global Manufacturing', 'US-China Trade'], criticality: 'critical' },
  { id: 'ashburn-dc', name: 'Ashburn Data Center Hub', type: 'datacenter', lat: 39.04, lon: -77.49, dependents: ['70% US Internet Traffic', 'Cloud'], criticality: 'critical' },
  { id: 'frankfurt-dc', name: 'Frankfurt IX', type: 'datacenter', lat: 50.11, lon: 8.68, dependents: ['EU Internet', 'Financial Data'], criticality: 'high' },
];

export interface CascadeResult {
  node: InfraNode;
  affectedRegions: string[];
  economicImpact: string;
  alternativeRoutes: string;
  recoveryTime: string;
}

export const simulateCascade = (nodeId: string): CascadeResult | null => {
  const node = INFRA_NODES.find(n => n.id === nodeId);
  if (!node) return null;

  const impacts: Record<string, { economic: string; alternatives: string; recovery: string }> = {
    suez: { economic: '$9.6B/day trade disruption', alternatives: 'Cape of Good Hope (+10 days)', recovery: '1-2 weeks' },
    hormuz: { economic: '21% global oil supply cut', alternatives: 'East-West Pipeline (limited), Strategic reserves', recovery: 'Months' },
    malacca: { economic: '$5.3T annual trade at risk', alternatives: 'Lombok/Sunda Straits (+2-3 days)', recovery: 'Weeks' },
    bosporus: { economic: 'Black Sea grain/energy blocked', alternatives: 'None — landlocked route', recovery: 'Depends on conflict' },
    bab: { economic: '$1T+ annual shipping affected', alternatives: 'Cape route (+14 days)', recovery: 'Variable' },
    panama: { economic: '5% global trade disrupted', alternatives: 'Suez + Cape routes', recovery: '3-6 months (drought: variable)' },
    nordstream: { economic: 'EU gas price spike 300%+', alternatives: 'LNG imports, TurkStream, Norway', recovery: 'Permanently disabled' },
    turkstream: { economic: 'SE Europe gas crisis', alternatives: 'TAP, LNG terminals', recovery: '6-12 months' },
    'marea-cable': { economic: 'Major US-EU latency spike', alternatives: 'TAT-14, Dunant, AEConnect', recovery: '2-4 weeks (repair ship)' },
    '2africa-cable': { economic: 'African internet backbone severed', alternatives: 'SAT-3, EASSy (limited)', recovery: '4-8 weeks' },
    'singapore-port': { economic: 'Global supply chain seizure', alternatives: 'Tanjung Pelepas, Port Klang', recovery: 'Weeks-months' },
    'rotterdam-port': { economic: 'EU energy/goods import halt', alternatives: 'Antwerp, Hamburg', recovery: '1-3 weeks' },
    'shanghai-port': { economic: 'Manufacturing supply chain collapse', alternatives: 'Ningbo, Shenzhen', recovery: '2-4 weeks' },
    'ashburn-dc': { economic: 'US internet backbone degraded', alternatives: 'Distributed CDNs, backup DCs', recovery: 'Hours-days' },
    'frankfurt-dc': { economic: 'EU financial data disruption', alternatives: 'London, Amsterdam IXPs', recovery: 'Hours-days' },
  };

  const impact = impacts[nodeId] || { economic: 'Unknown', alternatives: 'Unknown', recovery: 'Unknown' };

  return {
    node,
    affectedRegions: node.dependents,
    economicImpact: impact.economic,
    alternativeRoutes: impact.alternatives,
    recoveryTime: impact.recovery,
  };
};
