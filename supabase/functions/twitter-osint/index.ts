import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TWITTER_API = "https://api.x.com/2";

// Default OSINT accounts to monitor
const DEFAULT_ACCOUNTS = [
  "osaborneINT", "sentdefender", "IntelCrab", "OSINTdefender",
  "Faytuks", "RALee85", "Osinttechnical", "WarMonitor3",
  "AuroraIntel", "Liveuamap",
];

// Build OAuth 1.0a header for Twitter API v2
function buildOAuth(method: string, url: string, params: Record<string, string>): string {
  const consumerKey = Deno.env.get("TWITTER_CONSUMER_KEY")!;
  const consumerSecret = Deno.env.get("TWITTER_CONSUMER_SECRET")!;
  const accessToken = Deno.env.get("TWITTER_ACCESS_TOKEN")!;
  const accessTokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")!;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // Combine oauth params with query params for signature base (NOT body params)
  const allParams = { ...oauthParams, ...params };
  const paramStr = Object.keys(allParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join("&");

  const baseStr = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramStr)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessTokenSecret)}`;

  const hmac = createHmac("sha1", signingKey);
  hmac.update(baseStr);
  const signature = hmac.digest("base64");

  oauthParams["oauth_signature"] = signature;

  const authHeader = "OAuth " + Object.keys(oauthParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(", ");

  return authHeader;
}

// Try to extract location from tweet text using common patterns
function extractGeoFromText(text: string): { lat: number; lon: number; place: string } | null {
  // Check for coordinate patterns like "40.7128, -74.0060"
  const coordMatch = text.match(/(-?\d{1,3}\.\d{2,6})[,\s]+(-?\d{1,3}\.\d{2,6})/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon, place: `${lat.toFixed(2)}, ${lon.toFixed(2)}` };
    }
  }

  // Location keyword mapping for common OSINT locations
  const locationMap: Record<string, { lat: number; lon: number }> = {
    "kyiv": { lat: 50.4501, lon: 30.5234 },
    "kiev": { lat: 50.4501, lon: 30.5234 },
    "kharkiv": { lat: 49.9935, lon: 36.2304 },
    "odesa": { lat: 46.4825, lon: 30.7233 },
    "odessa": { lat: 46.4825, lon: 30.7233 },
    "moscow": { lat: 55.7558, lon: 37.6173 },
    "crimea": { lat: 44.9521, lon: 34.1024 },
    "donetsk": { lat: 48.0159, lon: 37.8029 },
    "zaporizhzhia": { lat: 47.8388, lon: 35.1396 },
    "kherson": { lat: 46.6354, lon: 32.6169 },
    "belgorod": { lat: 50.5997, lon: 36.5882 },
    "gaza": { lat: 31.3547, lon: 34.3088 },
    "tel aviv": { lat: 32.0853, lon: 34.7818 },
    "jerusalem": { lat: 31.7683, lon: 35.2137 },
    "beirut": { lat: 33.8938, lon: 35.5018 },
    "damascus": { lat: 33.5138, lon: 36.2765 },
    "aleppo": { lat: 36.2021, lon: 37.1343 },
    "tehran": { lat: 35.6892, lon: 51.3890 },
    "baghdad": { lat: 33.3152, lon: 44.3661 },
    "kabul": { lat: 34.5553, lon: 69.2075 },
    "taiwan": { lat: 23.6978, lon: 120.9605 },
    "taipei": { lat: 25.0330, lon: 121.5654 },
    "south china sea": { lat: 12.0, lon: 114.0 },
    "black sea": { lat: 43.0, lon: 35.0 },
    "red sea": { lat: 20.0, lon: 38.5 },
    "suez": { lat: 30.0, lon: 32.5 },
    "strait of hormuz": { lat: 26.5, lon: 56.2 },
    "pyongyang": { lat: 39.0392, lon: 125.7625 },
    "seoul": { lat: 37.5665, lon: 126.9780 },
    "pentagon": { lat: 38.8719, lon: -77.0563 },
    "washington": { lat: 38.9072, lon: -77.0369 },
    "nato": { lat: 50.8770, lon: 4.3227 },
    "rafah": { lat: 31.2969, lon: 34.2478 },
    "sudan": { lat: 15.5007, lon: 32.5599 },
    "khartoum": { lat: 15.5007, lon: 32.5599 },
    "libya": { lat: 26.3351, lon: 17.2283 },
    "tripoli": { lat: 32.8872, lon: 13.1913 },
    "yemen": { lat: 15.5527, lon: 48.5164 },
    "houthi": { lat: 15.3694, lon: 44.1910 },
    "iran": { lat: 32.4279, lon: 53.6880 },
    "isfahan": { lat: 32.6546, lon: 51.6680 },
    "mariupol": { lat: 47.0958, lon: 37.5488 },
    "bakhmut": { lat: 48.5953, lon: 38.0008 },
    "luhansk": { lat: 48.5740, lon: 39.3078 },
    "kursk": { lat: 51.7373, lon: 36.1874 },
    "rostov": { lat: 47.2357, lon: 39.7015 },
    "sevastopol": { lat: 44.6166, lon: 33.5254 },
    "dnipro": { lat: 48.4647, lon: 35.0462 },
    "lviv": { lat: 49.8397, lon: 24.0297 },
    "minsk": { lat: 53.9006, lon: 27.5590 },
    "ankara": { lat: 39.9334, lon: 32.8597 },
    "istanbul": { lat: 41.0082, lon: 28.9784 },
    "riyadh": { lat: 24.7136, lon: 46.6753 },
    "jeddah": { lat: 21.4858, lon: 39.1925 },
  };

  const lower = text.toLowerCase();
  for (const [keyword, coords] of Object.entries(locationMap)) {
    if (lower.includes(keyword)) {
      return { lat: coords.lat, lon: coords.lon, place: keyword };
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const consumerKey = Deno.env.get("TWITTER_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("TWITTER_CONSUMER_SECRET");
    const accessToken = Deno.env.get("TWITTER_ACCESS_TOKEN");
    const accessTokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET");

    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      return new Response(JSON.stringify({ error: "Twitter API keys not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const accounts = body.accounts || DEFAULT_ACCOUNTS;
    const query = body.query || null;

    // Build search query: posts from monitored accounts
    const fromQuery = accounts.map((a: string) => `from:${a}`).join(" OR ");
    const searchQuery = query || fromQuery;

    // Twitter API v2 recent search
    const searchUrl = `${TWITTER_API}/tweets/search/recent`;
    const queryParams: Record<string, string> = {
      query: searchQuery,
      max_results: "50",
      "tweet.fields": "created_at,geo,entities,author_id,public_metrics",
      "user.fields": "username,name",
      expansions: "author_id,geo.place_id",
      "place.fields": "full_name,geo,country",
    };

    const paramString = Object.entries(queryParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    const fullUrl = `${searchUrl}?${paramString}`;

    const authHeader = buildOAuth("GET", searchUrl, queryParams);

    const twitterRes = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    if (!twitterRes.ok) {
      const errText = await twitterRes.text();
      console.error("Twitter API error:", twitterRes.status, errText);
      return new Response(JSON.stringify({
        error: `Twitter API ${twitterRes.status}`,
        details: errText,
      }), {
        status: twitterRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const twitterData = await twitterRes.json();
    const tweets = twitterData.data || [];
    const users = twitterData.includes?.users || [];
    const places = twitterData.includes?.places || [];

    // Map author_id to username
    const userMap = new Map<string, string>();
    users.forEach((u: any) => userMap.set(u.id, u.username));

    // Map place_id to coordinates
    const placeMap = new Map<string, { lat: number; lon: number; name: string }>();
    places.forEach((p: any) => {
      if (p.geo?.bbox) {
        const [w, s, e, n] = p.geo.bbox;
        placeMap.set(p.id, { lat: (n + s) / 2, lon: (e + w) / 2, name: p.full_name });
      }
    });

    // Process tweets into geo-enriched posts
    const posts = tweets.map((tweet: any) => {
      const username = userMap.get(tweet.author_id) || "unknown";
      let geo: { lat: number; lon: number; place: string } | null = null;

      // 1. Check Twitter's native geo data
      if (tweet.geo?.place_id) {
        const p = placeMap.get(tweet.geo.place_id);
        if (p) geo = { lat: p.lat, lon: p.lon, place: p.name };
      }
      if (tweet.geo?.coordinates?.coordinates) {
        const [lon, lat] = tweet.geo.coordinates.coordinates;
        geo = { lat, lon, place: "exact" };
      }

      // 2. Extract location from text content
      if (!geo) {
        geo = extractGeoFromText(tweet.text);
      }

      return {
        id: tweet.id,
        account: username,
        text: tweet.text,
        createdAt: tweet.created_at,
        url: `https://x.com/${username}/status/${tweet.id}`,
        geo,
        metrics: tweet.public_metrics || {},
        source: "twitter_api" as const,
      };
    });

    // Split into geolocated and non-geolocated
    const geolocated = posts.filter((p: any) => p.geo !== null);
    const nonGeo = posts.filter((p: any) => p.geo === null);

    return new Response(JSON.stringify({
      success: true,
      posts,
      geolocated,
      nonGeoCount: nonGeo.length,
      total: posts.length,
      accounts,
      fetchedAt: new Date().toISOString(),
      meta: twitterData.meta || {},
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Twitter OSINT error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
