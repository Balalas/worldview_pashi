import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TWITTER_API = "https://api.x.com/2";

// Split into batches to stay under Twitter's 512 char query limit
const ACCOUNT_BATCHES = [
  ["conflict_radar", "sentdefender", "Polymarket", "Osinttechnical", "osintwarfare"],
];

// Extract location from tweet text
function extractGeoFromText(text: string): { lat: number; lon: number; place: string } | null {
  const coordMatch = text.match(/(-?\d{1,3}\.\d{2,6})[,\s]+(-?\d{1,3}\.\d{2,6})/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon, place: `${lat.toFixed(2)}, ${lon.toFixed(2)}` };
    }
  }

  const locationMap: Record<string, { lat: number; lon: number }> = {
    "kyiv": { lat: 50.4501, lon: 30.5234 }, "kiev": { lat: 50.4501, lon: 30.5234 },
    "kharkiv": { lat: 49.9935, lon: 36.2304 }, "odesa": { lat: 46.4825, lon: 30.7233 },
    "odessa": { lat: 46.4825, lon: 30.7233 }, "moscow": { lat: 55.7558, lon: 37.6173 },
    "crimea": { lat: 44.9521, lon: 34.1024 }, "donetsk": { lat: 48.0159, lon: 37.8029 },
    "zaporizhzhia": { lat: 47.8388, lon: 35.1396 }, "kherson": { lat: 46.6354, lon: 32.6169 },
    "belgorod": { lat: 50.5997, lon: 36.5882 }, "gaza": { lat: 31.3547, lon: 34.3088 },
    "tel aviv": { lat: 32.0853, lon: 34.7818 }, "jerusalem": { lat: 31.7683, lon: 35.2137 },
    "beirut": { lat: 33.8938, lon: 35.5018 }, "damascus": { lat: 33.5138, lon: 36.2765 },
    "aleppo": { lat: 36.2021, lon: 37.1343 }, "tehran": { lat: 35.6892, lon: 51.3890 },
    "baghdad": { lat: 33.3152, lon: 44.3661 }, "kabul": { lat: 34.5553, lon: 69.2075 },
    "taiwan": { lat: 23.6978, lon: 120.9605 }, "taipei": { lat: 25.0330, lon: 121.5654 },
    "south china sea": { lat: 12.0, lon: 114.0 }, "black sea": { lat: 43.0, lon: 35.0 },
    "red sea": { lat: 20.0, lon: 38.5 }, "strait of hormuz": { lat: 26.5, lon: 56.2 },
    "pyongyang": { lat: 39.0392, lon: 125.7625 }, "seoul": { lat: 37.5665, lon: 126.9780 },
    "pentagon": { lat: 38.8719, lon: -77.0563 }, "washington": { lat: 38.9072, lon: -77.0369 },
    "rafah": { lat: 31.2969, lon: 34.2478 }, "sudan": { lat: 15.5007, lon: 32.5599 },
    "khartoum": { lat: 15.5007, lon: 32.5599 }, "libya": { lat: 26.3351, lon: 17.2283 },
    "yemen": { lat: 15.5527, lon: 48.5164 }, "houthi": { lat: 15.3694, lon: 44.1910 },
    "iran": { lat: 32.4279, lon: 53.6880 }, "mariupol": { lat: 47.0958, lon: 37.5488 },
    "bakhmut": { lat: 48.5953, lon: 38.0008 }, "kursk": { lat: 51.7373, lon: 36.1874 },
    "sevastopol": { lat: 44.6166, lon: 33.5254 }, "dnipro": { lat: 48.4647, lon: 35.0462 },
    "lviv": { lat: 49.8397, lon: 24.0297 }, "istanbul": { lat: 41.0082, lon: 28.9784 },
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
    const bearerToken = Deno.env.get("TWITTER_BEARER_TOKEN");
    if (!bearerToken) {
      return new Response(JSON.stringify({ error: "TWITTER_BEARER_TOKEN not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const batches = body.accounts ? [body.accounts] : ACCOUNT_BATCHES;

    let allTweets: any[] = [];
    let allUsers: any[] = [];
    let allPlaces: any[] = [];
    const allAccounts: string[] = batches.flat();

    // Fetch each batch (stays under 512 char limit)
    for (const batch of batches) {
      const fromQuery = batch.map((a: string) => `from:${a}`).join(" OR ");
      if (fromQuery.length > 512) {
        console.warn(`Query too long (${fromQuery.length}), skipping batch`);
        continue;
      }

      const queryParams = new URLSearchParams({
        query: fromQuery,
        max_results: "30",
        "tweet.fields": "created_at,geo,entities,author_id,public_metrics",
        "user.fields": "username,name",
        expansions: "author_id,geo.place_id",
        "place.fields": "full_name,geo,country",
      });

      const fullUrl = `${TWITTER_API}/tweets/search/recent?${queryParams.toString()}`;

      const twitterRes = await fetch(fullUrl, {
        headers: { "Authorization": `Bearer ${bearerToken}` },
      });

      if (!twitterRes.ok) {
        const errText = await twitterRes.text();
        console.error("Twitter API error:", twitterRes.status, errText);
        if (twitterRes.status === 402 || twitterRes.status === 429) {
          // Rate limited — return what we have so far
          break;
        }
        if (twitterRes.status === 400) {
          console.error("Bad request for batch, skipping:", batch.join(","));
          continue;
        }
        return new Response(JSON.stringify({ error: `Twitter API ${twitterRes.status}`, details: errText }), {
          status: twitterRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await twitterRes.json();
      if (data.data) allTweets.push(...data.data);
      if (data.includes?.users) allUsers.push(...data.includes.users);
      if (data.includes?.places) allPlaces.push(...data.includes.places);
    }

    const tweets = allTweets;
    const users = allUsers;
    const places = allPlaces;

    const userMap = new Map<string, string>();
    users.forEach((u: any) => userMap.set(u.id, u.username));

    const placeMap = new Map<string, { lat: number; lon: number; name: string }>();
    places.forEach((p: any) => {
      if (p.geo?.bbox) {
        const [w, s, e, n] = p.geo.bbox;
        placeMap.set(p.id, { lat: (n + s) / 2, lon: (e + w) / 2, name: p.full_name });
      }
    });

    const posts = tweets.map((tweet: any) => {
      const username = userMap.get(tweet.author_id) || "unknown";
      let geo: { lat: number; lon: number; place: string } | null = null;

      if (tweet.geo?.place_id) {
        const p = placeMap.get(tweet.geo.place_id);
        if (p) geo = { lat: p.lat, lon: p.lon, place: p.name };
      }
      if (tweet.geo?.coordinates?.coordinates) {
        const [lon, lat] = tweet.geo.coordinates.coordinates;
        geo = { lat, lon, place: "exact" };
      }
      if (!geo) geo = extractGeoFromText(tweet.text);

      return {
        id: tweet.id,
        account: username,
        text: tweet.text,
        createdAt: tweet.created_at,
        url: `https://x.com/${username}/status/${tweet.id}`,
        geo,
        metrics: tweet.public_metrics || {},
        source: "twitter_api",
      };
    });

    const geolocated = posts.filter((p: any) => p.geo !== null);

    return new Response(JSON.stringify({
      success: true,
      posts,
      geolocated,
      nonGeoCount: posts.length - geolocated.length,
      total: posts.length,
      accounts: allAccounts,
      fetchedAt: new Date().toISOString(),
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
