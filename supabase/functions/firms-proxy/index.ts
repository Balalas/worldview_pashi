const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sensor, days } = await req.json();
    const validSensors = ['VIIRS_SNPP_NRT', 'MODIS_NRT'];
    const validDays = [1, 2, 7, 10];

    const sensorName = validSensors.includes(sensor) ? sensor : 'VIIRS_SNPP_NRT';
    const dayCount = validDays.includes(days) ? days : 1;

    // Use MAP_KEY from secrets, or fall back to empty (will return error)
    const mapKey = Deno.env.get('NASA_FIRMS_MAP_KEY') || '';
    
    if (!mapKey) {
      return new Response(JSON.stringify({ 
        error: 'No FIRMS API key configured', 
        csv: '',
        noKey: true 
      }), {
        status: 200, // Not a server error — just no key
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${sensorName}/world/${dayCount}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'WorldView/1.0 Fire Monitor' },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `FIRMS ${res.status}`, csv: '' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const csv = await res.text();
    
    // Check if response is an error message instead of CSV
    if (csv.startsWith('Invalid') || csv.startsWith('Error') || csv.length < 50) {
      return new Response(JSON.stringify({ error: csv.trim(), csv: '' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ csv, sensor: sensorName, days: dayCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' },
    });
  } catch (e) {
    console.error('FIRMS proxy error:', e);
    return new Response(JSON.stringify({ error: 'FIRMS proxy failed', csv: '' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
