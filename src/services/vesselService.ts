import { Vessel, ProtestEvent, OutageEvent, NewsItem } from '@/store/worldview';

// Major shipping lanes, ports, and yacht hotspots
const VESSEL_TEMPLATES: Omit<Vessel, 'id' | 'lat' | 'lon' | 'heading'>[] = [
  // Superyachts
  { name: 'AZZAM', type: 'yacht', speedKnots: 12, flag: '🇦🇪', length: 180, destination: 'Monaco', mmsi: '470000001' },
  { name: 'ECLIPSE', type: 'yacht', speedKnots: 14, flag: '🇧🇲', length: 162, destination: 'Antibes', mmsi: '310000001' },
  { name: 'DILBAR', type: 'yacht', speedKnots: 11, flag: '🇲🇹', length: 156, destination: 'Barcelona', mmsi: '248000001' },
  { name: 'FLYING FOX', type: 'yacht', speedKnots: 13, flag: '🇰🇾', length: 136, destination: 'St. Barts', mmsi: '319000001' },
  { name: 'NORD', type: 'yacht', speedKnots: 10, flag: '🇰🇾', length: 142, destination: 'Maldives', mmsi: '319000002' },
  { name: 'SOLARIS', type: 'yacht', speedKnots: 15, flag: '🇧🇲', length: 139, destination: 'Dubai', mmsi: '310000002' },
  { name: 'LADY MOURA', type: 'yacht', speedKnots: 9, flag: '🇧🇸', length: 105, destination: 'Sardinia', mmsi: '311000001' },
  { name: 'SAVANNAH', type: 'yacht', speedKnots: 11, flag: '🇧🇲', length: 83, destination: 'Ibiza', mmsi: '310000003' },
  { name: 'KISMET', type: 'yacht', speedKnots: 12, flag: '🇰🇾', length: 95, destination: 'Cannes', mmsi: '319000003' },
  { name: 'AQUARIUS', type: 'yacht', speedKnots: 10, flag: '🇲🇹', length: 92, destination: 'Mykonos', mmsi: '248000002' },
  // Container ships
  { name: 'EVER GIVEN', type: 'container', speedKnots: 14, flag: '🇵🇦', length: 400, destination: 'Rotterdam', mmsi: '353000001' },
  { name: 'MSC GÜLSÜN', type: 'container', speedKnots: 16, flag: '🇵🇦', length: 400, destination: 'Singapore', mmsi: '353000002' },
  { name: 'CMA CGM MARCO POLO', type: 'container', speedKnots: 15, flag: '🇬🇧', length: 396, destination: 'Shanghai', mmsi: '235000001' },
  { name: 'MADRID MAERSK', type: 'container', speedKnots: 13, flag: '🇩🇰', length: 399, destination: 'Felixstowe', mmsi: '219000001' },
  // Tankers
  { name: 'SEAWAYS LAURA LYNN', type: 'tanker', speedKnots: 11, flag: '🇱🇷', length: 333, destination: 'Houston', mmsi: '636000001' },
  { name: 'PIONEER SPIRIT', type: 'tanker', speedKnots: 10, flag: '🇲🇭', length: 380, destination: 'Ras Tanura', mmsi: '538000001' },
  { name: 'EURONAV NAUTICA', type: 'tanker', speedKnots: 12, flag: '🇧🇪', length: 332, destination: 'Fujairah', mmsi: '205000001' },
  // Military
  { name: 'USS GERALD FORD', type: 'military', speedKnots: 18, flag: '🇺🇸', length: 337, destination: 'CENTCOM AOR', mmsi: '369000001' },
  { name: 'HMS QUEEN ELIZABETH', type: 'military', speedKnots: 16, flag: '🇬🇧', length: 284, destination: 'WESTLANT', mmsi: '235000002' },
  { name: 'CHARLES DE GAULLE', type: 'military', speedKnots: 15, flag: '🇫🇷', length: 261, destination: 'MED PATROL', mmsi: '227000001' },
  { name: 'LIAONING', type: 'military', speedKnots: 14, flag: '🇨🇳', length: 305, destination: 'SCS PATROL', mmsi: '412000001' },
  { name: 'INS VIKRANT', type: 'military', speedKnots: 16, flag: '🇮🇳', length: 262, destination: 'IOR PATROL', mmsi: '419000001' },
  // Cargo
  { name: 'SYMPHONY SPIRIT', type: 'cargo', speedKnots: 12, flag: '🇱🇷', length: 225, destination: 'Jeddah', mmsi: '636000002' },
  { name: 'STELLAR BANNER', type: 'cargo', speedKnots: 11, flag: '🇲🇭', length: 340, destination: 'Qingdao', mmsi: '538000002' },
  // Fishing
  { name: 'FV NORDIC QUEEN', type: 'fishing', speedKnots: 8, flag: '🇳🇴', length: 55, mmsi: '259000001' },
  { name: 'FV PACIFIC HARVEST', type: 'fishing', speedKnots: 7, flag: '🇯🇵', length: 48, mmsi: '431000001' },
  { name: 'FV ATLANTIC EAGLE', type: 'fishing', speedKnots: 6, flag: '🇪🇸', length: 42, mmsi: '224000001' },
  // Passenger/Cruise
  { name: 'ICON OF THE SEAS', type: 'passenger', speedKnots: 17, flag: '🇧🇸', length: 365, destination: 'Miami', mmsi: '311000002' },
  { name: 'WONDER OF THE SEAS', type: 'passenger', speedKnots: 16, flag: '🇧🇸', length: 362, destination: 'Cozumel', mmsi: '311000003' },
  { name: 'MSC WORLD EUROPA', type: 'passenger', speedKnots: 15, flag: '🇲🇹', length: 333, destination: 'Marseille', mmsi: '248000003' },
];

