// NOAA Space Weather Prediction Center — Solar flares, geomagnetic storms, CMEs
// Free, no API key required

export interface SolarFlare {
  id: string;
  beginTime: string;
  peakTime: string;
  endTime: string;
  classType: string; // e.g. 'M1.2', 'X2.3'
  sourceLocation: string;
  activeRegion?: number;
  link?: string;
}

export interface GeomagneticStorm {
  observedTime: string;
  kpIndex: number; // 0-9
  stormLevel: 'none' | 'minor' | 'moderate' | 'strong' | 'severe' | 'extreme';
}

export interface SolarSnapshot {
  flares: SolarFlare[];
  kpIndex: number | null;
  stormLevel: string;
  solarWind: { speed: number; density: number } | null;
}

export const fetchSolarFlares = async (): Promise<SolarFlare[]> => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const start = weekAgo.toISOString().split('T')[0];
    const end = now.toISOString().split('T')[0];
    const res = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${start}&endDate=${end}&api_key=DEMO_KEY`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 20).map((f: any) => ({
      id: f.flrID || `flr-${f.beginTime}`,
      beginTime: f.beginTime,
      peakTime: f.peakTime,
      endTime: f.endTime,
      classType: f.classType || 'Unknown',
      sourceLocation: f.sourceLocation || '',
      activeRegion: f.activeRegionNum,
      link: f.link,
    }));
  } catch (e) {
    console.warn('Failed to fetch solar flares:', e);
    return [];
  }
};

export const fetchKpIndex = async (): Promise<GeomagneticStorm[]> => {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
    if (!res.ok) return [];
    const data = await res.json();
    // First row is headers, rest is data
    return data.slice(1).slice(-24).map((row: any[]) => {
      const kp = parseFloat(row[1]);
      let level: GeomagneticStorm['stormLevel'] = 'none';
      if (kp >= 9) level = 'extreme';
      else if (kp >= 8) level = 'severe';
      else if (kp >= 7) level = 'strong';
      else if (kp >= 6) level = 'moderate';
      else if (kp >= 5) level = 'minor';
      return { observedTime: row[0], kpIndex: kp, stormLevel: level };
    });
  } catch (e) {
    console.warn('Failed to fetch Kp index:', e);
    return [];
  }
};

export const fetchSolarWind = async (): Promise<{ speed: number; density: number } | null> => {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json');
    const densityRes = await fetch('https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json');
    if (!res.ok) return null;
    const speedData = await res.json();
    const densityData = densityRes.ok ? await densityRes.json() : null;
    return {
      speed: parseFloat(speedData.WindSpeed) || 0,
      density: densityData ? parseFloat(densityData.Bt) || 0 : 0,
    };
  } catch (e) {
    console.warn('Failed to fetch solar wind:', e);
    return null;
  }
};

export const fetchSolarSnapshot = async (): Promise<SolarSnapshot> => {
  const [flares, kpData, solarWind] = await Promise.all([
    fetchSolarFlares(),
    fetchKpIndex(),
    fetchSolarWind(),
  ]);
  const latestKp = kpData.length > 0 ? kpData[kpData.length - 1] : null;
  return {
    flares,
    kpIndex: latestKp?.kpIndex ?? null,
    stormLevel: latestKp?.stormLevel ?? 'none',
    solarWind,
  };
};
