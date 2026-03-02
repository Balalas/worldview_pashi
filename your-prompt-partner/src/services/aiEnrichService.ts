// Uses direct fetch to avoid supabase SDK throwing on 402/429

export interface AINewsEnrichment {
  summary: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'STABLE';
  keyDevelopments: string[];
  hotTopics: string[];
  flashAlert?: string | null;
  outlook?: string;
}

// Cache to avoid re-fetching on every render
const cache = new Map<string, { data: AINewsEnrichment; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute

export const fetchAINewsEnrichment = async (
  headlines: string[],
  context: 'global' | 'country' = 'global',
  countryName?: string
): Promise<AINewsEnrichment | null> => {
  if (headlines.length === 0) return null;

  const cacheKey = `${context}:${countryName || 'global'}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-news-enrich`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ headlines: headlines.slice(0, 25), context, countryName }),
      }
    );

    if (!resp.ok) {
      console.warn(`AI enrich HTTP ${resp.status} — using cache or skipping`);
      return cached?.data || null;
    }

    const data = await resp.json();

    if (data?.error) {
      console.warn('AI enrich returned error:', data.error);
      return cached?.data || null;
    }

    if (data?.success && data?.data) {
      cache.set(cacheKey, { data: data.data, ts: Date.now() });
      return data.data as AINewsEnrichment;
    }
    return null;
  } catch (e) {
    console.warn('Failed to fetch AI enrichment:', e);
    return cached?.data || null;
  }
};
