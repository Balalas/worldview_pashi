import { supabase } from '@/integrations/supabase/client';
import { NewsItem } from '@/store/worldview';

// ── AI Feed Enrichment ──

export interface AIFeedEnrichment {
  globalThreatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'GUARDED' | 'LOW';
  topStories: {
    headline: string;
    severity: string;
    country: string | null;
    category: string;
    aiSummary: string;
  }[];
  emergingThreats: string[];
  hotspots: { region: string; risk: string; reason: string }[];
  timestamp: string;
}

export interface AICountryEnrichment {
  summary: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'GUARDED' | 'LOW';
  aiTags: string[];
  keyDevelopments: string[];
  outlook: string;
  relatedCountries: string[];
}

// Caches to avoid excessive AI calls
let feedCache: AIFeedEnrichment | null = null;
let feedCacheTime = 0;
const FEED_CACHE_TTL = 120_000; // 2 min

const countryCache = new Map<string, { data: AICountryEnrichment; time: number }>();
const COUNTRY_CACHE_TTL = 180_000; // 3 min

export async function fetchAIFeedEnrichment(news: NewsItem[]): Promise<AIFeedEnrichment | null> {
  const now = Date.now();
  if (feedCache && now - feedCacheTime < FEED_CACHE_TTL) return feedCache;
  if (news.length === 0) return null;

  try {
    const headlines = news.slice(0, 40).map(n => `[${n.severity.toUpperCase()}] ${n.title} (${n.source})`);
    const { data, error } = await supabase.functions.invoke('ai-news-enrichment', {
      body: { headlines, mode: 'feed' },
    });

    if (error || !data?.success) {
      console.warn('[AI Enrichment] Feed error:', error || data?.error);
      return feedCache; // return stale cache
    }

    feedCache = data.data as AIFeedEnrichment;
    feedCacheTime = now;
    console.log(`[AI] Feed enriched: ${feedCache.globalThreatLevel} threat, ${feedCache.topStories?.length || 0} stories, ${feedCache.emergingThreats?.length || 0} emerging threats`);
    return feedCache;
  } catch (e) {
    console.warn('[AI Enrichment] Feed failed:', e);
    return feedCache;
  }
}

export async function fetchAICountryEnrichment(
  countryName: string,
  countryCode: string,
  headlines: string[]
): Promise<AICountryEnrichment | null> {
  const now = Date.now();
  const cached = countryCache.get(countryCode);
  if (cached && now - cached.time < COUNTRY_CACHE_TTL) return cached.data;
  if (headlines.length === 0) return null;

  try {
    const { data, error } = await supabase.functions.invoke('ai-news-enrichment', {
      body: { headlines, mode: 'country', countryName, countryCode },
    });

    if (error || !data?.success) {
      console.warn(`[AI Enrichment] Country ${countryCode} error:`, error || data?.error);
      return cached?.data || null;
    }

    const enrichment = data.data as AICountryEnrichment;
    countryCache.set(countryCode, { data: enrichment, time: now });
    console.log(`[AI] Country ${countryName} enriched: ${enrichment.threatLevel}`);
    return enrichment;
  } catch (e) {
    console.warn(`[AI Enrichment] Country ${countryCode} failed:`, e);
    return cached?.data || null;
  }
}
