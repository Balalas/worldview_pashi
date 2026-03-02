import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INTEL_PROMPT = (country: string) => `You are a senior intelligence analyst. Provide a tactical intelligence briefing about ${country}. Include: current threats, military developments, political instability, cyber incidents, economic risks. Be factual and cite sources. Respond in JSON:
{
  "briefing": "3-5 sentence intelligence summary with specific facts and dates",
  "threatLevel": "CRITICAL|HIGH|MEDIUM|LOW|STABLE",
  "developments": ["specific development 1 with date/detail", "development 2", "development 3", "development 4", "development 5"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "sources": ["source name 1", "source name 2"]
}`;

function parseIntelJSON(content: string): any {
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    return JSON.parse(jsonStr.trim());
  } catch {
    return {
      briefing: content.slice(0, 500),
      threatLevel: "MEDIUM",
      developments: [],
      risks: [],
      keywords: [],
      sources: [],
    };
  }
}

// Fetch from Perplexity (real-time web search grounded)
async function fetchPerplexity(countryName: string, searchQuery: string): Promise<{ data: any; citations: string[] } | null> {
  const key = Deno.env.get("PERPLEXITY_API_KEY");
  if (!key) { console.warn("No PERPLEXITY_API_KEY"); return null; }

  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: INTEL_PROMPT(countryName) },
          { role: "user", content: searchQuery },
        ],
        search_recency_filter: "day",
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) { console.warn(`Perplexity ${res.status}`); return null; }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || "";
    return { data: parseIntelJSON(content), citations: json.citations || [] };
  } catch (e) {
    console.warn("Perplexity failed:", e);
    return null;
  }
}

// Fetch from Lovable AI (Gemini — deep analysis, no web search but strong reasoning)
async function fetchGrokAI(countryName: string, searchQuery: string): Promise<{ data: any } | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) { console.warn("No LOVABLE_API_KEY"); return null; }

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: INTEL_PROMPT(countryName) + `\n\nProvide ADDITIONAL insights beyond surface-level news. Focus on: hidden patterns, escalation forecasts, second-order effects, historical parallels, and strategic implications. Include analysis a typical news reader would miss.` },
          { role: "user", content: searchQuery + ` — Provide deep analytical intelligence beyond headlines. What are the strategic implications? What escalation scenarios exist? What is the 72-hour forecast?` },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
      const status = res.status;
      console.warn(`Lovable AI ${status}`);
      return null;
    }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || "";
    return { data: parseIntelJSON(content) };
  } catch (e) {
    console.warn("Lovable AI failed:", e);
    return null;
  }
}

// Merge two intel results — Perplexity provides real-time facts, Gemini provides deep analysis
function mergeIntel(perplexity: any | null, grok: any | null): any {
  const p = perplexity?.data || {};
  const g = grok?.data || {};

  // Pick the higher threat level
  const THREAT_ORDER = ['STABLE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const pLevel = THREAT_ORDER.indexOf(p.threatLevel || 'MEDIUM');
  const gLevel = THREAT_ORDER.indexOf(g.threatLevel || 'MEDIUM');

  // Combine briefings
  const briefings: string[] = [];
  if (p.briefing) briefings.push(p.briefing);
  if (g.briefing && g.briefing !== p.briefing) briefings.push(`[DEEP ANALYSIS] ${g.briefing}`);

  // Deduplicate developments
  const allDevs = [...(p.developments || []), ...(g.developments || [])];
  const uniqueDevs = [...new Set(allDevs)].slice(0, 8);

  // Deduplicate risks
  const allRisks = [...(p.risks || []), ...(g.risks || [])];
  const uniqueRisks = [...new Set(allRisks)].slice(0, 6);

  // Combine keywords
  const allKeywords = [...new Set([...(p.keywords || []), ...(g.keywords || [])])].slice(0, 10);

  // Combine sources
  const allSources = [...new Set([...(p.sources || []), ...(g.sources || [])])];

  return {
    briefing: briefings.join(' '),
    threatLevel: THREAT_ORDER[Math.max(pLevel, gLevel)] || 'MEDIUM',
    developments: uniqueDevs,
    risks: uniqueRisks,
    keywords: allKeywords,
    sources: allSources,
    dualSource: !!(perplexity && grok),
    perplexityAvailable: !!perplexity,
    aiAnalysisAvailable: !!grok,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { countryName, query } = await req.json();
    if (!countryName) {
      return new Response(JSON.stringify({ error: "countryName required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchQuery = query || `Latest breaking news, security incidents, geopolitical developments, military activity, and OSINT intelligence about ${countryName} today`;

    // Run both in parallel
    const [perplexityResult, grokResult] = await Promise.all([
      fetchPerplexity(countryName, searchQuery),
      fetchGrokAI(countryName, searchQuery),
    ]);

    if (!perplexityResult && !grokResult) {
      return new Response(JSON.stringify({ error: "Both AI sources failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const merged = mergeIntel(perplexityResult, grokResult);

    return new Response(JSON.stringify({
      success: true,
      data: merged,
      citations: perplexityResult?.citations || [],
      fetchedAt: new Date().toISOString(),
      sources: {
        perplexity: !!perplexityResult,
        aiAnalysis: !!grokResult,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Country intel error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
