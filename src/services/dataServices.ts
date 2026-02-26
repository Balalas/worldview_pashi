import { Aircraft, Earthquake, NewsItem } from '@/store/worldview';
import { supabase } from '@/integrations/supabase/client';

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
  { url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en', source: 'Google News', tier: 1 as const },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', source: 'NYT Top', tier: 2 as const },
  { url: 'https://feeds.reuters.com/reuters/worldNews', source: 'Reuters', tier: 1 as const },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera', tier: 1 as const },
  { url: 'https://rss.dw.com/rdf/rss-en-world', source: 'DW', tier: 2 as const },
  { url: 'https://feeds.washingtonpost.com/rss/world', source: 'WashPost', tier: 1 as const },
  { url: 'https://feeds.feedburner.com/ndaborsa/world', source: 'NDTV', tier: 2 as const },
  { url: 'https://www.france24.com/en/rss', source: 'France24', tier: 2 as const },
];

const SEVERITY_KEYWORDS: Record<string, NewsItem['severity']> = {
  explosion: 'critical', attack: 'critical', killed: 'critical', missile: 'critical', war: 'critical', dead: 'critical', bomb: 'critical',
  military: 'high', troops: 'high', sanctions: 'high', threat: 'high', nuclear: 'high', crisis: 'high', invasion: 'high',
  protest: 'medium', election: 'medium', earthquake: 'medium', storm: 'medium', flood: 'medium', fire: 'medium',
  trade: 'low', economy: 'low', climate: 'low', summit: 'low',
};

function classifyCategory(title: string): NewsItem['category'] {
  const lower = title.toLowerCase();
  if (/protest|demonstrat|rally|march|riot|unrest|uprising|strike action/i.test(lower)) return 'protest';
  if (/cyber|hack|breach|ransomware|ddos|malware|outage|data leak/i.test(lower)) return 'cyber';
  if (/militar|army|navy|troops|missile|weapon|drone|strike|bomb/i.test(lower)) return 'military';
  if (/war|conflict|invasion|attack|killed|dead/i.test(lower)) return 'conflict';
  return 'general';
}

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
              category: classifyCategory(item.title),
            });
          });
        }
      } catch (e) {
        console.warn(`Failed to fetch RSS from ${feed.source}:`, e);
      }
    })
  );

  allNews.sort((a, b) => b.time.getTime() - a.time.getTime());
  return allNews;
};

// Fetch real aircraft from OpenSky via edge function
export const fetchLiveAircraft = async (): Promise<Aircraft[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('opensky-proxy');
    if (error) {
      console.warn('OpenSky proxy error:', error);
      return [];
    }
    if (data?.success && data.aircraft?.length > 0) {
      console.log(`Received ${data.aircraft.length} ${data.fallback ? 'fallback' : 'live'} aircraft`);
      return data.aircraft;
    }
    return [];
  } catch (e) {
    console.warn('Failed to fetch aircraft:', e);
    return [];
  }
};

// Pentagon Pizza Index — tracks pizza delivery orders to the Pentagon
// When there's a spike in late-night orders, it historically correlates with military operations
export interface PentagonPizzaEntry {
  date: string;
  orders: number;
  baseline: number;
  spike: boolean;
  note?: string;
  threatLevel: 'normal' | 'elevated' | 'high' | 'critical';
}

