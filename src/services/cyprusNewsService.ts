import { supabase } from '@/integrations/supabase/client';

export interface CyprusArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  category: 'security' | 'politics' | 'economy' | 'energy' | 'society' | 'general';
  type: 'search' | 'x-post' | 'scrape';
  query: string;
}

export interface CyprusNewsData {
  articles: CyprusArticle[];
  headlines: string[];
  totalFound: number;
  uniqueCount: number;
  scrapedAt: string;
  errors?: string[];
}

const cache: { data: CyprusNewsData | null; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 90_000; // 90 seconds

export const fetchCyprusNews = async (mode: 'full' | 'quick' = 'full'): Promise<CyprusNewsData | null> => {
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) return cache.data;

  try {
    const { data, error } = await supabase.functions.invoke('cyprus-news-scraper', {
      body: { mode },
    });

    if (error) {
      console.warn('Cyprus news scraper error:', error);
      return cache.data;
    }

    if (data?.success) {
      const result: CyprusNewsData = {
        articles: data.articles || [],
        headlines: data.headlines || [],
        totalFound: data.totalFound || 0,
        uniqueCount: data.uniqueCount || 0,
        scrapedAt: data.scrapedAt || new Date().toISOString(),
        errors: data.errors,
      };
      cache.data = result;
      cache.ts = Date.now();
      return result;
    }
    return cache.data;
  } catch (e) {
    console.warn('Failed to fetch Cyprus news:', e);
    return cache.data;
  }
};
