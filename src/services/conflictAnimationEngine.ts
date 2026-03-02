/**
 * Conflict Animation Engine
 * Watches live news + conflict intel for missile/strike/plane keywords
 * and auto-triggers animated missile arcs + country highlights on the globe.
 */

import { useWorldViewStore, NewsItem } from '@/store/worldview';
import { MissileActivity } from '@/services/conflictIntelService';
import { CONFLICT_ZONES } from '@/data/conflictZones';

// ── Keyword patterns ──
const MISSILE_KEYWORDS = /\b(missile|missiles|rocket|rockets|ballistic|cruise missile|ICBM|hypersonic|ATACMS|Patriot|Iron Dome|S-300|S-400|Iskander|Shaheen|Tochka|Kalibr|Kinzhal|Zircon|Tomahawk|HIMARS|Grad|MLRS)\b/i;
const STRIKE_KEYWORDS = /\b(airstrike|airstrikes|strike|strikes|bombing|bombed|bombardment|shelling|shelled|drone strike|drone attack|barrage|volley|launched|intercept|intercepted|shot down)\b/i;
const PLANE_KEYWORDS = /\b(fighter jets|warplanes|aircraft|bombers|F-16|F-35|Su-35|MiG|B-52|stealth|scrambled|deployed|heading toward|flying toward|sent to|dispatched|mobilized|en route|airspace|air force|sortie|flyover|no-fly zone)\b/i;

// Country coordinate lookup for generating arcs
const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  russia: { lat: 55.75, lon: 37.62 },
  ukraine: { lat: 48.5, lon: 37.5 },
  israel: { lat: 31.77, lon: 35.22 },
  gaza: { lat: 31.35, lon: 34.31 },
  palestine: { lat: 31.35, lon: 34.31 },
  iran: { lat: 35.69, lon: 51.39 },
  lebanon: { lat: 33.89, lon: 35.50 },
  syria: { lat: 34.80, lon: 38.99 },
  yemen: { lat: 15.35, lon: 44.20 },
  houthi: { lat: 15.35, lon: 44.20 },
  sudan: { lat: 15.50, lon: 32.56 },
  myanmar: { lat: 19.76, lon: 96.07 },
  china: { lat: 39.90, lon: 116.40 },
  taiwan: { lat: 25.03, lon: 121.56 },
  'north korea': { lat: 39.02, lon: 125.75 },
  'south korea': { lat: 37.57, lon: 126.98 },
  usa: { lat: 38.90, lon: -77.04 },
  'united states': { lat: 38.90, lon: -77.04 },
  iraq: { lat: 33.31, lon: 44.37 },
  pakistan: { lat: 33.69, lon: 73.04 },
  india: { lat: 28.61, lon: 77.21 },
  turkey: { lat: 39.93, lon: 32.85 },
  libya: { lat: 32.90, lon: 13.18 },
  somalia: { lat: 2.05, lon: 45.32 },
  ethiopia: { lat: 9.02, lon: 38.75 },
  'red sea': { lat: 13.5, lon: 42.5 },
  'saudi arabia': { lat: 24.71, lon: 46.68 },
  japan: { lat: 35.68, lon: 139.69 },
};

// Known attacker→defender pairs for arc direction
const ATTACKER_PAIRS: [string, string][] = [
  ['russia', 'ukraine'], ['israel', 'gaza'], ['israel', 'lebanon'],
  ['houthi', 'red sea'], ['iran', 'israel'], ['north korea', 'south korea'],
  ['sudan', 'darfur'], ['myanmar', 'shan'],
];

export interface AnimatedMissile extends MissileActivity {
  id: string;
  progress: number; // 0-1 animation progress
  createdAt: number;
  expiresAt: number;
  newsTitle: string;
}

export interface CountryHighlight {
  id: string;
  country: string;
  lat: number;
  lon: number;
  reason: string;
  type: 'plane_movement' | 'escalation';
  createdAt: number;
  expiresAt: number;
}

// ── State ──
let processedNewsIds = new Set<string>();
let activeMissiles: AnimatedMissile[] = [];
let activeHighlights: CountryHighlight[] = [];
let animationFrameId: number | null = null;
let lastProcessTime = 0;
const PROCESS_INTERVAL = 5000; // check every 5s
const MISSILE_DURATION = 30000; // missile animation lasts 30s
const HIGHLIGHT_DURATION = 45000; // country highlight lasts 45s