// Hotspot zones where vessels concentrate
const VESSEL_ZONES = [
  // Mediterranean yacht zone
  { latMin: 35, latMax: 44, lonMin: -2, lonMax: 20 },
  // Caribbean
  { latMin: 15, latMax: 25, lonMin: -85, lonMax: -60 },
  // Gulf region
  { latMin: 22, latMax: 30, lonMin: 48, lonMax: 58 },
  // Strait of Malacca
  { latMin: -2, latMax: 6, lonMin: 98, lonMax: 108 },
  // English Channel
  { latMin: 48, latMax: 52, lonMin: -5, lonMax: 5 },
  // South China Sea
  { latMin: 10, latMax: 22, lonMin: 110, lonMax: 120 },
  // Suez approaches
  { latMin: 28, latMax: 32, lonMin: 32, lonMax: 36 },
  // US East Coast
  { latMin: 28, latMax: 42, lonMin: -80, lonMax: -70 },
  // North Sea
  { latMin: 52, latMax: 58, lonMin: -2, lonMax: 8 },
  // Indian Ocean
  { latMin: 5, latMax: 20, lonMin: 65, lonMax: 80 },
];

export const generateVessels = (): Vessel[] => {
  const now = Date.now();
  return VESSEL_TEMPLATES.map((template, i) => {
    const zoneIdx = i % VESSEL_ZONES.length;
    const zone = VESSEL_ZONES[zoneIdx];
    // Use time-based position for gentle drift
    const drift = (now / 60000 + i * 137) % 360;
    const lat = zone.latMin + ((Math.sin(drift * 0.01 + i) + 1) / 2) * (zone.latMax - zone.latMin);
    const lon = zone.lonMin + ((Math.cos(drift * 0.013 + i * 2) + 1) / 2) * (zone.lonMax - zone.lonMin);
    const heading = (drift * 3 + i * 45) % 360;

    return { ...template, id: `vessel-${i}`, lat, lon, heading };
  });
};

