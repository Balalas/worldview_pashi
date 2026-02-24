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

// Pizza / Big Mac Index
export interface PizzaIndexEntry {
  country: string;
  flag: string;
  localPrice: string;
  usdPrice: number;
  index: number;
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

// Livestream feeds - expanded with more global cameras
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
  // News
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
  // Traffic/City Cameras
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
  // Space
  { id: 'iss', title: 'ISS – Earth View', category: 'space', url: 'https://www.youtube.com/embed/P9C25Un7xaM?autoplay=1&mute=1', isLive: true, source: 'NASA', region: 'Space' },
  { id: 'nasa-live', title: 'NASA Live', category: 'space', url: 'https://www.youtube.com/embed/21X5lGlDOfg?autoplay=1&mute=1', isLive: true, source: 'NASA', region: 'Space' },
  // Nature
  { id: 'african-water', title: 'African Waterhole', category: 'nature', url: 'https://www.youtube.com/embed/ydYDqZQpim8?autoplay=1&mute=1', isLive: true, source: 'Explore.org', region: 'Africa' },
  { id: 'jellyfish', title: 'Monterey Bay Jellies', category: 'nature', url: 'https://www.youtube.com/embed/P1NaxJRaBaY?autoplay=1&mute=1', isLive: true, source: 'Monterey Bay Aquarium', region: 'California' },
  { id: 'northern-lights', title: 'Northern Lights – Iceland', category: 'nature', url: 'https://www.youtube.com/embed/PVTMCwlY3cQ?autoplay=1&mute=1', isLive: true, source: 'Webcam', region: 'Iceland' },
  // Weather
  { id: 'wx-atlantic', title: 'Atlantic Hurricane Tracker', category: 'weather', url: 'https://www.youtube.com/embed/0PZM1MQbLMA?autoplay=1&mute=1', isLive: true, source: 'Weather Channel', region: 'Atlantic' },
  { id: 'wx-storm', title: 'Storm Chaser LIVE', category: 'weather', url: 'https://www.youtube.com/embed/AhDCZYFKIX0?autoplay=1&mute=1', isLive: true, source: 'Reed Timmer', region: 'US' },
];
