import { useWorldViewStore, LayerType, NewsItem, NewsHotspot } from '@/store/worldview';

/**
 * News-Driven Layer Sync Engine
 * 
 * Watches incoming news + X/OSINT data and:
 * 1. Auto-enables relevant data layers based on news categories
 * 2. Creates synthetic markers from news geo-locations  
 * 3. Generates hotspot highlights near active news regions
 */

// ── Category → Layer mapping ──
const CATEGORY_TO_LAYERS: Record<string, LayerType[]> = {
  military: ['aircraft', 'militaryFlights', 'militaryBases'],
  conflict: ['conflicts', 'militaryFlights', 'aircraft'],
  protest: ['protests'],
  cyber: ['outages'],
  earthquake: ['earthquakes'],
  fire: ['fires'],
  nuclear: ['nuclearSites'],
  weather: ['weather'],
  maritime: ['vessels', 'underseaCables', 'chokepoints'],
  volcano: ['volcanoes'],
};

// ── Keyword → Layer mapping for fine-grained detection ──
const KEYWORD_LAYERS: { pattern: RegExp; layers: LayerType[] }[] = [
  { pattern: /\b(earthquake|seismic|tremor|magnitude|richter)\b/i, layers: ['earthquakes'] },
  { pattern: /\b(wildfire|fire|burn|blaze|arson|inferno)\b/i, layers: ['fires'] },
  { pattern: /\b(protest|riot|demonstrat|uprising|march|civil unrest)\b/i, layers: ['protests'] },
  { pattern: /\b(cyber|hack|breach|ransomware|ddos|outage|internet down)\b/i, layers: ['outages'] },
  { pattern: /\b(militar|troops|deploy|aircraft|fighter jet|bomber|drone|airforce|navy|fleet)\b/i, layers: ['aircraft', 'militaryFlights', 'militaryBases'] },
  { pattern: /\b(nuclear|radiation|enrichment|warhead|reactor|meltdown)\b/i, layers: ['nuclearSites'] },
  { pattern: /\b(hurricane|typhoon|cyclone|tornado|storm|flood|blizzard)\b/i, layers: ['weather'] },
  { pattern: /\b(ship|vessel|naval|maritime|submarine|blockade|strait|piracy|cargo)\b/i, layers: ['vessels', 'chokepoints'] },
  { pattern: /\b(volcano|eruption|lava|magma|volcanic)\b/i, layers: ['volcanoes'] },
  { pattern: /\b(cable|internet|undersea|fiber optic)\b/i, layers: ['underseaCables'] },
  { pattern: /\b(pipeline|oil|gas|energy crisis|refinery)\b/i, layers: ['pipelines'] },
  { pattern: /\b(satellite|space|orbit|launch)\b/i, layers: ['satellites'] },
  { pattern: /\b(camera|cctv|surveillance|webcam)\b/i, layers: ['cameras'] },
];

// Re-export the type from store for convenience
export type { NewsHotspot } from '@/store/worldview';

// ── Detect which layers should be active based on news ──
function detectLayersFromNews(news: NewsItem[]): Set<LayerType> {
  const layersToEnable = new Set<LayerType>();
  const recentNews = news.filter(n => Date.now() - n.time.getTime() < 6 * 60 * 60 * 1000); // last 6h

  for (const item of recentNews) {
    // Category-based
    if (item.category && CATEGORY_TO_LAYERS[item.category]) {
      for (const layer of CATEGORY_TO_LAYERS[item.category]) {
        if (item.severity === 'critical' || item.severity === 'high') {
          layersToEnable.add(layer);
        }
      }
    }

    // Keyword-based (catches things categories miss)
    for (const { pattern, layers } of KEYWORD_LAYERS) {
      if (pattern.test(item.title)) {
        for (const layer of layers) {
          layersToEnable.add(layer);
        }
      }
    }
  }

  return layersToEnable;
}

