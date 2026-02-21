import { Earthquake, NewsItem } from '@/store/worldview';

export const fetchEarthquakes = async (): Promise<Earthquake[]> => {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
    const data = await res.json();
    return data.features.map((f: any) => ({
      id: f.id,
      title: f.properties.title,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      magnitude: f.properties.mag,
      depth: f.geometry.coordinates[2],
      time: f.properties.time,
      place: f.properties.place,
      url: f.properties.url,
    }));
  } catch (e) {
    console.error('Failed to fetch earthquakes:', e);
    return [];
  }
};

// Live RSS news from major outlets
const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC', tier: 1 as const },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NY Times', tier: 1 as const },
  { url: 'https://feeds.reuters.com/Reuters/worldNews', source: 'Reuters', tier: 1 as const },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', tier: 2 as const },
];

const SEVERITY_KEYWORDS: Record<string, NewsItem['severity']> = {
  explosion: 'critical', attack: 'critical', killed: 'critical', missile: 'critical', war: 'critical', dead: 'critical', bomb: 'critical',
  military: 'high', troops: 'high', sanctions: 'high', threat: 'high', nuclear: 'high', crisis: 'high', invasion: 'high',
  protest: 'medium', election: 'medium', earthquake: 'medium', storm: 'medium', flood: 'medium', fire: 'medium',
  trade: 'low', economy: 'low', climate: 'low', summit: 'low',
};

function classifySeverity(title: string): NewsItem['severity'] {
  const lower = title.toLowerCase();
  for (const [keyword, severity] of Object.entries(SEVERITY_KEYWORDS)) {
    if (lower.includes(keyword)) return severity;
  }
  return 'info';
}

export const fetchLiveNews = async (): Promise<NewsItem[]> => {
  const allNews: NewsItem[] = [];

  await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`
        );
        const data = await res.json();
        if (data.status === 'ok' && data.items) {
          data.items.slice(0, 6).forEach((item: any, i: number) => {
            allNews.push({
              id: `${feed.source}-${i}-${Date.now()}`,
              title: item.title,
              source: feed.source,
              tier: feed.tier,
              severity: classifySeverity(item.title),
              time: new Date(item.pubDate),
              link: item.link,
            });
          });
        }
      } catch (e) {
        console.warn(`Failed to fetch RSS from ${feed.source}:`, e);
      }
    })
  );

  // Sort by time, newest first
  allNews.sort((a, b) => b.time.getTime() - a.time.getTime());
  return allNews;
};

// Generate simulated aircraft data
export const generateMockAircraft = () => {
  const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'China', 'Russia', 'Japan', 'Australia', 'India', 'Brazil', 'Canada', 'UAE'];
  const callsigns = ['BAW', 'DLH', 'AAL', 'UAL', 'AFR', 'KLM', 'SIA', 'QFA', 'THY', 'ELY', 'SWR', 'ANA', 'JAL', 'CPA', 'UAE', 'ETH'];
  const militaryCallsigns = ['RCH', 'EVAC', 'REACH', 'VIPER', 'HAWK', 'MAGIC', 'CONDOR', 'IRON'];
  const aircraft: any[] = [];

  for (let i = 0; i < 200; i++) {
    const isMil = Math.random() < 0.12;
    const prefix = isMil
      ? militaryCallsigns[Math.floor(Math.random() * militaryCallsigns.length)]
      : callsigns[Math.floor(Math.random() * callsigns.length)];
    const num = Math.floor(Math.random() * 9000 + 100);

    aircraft.push({
      icao24: Math.random().toString(16).slice(2, 8),
      callsign: `${prefix}${num}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      lat: (Math.random() * 140) - 60,
      lon: (Math.random() * 360) - 180,
      altitude: isMil ? Math.random() * 12000 + 3000 : Math.random() * 12000 + 8000,
      altitudeFt: 0,
      speedKts: Math.random() * 300 + 200,
      heading: Math.random() * 360,
      verticalRate: (Math.random() - 0.5) * 10,
      onGround: false,
      isMilitary: isMil,
    });
    aircraft[aircraft.length - 1].altitudeFt = Math.round(aircraft[aircraft.length - 1].altitude * 3.28084);
  }
  return aircraft;
};

// Generate simulated satellite data
export const generateMockSatellites = () => {
  const names = ['ISS (ZARYA)', 'STARLINK-1234', 'STARLINK-5678', 'COSMOS 2542', 'USA-326', 'NOAA-20', 'SENTINEL-2A', 'TERRA', 'LANDSAT-9', 'GPS IIF-12', 'MUOS-5', 'GOES-17', 'METEOSAT-11', 'ALOS-2', 'TIANGONG', 'STARLINK-2001', 'STARLINK-3042', 'FENGYUN-4A', 'JASON-3', 'CBERS-4A'];
  return names.map((name, i) => ({
    name,
    lat: (Math.random() * 140) - 70,
    lon: (Math.random() * 360) - 180,
    alt: name.includes('ISS') || name.includes('TIANGONG') ? 408 : Math.random() * 1200 + 300,
    velocity: name.includes('ISS') ? 7.66 : Math.random() * 4 + 5,
  }));
};

