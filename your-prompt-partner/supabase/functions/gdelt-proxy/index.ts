import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── GDELT Doc API v2 ──
const GDELT_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc';

// ── Source tier classification ──
const TIER1 = new Set(['reuters.com','apnews.com','bbc.co.uk','bbc.com']);
const TIER2 = new Set(['nytimes.com','washingtonpost.com','theguardian.com','wsj.com','ft.com','economist.com']);
const TIER3 = new Set(['cnn.com','aljazeera.com','dw.com','france24.com','politico.com','bloomberg.com','foreignpolicy.com']);
const STATE_MEDIA = new Set(['rt.com','sputniknews.com','tass.com','xinhua.net','xinhuanet.com','cgtn.com','presstv.ir','kcna.kp','globaltimes.cn','en.people.cn']);

function getSourceTier(domain: string): 1 | 2 | 3 | 4 {
  const d = domain.replace(/^www\./, '');
  if (TIER1.has(d)) return 1;
  if (TIER2.has(d)) return 2;
  if (TIER3.has(d)) return 3;
  return 4;
}

function isStateMedia(domain: string): boolean {
  return STATE_MEDIA.has(domain.replace(/^www\./, ''));
}

// ── Severity classification ──
const SEVERITY_CRITICAL = /\b(nuclear strike|invasion|coup|assassination|genocide|bioweapon|pandemic declaration|mass casualty|chemical attack)\b/i;
const SEVERITY_HIGH = /\b(airstrike|missile|bombing|attack|shelling|casualties|killed|troops deploy|military offensive|cyber attack|terror|drone strike|artillery)\b/i;
const SEVERITY_MEDIUM = /\b(protest|sanctions|election|border|unrest|diplomatic|ceasefire|blockade|embargo|mobilization)\b/i;
const SEVERITY_LOW = /\b(trade|diplomatic meeting|economic|policy|agreement|humanitarian|relief|talks)\b/i;

function classifySeverity(title: string): string {
  if (SEVERITY_CRITICAL.test(title)) return 'critical';
  if (SEVERITY_HIGH.test(title)) return 'high';
  if (SEVERITY_MEDIUM.test(title)) return 'medium';
  if (SEVERITY_LOW.test(title)) return 'low';
  return 'info';
}

// ── Category classification ──
function classifyCategory(title: string): string {
  const t = title.toLowerCase();
  if (/epstein|ghislaine|maxwell|lolita express|little st.? james/.test(t)) return 'epstein';
  if (/militar|army|navy|troops|deploy|weapon|defense|pentagon|airforce|base|fleet/.test(t)) return 'military';
  if (/war|conflict|invasion|attack|killed|dead|casualties|strike|bomb|shell|offensive|frontline/.test(t)) return 'conflict';
  if (/protest|demonstrat|rally|riot|unrest|uprising|march|dissent/.test(t)) return 'protest';
  if (/cyber|hack|breach|ransomware|ddos|malware|data leak/.test(t)) return 'cyber';
  if (/nuclear|missile|weapon.*program|enrichment|warhead|icbm/.test(t)) return 'nuclear';
  if (/intelligen|espionage|spy|surveillance|sigint|covert/.test(t)) return 'intelligence';
  if (/naval|maritime|strait|shipping|piracy|blockade/.test(t)) return 'maritime';
  if (/sanction|diploma|treaty|embargo|summit|negotiat/.test(t)) return 'diplomacy';
  if (/terror|extremis|jihad|insurgent/.test(t)) return 'terrorism';
  if (/econom|inflation|recession|crash|debt|default|bank/.test(t)) return 'economic';
  if (/oil|gas|energy|pipeline|opec|lng/.test(t)) return 'energy';
  if (/earthquake|hurricane|flood|wildfire|tsunami|volcano|cyclone/.test(t)) return 'disaster';
  return 'general';
}

