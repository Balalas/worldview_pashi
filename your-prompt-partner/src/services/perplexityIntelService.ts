import { supabase } from '@/integrations/supabase/client';

export interface PerplexityIntel {
  briefing: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'STABLE';
  developments: string[];
  risks: string[];
  keywords: string[];
  sources: string[];
  citations?: string[];
  fetchedAt: string;
  dualSource?: boolean;
  perplexityAvailable?: boolean;
  aiAnalysisAvailable?: boolean;
}

const cache = new Map<string, { data: PerplexityIntel; ts: number }>();
const CACHE_TTL = 120_000; // 2 minutes

export const fetchPerplexityCountryIntel = async (countryName: string): Promise<PerplexityIntel | null> => {
  const cacheKey = countryName.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    const { data, error } = await supabase.functions.invoke('perplexity-country-intel', {
      body: { countryName },
    });

    if (error) {
      console.warn('Perplexity intel error:', error);
      return cached?.data || null;
    }

    if (data?.success && data?.data) {
      const result: PerplexityIntel = {
        ...data.data,
        citations: data.citations || [],
        fetchedAt: data.fetchedAt || new Date().toISOString(),
      };
      cache.set(cacheKey, { data: result, ts: Date.now() });
      return result;
    }
    return cached?.data || null;
  } catch (e) {
    console.warn('Failed to fetch Perplexity intel:', e);
    return cached?.data || null;
  }
};