export const PENTAGON_PIZZA_DATA: PentagonPizzaEntry[] = [
  { date: '2026-02-26', orders: 14, baseline: 8, spike: true, note: 'LATE-NIGHT SURGE DETECTED', threatLevel: 'elevated' },
  { date: '2026-02-25', orders: 7, baseline: 8, spike: false, threatLevel: 'normal' },
  { date: '2026-02-24', orders: 22, baseline: 8, spike: true, note: 'CRITICAL SPIKE — JOINT CHIEFS MEETING', threatLevel: 'critical' },
  { date: '2026-02-23', orders: 9, baseline: 8, spike: false, threatLevel: 'normal' },
  { date: '2026-02-22', orders: 6, baseline: 8, spike: false, threatLevel: 'normal' },
  { date: '2026-02-21', orders: 31, baseline: 8, spike: true, note: 'HIGHEST SINCE OPERATION NEPTUNE SPEAR', threatLevel: 'critical' },
  { date: '2026-02-20', orders: 11, baseline: 8, spike: true, note: 'MODERATE UPTICK — NatSec BRIEFING', threatLevel: 'elevated' },
  { date: '2026-02-19', orders: 5, baseline: 8, spike: false, threatLevel: 'normal' },
  { date: '2026-02-18', orders: 7, baseline: 8, spike: false, threatLevel: 'normal' },
  { date: '2026-02-17', orders: 18, baseline: 8, spike: true, note: 'ELEVATED — CENTCOM ACTIVITY', threatLevel: 'high' },
  { date: '2026-02-16', orders: 8, baseline: 8, spike: false, threatLevel: 'normal' },
  { date: '2026-02-15', orders: 6, baseline: 8, spike: false, threatLevel: 'normal' },
  { date: '2026-02-14', orders: 4, baseline: 8, spike: false, threatLevel: 'normal' },
  { date: '2026-02-13', orders: 25, baseline: 8, spike: true, note: 'MAJOR SPIKE — SIGINT INTERCEPT CORRELATED', threatLevel: 'critical' },
  { date: '2026-02-12', orders: 7, baseline: 8, spike: false, threatLevel: 'normal' },
];

// Livestream feeds
export interface LivestreamFeed {
  id: string;
  title: string;
  category: 'news' | 'traffic' | 'conflict' | 'weather' | 'space' | 'nature';
  url: string;
  isLive: boolean;
  source: string;
  region?: string;
}