// Extract protest events from news headlines
const PROTEST_KEYWORDS = /protest|demonstrat|rally|march|riot|unrest|uprising|strike action|labor strike|general strike|civil disobedience/i;

// Known protest hotspot locations (used when news matches keywords)
const PROTEST_LOCATIONS: { keywords: string[]; lat: number; lon: number; country: string }[] = [
  { keywords: ['france', 'paris', 'french'], lat: 48.86, lon: 2.35, country: 'France' },
  { keywords: ['israel', 'tel aviv', 'jerusalem', 'israeli'], lat: 31.77, lon: 35.23, country: 'Israel' },
  { keywords: ['iran', 'tehran', 'iranian'], lat: 35.69, lon: 51.39, country: 'Iran' },
  { keywords: ['india', 'delhi', 'mumbai', 'indian'], lat: 28.61, lon: 77.23, country: 'India' },
  { keywords: ['bangladesh', 'dhaka'], lat: 23.81, lon: 90.41, country: 'Bangladesh' },
  { keywords: ['kenya', 'nairobi'], lat: -1.29, lon: 36.82, country: 'Kenya' },
  { keywords: ['nigeria', 'lagos', 'abuja'], lat: 6.45, lon: 3.39, country: 'Nigeria' },
  { keywords: ['brazil', 'brasilia', 'são paulo'], lat: -15.79, lon: -47.88, country: 'Brazil' },
  { keywords: ['argentina', 'buenos aires'], lat: -34.60, lon: -58.38, country: 'Argentina' },
  { keywords: ['thailand', 'bangkok'], lat: 13.76, lon: 100.50, country: 'Thailand' },
  { keywords: ['germany', 'berlin', 'german'], lat: 52.52, lon: 13.40, country: 'Germany' },
  { keywords: ['uk', 'london', 'britain', 'british'], lat: 51.51, lon: -0.13, country: 'UK' },
  { keywords: ['us', 'washington', 'america', 'american', 'united states'], lat: 38.89, lon: -77.04, country: 'US' },
  { keywords: ['pakistan', 'islamabad', 'karachi'], lat: 33.69, lon: 73.04, country: 'Pakistan' },
  { keywords: ['south korea', 'seoul'], lat: 37.57, lon: 126.98, country: 'South Korea' },
  { keywords: ['mexico', 'mexico city'], lat: 19.43, lon: -99.13, country: 'Mexico' },
  { keywords: ['colombia', 'bogota'], lat: 4.71, lon: -74.07, country: 'Colombia' },
  { keywords: ['turkey', 'istanbul', 'ankara'], lat: 41.01, lon: 28.98, country: 'Turkey' },
  { keywords: ['georgia', 'tbilisi'], lat: 41.72, lon: 44.79, country: 'Georgia' },
  { keywords: ['venezuela'], lat: 10.49, lon: -66.88, country: 'Venezuela' },
];

export const extractProtestsFromNews = (news: NewsItem[]): ProtestEvent[] => {
  const protests: ProtestEvent[] = [];
  news.forEach((item) => {
    if (!PROTEST_KEYWORDS.test(item.title)) return;
    const lower = item.title.toLowerCase();
    for (const loc of PROTEST_LOCATIONS) {
      if (loc.keywords.some(kw => lower.includes(kw))) {
        protests.push({
          id: `protest-${item.id}`,
          title: item.title,
          lat: loc.lat + (Math.random() - 0.5) * 0.2,
          lon: loc.lon + (Math.random() - 0.5) * 0.2,
          country: loc.country,
          intensity: item.severity === 'critical' || item.severity === 'high' ? 'large' : item.severity === 'medium' ? 'medium' : 'small',
          source: item.source,
          time: item.time,
          link: item.link,
        });
        break;
      }
    }
  });
  return protests;
};

// Extract cyber/outage events from news
const CYBER_KEYWORDS = /cyber|hack|breach|ransomware|ddos|malware|phishing|data leak|outage|shutdown|blackout|internet down|service disruption|infrastructure attack/i;

