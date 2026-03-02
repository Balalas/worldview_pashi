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
}

Provide deep analytical intelligence beyond headlines. Focus on: hidden patterns, escalation forecasts, second-order effects, historical parallels, and strategic implications. What are the 72-hour forecasts?`;

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { countryName, query } = await req.json();
    if (!countryName) {
      return new Response(JSON.stringify({ error: "countryName required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const searchQuery = query || `Latest breaking news, security incidents, geopolitical developments, military activity, and OSINT intelligence about ${countryName} today`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: INTEL_PROMPT(countryName) },
          { role: "user", content: searchQuery },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || "";
    const parsed = parseIntelJSON(content);

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...parsed,
        dualSource: false,
        perplexityAvailable: false,
        aiAnalysisAvailable: true,
      },
      citations: [],
      fetchedAt: new Date().toISOString(),
      sources: { perplexity: false, aiAnalysis: true },
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
