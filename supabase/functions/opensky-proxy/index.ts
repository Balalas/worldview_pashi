const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lamin = url.searchParams.get('lamin') || '30';
    const lamax = url.searchParams.get('lamax') || '60';
    const lomin = url.searchParams.get('lomin') || '-15';
    const lomax = url.searchParams.get('lomax') || '45';

    console.log(`Fetching OpenSky data: lat[${lamin},${lamax}] lon[${lomin},${lomax}]`);

    const openSkyUrl = `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;
    
    // Try with 25s timeout first, then retry with smaller area
    let response: Response | null = null;
    for (const attempt of [0, 1]) {
      const controller = new AbortController();
      const timeoutMs = attempt === 0 ? 25000 : 20000;
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      
      // On retry, use a smaller bounding box (Central Europe)
      const url = attempt === 0 ? openSkyUrl : 
        `https://opensky-network.org/api/states/all?lamin=45&lamax=55&lomin=5&lomax=20`;
      
      try {
        response = await fetch(url, {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (response.ok) break;
      } catch (e) {
        clearTimeout(timer);
        console.warn(`Attempt ${attempt + 1} failed:`, e instanceof Error ? e.message : e);
        if (attempt === 1) throw e;
      }
    }

    if (!response || !response.ok) {
      const status = response?.status || 502;
      console.error(`OpenSky API error: ${status}`);
      return new Response(
        JSON.stringify({ success: false, error: `OpenSky returned ${status}` }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Transform OpenSky state vectors into our aircraft format
    const militaryCallsigns = ['RCH', 'EVAC', 'REACH', 'VIPER', 'HAWK', 'MAGIC', 'IRON', 'JAKE', 'DUKE', 'TOPCAT', 'SPAR', 'SAM', 'VENUS', 'DARK', 'COBRA', 'DRAGN'];
    
    const aircraft = (data.states || [])
      .filter((s: any[]) => s[5] != null && s[6] != null) // filter out null positions
      .slice(0, 500) // limit to 500 aircraft
      .map((s: any[]) => {
        const callsign = (s[1] || '').trim();
        const isMilitary = militaryCallsigns.some(m => callsign.toUpperCase().startsWith(m)) || 
                          (s[2] || '').toLowerCase().includes('military');
        const altitudeM = s[7] || s[13] || 0;
        const altitudeFt = Math.round(altitudeM * 3.28084);
        
        return {
          icao24: s[0] || '',
          callsign: callsign || 'N/A',
          country: s[2] || 'Unknown',
          lat: s[6],
          lon: s[5],
          altitude: altitudeM,
          altitudeFt,
          speedKts: s[9] ? Math.round(s[9] * 1.944) : 0, // m/s to knots
          heading: s[10] || 0,
          verticalRate: s[11] || 0,
          onGround: s[8] || false,
          isMilitary,
        };
      });

    console.log(`Returning ${aircraft.length} aircraft`);

    return new Response(
      JSON.stringify({ success: true, aircraft, time: data.time }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching OpenSky data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
