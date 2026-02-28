const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AggregatedCamera {
  id: string;
  source: string;
  name: string;
  lat: number;
  lon: number;
  imageUrl: string;
  streamUrl?: string;
  country: string;
  region?: string;
  heading?: number;
  isActive: boolean;
}

// ── Caltrans (California DOT) ──
async function fetchCaltransCameras(): Promise<AggregatedCamera[]> {
  const districts = [3, 4, 5, 7, 8, 11, 12];
  const results = await Promise.allSettled(
    districts.map(async (d) => {
      const url = `https://cwwp2.dot.ca.gov/data/d${d}/cctv/cctvStatusD${d.toString().padStart(2, '0')}.json`;
      const res = await fetch(url, { headers: { 'User-Agent': 'WorldView/1.0' } });
      if (!res.ok) return [];
      const data = await res.json();
      const cams: AggregatedCamera[] = [];
      for (const entry of data?.data || []) {
        try {
          const loc = entry?.location;
          const img = entry?.imageData?.static;
          if (!loc?.latitude || !loc?.longitude || !img?.currentImageURL) continue;
          cams.push({
            id: `caltrans-${d}-${entry.index || cams.length}`,
            source: 'caltrans',
            name: loc.locationName || `CA-D${d} Camera`,
            lat: parseFloat(loc.latitude),
            lon: parseFloat(loc.longitude),
            imageUrl: img.currentImageURL.replace('http://', 'https://'),
            country: 'US',
            region: `California D${d}`,
            heading: parseFloat(loc.direction) || undefined,
            isActive: true,
          });
        } catch { /* skip */ }
      }
      return cams;
    })
  );
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
}

