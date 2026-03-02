import { supabase } from '@/integrations/supabase/client';

export interface TwitterOsintPost {
  id: string;
  account: string;
  text: string;
  createdAt: string;
  url: string;
  geo: { lat: number; lon: number; place: string } | null;
  metrics: { like_count?: number; retweet_count?: number; reply_count?: number };
  source: 'twitter_api';
}

export interface TwitterOsintData {
  posts: TwitterOsintPost[];
  geolocated: TwitterOsintPost[];
  total: number;
  fetchedAt: string;
}

const cache: { data: TwitterOsintData | null; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 120_000; // 2 minutes

export const fetchTwitterOsint = async (): Promise<TwitterOsintData | null> => {
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) return cache.data;

  try {
    const { data, error } = await supabase.functions.invoke('twitter-osint', {
      body: {},
    });

    if (error) {
      console.warn('Twitter OSINT error:', error);
      return cache.data;
    }

    if (data?.success) {
      const result: TwitterOsintData = {
        posts: data.posts || [],
        geolocated: data.geolocated || [],
        total: data.total || 0,
        fetchedAt: data.fetchedAt || new Date().toISOString(),
      };
      cache.data = result;
      cache.ts = Date.now();
      return result;
    }
    return cache.data;
  } catch (e) {
    console.warn('Failed to fetch Twitter OSINT:', e);
    return cache.data;
  }
};
