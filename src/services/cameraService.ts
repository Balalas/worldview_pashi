import { supabase } from '@/integrations/supabase/client';

export interface GlobalCamera {
  id: string;
  source: string;  // 'caltrans' | 'digitraffic' | 'singapore' | 'hongkong' | 'tfl' | 'curated'
  name: string;
  lat: number;
  lon: number;
  imageUrl: string;
  streamUrl?: string;
  country: string;
  region?: string;
  heading?: number;
  isActive: boolean;
  feedType: 'snapshot' | 'embed';
  official?: boolean;
}

// Cache
let cachedCameras: GlobalCamera[] = [];
let lastFetch = 0;
const CACHE_MS = 5 * 60 * 1000; // 5 min

// Deterministic heading from camera ID when none provided
function hashHeading(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return ((h % 360) + 360) % 360;
}

export async function fetchAllCameras(): Promise<GlobalCamera[]> {
  const now = Date.now();
  if (now - lastFetch < CACHE_MS && cachedCameras.length > 0) {
    return cachedCameras;
  }

  try {
    const { data, error } = await supabase.functions.invoke('camera-aggregator');

    if (error || !data?.success) {
      console.warn('[Cameras] Aggregator error:', error || data?.error);
      return cachedCameras;
    }

    const liveCams: GlobalCamera[] = (data.cameras || []).map((cam: any) => ({
      ...cam,
      heading: cam.heading ?? hashHeading(cam.id),
      feedType: 'snapshot' as const,
      official: cam.source !== 'curated',
    }));

    cachedCameras = liveCams;
    lastFetch = now;

    console.log(`[Cameras] Fetched ${liveCams.length} live cameras from ${Object.keys(data.sources || {}).length} sources`);
    return liveCams;
  } catch (e) {
    console.error('[Cameras] Fetch failed:', e);
    return cachedCameras;
  }
}

export function getCameraSourceColor(source: string): string {
  switch (source) {
    case 'caltrans': return '#ff8800';
    case 'digitraffic': return '#00aaff';
    case 'singapore': return '#ff44aa';
    case 'hongkong': return '#ffdd00';
    case 'tfl': return '#ff4444';
    default: return '#fbbf24';
  }
}

export function getCameraSourceLabel(source: string): string {
  switch (source) {
    case 'caltrans': return 'CALTRANS';
    case 'digitraffic': return 'FI-DOT';
    case 'singapore': return 'SG-LTA';
    case 'hongkong': return 'HK-GOV';
    case 'tfl': return 'TFL';
    default: return source.toUpperCase();
  }
}
