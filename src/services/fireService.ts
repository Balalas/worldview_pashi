import { FireEvent } from '@/store/worldview';
import { supabase } from '@/integrations/supabase/client';

export type FireTimeWindow = '1H' | '6H' | '24H' | '48H' | '7D';

const DAYS_MAP: Record<FireTimeWindow, number> = {
  '1H': 1, '6H': 1, '24H': 1, '48H': 2, '7D': 7,
};

const WINDOW_MS: Record<FireTimeWindow, number> = {
  '1H': 60 * 60 * 1000,
  '6H': 6 * 60 * 60 * 1000,
  '24H': 24 * 60 * 60 * 1000,
  '48H': 48 * 60 * 60 * 1000,
  '7D': 7 * 24 * 60 * 60 * 1000,
};

// ── Parse NASA FIRMS CSV ──
function parseFirmsCSV(csv: string, timeWindow: FireTimeWindow): FireEvent[] {
  const lines = csv.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const latIdx = headers.indexOf('latitude');
  const lonIdx = headers.indexOf('longitude');
  const brIdx = headers.indexOf('bright_ti4') !== -1 ? headers.indexOf('bright_ti4') : headers.indexOf('brightness');
  const frpIdx = headers.indexOf('frp');
  const confIdx = headers.indexOf('confidence');
  const dateIdx = headers.indexOf('acq_date');
  const timeIdx = headers.indexOf('acq_time');

  if (latIdx === -1 || lonIdx === -1) return [];

  const now = Date.now();
  const cutoff = now - WINDOW_MS[timeWindow];
  const fires: FireEvent[] = [];

  // Limit to 999 data rows
  const dataLines = lines.slice(1, 1000);

  for (const line of dataLines) {
    const cols = line.split(',');
    const lat = parseFloat(cols[latIdx]);
    const lon = parseFloat(cols[lonIdx]);
    if (isNaN(lat) || isNaN(lon)) continue;

    const brightness = brIdx !== -1 ? parseFloat(cols[brIdx]) || 350 : 350;
    const frp = frpIdx !== -1 ? parseFloat(cols[frpIdx]) || 0 : 0;
    const confidence = confIdx !== -1 ? (cols[confIdx] || 'nominal').trim() : 'nominal';
    const acqDate = dateIdx !== -1 ? cols[dateIdx]?.trim() || '' : '';
    const acqTime = timeIdx !== -1 ? cols[timeIdx]?.trim() || '' : '';

    // Time filter
    if (acqDate && acqTime) {
      const t = String(acqTime).padStart(4, '0');
      const fireTime = new Date(`${acqDate}T${t.slice(0, 2)}:${t.slice(2)}:00Z`).getTime();
      if (!isNaN(fireTime) && fireTime < cutoff) continue;
    }

    fires.push({
      id: `firms-${lat.toFixed(3)}-${lon.toFixed(3)}`,
      title: `FIRMS ${brightness.toFixed(0)}K ${frp > 0 ? frp.toFixed(0) + 'MW' : ''}`,
      lat, lon,
      brightness, frp, confidence,
      acq_date: acqDate,
      acq_time: acqTime,
      date: acqDate,
      source: 'NASA FIRMS',
      category: 'wildfire',
    });
  }

  return fires;
}

// ── Fetch from FIRMS via edge function proxy ──
async function fetchFromFIRMS(timeWindow: FireTimeWindow, sensor: string = 'VIIRS_SNPP_NRT'): Promise<FireEvent[]> {
  try {
    const { data, error } = await supabase.functions.invoke('firms-proxy', {
      body: { sensor, days: DAYS_MAP[timeWindow] },
    });
    if (error || !data?.csv) return [];
    return parseFirmsCSV(data.csv, timeWindow);
  } catch (e) {
    console.warn(`FIRMS ${sensor} fetch failed:`, e);
    return [];
  }
}

// ── NASA EONET (wildfire events) — no key needed ──
async function fetchFromEONET(): Promise<FireEvent[]> {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=200&category=wildfires', {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.events || []).map((event: any) => {
      const geo = event.geometry?.[event.geometry.length - 1];
      if (!geo?.coordinates) return null;
      const mag = geo.magnitudeValue || 0;
      return {
        id: `eonet-${event.id}`,
        title: event.title,
        lat: geo.coordinates[1],
        lon: geo.coordinates[0],
        brightness: mag > 0 ? Math.min(500, mag / 10) : 350,
        frp: mag > 0 ? mag : 50,
        confidence: 'nominal',
        acq_date: geo.date?.substring(0, 10) || '',
        acq_time: geo.date?.substring(11, 15)?.replace(':', '') || '',
        date: geo.date,
        source: event.sources?.[0]?.id || 'NASA EONET',
        link: event.sources?.[0]?.url || event.link,
        category: 'wildfire' as const,
      };
    }).filter(Boolean) as FireEvent[];
  } catch (e) {
    console.warn('EONET wildfire fetch failed:', e);
    return [];
  }
}

