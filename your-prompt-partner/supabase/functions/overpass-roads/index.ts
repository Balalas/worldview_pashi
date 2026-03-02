const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, radius } = await req.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response(JSON.stringify({ error: 'lat and lng required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const r = radius || 500;

    const query = `
      [out:json][timeout:8];
      way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"](around:${r},${lat},${lng});
      out geom;
    `;

    const servers = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ];

    let lastError = '';
    for (const overpassUrl of servers) {
      try {
        const res = await fetch(overpassUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
        });

        if (res.status === 429) {
          console.error('Overpass 429 from', overpassUrl);
          lastError = '429';
          continue;
        }

        if (!res.ok) {
          console.error('Overpass error:', res.status, 'from', overpassUrl);
          lastError = `${res.status}`;
          continue;
        }

        const data = await res.json();

        const roads: { lat: number; lng: number }[][] = [];
        for (const el of data.elements || []) {
          if (el.type === 'way' && el.geometry) {
            const path = el.geometry.map((pt: { lat: number; lon: number }) => ({
              lat: pt.lat,
              lng: pt.lon,
            }));
            if (path.length >= 2) {
              roads.push(path);
            }
          }
        }

        return new Response(JSON.stringify({ roads }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (serverErr) {
        console.error('Server error from', overpassUrl, serverErr);
        lastError = String(serverErr);
        continue;
      }
    }

    // All servers failed
    return new Response(JSON.stringify({ error: `All Overpass servers failed: ${lastError}` }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Overpass proxy error:', e);
    return new Response(JSON.stringify({ error: 'Failed to fetch roads' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