// ── Generate hotspots from clustered geolocated news ──
function generateHotspots(news: NewsItem[]): NewsHotspot[] {
  // Country centroid lookup for news with country but no explicit coords
  const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
    ukraine: { lat: 48.5, lon: 37.5 }, russia: { lat: 55.75, lon: 37.62 },
    gaza: { lat: 31.35, lon: 34.31 }, israel: { lat: 31.77, lon: 35.22 },
    iran: { lat: 35.69, lon: 51.39 }, iraq: { lat: 33.31, lon: 44.37 },
    syria: { lat: 33.51, lon: 36.29 }, yemen: { lat: 15.35, lon: 44.2 },
    sudan: { lat: 15.5, lon: 32.56 }, lebanon: { lat: 33.89, lon: 35.5 },
    'north korea': { lat: 39.02, lon: 125.75 }, china: { lat: 39.91, lon: 116.4 },
    taiwan: { lat: 25.03, lon: 121.57 }, afghanistan: { lat: 34.53, lon: 69.17 },
    myanmar: { lat: 19.76, lon: 96.07 }, somalia: { lat: 2.05, lon: 45.32 },
    libya: { lat: 32.9, lon: 13.1 }, haiti: { lat: 18.54, lon: -72.34 },
    'united states': { lat: 38.91, lon: -77.04 }, turkey: { lat: 39.93, lon: 32.86 },
    egypt: { lat: 30.04, lon: 31.24 }, pakistan: { lat: 33.69, lon: 73.04 },
    india: { lat: 28.61, lon: 77.21 }, 'virgin islands': { lat: 18.34, lon: -64.93 },
    'united kingdom': { lat: 51.51, lon: -0.13 }, france: { lat: 48.86, lon: 2.35 },
    germany: { lat: 52.52, lon: 13.41 }, japan: { lat: 35.68, lon: 139.69 },
    'south korea': { lat: 37.57, lon: 126.98 }, 'saudi arabia': { lat: 24.71, lon: 46.68 },
    uae: { lat: 24.45, lon: 54.65 }, congo: { lat: -4.32, lon: 15.31 },
    ethiopia: { lat: 9.01, lon: 38.75 }, nigeria: { lat: 9.08, lon: 7.49 },
    venezuela: { lat: 10.49, lon: -66.88 }, colombia: { lat: 4.71, lon: -74.07 },
    mexico: { lat: 19.43, lon: -99.13 }, brazil: { lat: -15.79, lon: -47.88 },
  };

  // Group news by country/region
  const clusters = new Map<string, { items: NewsItem[]; lat: number; lon: number }>();
  
  for (const item of news) {
    if (!item.country) continue;
    const key = item.country.toLowerCase();
    const coords = COUNTRY_COORDS[key];
    if (!coords) continue;

    if (!clusters.has(key)) {
      clusters.set(key, { items: [], lat: coords.lat, lon: coords.lon });
    }
    clusters.get(key)!.items.push(item);
  }

  const hotspots: NewsHotspot[] = [];
  
  for (const [country, { items, lat, lon }] of clusters) {
    if (items.length < 2) continue; // need at least 2 news items to be a hotspot
    
    const critCount = items.filter(i => i.severity === 'critical').length;
    const highCount = items.filter(i => i.severity === 'high').length;
    
    const intensity: NewsHotspot['intensity'] = 
      critCount >= 2 ? 'critical' : 
      (critCount >= 1 || highCount >= 3) ? 'high' : 'medium';

    const categories = [...new Set(items.map(i => i.category).filter(Boolean))] as string[];

    hotspots.push({
      id: `hotspot-${country}`,
      lat,
      lon,
      radius: Math.min(200, 50 + items.length * 15), // km
      intensity,
      label: country.toUpperCase(),
      newsCount: items.length,
      categories,
      timestamp: new Date(Math.max(...items.map(i => i.time.getTime()))),
    });
  }

  // Sort by intensity then count
  const ORDER = { critical: 0, high: 1, medium: 2 };
  hotspots.sort((a, b) => ORDER[a.intensity] - ORDER[b.intensity] || b.newsCount - a.newsCount);

  return hotspots.slice(0, 20);
}

// ── Also analyze X/OSINT posts for layer hints ──
function detectLayersFromTwitter(posts: { text: string }[]): Set<LayerType> {
  const layers = new Set<LayerType>();
  for (const post of posts) {
    for (const { pattern, layers: l } of KEYWORD_LAYERS) {
      if (pattern.test(post.text)) {
        l.forEach(layer => layers.add(layer));
      }
    }
  }
  return layers;
}

// Track which layers we auto-enabled so we don't fight the user
let autoEnabledLayers = new Set<LayerType>();
let lastSyncHash = '';

/**
 * Main sync function — called after news/X data refreshes
 * Mutates the store to enable layers and update hotspots
 */
export function syncLayersWithNews() {
  const state = useWorldViewStore.getState();
  const { news, twitterPosts, layers } = state;
  
  if (news.length === 0) return;

  // Create a hash to avoid re-processing identical data
  const hash = `${news.length}-${news[0]?.id}-${twitterPosts.length}`;
  if (hash === lastSyncHash) return;
  lastSyncHash = hash;

  // 1. Detect layers from news + X posts
  const newsLayers = detectLayersFromNews(news);
  const twitterLayers = detectLayersFromTwitter(twitterPosts);
  const allDetected = new Set([...newsLayers, ...twitterLayers]);

  // 2. Auto-enable detected layers (only if they're currently off and we haven't been overridden)
  const layersToToggle: LayerType[] = [];
  for (const layer of allDetected) {
    if (!layers[layer] && !autoEnabledLayers.has(layer)) {
      layersToToggle.push(layer);
    }
  }

  if (layersToToggle.length > 0) {
    // Batch enable
    useWorldViewStore.setState((s) => {
      const newLayers = { ...s.layers };
      for (const l of layersToToggle) {
        newLayers[l] = true;
        autoEnabledLayers.add(l);
      }
      return { layers: newLayers };
    });
    console.log(`[LayerSync] Auto-enabled layers: ${layersToToggle.join(', ')}`);
  }

  // 3. Generate hotspots
  const hotspots = generateHotspots(news);
  useWorldViewStore.getState().setNewsHotspots(hotspots);

  if (hotspots.length > 0) {
    console.log(`[LayerSync] ${hotspots.length} news hotspots (${hotspots.filter(h => h.intensity === 'critical').length} critical)`);
  }
}