// ── EONET Open fallback (all events, filter to wildfires) ──
async function fetchFromEONETOpen(): Promise<FireEvent[]> {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=300', {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.events || [])
      .filter((ev: any) => ev.categories?.some((c: any) => c.id === 'wildfires'))
      .map((event: any) => {
        const geo = event.geometry?.[event.geometry.length - 1];
        if (!geo?.coordinates) return null;
        return {
          id: `eonet-open-${event.id}`,
          title: event.title,
          lat: geo.coordinates[1],
          lon: geo.coordinates[0],
          brightness: 350,
          frp: 50,
          confidence: 'nominal',
          acq_date: geo.date?.substring(0, 10) || '',
          acq_time: '',
          date: geo.date,
          source: 'NASA EONET',
          link: event.sources?.[0]?.url,
          category: 'wildfire' as const,
        };
      })
      .filter(Boolean) as FireEvent[];
  } catch (e) {
    console.warn('EONET open fallback failed:', e);
    return [];
  }
}

// ── Deduplicate by lat/lon grid (0.01° ≈ 1.1km) ──
function deduplicateFires(fires: FireEvent[]): FireEvent[] {
  const seen = new Set<string>();
  return fires.filter(f => {
    const key = `${f.lat.toFixed(2)},${f.lon.toFixed(2)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Main fetch: FIRMS (VIIRS → MODIS fallback) + EONET → deduplicate ──
export const fetchFires = async (timeWindow: FireTimeWindow = '24H'): Promise<FireEvent[]> => {
  const [firmsResult, eonetResult] = await Promise.allSettled([
    fetchFromFIRMS(timeWindow, 'VIIRS_SNPP_NRT').then(async fires => {
      // If VIIRS returns nothing, try MODIS
      if (fires.length === 0) {
        return fetchFromFIRMS(timeWindow, 'MODIS_NRT');
      }
      return fires;
    }),
    fetchFromEONET(),
  ]);

  let combined: FireEvent[] = [];
  if (firmsResult.status === 'fulfilled') combined.push(...firmsResult.value);
  if (eonetResult.status === 'fulfilled') combined.push(...eonetResult.value);

  // Tertiary fallback if both returned empty
  if (combined.length === 0) {
    combined = await fetchFromEONETOpen();
  }

  return deduplicateFires(combined);
};

// ── Legacy export for backward compat ──
export const fetchActiveFiresEONET = fetchFires;

// NASA EONET - all natural events (volcanoes, storms, floods, etc.)
export const fetchNaturalDisasters = async (): Promise<FireEvent[]> => {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50');
    if (!res.ok) return [];
    const data = await res.json();

    return (data.events || [])
      .filter((e: any) => {
        const cat = e.categories?.[0]?.id;
        return cat && cat !== 'wildfires' && cat !== 'seaLakeIce';
      })
      .map((event: any) => {
        const geo = event.geometry?.[event.geometry.length - 1];
        if (!geo?.coordinates) return null;
        const catId = event.categories?.[0]?.id || 'other';
        const categoryMap: Record<string, FireEvent['category']> = {
          volcanoes: 'volcano',
          severeStorms: 'storm',
          floods: 'flood',
          earthquakes: 'earthquake',
          drought: 'drought',
          landslides: 'landslide',
          snow: 'storm',
          tempExtremes: 'storm',
        };
        return {
          id: event.id,
          title: event.title,
          lat: geo.coordinates[1],
          lon: geo.coordinates[0],
          brightness: 0,
          frp: 0,
          confidence: 'nominal',
          acq_date: geo.date?.substring(0, 10) || '',
          acq_time: '',
          date: geo.date,
          source: event.sources?.[0]?.id || 'NASA',
          link: event.sources?.[0]?.url,
          category: categoryMap[catId] || 'other',
        };
      })
      .filter(Boolean) as FireEvent[];
  } catch (e) {
    console.warn('Failed to fetch EONET events:', e);
    return [];
  }
};
