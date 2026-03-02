// Train tracking service — EU rail APIs

export interface TrainData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  type: 'highspeed' | 'intercity' | 'regional' | 'freight' | 'metro';
  operator: string;
  country: string;
  route?: string;
}

// Fetch Finnish trains from Digitraffic
const fetchFinnishTrains = async (): Promise<TrainData[]> => {
  try {
    const res = await fetch('https://rata.digitraffic.fi/api/v1/train-locations/latest/', {
      headers: { 'Digitraffic-User': 'worldview-app' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slice(0, 50).map((t: any) => ({
      id: `fi-${t.trainNumber}`,
      name: `Train ${t.trainNumber}`,
      lat: t.location?.coordinates?.[1] ?? 0,
      lon: t.location?.coordinates?.[0] ?? 0,
      speed: t.speed ?? 0,
      heading: 0,
      type: t.speed > 160 ? 'highspeed' : t.speed > 80 ? 'intercity' : 'regional',
      operator: 'VR',
      country: 'Finland',
    })).filter((t: TrainData) => t.lat !== 0);
  } catch {
    return [];
  }
};

// Fetch German trains from Deutsche Bahn transport.rest
const fetchGermanTrains = async (): Promise<TrainData[]> => {
  try {
    const north = 55.1, west = 5.8, south = 47.2, east = 15.1;
    const res = await fetch(
      `https://v6.db.transport.rest/radar?north=${north}&west=${west}&south=${south}&east=${east}&duration=30&frames=1`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.slice(0, 80).map((t: any, i: number) => {
      const frame = t.frames?.[0];
      const type: TrainData['type'] = t.line?.product === 'nationalExpress' ? 'highspeed' :
              t.line?.product === 'national' ? 'intercity' :
              t.line?.product === 'regional' ? 'regional' : 'regional';
      return {
        id: `de-${t.tripId || i}`,
        name: t.direction ? `→ ${t.direction}` : `Train ${i}`,
        lat: frame?.location?.latitude ?? 0,
        lon: frame?.location?.longitude ?? 0,
        speed: 0,
        heading: 0,
        type,
        operator: t.line?.operator?.name || 'DB',
        country: 'Germany',
        route: t.line?.name || '',
      } as TrainData;
    }).filter((t) => t.lat !== 0);
  } catch {
    return [];
  }
};

// Fetch Swiss trains from SBB API
const fetchSwissTrains = async (): Promise<TrainData[]> => {
  try {
    const res = await fetch('https://transport.opendata.ch/v1/connections?from=Zurich&to=Bern&limit=6');
    if (!res.ok) return [];
    const data = await res.json();
    const trains: TrainData[] = [];
    data.connections?.forEach((c: any, i: number) => {
      const dep = c.from?.station;
      if (dep?.coordinate) {
        trains.push({
          id: `ch-${i}`,
          name: c.products?.[0] || `SBB ${i}`,
          lat: dep.coordinate.x,
          lon: dep.coordinate.y,
          speed: 0,
          heading: 0,
          type: 'intercity',
          operator: 'SBB',
          country: 'Switzerland',
          route: `${c.from?.station?.name} → ${c.to?.station?.name}`,
        });
      }
    });
    return trains;
  } catch {
    return [];
  }
};

export const fetchLiveTrains = async (): Promise<TrainData[]> => {
  const [fi, de, ch] = await Promise.allSettled([
    fetchFinnishTrains(),
    fetchGermanTrains(),
    fetchSwissTrains(),
  ]);

  const trains: TrainData[] = [
    ...(fi.status === 'fulfilled' ? fi.value : []),
    ...(de.status === 'fulfilled' ? de.value : []),
    ...(ch.status === 'fulfilled' ? ch.value : []),
  ];

  console.log(`Fetched ${trains.length} trains (FI: ${fi.status === 'fulfilled' ? fi.value.length : 0}, DE: ${de.status === 'fulfilled' ? de.value.length : 0}, CH: ${ch.status === 'fulfilled' ? ch.value.length : 0})`);
  return trains;
};
