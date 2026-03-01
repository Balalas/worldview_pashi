import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Cyprus-specific search queries for comprehensive coverage
const CYPRUS_QUERIES = [
  "Cyprus news today",
  "Cyprus politics government",
  "Cyprus Turkey tensions",
  "Northern Cyprus TRNC",
  "Cyprus EEZ gas drilling",
  "Cyprus military UN buffer zone",
  "Limassol Nicosia Larnaca news",
  "Cyprus economy banking",
];

// Cyprus X/Twitter accounts & journalists
const CYPRUS_X_ACCOUNTS = [
  "CyprusMail",
  "InCyprus_news",
  "KathimeriniCy",
  "PhilenewsCom",
  "SigmaLiveNews",
];

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
    const mode = body.mode || "full"; // "full" | "quick"

    const allArticles: any[] = [];
    const errors: string[] = [];

    // 1. Firecrawl web search for Cyprus news (multiple queries)
    const queries = mode === "quick" ? CYPRUS_QUERIES.slice(0, 3) : CYPRUS_QUERIES;

    const searchResults = await Promise.allSettled(
      queries.map(async (query) => {
        try {
          const response = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              limit: 5,
              tbs: "qdr:d", // last 24 hours
            }),
          });

          if (!response.ok) {
            console.warn(`Search failed for "${query}": ${response.status}`);
            return [];
          }

          const data = await response.json();
          return (data.data || []).map((r: any) => ({
            title: r.title || "",
            description: r.description || "",
            url: r.url || "",
            source: extractDomain(r.url),
            query,
            type: "search" as const,
          }));
        } catch (e) {
          console.warn(`Search error for "${query}":`, e);
          return [];
        }
      })
    );

    for (const result of searchResults) {
      if (result.status === "fulfilled" && result.value.length > 0) {
        allArticles.push(...result.value);
      }
    }

    // 2. Search X/Twitter for Cyprus accounts
    const xResults = await Promise.allSettled(
      CYPRUS_X_ACCOUNTS.map(async (account) => {
        try {
          const response = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `site:x.com ${account} Cyprus`,
              limit: 3,
              tbs: "qdr:d",
            }),
          });

          if (!response.ok) return [];
          const data = await response.json();
          return (data.data || []).map((r: any) => ({
            title: r.title || r.description || "",
            description: r.description || "",
            url: r.url || "",
            source: `@${account}`,
            query: "x-account",
            type: "x-post" as const,
          }));
        } catch {
          return [];
        }
      })
    );

    for (const result of xResults) {
      if (result.status === "fulfilled" && result.value.length > 0) {
        allArticles.push(...result.value);
      }
    }

    // 3. Scrape key Cyprus news sites directly
    const cyprusSites = [
      "https://cyprus-mail.com/category/news/",
      "https://in-cyprus.philenews.com/news/",
    ];

    if (mode === "full") {
      const scrapeResults = await Promise.allSettled(
        cyprusSites.map(async (siteUrl) => {
          try {
            const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: siteUrl,
                formats: ["links", "markdown"],
                onlyMainContent: true,
                waitFor: 2000,
              }),
            });

            if (!response.ok) return [];
            const data = await response.json();
            const markdown = data.data?.markdown || data.markdown || "";
            const links = data.data?.links || data.links || [];

            // Extract headlines from markdown
            const headlines = extractHeadlines(markdown);
            return headlines.map((h: string) => ({
              title: h,
              description: "",
              url: siteUrl,
              source: extractDomain(siteUrl),
              query: "scrape",
              type: "scrape" as const,
            }));
          } catch {
            return [];
          }
        })
      );

      for (const result of scrapeResults) {
        if (result.status === "fulfilled" && result.value.length > 0) {
          allArticles.push(...result.value);
        }
      }
    }

    // Deduplicate by title similarity
    const seen = new Set<string>();
    const unique = allArticles.filter((a) => {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 50);
      if (seen.has(key) || key.length < 10) return false;
      seen.add(key);
      return true;
    });

    // Categorize
    const categorized = unique.map((a) => ({
      ...a,
      category: categorizeCyprus(a.title + " " + a.description),
    }));

    // Sort: critical first
    const priorityOrder = { security: 0, politics: 1, economy: 2, energy: 3, society: 4, general: 5 };
    categorized.sort(
      (a, b) =>
        (priorityOrder[a.category as keyof typeof priorityOrder] ?? 5) -
        (priorityOrder[b.category as keyof typeof priorityOrder] ?? 5)
    );

    const headlines = categorized
      .map((a) => `[${a.category.toUpperCase()}] ${a.title}`)
      .slice(0, 50);

    return new Response(
      JSON.stringify({
        success: true,
        articles: categorized.slice(0, 60),
        headlines,
        totalFound: allArticles.length,
        uniqueCount: categorized.length,
        errors: errors.length > 0 ? errors : undefined,
        scrapedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Cyprus news scraper error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}

function extractHeadlines(markdown: string): string[] {
  const lines = markdown.split("\n");
  const headlines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Headlines often start with # or are bold **text** or are short standalone lines
    if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
      headlines.push(trimmed.replace(/^#+\s*/, ""));
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      headlines.push(trimmed.replace(/\*\*/g, ""));
    } else if (trimmed.length > 20 && trimmed.length < 150 && !trimmed.includes("http")) {
      // Likely a headline
      if (/^[A-Z]/.test(trimmed) && !trimmed.includes("|")) {
        headlines.push(trimmed);
      }
    }
  }
  return headlines.slice(0, 20);
}

function categorizeCyprus(text: string): string {
  const t = text.toLowerCase();
  if (/\b(turkey|tension|military|buffer zone|occupied|trnc|invasion|threat|nato|base|akrotiri|dhekelia|un peacekeep)\b/.test(t))
    return "security";
  if (/\b(president|parliament|government|minister|election|vote|law|legislation|eu|european)\b/.test(t))
    return "politics";
  if (/\b(economy|bank|gdp|investment|trade|tax|tourism|crypto|fintech|property)\b/.test(t))
    return "economy";
  if (/\b(gas|eez|drilling|energy|pipeline|hydrocarbons|lng|aphrodite|calypso)\b/.test(t))
    return "energy";
  if (/\b(society|culture|education|health|protest|strike|crime|court)\b/.test(t))
    return "society";
  return "general";
}