// ── Digitraffic (Finland) ──
async function fetchDigitrafficCameras(): Promise<AggregatedCamera[]> {
  try {
    const res = await fetch('https://tie.digitraffic.fi/api/weathercam/v1/stations', {
      headers: { 'Accept': 'application/json', 'Digitraffic-User': 'WorldView/1.0' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const cams: AggregatedCamera[] = [];
    for (const feature of data?.features || []) {
      try {
        const coords = feature?.geometry?.coordinates;
        const props = feature?.properties;
        if (!coords || coords.length < 2 || !props?.presets?.length) continue;
        const preset = props.presets[0];
        cams.push({
          id: `digitraffic-${props.id}`,
          source: 'digitraffic',
          name: props.name || `FI Camera ${props.id}`,
          lat: coords[1],
          lon: coords[0],
          imageUrl: preset.imageUrl || `https://weathercam.digitraffic.fi/${preset.id}.jpg`,
          country: 'FI',
          region: 'Finland',
          isActive: true,
        });
      } catch { /* skip */ }
    }
    return cams;
  } catch (e) {
    console.warn('Digitraffic error:', e);
    return [];
  }
}

// ── Singapore LTA ──
async function fetchSingaporeCameras(): Promise<AggregatedCamera[]> {
  try {
    const res = await fetch('https://api.data.gov.sg/v1/transport/traffic-images');
    if (!res.ok) return [];
    const data = await res.json();
    const cameras = data?.items?.[0]?.cameras || [];
    return cameras.map((cam: any) => ({
      id: `singapore-${cam.camera_id}`,
      source: 'singapore',
      name: `SG Traffic Cam ${cam.camera_id}`,
      lat: cam.location.latitude,
      lon: cam.location.longitude,
      imageUrl: cam.image,
      country: 'SG',
      region: 'Singapore',
      isActive: true,
    }));
  } catch (e) {
    console.warn('Singapore error:', e);
    return [];
  }
}

// ── Hong Kong (hardcoded positions) ──
function fetchHongKongCameras(): AggregatedCamera[] {
  const hkCams = [
    { id: 'H101', name: 'Cross Harbour Tunnel (HK)', lat: 22.3019, lon: 114.1753 },
    { id: 'H102', name: 'Cross Harbour Tunnel (KL)', lat: 22.3047, lon: 114.1756 },
    { id: 'H103', name: 'Eastern Harbour Crossing', lat: 22.3050, lon: 114.2130 },
    { id: 'H104', name: 'Western Harbour Crossing', lat: 22.2990, lon: 114.1530 },
    { id: 'H201', name: 'Tsing Ma Bridge', lat: 22.3520, lon: 114.0740 },
    { id: 'H202', name: 'Ting Kau Bridge', lat: 22.3680, lon: 114.0630 },
    { id: 'H301', name: 'Lion Rock Tunnel', lat: 22.3470, lon: 114.1780 },
    { id: 'H302', name: 'Shing Mun Tunnel', lat: 22.3720, lon: 114.1490 },
    { id: 'H303', name: 'Tate\'s Cairn Tunnel', lat: 22.3560, lon: 114.2150 },
    { id: 'H401', name: 'Nathan Road TST', lat: 22.2980, lon: 114.1720 },
    { id: 'H402', name: 'Kwun Tong Road', lat: 22.3130, lon: 114.2240 },
    { id: 'H403', name: 'Lung Cheung Road', lat: 22.3380, lon: 114.1820 },
    { id: 'H404', name: 'Tuen Mun Highway', lat: 22.3880, lon: 114.0210 },
    { id: 'H405', name: 'Tolo Highway', lat: 22.4130, lon: 114.1870 },
    { id: 'H406', name: 'Aberdeen Tunnel', lat: 22.2670, lon: 114.1730 },
    { id: 'H407', name: 'Wan Chai', lat: 22.2790, lon: 114.1730 },
    { id: 'H408', name: 'North Point', lat: 22.2910, lon: 114.2000 },
    { id: 'H409', name: 'Mongkok', lat: 22.3180, lon: 114.1700 },
    { id: 'H410', name: 'Sha Tin', lat: 22.3820, lon: 114.1930 },
  ];
  return hkCams.map(c => ({
    id: `hongkong-${c.id}`,
    source: 'hongkong',
    name: c.name,
    lat: c.lat,
    lon: c.lon,
    imageUrl: `https://tdcctv.data.one.gov.hk/${c.id}.JPG`,
    country: 'HK',
    region: 'Hong Kong',
    isActive: true,
  }));
}

// ── TfL London JamCams ──
async function fetchTflCameras(): Promise<AggregatedCamera[]> {
  try {
    const res = await fetch('https://api.tfl.gov.uk/Place/Type/JamCam');
    if (!res.ok) return [];
    const data = await res.json();
    const cams: AggregatedCamera[] = [];
    for (const place of data || []) {
      try {
        const imageUrl = place.additionalProperties?.find((p: any) => p.key === 'imageUrl')?.value;
        if (!imageUrl || !place.lat || !place.lon) continue;
        cams.push({
          id: `tfl-${place.id}`,
          source: 'tfl',
          name: place.commonName || `London Cam`,
          lat: place.lat,
          lon: place.lon,
          imageUrl,
          country: 'GB',
          region: 'London',
          isActive: true,
        });
      } catch { /* skip */ }
    }
    return cams;
  } catch (e) {
    console.warn('TfL error:', e);
    return [];
  }
}

// ── Aggregator ──
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sources = [
      fetchCaltransCameras(),
      fetchDigitrafficCameras(),
      fetchSingaporeCameras(),
      Promise.resolve(fetchHongKongCameras()),
      fetchTflCameras(),
    ];

    const results = await Promise.allSettled(sources);
    const cameras: AggregatedCamera[] = [];
    const sourceStats: Record<string, number> = {};

    for (const result of results) {
      if (result.status === 'fulfilled') {
        cameras.push(...result.value);
        for (const cam of result.value) {
          sourceStats[cam.source] = (sourceStats[cam.source] || 0) + 1;
        }
      }
    }

    console.log(`Camera aggregator: ${cameras.length} total cameras`, sourceStats);

    return new Response(JSON.stringify({
      success: true,
      cameras,
      count: cameras.length,
      sources: sourceStats,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (e) {
    console.error('Camera aggregator error:', e);
    return new Response(JSON.stringify({ success: false, error: String(e), cameras: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
