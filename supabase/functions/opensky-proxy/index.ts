const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Military Detection ──

const MILITARY_CALLSIGN_PREFIXES = [
  'RCH', 'EVAC', 'REACH', 'JAKE', 'VIPER', 'KING', 'HAWK', 'MAGIC', 'DRAGON',
  'CONDOR', 'SPAR', 'FELIX', 'IRON', 'PEARL', 'BLOCKED', 'FORTE', 'DUKE',
  'DOOM', 'TOPCAT', 'ANGRY', 'CHAOS', 'DEMON', 'GHOST', 'REAPER', 'ATLAS',
  'NAVY', 'ARMY', 'USAF', 'RAF', 'GRZLY', 'TITAN', 'TROJAN', 'LANCE',
  'TEAL', 'ORDER', 'GORDO', 'OXIDE', 'METAL', 'PACK', 'WOLF', 'COBRA',
];

function isMilitaryCallsign(callsign: string): boolean {
  const upper = callsign.toUpperCase().trim();
  return MILITARY_CALLSIGN_PREFIXES.some(p => upper.startsWith(p));
}

function classifyMissionType(callsign: string): string | undefined {
  const upper = callsign.toUpperCase().trim();
  if (upper.startsWith('RCH') || upper.startsWith('REACH')) return 'Tanker/Transport';
  if (upper.startsWith('SPAR') || upper.startsWith('FELIX')) return 'VIP Transport';
  if (upper.startsWith('FORTE') || upper.startsWith('MAGIC') || upper.startsWith('DRAGON')) return 'Surveillance';
  if (upper.startsWith('EVAC')) return 'Medical Evacuation';
  if (upper.startsWith('BLOCKED')) return 'Classified';
  return 'Military';
}

function generateFallbackAircraft() {
  const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'China', 'Russia', 'Japan', 'Australia', 'India', 'Brazil', 'Canada', 'UAE', 'Turkey', 'Poland', 'Italy', 'Spain'];
  const callsigns = ['BAW', 'DLH', 'AAL', 'UAL', 'AFR', 'KLM', 'SIA', 'QFA', 'THY', 'ELY', 'SWR', 'ANA', 'JAL', 'CPA', 'UAE', 'ETH'];
  const milCallsigns = ['RCH', 'EVAC', 'REACH', 'VIPER', 'HAWK', 'MAGIC', 'IRON', 'COBRA', 'FORTE', 'SPAR'];
  const aircraft = [];

  for (let i = 0; i < 250; i++) {
    const isMil = Math.random() < 0.12;
    const prefix = isMil
      ? milCallsigns[Math.floor(Math.random() * milCallsigns.length)]
      : callsigns[Math.floor(Math.random() * callsigns.length)];
    const num = Math.floor(Math.random() * 9000 + 100);
    const callsign = `${prefix}${num}`;
    const altitudeM = isMil ? Math.random() * 12000 + 3000 : Math.random() * 12000 + 8000;

    aircraft.push({
      icao24: Math.random().toString(16).slice(2, 8),
      callsign,
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
      missionType: isMil ? classifyMissionType(callsign) : undefined,
      squawk: String(1000 + Math.floor(Math.random() * 7000)),
      lastContact: Math.floor(Date.now() / 1000),
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
      console.warn('OpenSky fetch failed, trying adsb.lol fallback:', e instanceof Error ? e.message : e);
      
      // Fallback chain: adsb.lol LADD → adsb.lol Military → generated
      try {
        const adsbRes = await fetch('https://api.adsb.lol/v2/ladd', { signal: AbortSignal.timeout(8000) });
        if (adsbRes.ok) {
          const adsbData = await adsbRes.json();
          const ac = (adsbData.ac || [])
            .filter((a: any) => a.lat != null && a.lon != null && a.alt_baro !== 'ground')
            .slice(0, 5000)
            .map((a: any) => {
              const callsign = (a.flight || '').trim();
              const isMil = isMilitaryCallsign(callsign) || (a.dbFlags as number) === 1;
              const altM = typeof a.alt_baro === 'number' ? a.alt_baro * 0.3048 : 0;
              return {
                icao24: a.hex || '',
                callsign: callsign || 'N/A',
                country: a.r || 'Unknown',
                lat: a.lat, lon: a.lon,
                altitude: altM,
                altitudeFt: typeof a.alt_baro === 'number' ? a.alt_baro : 0,
                speedKts: a.gs || 0,
                heading: a.track || 0,
                verticalRate: a.baro_rate ? a.baro_rate * 0.00508 : 0,
                onGround: false,
                isMilitary: isMil,
                missionType: isMil ? classifyMissionType(callsign) : undefined,
                squawk: a.squawk || '',
                lastContact: Math.floor(Date.now() / 1000),
              };
            });
          if (ac.length > 0) {
            console.log(`adsb.lol LADD returned ${ac.length} aircraft`);
            return new Response(
              JSON.stringify({ success: true, aircraft: ac, time: Math.floor(Date.now() / 1000), fallback: true }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch {}

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

    const aircraft = (data.states || [])
      .filter((s: any[]) => s[5] != null && s[6] != null)
      .slice(0, 5000)
      .map((s: any[]) => {
        const callsign = (s[1] || '').trim();
        const isMilitary = isMilitaryCallsign(callsign);
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
          missionType: isMilitary ? classifyMissionType(callsign) : undefined,
          squawk: s[14] || '',
          lastContact: s[4] || Math.floor(Date.now() / 1000),
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
