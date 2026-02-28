import { supabase } from '@/integrations/supabase/client';

export interface AIWorldBrief {
  brief: string;
  sentiment: {
    score: number; // -100 to 100
    label: 'CRITICAL' | 'TENSE' | 'CAUTIOUS' | 'STABLE' | 'CALM';
    drivers: string[];
  };
  focalPoints: {
    region: string;
    threat: 'HIGH' | 'MEDIUM' | 'LOW';
    summary: string;
  }[];
  velocity: {
    escalating: string[];
    deescalating: string[];
    emerging: string[];
  };
}

export const fetchAIWorldBrief = async (
  headlines: string[],
  earthquakeCount: number,
  fireCount: number,
  criticalTheaters: string
): Promise<AIWorldBrief | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-world-brief', {
      body: { headlines, earthquakes: earthquakeCount, fires: fireCount, theaters: criticalTheaters },
    });

    if (error) {
      console.warn('AI brief error:', error);
      return null;
    }

    if (data?.success && data?.data) {
      return data.data as AIWorldBrief;
    }
    return null;
  } catch (e) {
    console.warn('Failed to fetch AI brief:', e);
    return null;
  }
};
