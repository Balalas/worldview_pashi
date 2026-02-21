import { Earthquake } from '@/store/worldview';

export const fetchEarthquakes = async (): Promise<Earthquake[]> => {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
    const data = await res.json();
    return data.features.map((f: any) => ({
      id: f.id,
      title: f.properties.title,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      magnitude: f.properties.mag,
      depth: f.geometry.coordinates[2],
      time: f.properties.time,
      place: f.properties.place,
      url: f.properties.url,
    }));
  } catch (e) {
    console.error('Failed to fetch earthquakes:', e);
    return [];
  }
};

// Generate simulated aircraft data
export const generateMockAircraft = () => {
  const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'China', 'Russia', 'Japan', 'Australia', 'India', 'Brazil', 'Canada', 'UAE'];
  const callsigns = ['BAW', 'DLH', 'AAL', 'UAL', 'AFR', 'KLM', 'SIA', 'QFA', 'THY', 'ELY', 'SWR', 'ANA', 'JAL', 'CPA', 'UAE', 'ETH'];
  const militaryCallsigns = ['RCH', 'EVAC', 'REACH', 'VIPER', 'HAWK', 'MAGIC', 'CONDOR', 'IRON'];
  const aircraft: any[] = [];

  for (let i = 0; i < 200; i++) {
    const isMil = Math.random() < 0.12;
    const prefix = isMil
      ? militaryCallsigns[Math.floor(Math.random() * militaryCallsigns.length)]
      : callsigns[Math.floor(Math.random() * callsigns.length)];
    const num = Math.floor(Math.random() * 9000 + 100);

    aircraft.push({
      icao24: Math.random().toString(16).slice(2, 8),
      callsign: `${prefix}${num}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      lat: (Math.random() * 140) - 60,
      lon: (Math.random() * 360) - 180,
      altitude: isMil ? Math.random() * 12000 + 3000 : Math.random() * 12000 + 8000,
      altitudeFt: 0,
      speedKts: Math.random() * 300 + 200,
      heading: Math.random() * 360,
      verticalRate: (Math.random() - 0.5) * 10,
      onGround: false,
      isMilitary: isMil,
    });
    aircraft[aircraft.length - 1].altitudeFt = Math.round(aircraft[aircraft.length - 1].altitude * 3.28084);
  }
  return aircraft;
};

// Generate simulated satellite data
export const generateMockSatellites = () => {
  const names = ['ISS (ZARYA)', 'STARLINK-1234', 'STARLINK-5678', 'COSMOS 2542', 'USA-326', 'NOAA-20', 'SENTINEL-2A', 'TERRA', 'LANDSAT-9', 'GPS IIF-12', 'MUOS-5', 'GOES-17', 'METEOSAT-11', 'ALOS-2', 'TIANGONG', 'STARLINK-2001', 'STARLINK-3042', 'FENGYUN-4A', 'JASON-3', 'CBERS-4A'];
  return names.map((name, i) => ({
    name,
    lat: (Math.random() * 140) - 70,
    lon: (Math.random() * 360) - 180,
    alt: name.includes('ISS') || name.includes('TIANGONG') ? 408 : Math.random() * 1200 + 300,
    velocity: name.includes('ISS') ? 7.66 : Math.random() * 4 + 5,
  }));
};
