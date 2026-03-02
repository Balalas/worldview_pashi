import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OSINT_ACCOUNTS = ["conflict_radar", "sentdefender", "Polymarket", "Osinttechnical", "osintwarfare"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const accounts = body.accounts || OSINT_ACCOUNTS;

    // Scrape each X account profile page for latest posts
    const scrapeResults = await Promise.allSettled(
      accounts.map(async (account: string) => {
        const url = `https://x.com/${account}`;
        
        const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            formats: ["markdown"],
            onlyMainContent: true,
            waitFor: 3000, // Wait for dynamic content to load
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Firecrawl error for @${account}:`, response.status, errText);
          return { account, posts: [], error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        const markdown = data.data?.markdown || data.markdown || "";

        // Extract individual posts/tweets from the markdown
        const posts = extractPosts(markdown, account);
        return { account, posts };
      })
    );

    const allPosts: any[] = [];
    const errors: string[] = [];

    for (const result of scrapeResults) {
      if (result.status === "fulfilled") {
        const val = result.value;
        if (val.error) {
          errors.push(`@${val.account}: ${val.error}`);
        }
        if (val.posts?.length > 0) {
          allPosts.push(...val.posts);
        }
      } else {
        errors.push(result.reason?.message || "Unknown scrape error");
      }
    }

    // Also do a Firecrawl web search for latest conflict OSINT
    let searchPosts: any[] = [];
    try {
      const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "site:x.com (osintwarfare OR conflict_radar OR sentdefender) war conflict missile strike",
          limit: 10,
          tbs: "qdr:d", // Last 24 hours
        }),
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const results = searchData.data || [];
        searchPosts = results.map((r: any) => ({
          account: extractAccountFromUrl(r.url),
          text: r.description || r.title || "",
          url: r.url,
          source: "search",
        })).filter((p: any) => p.text.length > 10);
      }
    } catch (e) {
      console.warn("OSINT search error:", e);
    }

    const combined = [...allPosts, ...searchPosts];

    // Extract just the text content for AI analysis
    const osintHeadlines = combined
      .map(p => `[@${p.account}] ${p.text}`)
      .filter(h => h.length > 15)
      .slice(0, 50);

    return new Response(JSON.stringify({
      success: true,
      posts: combined.slice(0, 50),
      headlines: osintHeadlines,
      accounts: accounts,
      errors: errors.length > 0 ? errors : undefined,
      scrapedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("OSINT scraper error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractPosts(markdown: string, account: string): any[] {
  const posts: any[] = [];
  
  // Split by common tweet separators in scraped markdown
  const chunks = markdown.split(/\n---\n|\n\n(?=[A-Z@#])/g);
  
  for (const chunk of chunks) {
    const text = chunk.trim();
    if (text.length < 20) continue;
    if (text.length > 500) continue; // Skip long non-tweet content
    
    // Filter for conflict/military relevant content
    const isRelevant = /\b(war|strike|missile|drone|attack|killed|troops|military|artillery|frontline|conflict|bomb|shell|intercept|escalat|cease|tank|airforce|navy|weapon|casualt|combat|offensive|retreat|advance|checkpoint|siege|blockade|patrol|deploy|radar|surveillance|intel|osint)\b/i.test(text);
    
    if (isRelevant) {
      posts.push({
        account,
        text: text.substring(0, 280),
        source: "scrape",
      });
    }
  }
  
  return posts.slice(0, 15); // Max 15 posts per account
}

function extractAccountFromUrl(url: string): string {
  try {
    const match = url.match(/x\.com\/([^\/\?]+)/);
    return match ? match[1] : "unknown";
  } catch {
    return "unknown";
  }
}
