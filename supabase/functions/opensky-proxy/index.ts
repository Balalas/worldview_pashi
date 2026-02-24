const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function generateFallbackAircraft() {
  const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'China', 'Russia', 'Japan', 'Australia', 'India', 'Brazil', 'Canada', 'UAE', 'Turkey', 'Poland', 'Italy', 'Spain'];
  const callsigns = ['BAW', 'DLH', 'AAL', 'UAL', 'AFR', 'KLM', 'SIA', 'QFA', 'THY', 'ELY', 'SWR', 'ANA', 'JAL', 'CPA', 'UAE', 'ETH'];
  const milCallsigns = ['RCH', 'EVAC', 'REACH', 'VIPER', 'HAWK', 'MAGIC', 'IRON', 'COBRA'];
  const aircraft = [];

  for (let i = 0; i < 250; i++) {
    const isMil = Math.random() < 0.12;
    const prefix = isMil
      ? milCallsigns[Math.floor(Math.random() * milCallsigns.length)]
      : callsigns[Math.floor(Math.random() * callsigns.length)];
    const num = Math.floor(Math.random() * 9000 + 100);
    const altitudeM = isMil ? Math.random() * 12000 + 3000 : Math.random() * 12000 + 8000;

    aircraft.push({
      icao24: Math.random().toString(16).slice(2, 8),
      callsign: `${prefix}${num}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      lat: (Math.random() * 140) - 60,
      lon: (Math.random() * 360) - 180,
      altitude: altitudeM,
      altitudeFt: Math.round(altitudeM * 3.28084),
      speedKts: Math.round(Math.random() * 300 + 200),
      heading: Math.round(Math.random() * 360),
      verticalRate: Math.round((Math.random() - 0.5) * 10 * 100) / 100,
      onGround: false,
      isMilitary: isMil,
    });
  }
  return aircraft;
}

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

    // Use a small bounding box to reduce response time
    const openSkyUrl = `https://opensky-network.org/api/states/all?lamin=${lamin}&lamax=${lamax}&lomin=${lomin}&lomax=${lomax}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    let response: Response;
    try {
      response = await fetch(openSkyUrl, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);
    } catch (e) {
      clearTimeout(timer);
      console.warn('OpenSky fetch failed, returning fallback data:', e instanceof Error ? e.message : e);
      return new Response(
        JSON.stringify({ success: true, aircraft: generateFallbackAircraft(), time: Math.floor(Date.now() / 1000), fallback: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      console.warn(`OpenSky returned ${response.status}, using fallback`);
      return new Response(
        JSON.stringify({ success: true, aircraft: generateFallbackAircraft(), time: Math.floor(Date.now() / 1000), fallback: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    const militaryCallsigns = ['RCH', 'EVAC', 'REACH', 'VIPER', 'HAWK', 'MAGIC', 'IRON', 'JAKE', 'DUKE', 'TOPCAT', 'SPAR', 'SAM', 'VENUS', 'DARK', 'COBRA', 'DRAGN'];

    const aircraft = (data.states || [])
      .filter((s: any[]) => s[5] != null && s[6] != null)
      .slice(0, 500)
      .map((s: any[]) => {
        const callsign = (s[1] || '').trim();
        const isMilitary = militaryCallsigns.some(m => callsign.toUpperCase().startsWith(m)) ||
                          (s[2] || '').toLowerCase().includes('military');
        const altitudeM = s[7] || s[13] || 0;

        return {
          icao24: s[0] || '',
          callsign: callsign || 'N/A',
          country: s[2] || 'Unknown',
          lat: s[6],
          lon: s[5],
          altitude: altitudeM,
          altitudeFt: Math.round(altitudeM * 3.28084),
          speedKts: s[9] ? Math.round(s[9] * 1.944) : 0,
          heading: s[10] || 0,
          verticalRate: s[11] || 0,
          onGround: s[8] || false,
          isMilitary,
        };
      });

    if (aircraft.length === 0) {
      console.warn('No aircraft from OpenSky, using fallback');
      return new Response(
        JSON.stringify({ success: true, aircraft: generateFallbackAircraft(), time: data.time, fallback: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Returning ${aircraft.length} live aircraft`);
    return new Response(
      JSON.stringify({ success: true, aircraft, time: data.time }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in opensky-proxy:', error);
    return new Response(
      JSON.stringify({ success: true, aircraft: generateFallbackAircraft(), time: Math.floor(Date.now() / 1000), fallback: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