// ── Country extraction from title ──
const COUNTRY_MAP: Record<string, { lat: number; lon: number }> = {
  'ukraine': { lat: 48.5, lon: 37.5 }, 'russia': { lat: 55.75, lon: 37.62 },
  'gaza': { lat: 31.35, lon: 34.31 }, 'israel': { lat: 31.77, lon: 35.22 },
  'iran': { lat: 35.69, lon: 51.39 }, 'iraq': { lat: 33.31, lon: 44.37 },
  'syria': { lat: 33.51, lon: 36.29 }, 'yemen': { lat: 15.35, lon: 44.2 },
  'sudan': { lat: 15.5, lon: 32.56 }, 'somalia': { lat: 2.05, lon: 45.32 },
  'myanmar': { lat: 19.76, lon: 96.07 }, 'afghanistan': { lat: 34.53, lon: 69.17 },
  'north korea': { lat: 39.02, lon: 125.75 }, 'south korea': { lat: 37.57, lon: 126.98 },
  'china': { lat: 39.91, lon: 116.40 }, 'taiwan': { lat: 25.03, lon: 121.57 },
  'pakistan': { lat: 33.69, lon: 73.04 }, 'india': { lat: 28.61, lon: 77.21 },
  'lebanon': { lat: 33.89, lon: 35.50 }, 'libya': { lat: 32.90, lon: 13.10 },
  'mali': { lat: 12.64, lon: -8.00 }, 'niger': { lat: 13.51, lon: 2.11 },
  'burkina faso': { lat: 12.37, lon: -1.52 }, 'ethiopia': { lat: 9.01, lon: 38.75 },
  'congo': { lat: -4.32, lon: 15.31 }, 'haiti': { lat: 18.54, lon: -72.34 },
  'mexico': { lat: 19.43, lon: -99.13 }, 'colombia': { lat: 4.71, lon: -74.07 },
  'venezuela': { lat: 10.49, lon: -66.88 }, 'brazil': { lat: -15.79, lon: -47.88 },
  'turkey': { lat: 39.93, lon: 32.86 }, 'egypt': { lat: 30.04, lon: 31.24 },
  'saudi arabia': { lat: 24.71, lon: 46.68 }, 'uae': { lat: 24.45, lon: 54.65 },
  'qatar': { lat: 25.29, lon: 51.53 }, 'bahrain': { lat: 26.07, lon: 50.56 },
  'kuwait': { lat: 29.38, lon: 47.99 }, 'jordan': { lat: 31.95, lon: 35.93 },
  'tunisia': { lat: 36.81, lon: 10.18 }, 'algeria': { lat: 36.75, lon: 3.06 },
  'morocco': { lat: 33.97, lon: -6.85 }, 'kenya': { lat: -1.29, lon: 36.82 },
  'nigeria': { lat: 9.08, lon: 7.49 }, 'south africa': { lat: -33.93, lon: 18.42 },
  'mozambique': { lat: -25.97, lon: 32.57 }, 'cameroon': { lat: 3.87, lon: 11.52 },
  'georgia': { lat: 41.72, lon: 44.79 }, 'armenia': { lat: 40.18, lon: 44.51 },
  'azerbaijan': { lat: 40.41, lon: 49.87 }, 'japan': { lat: 35.68, lon: 139.69 },
  'philippines': { lat: 14.60, lon: 120.98 }, 'indonesia': { lat: -6.21, lon: 106.85 },
  'thailand': { lat: 13.76, lon: 100.50 }, 'vietnam': { lat: 21.03, lon: 105.85 },
  'uk': { lat: 51.51, lon: -0.13 }, 'united kingdom': { lat: 51.51, lon: -0.13 },
  'france': { lat: 48.86, lon: 2.35 }, 'germany': { lat: 52.52, lon: 13.41 },
  'poland': { lat: 52.23, lon: 21.01 }, 'romania': { lat: 44.43, lon: 26.10 },
  'united states': { lat: 38.91, lon: -77.04 }, 'us': { lat: 38.91, lon: -77.04 },
  'washington': { lat: 38.91, lon: -77.04 }, 'pentagon': { lat: 38.87, lon: -77.06 },
  'jerusalem': { lat: 31.77, lon: 35.22 }, 'tehran': { lat: 35.69, lon: 51.39 },
  'moscow': { lat: 55.75, lon: 37.62 }, 'beijing': { lat: 39.91, lon: 116.40 },
  'kyiv': { lat: 50.45, lon: 30.52 }, 'kabul': { lat: 34.53, lon: 69.17 },
  'baghdad': { lat: 33.31, lon: 44.37 }, 'damascus': { lat: 33.51, lon: 36.29 },
  'tripoli': { lat: 32.90, lon: 13.10 }, 'khartoum': { lat: 15.50, lon: 32.56 },
  'mogadishu': { lat: 2.05, lon: 45.32 }, 'aden': { lat: 12.78, lon: 45.04 },
  'erbil': { lat: 36.19, lon: 44.01 }, 'mosul': { lat: 36.34, lon: 43.13 },
  'aleppo': { lat: 36.20, lon: 37.15 }, 'idlib': { lat: 35.93, lon: 36.63 },
  'kharkiv': { lat: 49.99, lon: 36.23 }, 'odesa': { lat: 46.48, lon: 30.73 },
  'crimea': { lat: 44.95, lon: 34.10 }, 'donbas': { lat: 48.00, lon: 38.00 },
  'donetsk': { lat: 48.00, lon: 37.80 }, 'luhansk': { lat: 48.57, lon: 39.31 },
  'rafah': { lat: 31.27, lon: 34.25 }, 'west bank': { lat: 31.95, lon: 35.20 },
  'red sea': { lat: 20.0, lon: 38.0 }, 'strait of hormuz': { lat: 26.57, lon: 56.25 },
  'south china sea': { lat: 15.0, lon: 115.0 }, 'taiwan strait': { lat: 24.5, lon: 119.5 },
  'djibouti': { lat: 11.55, lon: 43.15 }, 'eritrea': { lat: 15.34, lon: 38.93 },
  // Epstein-linked locations
  'epstein': { lat: 18.30, lon: -64.83 }, 'little st james': { lat: 18.30, lon: -64.83 },
  'epstein island': { lat: 18.30, lon: -64.83 }, 'ghislaine': { lat: 40.76, lon: -73.98 },
  'maxwell': { lat: 40.76, lon: -73.98 }, 'lolita express': { lat: 18.30, lon: -64.83 },
  'palm beach': { lat: 26.71, lon: -80.04 }, 'virgin islands': { lat: 18.34, lon: -64.93 },
};

