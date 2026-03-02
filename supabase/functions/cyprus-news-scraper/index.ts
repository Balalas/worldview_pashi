import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Greek Cypriot news sources to prioritize
const GREEK_CYPRIOT_DOMAINS = [
  "cyprus-mail.com",
  "in-cyprus.philenews.com",
  "philenews.com",
  "kathimerini.com.cy",
  "sigmalive.com",
  "stockwatch.com.cy",
  "financialmirror.com",
  "reporter.com.cy",
  "politis.com.cy",
  "dialogos.com.cy",
  "cna.org.cy",
  "pio.gov.cy",
  "knews.kathimerini.com.cy",
  "brief.com.cy",
  "alphanews.live",
  "offsite.com.cy",
  "ant1.com.cy",
  "omegalive.com.cy",
];

// Block Turkish state/propaganda sources
const BLOCKED_DOMAINS = [
  "aa.com.tr", "trtworld.com", "dailysabah.com", "yenisafak.com",
  "hurriyetdailynews.com", "trthaber.com", "kibrispostasi.com",
  "gundemkibris.com", "havadiskibris.com", "brtk.net",
];

// Perplexity AI search queries for comprehensive Cyprus coverage
const PERPLEXITY_QUERIES = [
  "Latest news Cyprus Republic today politics economy security",
  "Cyprus EEZ energy gas drilling hydrocarbons Aphrodite latest",
  "Cyprus military developments UK bases Akrotiri Dhekelia",
  "Nicosia Limassol Larnaca Paphos Famagusta news today",
  "Cyprus EU European Union developments latest",
];

// Firecrawl search queries
const FIRECRAWL_QUERIES = [
  "site:cyprus-mail.com latest news",
  "site:philenews.com Cyprus news English",
  "site:sigmalive.com Cyprus news",
  "site:stockwatch.com.cy Cyprus",
  "site:financialmirror.com Cyprus",
  "Cyprus Republic news today -TRNC -\"Northern Cyprus government\"",
  "Cyprus economy banking tourism 2026",
  "Cyprus security military Akrotiri",
];

