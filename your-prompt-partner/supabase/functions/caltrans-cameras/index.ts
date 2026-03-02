const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Caltrans CCTV JSON API — returns real camera snapshot URLs for a given district
// Districts: d1-d12 (1=Eureka, 2=Redding, 3=Marysville, 4=Oakland/SF, 5=SLO, 6=Fresno, 7=LA, 8=SB, 9=Stockton, 10=Modesto, 11=SD, 12=OC)
const DISTRICTS = ['d4', 'd7', 'd8', 'd11', 'd12']; // SF, LA, SB, SD, OC

interface CaltransCamera {
  id: string;
  name: string;
  lat: number;
  lon: number;
  snapshotUrl: string;
  heading: string;
  district: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cameras: CaltransCamera[] = [];
    
    // Fetch camera lists from all districts in parallel
    const results = await Promise.allSettled(
      DISTRICTS.map(async (district) => {
        const url = `https://cwwp2.dot.ca.gov/data/${district}/cctv/cctvStatus${district.toUpperCase()}.json`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'WorldView/1.0 Traffic Monitor' },
        });
        if (!res.ok) return [];
        const data = await res.json();
        
        // Parse the Caltrans JSON structure
        const cams: CaltransCamera[] = [];
        const entries = data?.data || [];
        for (const entry of entries) {
          try {
            const loc = entry?.location;
            const img = entry?.imageData?.static;
            if (!loc?.latitude || !loc?.longitude || !img?.currentImageURL) continue;
            
            cams.push({
              id: `cal-${district}-${entry.index || cams.length}`,
              name: loc.locationName || `Camera ${entry.index}`,
              lat: parseFloat(loc.latitude),
              lon: parseFloat(loc.longitude),
              snapshotUrl: img.currentImageURL.replace('http://', 'https://'),
              heading: loc.direction || '0',
              district,
            });
          } catch { /* skip malformed entries */ }
        }
        return cams;
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        cameras.push(...result.value);
      }
    }

    return new Response(JSON.stringify({ cameras, count: cameras.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (e) {
    console.error('Caltrans fetch error:', e);
    return new Response(JSON.stringify({ error: 'Failed to fetch cameras', cameras: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