function extractLocation(title: string): { country: string; lat: number; lon: number } | null {
  const lower = title.toLowerCase();
  // Sort by length descending so "south korea" matches before "korea"
  const sorted = Object.keys(COUNTRY_MAP).sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    if (lower.includes(key)) {
      return { country: key, ...COUNTRY_MAP[key] };
    }
  }
  return null;
}

// ── Query topics for parallel fetching ──
const QUERY_TOPICS = [
  { category: 'conflict', query: 'war OR conflict OR invasion OR casualties OR airstrike' },
  { category: 'military', query: 'military deployment OR armed forces OR troops OR defense' },
  { category: 'protest', query: 'protest OR demonstration OR riot OR civil unrest' },
  { category: 'cyber', query: 'cyber attack OR ransomware OR data breach OR hacking' },
  { category: 'nuclear', query: 'nuclear OR missile OR weapons program' },
  { category: 'terrorism', query: 'terrorist OR terrorism OR extremist' },
  { category: 'maritime', query: 'naval OR maritime OR strait OR shipping blockade' },
  { category: 'diplomacy', query: 'sanctions OR diplomacy OR treaty OR embargo' },
  { category: 'energy', query: 'oil crisis OR gas pipeline OR energy crisis' },
  { category: 'disaster', query: 'earthquake OR hurricane OR flood OR wildfire' },
  { category: 'economic', query: 'economic crisis OR inflation OR recession' },
  { category: 'intelligence', query: 'intelligence OR espionage OR surveillance' },
  { category: 'epstein', query: 'Epstein OR "Jeffrey Epstein" OR "Epstein files" OR "Epstein island" OR "Epstein list" OR "Ghislaine Maxwell"' },
];

interface GdeltArticle {
  url: string;
  url_mobile: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

async function fetchGdeltTopic(topic: typeof QUERY_TOPICS[0], maxRecords = 25): Promise<GdeltArticle[]> {
  const params = new URLSearchParams({
    query: `${topic.query} sourcelang:english`,
    mode: 'artlist',
    maxrecords: String(maxRecords),
    format: 'json',
    sort: 'DateDesc',
    timespan: '48h',
  });
  
  const url = `${GDELT_BASE}?${params}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[GDELT] Topic "${topic.category}" HTTP ${res.status}`);
      return [];
    }
    const text = await res.text();
    if (!text || text.trim().length === 0) {
      console.warn(`[GDELT] Topic "${topic.category}" returned empty body`);
      return [];
    }
    try {
      const data = JSON.parse(text);
      const articles = data.articles || [];
      if (articles.length > 0) {
        console.log(`[GDELT] Topic "${topic.category}": ${articles.length} articles`);
      }
      return articles;
    } catch (parseErr) {
      console.warn(`[GDELT] Topic "${topic.category}" JSON parse failed:`, parseErr);
      return [];
    }
  } catch (err) {
    console.warn(`[GDELT] Topic "${topic.category}" fetch error:`, err);
    return [];
  }
}

// ── Fallback: Fetch from GNews (free, no key needed for limited use) ──
async function fetchGNewsArticles(maxRecords: number): Promise<GdeltArticle[]> {
  const queries = ['war conflict military', 'protest crisis terrorism', 'cyber attack nuclear'];
  const results: GdeltArticle[] = [];

  for (const q of queries) {
    try {
      const params = new URLSearchParams({
        q,
        lang: 'en',
        max: String(Math.min(maxRecords, 10)),
      });
      const res = await fetch(`https://gnews.io/api/v4/search?${params}&apikey=free`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const a of data.articles || []) {
        const domain = new URL(a.url).hostname;
        results.push({
          url: a.url,
          url_mobile: a.url,
          title: a.title || '',
          seendate: (a.publishedAt || '').replace(/[-T:Z]/g, '').substring(0, 14),
          socialimage: a.image || '',
          domain,
          language: 'English',
          sourcecountry: '',
        });
      }
    } catch { /* skip */ }
  }
  return results;
}