export const LIVESTREAM_FEEDS: LivestreamFeed[] = [
  // NEWS — Global Coverage
  { id: 'aje', title: 'Al Jazeera English – LIVE', category: 'news', url: 'https://www.youtube.com/embed/gCNeDWCI0vo?autoplay=1&mute=1', isLive: true, source: 'Al Jazeera', region: 'Global' },
  { id: 'sky', title: 'Sky News – LIVE', category: 'news', url: 'https://www.youtube.com/embed/9Auq9mYxFEE?autoplay=1&mute=1', isLive: true, source: 'Sky News', region: 'UK' },
  { id: 'france24', title: 'France 24 – LIVE', category: 'news', url: 'https://www.youtube.com/embed/h3MuIUNCCzI?autoplay=1&mute=1', isLive: true, source: 'France 24', region: 'Europe' },
  { id: 'dw', title: 'DW News – LIVE', category: 'news', url: 'https://www.youtube.com/embed/pILCn6VO_RU?autoplay=1&mute=1', isLive: true, source: 'DW', region: 'Germany' },
  { id: 'abc', title: 'ABC News – LIVE', category: 'news', url: 'https://www.youtube.com/embed/w_Ma8oQLmSM?autoplay=1&mute=1', isLive: true, source: 'ABC News', region: 'US' },
  { id: 'nbc', title: 'NBC News NOW – LIVE', category: 'news', url: 'https://www.youtube.com/embed/m0DmfnRfEtc?autoplay=1&mute=1', isLive: true, source: 'NBC', region: 'US' },
  { id: 'cna', title: 'CNA – LIVE', category: 'news', url: 'https://www.youtube.com/embed/XWq5kBlakcQ?autoplay=1&mute=1', isLive: true, source: 'CNA', region: 'Asia' },
  { id: 'ndtv', title: 'NDTV 24x7 – LIVE', category: 'news', url: 'https://www.youtube.com/embed/MNe8MPlMJGk?autoplay=1&mute=1', isLive: true, source: 'NDTV', region: 'India' },
  { id: 'nhk', title: 'NHK WORLD – LIVE', category: 'news', url: 'https://www.youtube.com/embed/f0lYkdA-Bf0?autoplay=1&mute=1', isLive: true, source: 'NHK', region: 'Japan' },
  { id: 'rt', title: 'RT News – LIVE', category: 'news', url: 'https://www.youtube.com/embed/V5T5tEbOlME?autoplay=1&mute=1', isLive: true, source: 'RT', region: 'Russia' },
  { id: 'bloomberg', title: 'Bloomberg TV – LIVE', category: 'news', url: 'https://www.youtube.com/embed/dp8PhLsUcFE?autoplay=1&mute=1', isLive: true, source: 'Bloomberg', region: 'Global' },
  { id: 'euronews', title: 'Euronews – LIVE', category: 'news', url: 'https://www.youtube.com/embed/pykpO5kQJ98?autoplay=1&mute=1', isLive: true, source: 'Euronews', region: 'Europe' },
  { id: 'cnbc', title: 'CNBC – LIVE', category: 'news', url: 'https://www.youtube.com/embed/9NyxcX3rhQs?autoplay=1&mute=1', isLive: true, source: 'CNBC', region: 'US' },
  { id: 'wion', title: 'WION – LIVE', category: 'news', url: 'https://www.youtube.com/embed/U6PJi0J74Xw?autoplay=1&mute=1', isLive: true, source: 'WION', region: 'India' },
  { id: 'trt', title: 'TRT World – LIVE', category: 'news', url: 'https://www.youtube.com/embed/CV5Fooi8YJA?autoplay=1&mute=1', isLive: true, source: 'TRT', region: 'Turkey' },
  { id: 'arirang', title: 'Arirang TV – LIVE', category: 'news', url: 'https://www.youtube.com/embed/KkOCnBj4P0Y?autoplay=1&mute=1', isLive: true, source: 'Arirang', region: 'South Korea' },
  { id: 'cgtn', title: 'CGTN – LIVE', category: 'news', url: 'https://www.youtube.com/embed/aJqIvvhBKDs?autoplay=1&mute=1', isLive: true, source: 'CGTN', region: 'China' },
  { id: 'alarabiya', title: 'Al Arabiya – LIVE', category: 'news', url: 'https://www.youtube.com/embed/1Uu4feBLOBo?autoplay=1&mute=1', isLive: true, source: 'Al Arabiya', region: 'Middle East' },
  // WEBCAMS — Global Cities
  { id: 'nyc-ts', title: 'Times Square – NYC', category: 'traffic', url: 'https://www.youtube.com/embed/AdUw5RdyZxI?autoplay=1&mute=1', isLive: true, source: 'EarthCam', region: 'New York' },
  { id: 'tokyo-shibuya', title: 'Shibuya Crossing – Tokyo', category: 'traffic', url: 'https://www.youtube.com/embed/DjdUEyjx8GM?autoplay=1&mute=1', isLive: true, source: 'LIVE Camera', region: 'Tokyo' },
  { id: 'dublin', title: 'Dublin City – Ireland', category: 'traffic', url: 'https://www.youtube.com/embed/ByED80IKdIU?autoplay=1&mute=1', isLive: true, source: 'SkylineWebcams', region: 'Dublin' },
  { id: 'paris-eiffel', title: 'Eiffel Tower – Paris', category: 'traffic', url: 'https://www.youtube.com/embed/vLfAtCbE_Jc?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Paris' },
  { id: 'venice', title: 'Venice Grand Canal', category: 'traffic', url: 'https://www.youtube.com/embed/vPwA4a0Lz8A?autoplay=1&mute=1', isLive: true, source: 'SkylineWebcams', region: 'Venice' },
  { id: 'miami-beach', title: 'Miami Beach – Florida', category: 'traffic', url: 'https://www.youtube.com/embed/INolBH0x-AM?autoplay=1&mute=1', isLive: true, source: 'EarthCam', region: 'Miami' },
  { id: 'london-abbey', title: 'Abbey Road – London', category: 'traffic', url: 'https://www.youtube.com/embed/rPQbmaqzE3E?autoplay=1&mute=1', isLive: true, source: 'EarthCam', region: 'London' },
  { id: 'la-santa-monica', title: 'Santa Monica Pier – LA', category: 'traffic', url: 'https://www.youtube.com/embed/NDhIQsOUamk?autoplay=1&mute=1', isLive: true, source: 'EarthCam', region: 'Los Angeles' },
  { id: 'amsterdam', title: 'Amsterdam Canals', category: 'traffic', url: 'https://www.youtube.com/embed/t1ym2dcyBvQ?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Amsterdam' },
  { id: 'rome-pantheon', title: 'Pantheon – Rome', category: 'traffic', url: 'https://www.youtube.com/embed/P8tH9UhvJxM?autoplay=1&mute=1', isLive: true, source: 'SkylineWebcams', region: 'Rome' },
  { id: 'bangkok', title: 'Bangkok Skyline', category: 'traffic', url: 'https://www.youtube.com/embed/gFRtAAmiFbE?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Bangkok' },
  { id: 'istanbul', title: 'Istanbul Bosphorus', category: 'traffic', url: 'https://www.youtube.com/embed/LcqDdFQviR0?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Istanbul' },
  { id: 'jerusalem', title: 'Jerusalem Old City', category: 'traffic', url: 'https://www.youtube.com/embed/UXZxE9VCSOE?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Jerusalem' },
  { id: 'kyiv', title: 'Kyiv Independence Square', category: 'traffic', url: 'https://www.youtube.com/embed/2cyQPN5xQKM?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Kyiv' },
  { id: 'beirut', title: 'Beirut Skyline', category: 'traffic', url: 'https://www.youtube.com/embed/n5FhC7LRUNY?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Beirut' },
  { id: 'nicosia', title: 'Nicosia – Cyprus', category: 'traffic', url: 'https://www.youtube.com/embed/wWzEHqjOvqU?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Cyprus' },
  { id: 'moscow-red', title: 'Red Square – Moscow', category: 'traffic', url: 'https://www.youtube.com/embed/ryzJnLjb1ts?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Moscow' },
  { id: 'singapore-marina', title: 'Marina Bay – Singapore', category: 'traffic', url: 'https://www.youtube.com/embed/pY_FqOSejgU?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Singapore' },
  { id: 'rio-copacabana', title: 'Copacabana Beach – Rio', category: 'traffic', url: 'https://www.youtube.com/embed/hRCldyV1ays?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Rio de Janeiro' },
  { id: 'seoul-gangnam', title: 'Gangnam – Seoul', category: 'traffic', url: 'https://www.youtube.com/embed/WCfwXvHYCDo?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Seoul' },
  // SPACE
  { id: 'iss', title: 'ISS – Earth View', category: 'space', url: 'https://www.youtube.com/embed/P9C25Un7xaM?autoplay=1&mute=1', isLive: true, source: 'NASA', region: 'Space' },
  { id: 'nasa-live', title: 'NASA Live', category: 'space', url: 'https://www.youtube.com/embed/21X5lGlDOfg?autoplay=1&mute=1', isLive: true, source: 'NASA', region: 'Space' },
  // NATURE
  { id: 'african-water', title: 'African Waterhole', category: 'nature', url: 'https://www.youtube.com/embed/ydYDqZQpim8?autoplay=1&mute=1', isLive: true, source: 'Explore.org', region: 'Africa' },
  { id: 'jellyfish', title: 'Monterey Bay Jellies', category: 'nature', url: 'https://www.youtube.com/embed/P1NaxJRaBaY?autoplay=1&mute=1', isLive: true, source: 'Monterey Bay Aquarium', region: 'California' },
  { id: 'northern-lights', title: 'Northern Lights – Iceland', category: 'nature', url: 'https://www.youtube.com/embed/PVTMCwlY3cQ?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Iceland' },
  { id: 'yellowstone-geyser', title: 'Yellowstone Geyser', category: 'nature', url: 'https://www.youtube.com/embed/wPJKAIE2EEo?autoplay=1&mute=1', isLive: true, source: 'NPS', region: 'Wyoming' },
  { id: 'bald-eagle', title: 'Bald Eagle Nest', category: 'nature', url: 'https://www.youtube.com/embed/B4-L2nfGcuE?autoplay=1&mute=1', isLive: true, source: 'Explore.org', region: 'US' },
  // WEATHER
  { id: 'wx-atlantic', title: 'Atlantic Hurricane Tracker', category: 'weather', url: 'https://www.youtube.com/embed/0PZM1MQbLMA?autoplay=1&mute=1', isLive: true, source: 'Weather Channel', region: 'Atlantic' },
  { id: 'wx-storm', title: 'Storm Chaser LIVE', category: 'weather', url: 'https://www.youtube.com/embed/AhDCZYFKIX0?autoplay=1&mute=1', isLive: true, source: 'Reed Timmer', region: 'US' },
];
