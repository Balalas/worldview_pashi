import { supabase } from '@/integrations/supabase/client';

export interface MissileActivity {
  from: string;
  to: string;
  type: 'ballistic' | 'cruise' | 'drone' | 'rocket';
  status: 'launched' | 'intercepted' | 'hit' | 'reported';
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
}

export interface ActiveStrike {
  attacker: string;
  defender: string;
  weaponType: string;
  description: string;
  confidence: 'confirmed' | 'likely' | 'unconfirmed';
  intensity: number;
}

export interface EscalationRisk {
  pair: string;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  prediction: string;
  probability: number;
  timeframe: string;
}

export interface ConflictPair {
  attacker: string;
  defender: string;
  attackerCoords: { lat: number; lon: number };
  defenderCoords: { lat: number; lon: number };
  active: boolean;
}

export interface ConflictIntel {
  activeStrikes: ActiveStrike[];
  escalationRisk: EscalationRisk[];
  missileActivity: MissileActivity[];
  threatBrief: string;
  conflictPairs: ConflictPair[];
}

const cache: { data: ConflictIntel | null; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 90_000; // 90 seconds

export const fetchConflictIntel = async (
  headlines: string[],
  conflictZones: string[]
): Promise<ConflictIntel | null> => {
  if (headlines.length === 0) return cache.data;

  if (cache.data && Date.now() - cache.ts < CACHE_TTL) return cache.data;

  try {
    const { data, error } = await supabase.functions.invoke('ai-conflict-intel', {
      body: { headlines: headlines.slice(0, 30), conflictZones: conflictZones.slice(0, 15) },
    });

    if (error) {
      console.warn('Conflict intel error:', error);
      return cache.data;
    }

    if (data?.success && data?.data) {
      const result: ConflictIntel = {
        ...data.data,
        conflictPairs: data.conflictPairs || [],
      };
      cache.data = result;
      cache.ts = Date.now();
      return result;
    }
    return cache.data;
  } catch (e) {
    console.warn('Failed to fetch conflict intel:', e);
    return cache.data;
  }
};
