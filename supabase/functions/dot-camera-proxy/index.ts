const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only allow known DOT camera domains
    const allowed = [
      '207.251.86.238',        // NYC DOT
      'webcams.nyctmc.org',    // NYC TMC
      'cwwp2.dot.ca.gov',      // Caltrans
      'its.ny.gov',            // NY State
      'trafficcams.vancouver.ca', // Vancouver
      'tdg-images-cctv',       // misc DOT
      'fl511.com',             // Florida DOT
      'hb.511ia.org',          // Iowa DOT
    ];

    const urlObj = new URL(url);
    if (!allowed.some(d => urlObj.hostname.includes(d))) {
      return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imgRes = await fetch(url, {
      headers: { 'User-Agent': 'WorldView/1.0 Traffic Monitor' },
    });

    if (!imgRes.ok) {
      return new Response(JSON.stringify({ error: `Upstream ${imgRes.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const body = await imgRes.arrayBuffer();

    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch (e) {
    console.error('DOT camera proxy error:', e);
    return new Response(JSON.stringify({ error: 'Proxy failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
