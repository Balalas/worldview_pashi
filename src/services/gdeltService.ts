import { supabase } from '@/integrations/supabase/client';
import { NewsItem } from '@/store/worldview';

// ── GDELT Event (geolocated) ──
export interface GdeltEvent {
  id: string;
  title: string;
  lat: number;
  lon: number;
  country: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  source: string;
  time: string;
  type: string; // conflict, protest, military, nuclear, cyber
}

// ── Severity visual mapping ──
export const SEVERITY_CONFIG = {
  critical: { color: '#cc2244', size: 25, multiplier: 10 },
  high:     { color: '#ff6600', size: 17.5, multiplier: 7 },
  medium:   { color: '#ffaa00', size: 12.5, multiplier: 5 },
  low:      { color: '#00ffaa', size: 12.5, multiplier: 5 },
  info:     { color: '#0099ff', size: 12.5, multiplier: 5 },
} as const;

// ── Tier labels ──
export const TIER_LABELS: Record<number, string> = {
  1: 'WIRE',    // Reuters, AP, BBC
  2: 'QUALITY', // NYT, WaPo, Guardian
  3: 'BROADCAST', // CNN, AJ, DW
  4: 'REGIONAL',
};

// ── Cache ──
let cachedArticles: NewsItem[] = [];
let cachedEvents: GdeltEvent[] = [];
let lastFetch = 0;
const CACHE_TTL = 45_000; // 45 seconds — live update cadence

// ── Parse GDELT date format (YYYYMMDDHHMMSS) to Date ──
function parseGdeltDate(dateStr: string): Date {
  if (!dateStr || dateStr.length < 14) return new Date();
  const y = dateStr.substring(0, 4);
  const m = dateStr.substring(4, 6);
  const d = dateStr.substring(6, 8);
  const h = dateStr.substring(8, 10);
  const min = dateStr.substring(10, 12);
  const sec = dateStr.substring(12, 14);
  return new Date(`${y}-${m}-${d}T${h}:${min}:${sec}Z`);
}

// ── Fetch from GDELT proxy edge function ──
export async function fetchGdeltData(options?: { warMode?: boolean }): Promise<{
  articles: NewsItem[];
  events: GdeltEvent[];
}> {
  const now = Date.now();
  if (now - lastFetch < CACHE_TTL && cachedArticles.length > 0) {
    return { articles: cachedArticles, events: cachedEvents };
  }

  try {
    const topics = options?.warMode 
      ? ['conflict', 'military', 'terrorism', 'nuclear', 'maritime']
      : undefined; // all topics

    const { data, error } = await supabase.functions.invoke('gdelt-proxy', {
      body: { mode: 'all', topics, maxRecords: 25 },
    });

    if (error || !data?.success) {
      console.warn('[GDELT] Proxy error:', error || data?.error);
      return { articles: cachedArticles, events: cachedEvents };
    }

    // Transform articles into NewsItem format
    const articles: NewsItem[] = (data.articles || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      source: a.source,
      tier: a.tier as 1 | 2 | 3 | 4,
      severity: a.severity as NewsItem['severity'],
      time: parseGdeltDate(a.time),
      isStateMedia: a.isStateMedia,
      link: a.url,
      category: mapToNewsCategory(a.category),
      country: a.country,
      image: a.image,
    }));

    const events: GdeltEvent[] = (data.events || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      lat: e.lat,
      lon: e.lon,
      country: e.country,
      severity: e.severity,
      category: e.category,
      source: e.source,
      time: e.time,
      type: e.type,
    }));

    cachedArticles = articles;
    cachedEvents = events;
    lastFetch = now;

    console.log(`[GDELT] Fetched ${articles.length} articles, ${events.length} geo-events from ${data.topicCount} topics`);

    return { articles, events };
  } catch (err) {
    console.error('[GDELT] Fetch failed:', err);
    return { articles: cachedArticles, events: cachedEvents };
  }
}

// Map GDELT categories to the existing NewsItem category enum
function mapToNewsCategory(cat: string): NewsItem['category'] {
  switch (cat) {
    case 'conflict': case 'terrorism': return 'conflict';
    case 'military': case 'intelligence': case 'maritime': case 'nuclear': return 'military';
    case 'protest': return 'protest';
    case 'cyber': return 'cyber';
    default: return 'general';
  }
}
