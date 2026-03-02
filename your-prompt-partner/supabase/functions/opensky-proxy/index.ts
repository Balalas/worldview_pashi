const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Military Detection ──

// Comprehensive military callsign prefixes (publicly tracked)
const MILITARY_CALLSIGN_PREFIXES = [
  // ── US Military ──
  'RCH', 'REACH', 'EVAC', 'JAKE', 'VIPER', 'KING', 'HAWK', 'MAGIC', 'DRAGON',
  'CONDOR', 'SPAR', 'FELIX', 'IRON', 'PEARL', 'BLOCKED', 'FORTE', 'DUKE',
  'DOOM', 'TOPCAT', 'ANGRY', 'CHAOS', 'DEMON', 'GHOST', 'REAPER', 'ATLAS',
  'NAVY', 'ARMY', 'USAF', 'GRZLY', 'TITAN', 'TROJAN', 'LANCE', 'TEAL',
  'ORDER', 'GORDO', 'OXIDE', 'METAL', 'PACK', 'WOLF', 'COBRA', 'NCHO',
  'SKULL', 'HAVOC', 'THUD', 'BOLT', 'TORCH', 'BLADE', 'PUMA', 'RAZOR',
  'STEEL', 'ARROW', 'STORM', 'ROCKY', 'VENOM', 'RAPTOR', 'NIGHT', 'ROGUE',
  'SHADOW', 'CROSS', 'EAGLE', 'TREND', 'DECEE', 'DRAGN', 'VADER', 'WITCH',
  'BISON', 'MOOSE', 'CROOK', 'VALOR', 'HONOR', 'RAGE', 'FURY', 'FRENZY',
  'BANDIT', 'CODY', 'BULLY', 'ROCKY', 'ZIPPO', 'SHADY', 'DUSTY', 'NORDO',
  'LITER', 'CRZR', 'DARK', 'TALON', 'RAPIER', 'SENTRY', 'SKYKING',
  // USAF tankers/transports
  'GOLD', 'SHELL', 'ARCT', 'TUFF', 'PACK', 'HOMER', 'HERC', 'MOBY',
  'CARGO', 'ETHEL', 'TABOR', 'RAIDR', 'SCORE', 'CASEY', 'BATON',
  // USAF ISR/recon
  'HOMER', 'JAKE', 'NEMO', 'RACER', 'RAVEN', 'JSTARS', 'AWACS',
  // USN/USMC
  'CNV', 'MARLN', 'NAVY', 'COTTN', 'SALTY', 'SNOOP', 'TROUT',
  'TIGER', 'TOPGN', 'HOIST', 'ANGEL', 'PEDRO', 'JOLLY',
  // US special ops
  'NIGHT', 'WRATH', 'KNIFE', 'JEDI', 'AFSOC',
  
  // ── UK RAF ──
  'RAF', 'RRR', 'ASCOT', 'TARTN', 'LOSSIE', 'CONAN',
  'TIVVY', 'RAFUK', 'RAFKC', 'BRIZE', 'MARHAM', 'WADDINGTON',
  
  // ── NATO / Allied ──
  'NATO', 'NASTY', 'MAGIC', 'MYSTIC', 'DACOL', 'MMF',
  
  // ── French AF ──
  'FAF', 'FRAF', 'CTM', 'COTAM', 'FRAF',
  
  // ── German AF ──
  'GAF', 'GERM', 'GERMA',
  
  // ── Italian AF ──
  'IAM', 'ITAF',
  
  // ── Canadian AF ──
  'CFC', 'CANAF', 'CANFORCE',
  
  // ── Australian AF ──
  'RAAF', 'AUSAF', 'AUSMIL',
  
  // ── Turkish AF ──
  'TUAF', 'THK', 'TURK',
  
  // ── Israeli AF ──
  'IAF', 'ISDFA',
  
  // ── Indian AF ──
  'IFC', 'INDIA',
  
  // ── Japanese ASDF ──
  'JASDF', 'JFA',
  
  // ── South Korean AF ──
  'ROKAF', 'KAF',
  
  // ── Swedish AF ──
  'SVF', 'SWEDE',
  
  // ── Norwegian AF ──
  'NORA', 'NORW',
  
  // ── Polish AF ──
  'PLF', 'PLAF',
  
  // ── Saudi AF ──
  'RSAF', 'SVA',
  
  // ── UAE AF ──
  'UAF',
  
  // ── Russian AF (may appear on ADS-B) ──
  'RFF', 'RUAF', 'RFAF',
  
  // ── Chinese PLAAF (rare on ADS-B) ──
  'CCA', 'PLAAF',
];

// Military ICAO hex ranges (country-allocated mil blocks)
const MILITARY_HEX_RANGES: [number, number][] = [
  [0xADF7C8, 0xAFFFFF], // US military
  [0x3C0000, 0x3FFFFF], // Germany (includes Bundeswehr)
  [0x43C000, 0x43CFFF], // UK military
  [0x3F0000, 0x3FFFFF], // France military
  [0x300000, 0x33FFFF], // Italy (includes AMI)
  [0x710000, 0x713FFF], // Israel military
  [0x738000, 0x739FFF], // Saudi Arabia military
  [0x480000, 0x487FFF], // Netherlands military
  [0x500000, 0x507FFF], // Sweden military
];

// Squawk codes indicating military operations
const MILITARY_SQUAWKS = new Set([
  '7777', // Military intercept
  '0100', '0200', '0300', '0400', // Common mil blocks
  '4400', '4401', '4402', '4403', '4404', '4405', // US military VFR
  '5100', '5200', '5300', '5400', // NATO operations
  '6100', '6200', '6300', '6400', // European military
  '7501', // NORAD intercept
]);