/** Extract country names mentioned in a headline */
function extractCountries(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.keys(COUNTRY_COORDS).filter(c => lower.includes(c));
}

/** Find the best conflict zone match for a headline */
function matchConflictZone(text: string): typeof CONFLICT_ZONES[0] | null {
  const lower = text.toLowerCase();
  for (const zone of CONFLICT_ZONES) {
    const parts = zone.name.toLowerCase().split(/[\s–\-]+/);
    if (parts.some(p => p.length > 3 && lower.includes(p))) return zone;
  }
  return null;
}

/** Determine attacker and defender from headline context */
function inferAttackerDefender(text: string, countries: string[]): { attacker: string; defender: string } | null {
  if (countries.length < 2) {
    // Try conflict zone match
    const zone = matchConflictZone(text);
    if (zone && countries.length === 1) {
      // The mentioned country + zone gives us a pair
      return { attacker: countries[0], defender: zone.name.split('–')[0].trim().toLowerCase() };
    }
    return null;
  }
  
  // Check known pairs
  for (const [a, d] of ATTACKER_PAIRS) {
    if (countries.includes(a) && countries.includes(d)) return { attacker: a, defender: d };
    if (countries.includes(d) && countries.includes(a)) return { attacker: a, defender: d };
  }
  
  // Heuristic: first mentioned = attacker in "X strikes Y" patterns
  const strikeMatch = text.match(/(\w+)\s+(?:strikes?|attacks?|bombs?|shells?|hits?)\s+(\w+)/i);
  if (strikeMatch) {
    const a = countries.find(c => text.toLowerCase().indexOf(c) < text.toLowerCase().indexOf(strikeMatch[2]!));
    const d = countries.find(c => c !== a);
    if (a && d) return { attacker: a, defender: d };
  }
  
  return { attacker: countries[0], defender: countries[1] };
}

/** Process a news item and generate animations */
function processNewsItem(item: NewsItem): void {
  if (processedNewsIds.has(item.id)) return;
  processedNewsIds.add(item.id);
  
  const title = item.title;
  const now = Date.now();
  
  // ── Missile/Strike detection ──
  if (MISSILE_KEYWORDS.test(title) || STRIKE_KEYWORDS.test(title)) {
    const countries = extractCountries(title);
    const pair = inferAttackerDefender(title, countries);
    
    if (pair) {
      const fromCoords = COUNTRY_COORDS[pair.attacker];
      const toCoords = COUNTRY_COORDS[pair.defender];
      
      if (fromCoords && toCoords) {
        // Determine missile type from keywords
        const type: MissileActivity['type'] = 
          /ballistic|ICBM|Iskander/i.test(title) ? 'ballistic' :
          /drone/i.test(title) ? 'drone' :
          /cruise/i.test(title) ? 'cruise' : 'rocket';
        
        const status: MissileActivity['status'] = 
          /intercept/i.test(title) ? 'intercepted' :
          /hit|struck|destroyed/i.test(title) ? 'hit' : 'launched';
        
        const missile: AnimatedMissile = {
          id: `anim-${item.id}`,
          from: pair.attacker,
          to: pair.defender,
          type,
          status,
          fromLat: fromCoords.lat + (Math.random() - 0.5) * 2,
          fromLon: fromCoords.lon + (Math.random() - 0.5) * 2,
          toLat: toCoords.lat + (Math.random() - 0.5) * 2,
          toLon: toCoords.lon + (Math.random() - 0.5) * 2,
          progress: 0,
          createdAt: now,
          expiresAt: now + MISSILE_DURATION,
          newsTitle: title,
        };
        
        activeMissiles.push(missile);
        
        // Push to store so the globe renders the arc
        const store = useWorldViewStore.getState();
        const existing = store.missileArcs || [];
        // Avoid duplicates from same news
        if (!existing.some(m => m.from === missile.from && m.to === missile.to && m.type === missile.type)) {
          useWorldViewStore.getState().setMissileArcs([...existing, missile]);
        }
      }
    } else if (countries.length === 1) {
      // Single country mentioned with strike — use conflict zone as target
      const zone = matchConflictZone(title);
      const fromCoords = COUNTRY_COORDS[countries[0]];
      if (zone && fromCoords) {
        const missile: AnimatedMissile = {
          id: `anim-${item.id}`,
          from: countries[0],
          to: zone.name,
          type: /drone/i.test(title) ? 'drone' : 'rocket',
          status: /intercept/i.test(title) ? 'intercepted' : 'launched',
          fromLat: fromCoords.lat,
          fromLon: fromCoords.lon,
          toLat: zone.lat,
          toLon: zone.lon,
          progress: 0,
          createdAt: now,
          expiresAt: now + MISSILE_DURATION,
          newsTitle: title,
        };
        activeMissiles.push(missile);
        const store = useWorldViewStore.getState();
        useWorldViewStore.getState().setMissileArcs([...(store.missileArcs || []), missile]);
      }
    }
  }
  
  // ── Plane/aircraft movement detection ──
  if (PLANE_KEYWORDS.test(title)) {
    const countries = extractCountries(title);
    for (const country of countries) {
      const coords = COUNTRY_COORDS[country];
      if (!coords) continue;
      
      // Don't duplicate highlights
      if (activeHighlights.some(h => h.country === country && now - h.createdAt < 30000)) continue;
      
      const highlight: CountryHighlight = {
        id: `highlight-${item.id}-${country}`,
        country,
        lat: coords.lat,
        lon: coords.lon,
        reason: title.substring(0, 80),
        type: 'plane_movement',
        createdAt: now,
        expiresAt: now + HIGHLIGHT_DURATION,
      };
      activeHighlights.push(highlight);
    }
  }
}