// Cyprus X/Twitter accounts (Greek Cypriot)
const CYPRUS_X_ACCOUNTS = [
  "CyprusMail",
  "InCyprus_news",
  "KathimeriniCy",
  "PhilenewsCom",
  "SigmaLiveNews",
  "StockwatchCY",
  "CnaEngService",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    
    if (!FIRECRAWL_API_KEY && !PERPLEXITY_API_KEY) {
      return new Response(JSON.stringify({ error: "No scraping API configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "full"; // "full" | "quick"

    const allArticles: any[] = [];
    const errors: string[] = [];

    // ═══════════════════════════════════════════
    // 1. PERPLEXITY AI SEARCH — primary source
    // ═══════════════════════════════════════════
    if (PERPLEXITY_API_KEY) {
      const queries = mode === "quick" ? PERPLEXITY_QUERIES.slice(0, 2) : PERPLEXITY_QUERIES;

      const pplxResults = await Promise.allSettled(
        queries.map(async (query) => {
          try {
            const response = await fetch("https://api.perplexity.ai/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "sonar",
                messages: [
                  {
                    role: "system",
                    content: `You are a Cyprus news aggregator. Extract the latest news headlines about the Republic of Cyprus. 
ONLY include news from Greek Cypriot and international sources. NEVER include Turkish state media (Anadolu Agency, TRT, Daily Sabah) or TRNC government statements.
Respond ONLY in valid JSON array format:
[{"title":"headline text","description":"1 sentence summary","source":"source name","url":"source url if known"}]
Return 5-8 headlines. Focus on: politics, economy, security, energy/EEZ, EU affairs, society.`,
                  },
                  { role: "user", content: query },
                ],
                search_recency_filter: "day",
                search_domain_filter: [
                  "-aa.com.tr", "-trtworld.com", "-dailysabah.com",
                  "-yenisafak.com", "-hurriyetdailynews.com",
                ],
                temperature: 0.1,
              }),
            });

            if (!response.ok) {
              console.warn(`Perplexity error for "${query}": ${response.status}`);
              return [];
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || "";
            const citations = data.citations || [];

            // Parse JSON response
            try {
              const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/```json\s*([\s\S]*?)```/);
              const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
              const items = JSON.parse(jsonStr.trim());
              return items.map((item: any, idx: number) => ({
                title: item.title || "",
                description: item.description || "",
                url: item.url || citations[idx] || "",
                source: item.source || "Perplexity AI",
                query,
                type: "ai-search" as const,
              }));
            } catch {
              // Fallback: extract lines as headlines
              const lines = content.split("\n").filter((l: string) => l.trim().length > 20);
              return lines.slice(0, 5).map((line: string) => ({
                title: line.replace(/^[-*•\d.]+\s*/, "").replace(/\*\*/g, ""),
                description: "",
                url: citations[0] || "",
                source: "Perplexity AI",
                query,
                type: "ai-search" as const,
              }));
            }
          } catch (e) {
            console.warn(`Perplexity error:`, e);
            return [];
          }
        })
      );

      for (const result of pplxResults) {
        if (result.status === "fulfilled") allArticles.push(...result.value);
      }
    }

    // ═══════════════════════════════════════════
    // 2. FIRECRAWL WEB SEARCH — supplementary
    // ═══════════════════════════════════════════
    if (FIRECRAWL_API_KEY) {
      const fcQueries = mode === "quick" ? FIRECRAWL_QUERIES.slice(0, 3) : FIRECRAWL_QUERIES;

      const searchResults = await Promise.allSettled(
        fcQueries.map(async (query) => {
          try {
            const response = await fetch("https://api.firecrawl.dev/v1/search", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ query, limit: 5, tbs: "qdr:d" }),
            });

            if (!response.ok) return [];
            const data = await response.json();
            return (data.data || []).map((r: any) => ({
              title: r.title || "",
              description: r.description || "",
              url: r.url || "",
              source: extractDomain(r.url),
              query,
              type: "search" as const,
            }));
          } catch {
            return [];
          }
        })
      );

      for (const result of searchResults) {
        if (result.status === "fulfilled") allArticles.push(...result.value);
      }

      // 3. X/Twitter accounts search
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
        if (result.status === "fulfilled") allArticles.push(...result.value);
      }

      // 4. Direct scrape of key Greek Cypriot news sites
      if (mode === "full") {
        const cyprusSites = [
          "https://cyprus-mail.com/category/news/",
          "https://in-cyprus.philenews.com/news/",
          "https://knews.kathimerini.com.cy/en/news",
        ];

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
                  formats: ["markdown"],
                  onlyMainContent: true,
                  waitFor: 2000,
                }),
              });

              if (!response.ok) return [];
              const data = await response.json();
              const markdown = data.data?.markdown || data.markdown || "";
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
          if (result.status === "fulfilled") allArticles.push(...result.value);
        }
      }
    }

    // ═══════════════════════════════════════════
    // FILTER, DEDUPLICATE, CATEGORIZE
    // ═══════════════════════════════════════════

    // Filter out Turkish state media and propaganda
    const filtered = allArticles.filter((a) => {
      const domain = extractDomain(a.url);
      if (BLOCKED_DOMAINS.some((b) => domain.includes(b))) return false;
      const t = (a.title + " " + a.description).toLowerCase();
      if (/\b(trnc president|northern cyprus government|turkish republic of northern)\b/.test(t)) return false;
      return a.title.length > 10;
    });

    // Deduplicate
    const seen = new Set<string>();
    const unique = filtered.filter((a) => {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 50);
      if (seen.has(key) || key.length < 8) return false;
      seen.add(key);
      return true;
    });

    // Categorize & sort
    const categorized = unique.map((a) => ({
      ...a,
      category: categorizeCyprus(a.title + " " + a.description),
    }));

    const priorityOrder = { security: 0, politics: 1, energy: 2, economy: 3, society: 4, general: 5 };
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
        articles: categorized.slice(0, 80),
        headlines,
        totalFound: allArticles.length,
        uniqueCount: categorized.length,
        sources: {
          perplexity: allArticles.filter(a => a.type === "ai-search").length,
          firecrawl: allArticles.filter(a => a.type === "search").length,
          xPosts: allArticles.filter(a => a.type === "x-post").length,
          scraped: allArticles.filter(a => a.type === "scrape").length,
        },
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
  try { return new URL(url).hostname.replace("www.", ""); } catch { return "unknown"; }
}

function extractHeadlines(markdown: string): string[] {
  const lines = markdown.split("\n");
  const headlines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
      headlines.push(trimmed.replace(/^#+\s*/, ""));
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      headlines.push(trimmed.replace(/\*\*/g, ""));
    } else if (trimmed.length > 20 && trimmed.length < 150 && !trimmed.includes("http") && /^[A-Z]/.test(trimmed) && !trimmed.includes("|")) {
      headlines.push(trimmed);
    }
  }
  return headlines.slice(0, 20);
}

function categorizeCyprus(text: string): string {
  const t = text.toLowerCase();
  if (/\b(turkey|tension|military|buffer zone|occupied|invasion|threat|nato|base|akrotiri|dhekelia|un peacekeep|missile|drone|attack)\b/.test(t)) return "security";
  if (/\b(president|parliament|government|minister|election|vote|law|legislation|eu|european|commission)\b/.test(t)) return "politics";
  if (/\b(gas|eez|drilling|energy|pipeline|hydrocarbons|lng|aphrodite|calypso|block \d)\b/.test(t)) return "energy";
  if (/\b(economy|bank|gdp|investment|trade|tax|tourism|crypto|fintech|property|stock)\b/.test(t)) return "economy";
  if (/\b(society|culture|education|health|protest|strike|crime|court|vaccine|football)\b/.test(t)) return "society";
  return "general";
}