function isMilitaryHex(hex: string): boolean {
  const n = parseInt(hex, 16);
  return MILITARY_HEX_RANGES.some(([lo, hi]) => n >= lo && n <= hi);
}

function isMilitaryCallsign(callsign: string): boolean {
  const upper = callsign.toUpperCase().trim();
  return MILITARY_CALLSIGN_PREFIXES.some(p => upper.startsWith(p));
}

function isMilitarySquawk(squawk: string): boolean {
  return MILITARY_SQUAWKS.has(squawk);
}

function detectMilitary(callsign: string, icao: string, squawk: string, dbFlags?: number): boolean {
  return isMilitaryCallsign(callsign) || isMilitaryHex(icao) || isMilitarySquawk(squawk) || dbFlags === 1;
}

function classifyMissionType(callsign: string): string | undefined {
  const upper = callsign.toUpperCase().trim();
  if (upper.startsWith('RCH') || upper.startsWith('REACH') || upper.startsWith('HERC') || upper.startsWith('CARGO') || upper.startsWith('MOBY') || upper.startsWith('ATLAS')) return 'Tanker/Transport';
  if (upper.startsWith('SPAR') || upper.startsWith('FELIX') || upper.startsWith('ASCOT') || upper.startsWith('COTAM')) return 'VIP Transport';
  if (upper.startsWith('FORTE') || upper.startsWith('MAGIC') || upper.startsWith('DRAGON') || upper.startsWith('RAVEN') || upper.startsWith('HOMER') || upper.startsWith('JAKE') || upper.startsWith('JSTARS') || upper.startsWith('AWACS') || upper.startsWith('SENTRY') || upper.startsWith('SNOOP')) return 'Surveillance';
  if (upper.startsWith('EVAC') || upper.startsWith('PEDRO') || upper.startsWith('ANGEL') || upper.startsWith('JOLLY')) return 'Medical Evacuation';
  if (upper.startsWith('BLOCKED') || upper.startsWith('DARK') || upper.startsWith('NIGHT') || upper.startsWith('JEDI') || upper.startsWith('AFSOC') || upper.startsWith('KNIFE') || upper.startsWith('WRATH')) return 'Classified';
  if (upper.startsWith('SHELL') || upper.startsWith('GOLD') || upper.startsWith('ARCT') || upper.startsWith('TUFF')) return 'Tanker/Transport';
  if (upper.startsWith('VIPER') || upper.startsWith('HAWK') || upper.startsWith('RAPTOR') || upper.startsWith('REAPER') || upper.startsWith('DOOM') || upper.startsWith('SKULL') || upper.startsWith('DEMON') || upper.startsWith('CHAOS') || upper.startsWith('FURY') || upper.startsWith('RAGE') || upper.startsWith('TOPGN')) return 'Fighter/Attack';
  if (upper.startsWith('NATO') || upper.startsWith('GAF') || upper.startsWith('FAF') || upper.startsWith('RAF') || upper.startsWith('RAAF') || upper.startsWith('IAF') || upper.startsWith('ROKAF') || upper.startsWith('TUAF') || upper.startsWith('JASDF')) return 'Military';
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
              const hex = (a.hex || '').trim();
              const squawk = (a.squawk || '').trim();
              const isMil = detectMilitary(callsign, hex, squawk, a.dbFlags as number);
              const altM = typeof a.alt_baro === 'number' ? a.alt_baro * 0.3048 : 0;
              return {
                icao24: hex,
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
                squawk: squawk,
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
        const icao = (s[0] || '').trim();
        const squawk = String(s[14] || '');
        const isMil = detectMilitary(callsign, icao, squawk);
        const altitudeM = s[7] || s[13] || 0;

        return {
          icao24: icao,
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
          isMilitary: isMil,
          missionType: isMil ? classifyMissionType(callsign) : undefined,
          squawk,
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

    // Merge additional military aircraft from adsb.lol mil endpoint
    try {
      const milRes = await fetch('https://api.adsb.lol/v2/mil', { signal: AbortSignal.timeout(5000) });
      if (milRes.ok) {
        const milData = await milRes.json();
        const existingIcaos = new Set(aircraft.map((a: any) => a.icao24));
        const extraMil = (milData.ac || [])
          .filter((a: any) => a.lat != null && a.lon != null && a.alt_baro !== 'ground' && !existingIcaos.has(a.hex))
          .slice(0, 500)
          .map((a: any) => {
            const callsign = (a.flight || '').trim();
            const altM = typeof a.alt_baro === 'number' ? a.alt_baro * 0.3048 : 0;
            return {
              icao24: (a.hex || '').trim(),
              callsign: callsign || 'N/A',
              country: a.r || 'Unknown',
              lat: a.lat, lon: a.lon,
              altitude: altM,
              altitudeFt: typeof a.alt_baro === 'number' ? a.alt_baro : 0,
              speedKts: a.gs || 0,
              heading: a.track || 0,
              verticalRate: a.baro_rate ? a.baro_rate * 0.00508 : 0,
              onGround: false,
              isMilitary: true,
              missionType: classifyMissionType(callsign),
              squawk: a.squawk || '',
              lastContact: Math.floor(Date.now() / 1000),
            };
          });
        if (extraMil.length > 0) {
          aircraft.push(...extraMil);
          console.log(`Merged ${extraMil.length} additional mil aircraft from adsb.lol`);
        }
      }
    } catch { /* non-critical */ }

    const milCount = aircraft.filter((a: any) => a.isMilitary).length;
    console.log(`Returning ${aircraft.length} live aircraft (${milCount} military)`);
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
