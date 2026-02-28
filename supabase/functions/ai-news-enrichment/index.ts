import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { headlines, mode, countryName, countryCode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Two modes: "feed" for global news enrichment, "country" for country-specific analysis
    const isCountryMode = mode === "country" && countryName;

    const systemPrompt = isCountryMode
      ? `You are an intelligence analyst. Analyze these headlines about ${countryName} (${countryCode}). Return ONLY valid JSON:
{
  "summary": "<2-3 sentence intelligence summary for this country>",
  "threatLevel": "<CRITICAL|HIGH|ELEVATED|GUARDED|LOW>",
  "aiTags": ["<tag1>", "<tag2>", "<tag3>"],
  "keyDevelopments": ["<development1>", "<development2>"],
  "outlook": "<1 sentence forecast>",
  "relatedCountries": ["<country1>", "<country2>"]
}`
      : `You are a senior OSINT analyst. Analyze these news headlines and enrich them. Return ONLY valid JSON:
{
  "globalThreatLevel": "<CRITICAL|HIGH|ELEVATED|GUARDED|LOW>",
  "topStories": [
    { "headline": "<original or improved headline>", "severity": "<critical|high|medium|low|info>", "country": "<country name or null>", "category": "<conflict|military|cyber|protest|diplomacy|disaster|economic|general>", "aiSummary": "<15 word max context>" }
  ],
  "emergingThreats": ["<threat1>", "<threat2>"],
  "hotspots": [
    { "region": "<name>", "risk": "<HIGH|MEDIUM|LOW>", "reason": "<10 words>" }
  ],
  "timestamp": "${new Date().toISOString()}"
}
Analyze ALL provided headlines. Focus on geopolitical, military, and security significance.`;

    const userContent = isCountryMode
      ? `Headlines mentioning ${countryName}:\n${(headlines || []).slice(0, 20).join('\n')}`
      : `Current global headlines:\n${(headlines || []).slice(0, 40).join('\n')}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      parsed = isCountryMode
        ? { summary: content, threatLevel: "GUARDED", aiTags: [], keyDevelopments: [], outlook: "", relatedCountries: [] }
        : { globalThreatLevel: "GUARDED", topStories: [], emergingThreats: [], hotspots: [], timestamp: new Date().toISOString() };
    }

    return new Response(JSON.stringify({ success: true, data: parsed, mode: isCountryMode ? "country" : "feed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI enrichment error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
