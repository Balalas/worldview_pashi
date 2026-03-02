import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { countryName, query } = await req.json();
    if (!countryName) {
      return new Response(JSON.stringify({ error: "countryName required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchQuery = query || `Latest breaking news, security incidents, geopolitical developments, military activity, and OSINT intelligence about ${countryName} today`;

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
            content: `You are a senior intelligence analyst. Provide a tactical intelligence briefing about ${countryName}. Include: current threats, military developments, political instability, cyber incidents, economic risks. Be factual and cite sources. Respond in JSON:
{
  "briefing": "3-5 sentence intelligence summary with specific facts and dates",
  "threatLevel": "CRITICAL|HIGH|MEDIUM|LOW|STABLE",
  "developments": ["specific development 1 with date/detail", "development 2", "development 3", "development 4", "development 5"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "sources": ["source name 1", "source name 2"]
}`
          },
          { role: "user", content: searchQuery },
        ],
        search_recency_filter: "day",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Perplexity API error:", response.status, errText);
      return new Response(JSON.stringify({ error: `Perplexity API ${response.status}` }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    let parsed;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      parsed = {
        briefing: content.slice(0, 500),
        threatLevel: "MEDIUM",
        developments: [],
        risks: [],
        keywords: [],
        sources: [],
      };
    }

    return new Response(JSON.stringify({
      success: true,
      data: parsed,
      citations,
      fetchedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Perplexity country intel error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