// ── Fallback: Use MediaStack (free tier, no key needed for basic) ──
async function fetchMediaStackArticles(maxRecords: number): Promise<GdeltArticle[]> {
  // Use NewsAPI.org's "everything" endpoint (free tier available)
  // Actually use a public RSS-to-JSON approach as ultimate fallback
  const rssFeeds = [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    'https://www.aljazeera.com/xml/rss/all.xml',
    'https://feeds.reuters.com/reuters/worldNews',
  ];

  const results: GdeltArticle[] = [];
  await Promise.allSettled(rssFeeds.map(async (feedUrl) => {
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.status !== 'ok') return;
      for (const item of (data.items || []).slice(0, 10)) {
        const domain = data.feed?.link ? new URL(data.feed.link).hostname : 'unknown';
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        const seendate = pubDate.toISOString().replace(/[-T:Z.]/g, '').substring(0, 14);
        results.push({
          url: item.link || '',
          url_mobile: item.link || '',
          title: item.title || '',
          seendate,
          socialimage: item.thumbnail || item.enclosure?.link || '',
          domain,
          language: 'English',
          sourcecountry: '',
        });
      }
    } catch { /* skip */ }
  }));
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'all';
    const maxRecords = body.maxRecords || 75;
    
    let rawArticles: GdeltArticle[] = [];

    // Try GDELT first with a simple query
    try {
      console.log('[GDELT] Trying GDELT API...');
      const params = new URLSearchParams({
        query: '(conflict OR military OR attack OR protest OR crisis OR Epstein) sourcelang:english',
        mode: 'artlist',
        maxrecords: String(Math.min(maxRecords, 250)),
        format: 'json',
        sort: 'DateDesc',
        timespan: '48h',
      });
      const res = await fetch(`${GDELT_BASE}?${params}`, {
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 10 && text[0] === '{') {
          const data = JSON.parse(text);
          rawArticles = data.articles || [];
          console.log(`[GDELT] Got ${rawArticles.length} articles`);
        } else {
          console.warn('[GDELT] Non-JSON response, falling back');
        }
      } else {
        console.warn(`[GDELT] HTTP ${res.status}, falling back`);
      }
    } catch (err) {
      console.warn('[GDELT] Failed, trying fallback:', String(err).substring(0, 100));
    }

    // Fallback to RSS aggregation if GDELT fails
    if (rawArticles.length === 0) {
      console.log('[GDELT] Using RSS fallback...');
      rawArticles = await fetchMediaStackArticles(maxRecords);
      console.log(`[GDELT] RSS fallback got ${rawArticles.length} articles`);
    }

    const seenUrls = new Set<string>();
    const allArticles: any[] = [];
    const geoEvents: any[] = [];

    for (const article of rawArticles) {
      if (seenUrls.has(article.url)) continue;
      seenUrls.add(article.url);

      const severity = classifySeverity(article.title);
      const category = classifyCategory(article.title);
      const tier = getSourceTier(article.domain);
      const stateMedia = isStateMedia(article.domain);
      const location = extractLocation(article.title);

      const processed = {
        id: btoa(article.url).substring(0, 24),
        title: article.title,
        url: article.url,
        source: article.domain.replace(/^www\./, ''),
        sourceCountry: article.sourcecountry,
        image: article.socialimage,
        time: article.seendate,
        severity,
        category,
        tier,
        isStateMedia: stateMedia,
        country: location?.country || null,
        lat: location?.lat || null,
        lon: location?.lon || null,
      };

      allArticles.push(processed);

      if (location && (mode === 'all' || mode === 'events')) {
        geoEvents.push({
          id: processed.id,
          title: article.title,
          lat: location.lat,
          lon: location.lon,
          country: location.country,
          severity,
          category,
          source: processed.source,
          time: article.seendate,
          type: category === 'protest' ? 'protest' : 
                category === 'military' ? 'military' :
                category === 'nuclear' ? 'nuclear' :
                category === 'cyber' ? 'cyber' : 'conflict',
        });
      }
    }

    // Sort articles by time (newest first)
    allArticles.sort((a, b) => (b.time || '').localeCompare(a.time || ''));

    // Deduplicate geo events by proximity (within 0.5°)
    const dedupedEvents: any[] = [];
    for (const evt of geoEvents) {
      const tooClose = dedupedEvents.some(
        e => Math.abs(e.lat - evt.lat) < 0.5 && Math.abs(e.lon - evt.lon) < 0.5 && e.category === evt.category
      );
      if (!tooClose) dedupedEvents.push(evt);
    }

    return new Response(JSON.stringify({
      success: true,
      articles: allArticles.slice(0, 200),
      events: dedupedEvents,
      topicCount: 1,
      totalRaw: seenUrls.size,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('GDELT proxy error:', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
