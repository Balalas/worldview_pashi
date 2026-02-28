import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// X/Twitter OSINT accounts to monitor
const OSINT_ACCOUNTS = ["osintwarfare", "conflict_radar", "sentdefender"];

// Known conflict pairs for missile visualization
const CONFLICT_PAIRS = [
  { attacker: "Russia", defender: "Ukraine", attackerCoords: { lat: 55.75, lon: 37.62 }, defenderCoords: { lat: 48.5, lon: 37.5 }, active: true },
  { attacker: "Israel", defender: "Gaza", attackerCoords: { lat: 31.77, lon: 35.22 }, defenderCoords: { lat: 31.35, lon: 34.31 }, active: true },
  { attacker: "Houthi", defender: "Red Sea Shipping", attackerCoords: { lat: 15.35, lon: 44.2 }, defenderCoords: { lat: 13.5, lon: 42.5 }, active: true },
  { attacker: "Iran", defender: "Israel", attackerCoords: { lat: 35.69, lon: 51.39 }, defenderCoords: { lat: 31.77, lon: 35.22 }, active: false },
  { attacker: "Sudan SAF", defender: "RSF Khartoum", attackerCoords: { lat: 15.5, lon: 32.56 }, defenderCoords: { lat: 13.0, lon: 25.0 }, active: true },
  { attacker: "Myanmar Junta", defender: "Resistance", attackerCoords: { lat: 19.76, lon: 96.07 }, defenderCoords: { lat: 21.0, lon: 97.0 }, active: true },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { headlines, conflictZones } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a senior military intelligence analyst specializing in real-time conflict analysis.
Given the latest news headlines and known conflict zones, provide a tactical assessment.
Focus on: active missile/drone strikes, troop movements, escalation signals, and attack predictions.
Monitored OSINT sources: @${OSINT_ACCOUNTS.join(", @")}

Respond ONLY in valid JSON:
{
  "activeStrikes": [
    {
      "attacker": "country/group name",
      "defender": "country/group name",
      "weaponType": "missile|drone|artillery|air_strike|naval",
      "description": "brief description",
      "confidence": "confirmed|likely|unconfirmed",
      "intensity": 1-10
    }
  ],
  "escalationRisk": [
    {
      "pair": "Country A vs Country B",
      "risk": "CRITICAL|HIGH|MEDIUM|LOW",
      "prediction": "1 sentence prediction",
      "probability": 0-100,
      "timeframe": "hours|days|weeks"
    }
  ],
  "missileActivity": [
    {
      "from": "launch origin",
      "to": "target area",
      "type": "ballistic|cruise|drone|rocket",
      "status": "launched|intercepted|hit|reported",
      "fromLat": number,
      "fromLon": number,
      "toLat": number,
      "toLon": number
    }
  ],
  "threatBrief": "2-3 sentence overall military situation assessment"
}

Use the known conflict pairs to map missile activity to coordinates. Be analytical and precise.`;

    const pairsContext = CONFLICT_PAIRS.map(p => 
      `${p.attacker} → ${p.defender} (Active: ${p.active})`
    ).join("\n");

    const userContent = `Latest headlines:\n${(headlines || []).slice(0, 30).join('\n')}\n\nKnown conflict pairs:\n${pairsContext}\n\nActive conflict zones:\n${(conflictZones || []).slice(0, 15).join('\n')}`;

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
      parsed = {
        activeStrikes: [],
        escalationRisk: [],
        missileActivity: [],
        threatBrief: content.slice(0, 300),
      };
    }

    // Enrich missile activity with known conflict pair coordinates if missing
    if (parsed.missileActivity) {
      for (const m of parsed.missileActivity) {
        if (!m.fromLat || !m.toLat) {
          const pair = CONFLICT_PAIRS.find(p => {
            const from = (m.from || "").toLowerCase();
            const to = (m.to || "").toLowerCase();
            return (from.includes(p.attacker.toLowerCase()) || p.attacker.toLowerCase().includes(from)) &&
                   (to.includes(p.defender.toLowerCase()) || p.defender.toLowerCase().includes(to));
          });
          if (pair) {
            m.fromLat = m.fromLat || pair.attackerCoords.lat;
            m.fromLon = m.fromLon || pair.attackerCoords.lon;
            m.toLat = m.toLat || pair.defenderCoords.lat;
            m.toLon = m.toLon || pair.defenderCoords.lon;
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, data: parsed, conflictPairs: CONFLICT_PAIRS }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("AI conflict intel error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
