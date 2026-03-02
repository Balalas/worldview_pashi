const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, context } = await req.json();

    if (!question) {
      return new Response(JSON.stringify({ error: 'question required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      return new Response(JSON.stringify({ error: 'Perplexity API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build context from recent OSINT posts
    const osintContext = context
      ? `Here is recent OSINT intelligence from monitored X/Twitter accounts:\n\n${context}\n\n`
      : '';

    const systemPrompt = `You are a senior OSINT analyst embedded in a geospatial intelligence dashboard. You have access to live feeds from X/Twitter OSINT accounts, GDELT news, conflict zone data, and military tracking systems.

${osintContext}Answer the operator's question using the OSINT context above plus your real-time web search capabilities. Be concise, tactical, and cite sources. Use bullet points for clarity. If the question relates to a specific region or event, provide coordinates when possible.

Format: Brief tactical answer. No fluff. Intelligence-grade analysis.`;

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        search_recency_filter: 'day',
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error('Perplexity error:', res.status, t);
      return new Response(JSON.stringify({ error: `AI error: ${res.status}` }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = await res.json();
    const answer = json.choices?.[0]?.message?.content || 'No response from AI.';
    const citations = json.citations || [];

    return new Response(JSON.stringify({
      success: true,
      answer,
      citations,
      model: 'sonar',
      answeredAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('OSINT chat error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