/** Clean expired animations */
function cleanupExpired(): void {
  const now = Date.now();
  const expiredMissiles = activeMissiles.filter(m => now >= m.expiresAt);
  
  if (expiredMissiles.length > 0) {
    activeMissiles = activeMissiles.filter(m => now < m.expiresAt);
    // Remove expired from store
    const store = useWorldViewStore.getState();
    const remaining = (store.missileArcs || []).filter(
      arc => !expiredMissiles.some(e => e.from === arc.from && e.to === arc.to && e.type === arc.type)
    );
    store.setMissileArcs(remaining);
  }
  
  activeHighlights = activeHighlights.filter(h => now < h.expiresAt);
  
  // Trim processed IDs set to prevent unbounded growth
  if (processedNewsIds.size > 500) {
    const arr = Array.from(processedNewsIds);
    processedNewsIds = new Set(arr.slice(-200));
  }
}

/** Main tick — process news and update animations */
export function tickAnimationEngine(): void {
  const now = Date.now();
  if (now - lastProcessTime < PROCESS_INTERVAL) return;
  lastProcessTime = now;
  
  const store = useWorldViewStore.getState();
  const { news, conflictIntel } = store;
  
  // Process new news items
  for (const item of news) {
    processNewsItem(item);
  }
  
  // Also process conflict intel active strikes
  if (conflictIntel?.activeStrikes) {
    for (const strike of conflictIntel.activeStrikes) {
      const fakeNews: NewsItem = {
        id: `ci-${strike.attacker}-${strike.defender}`,
        title: `${strike.attacker} ${strike.weaponType} ${strike.description}`,
        source: 'AI-INTEL',
        tier: 1,
        severity: strike.intensity >= 7 ? 'critical' : 'high',
        time: new Date(),
      };
      processNewsItem(fakeNews);
    }
  }
  
  // Cleanup expired
  cleanupExpired();
}

/** Get active country highlights for rendering */
export function getActiveHighlights(): CountryHighlight[] {
  return activeHighlights.filter(h => Date.now() < h.expiresAt);
}

/** Get active animated missiles for rendering */
export function getActiveMissiles(): AnimatedMissile[] {
  return activeMissiles.filter(m => Date.now() < m.expiresAt);
}

/** Start the animation engine loop */
export function startAnimationEngine(): () => void {
  const interval = setInterval(tickAnimationEngine, PROCESS_INTERVAL);
  return () => clearInterval(interval);
}

/** Reset engine state */
export function resetAnimationEngine(): void {
  processedNewsIds.clear();
  activeMissiles = [];
  activeHighlights = [];
}