const CYBER_LOCATIONS: { keywords: string[]; lat: number; lon: number }[] = [
  { keywords: ['us', 'america', 'united states', 'fbi', 'nsa'], lat: 38.89, lon: -77.04 },
  { keywords: ['china', 'chinese', 'beijing'], lat: 39.90, lon: 116.41 },
  { keywords: ['russia', 'russian', 'moscow', 'kremlin'], lat: 55.76, lon: 37.62 },
  { keywords: ['iran', 'iranian'], lat: 35.69, lon: 51.39 },
  { keywords: ['north korea', 'pyongyang', 'lazarus'], lat: 39.04, lon: 125.76 },
  { keywords: ['uk', 'britain', 'london', 'nhs'], lat: 51.51, lon: -0.13 },
  { keywords: ['india', 'indian'], lat: 28.61, lon: 77.23 },
  { keywords: ['germany', 'german'], lat: 52.52, lon: 13.40 },
  { keywords: ['australia', 'australian'], lat: -33.87, lon: 151.21 },
  { keywords: ['japan', 'japanese'], lat: 35.68, lon: 139.69 },
  { keywords: ['france', 'french'], lat: 48.86, lon: 2.35 },
  { keywords: ['microsoft', 'google', 'amazon', 'facebook', 'meta', 'apple'], lat: 37.39, lon: -122.08 },
];

export const extractOutagesFromNews = (news: NewsItem[]): OutageEvent[] => {
  const outages: OutageEvent[] = [];
  news.forEach((item) => {
    if (!CYBER_KEYWORDS.test(item.title)) return;
    const lower = item.title.toLowerCase();
    
    let type: OutageEvent['type'] = 'cyber';
    if (/ransomware/i.test(lower)) type = 'ransomware';
    else if (/ddos/i.test(lower)) type = 'ddos';
    else if (/outage|down|blackout/i.test(lower)) type = 'internet';
    else if (/power/i.test(lower)) type = 'power';
    else if (/telecom/i.test(lower)) type = 'telecom';

    for (const loc of CYBER_LOCATIONS) {
      if (loc.keywords.some(kw => lower.includes(kw))) {
        outages.push({
          id: `outage-${item.id}`,
          title: item.title,
          lat: loc.lat + (Math.random() - 0.5) * 1,
          lon: loc.lon + (Math.random() - 0.5) * 1,
          type,
          severity: item.severity === 'critical' ? 'critical' : item.severity === 'high' ? 'major' : 'minor',
          source: item.source,
          time: item.time,
          affected: loc.keywords[0].toUpperCase(),
          link: item.link,
        });
        break;
      }
    }
  });
  return outages;
};

// Also add RSS feeds for cyber-specific news
export const fetchCyberNews = async (): Promise<NewsItem[]> => {
  const cyberFeeds = [
    { url: 'https://feeds.feedburner.com/TheHackersNews', source: 'HackerNews', tier: 2 as const },
    { url: 'https://www.bleepingcomputer.com/feed/', source: 'BleepingPC', tier: 2 as const },
  ];

  const items: NewsItem[] = [];
  await Promise.allSettled(
    cyberFeeds.map(async (feed) => {
      try {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
        const data = await res.json();
        if (data.status === 'ok' && data.items) {
          data.items.slice(0, 5).forEach((item: any, i: number) => {
            items.push({
              id: `cyber-${feed.source}-${i}-${Date.now()}`,
              title: item.title,
              source: feed.source,
              tier: feed.tier,
              severity: CYBER_KEYWORDS.test(item.title) ? 'high' : 'medium',
              time: new Date(item.pubDate),
              link: item.link,
              category: 'cyber',
            });
          });
        }
      } catch (e) {
        console.warn(`Failed to fetch cyber RSS from ${feed.source}:`, e);
      }
    })
  );
  return items;
};
