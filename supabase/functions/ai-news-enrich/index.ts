import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { headlines, context, countryName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isCountry = context === "country" && countryName;

    const systemPrompt = isCountry
      ? `You are a senior intelligence analyst. Analyze the provided news headlines about ${countryName} and respond ONLY in valid JSON:
{
  "summary": "2-3 sentence tactical situation assessment for ${countryName}",
  "threatLevel": "CRITICAL|HIGH|MEDIUM|LOW|STABLE",
  "keyDevelopments": ["development 1", "development 2", "development 3"],
  "outlook": "1 sentence forecast",
  "hotTopics": ["topic1", "topic2"]
}
Be analytical, concise, grounded in the headlines provided.`
      : `You are a senior intelligence analyst. Analyze the provided global news headlines and respond ONLY in valid JSON:
{
  "summary": "2-3 sentence global situation assessment",
  "threatLevel": "CRITICAL|HIGH|MEDIUM|LOW|STABLE",
  "keyDevelopments": ["development 1", "development 2", "development 3"],
  "hotTopics": ["topic1", "topic2", "topic3"],
  "flashAlert": "1 sentence about most urgent item or null"
}
Be analytical, concise, grounded in the headlines provided.`;

    const userContent = `Headlines:\n${(headlines || []).slice(0, 25).join('\n')}`;

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
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
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
      parsed = { summary: content.slice(0, 300), threatLevel: "STABLE", keyDevelopments: [], hotTopics: [], flashAlert: null };
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI enrich error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
