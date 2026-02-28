import { supabase } from '@/integrations/supabase/client';

export interface OsintPost {
  account: string;
  text: string;
  url?: string;
  source: 'scrape' | 'search';
}

export interface OsintData {
  posts: OsintPost[];
  headlines: string[];
  scrapedAt: string;
  errors?: string[];
}

const cache: { data: OsintData | null; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 120_000; // 2 minutes

export const fetchOsintData = async (): Promise<OsintData | null> => {
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) return cache.data;

  try {
    const { data, error } = await supabase.functions.invoke('osint-scraper', {
      body: {},
    });

    if (error) {
      console.warn('OSINT scraper error:', error);
      return cache.data;
    }

    if (data?.success) {
      const result: OsintData = {
        posts: data.posts || [],
        headlines: data.headlines || [],
        scrapedAt: data.scrapedAt || new Date().toISOString(),
        errors: data.errors,
      };
      cache.data = result;
      cache.ts = Date.now();
      return result;
    }
    return cache.data;
  } catch (e) {
    console.warn('Failed to fetch OSINT data:', e);
    return cache.data;
  }
};