// Pizza / Big Mac Index (based on real 2024 Economist data, USD equivalent)
export interface PizzaIndexEntry {
  country: string;
  flag: string;
  localPrice: string;
  usdPrice: number;
  index: number; // vs US baseline (100)
  overUnder: 'over' | 'under' | 'base';
}

export const PIZZA_INDEX_DATA: PizzaIndexEntry[] = [
  { country: 'Switzerland', flag: '🇨🇭', localPrice: 'CHF 6.70', usdPrice: 7.73, index: 133, overUnder: 'over' },
  { country: 'Norway', flag: '🇳🇴', localPrice: 'NOK 69', usdPrice: 6.52, index: 112, overUnder: 'over' },
  { country: 'United States', flag: '🇺🇸', localPrice: '$5.69', usdPrice: 5.69, index: 100, overUnder: 'base' },
  { country: 'Euro area', flag: '🇪🇺', localPrice: '€5.29', usdPrice: 5.82, index: 102, overUnder: 'over' },
  { country: 'United Kingdom', flag: '🇬🇧', localPrice: '£3.69', usdPrice: 4.68, index: 82, overUnder: 'under' },
  { country: 'Japan', flag: '🇯🇵', localPrice: '¥450', usdPrice: 2.83, index: 50, overUnder: 'under' },
  { country: 'China', flag: '🇨🇳', localPrice: '¥24.9', usdPrice: 3.42, index: 60, overUnder: 'under' },
  { country: 'India', flag: '🇮🇳', localPrice: '₹199', usdPrice: 2.39, index: 42, overUnder: 'under' },
  { country: 'Brazil', flag: '🇧🇷', localPrice: 'R$17.9', usdPrice: 3.54, index: 62, overUnder: 'under' },
  { country: 'Turkey', flag: '🇹🇷', localPrice: '₺110', usdPrice: 3.29, index: 58, overUnder: 'under' },
  { country: 'South Africa', flag: '🇿🇦', localPrice: 'R59.9', usdPrice: 3.13, index: 55, overUnder: 'under' },
  { country: 'Egypt', flag: '🇪🇬', localPrice: 'EGP 99', usdPrice: 2.02, index: 36, overUnder: 'under' },
];

// Livestream feeds
export interface LivestreamFeed {
  id: string;
  title: string;
  category: 'news' | 'traffic' | 'conflict' | 'weather' | 'space';
  url: string; // YouTube embed or iframe URL
  thumbnail?: string;
  isLive: boolean;
  source: string;
  region?: string;
}

export const LIVESTREAM_FEEDS: LivestreamFeed[] = [
  // News Livestreams
  { id: 'aje', title: 'Al Jazeera English – LIVE', category: 'news', url: 'https://www.youtube.com/embed/gCNeDWCI0vo?autoplay=1&mute=1', isLive: true, source: 'Al Jazeera', region: 'Global' },
  { id: 'sky', title: 'Sky News – LIVE', category: 'news', url: 'https://www.youtube.com/embed/9Auq9mYxFEE?autoplay=1&mute=1', isLive: true, source: 'Sky News', region: 'UK' },
  { id: 'france24', title: 'France 24 – LIVE', category: 'news', url: 'https://www.youtube.com/embed/h3MuIUNCCzI?autoplay=1&mute=1', isLive: true, source: 'France 24', region: 'Europe' },
  { id: 'dw', title: 'DW News – LIVE', category: 'news', url: 'https://www.youtube.com/embed/pILCn6VO_RU?autoplay=1&mute=1', isLive: true, source: 'DW', region: 'Germany' },
  { id: 'abc', title: 'ABC News – LIVE', category: 'news', url: 'https://www.youtube.com/embed/w_Ma8oQLmSM?autoplay=1&mute=1', isLive: true, source: 'ABC News', region: 'US' },
  { id: 'nbc', title: 'NBC News NOW – LIVE', category: 'news', url: 'https://www.youtube.com/embed/m0DmfnRfEtc?autoplay=1&mute=1', isLive: true, source: 'NBC', region: 'US' },

  // Traffic Cameras
  { id: 'nyc-ts', title: 'Times Square – NYC', category: 'traffic', url: 'https://www.youtube.com/embed/AdUw5RdyZxI?autoplay=1&mute=1', isLive: true, source: 'EarthCam', region: 'New York' },
  { id: 'tokyo-shibuya', title: 'Shibuya Crossing – Tokyo', category: 'traffic', url: 'https://www.youtube.com/embed/DjdUEyjx8GM?autoplay=1&mute=1', isLive: true, source: 'LIVE Camera', region: 'Tokyo' },
  { id: 'dublin', title: 'Dublin City – Ireland', category: 'traffic', url: 'https://www.youtube.com/embed/ByED80IKdIU?autoplay=1&mute=1', isLive: true, source: 'SkylineWebcams', region: 'Dublin' },

  // Space
  { id: 'iss', title: 'ISS – Earth View', category: 'space', url: 'https://www.youtube.com/embed/P9C25Un7xaM?autoplay=1&mute=1', isLive: true, source: 'NASA', region: 'Space' },

  // Weather
  { id: 'wx-atlantic', title: 'Atlantic Hurricane Tracker', category: 'weather', url: 'https://www.youtube.com/embed/0PZM1MQbLMA?autoplay=1&mute=1', isLive: true, source: 'Weather Channel', region: 'Atlantic' },
];
