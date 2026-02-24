// Weather data from Open-Meteo (free, no API key needed)
export interface WeatherAlert {
  city: string;
  lat: number;
  lon: number;
  temp: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  isExtreme: boolean;
}

export interface VolcanoData {
  name: string;
  lat: number;
  lon: number;
  elevation: number;
  status: 'erupting' | 'warning' | 'elevated' | 'normal';
  lastEruption: string;
  country: string;
}

// Active/notable volcanoes (based on Smithsonian GVP data)
export const ACTIVE_VOLCANOES: VolcanoData[] = [
  { name: 'Kīlauea', lat: 19.421, lon: -155.287, elevation: 1222, status: 'erupting', lastEruption: '2024', country: 'US' },
  { name: 'Etna', lat: 37.748, lon: 15.002, elevation: 3357, status: 'erupting', lastEruption: '2024', country: 'Italy' },
  { name: 'Stromboli', lat: 38.789, lon: 15.213, elevation: 924, status: 'erupting', lastEruption: '2024', country: 'Italy' },
  { name: 'Sakurajima', lat: 31.585, lon: 130.657, elevation: 1117, status: 'erupting', lastEruption: '2024', country: 'Japan' },
  { name: 'Merapi', lat: -7.541, lon: 110.446, elevation: 2968, status: 'warning', lastEruption: '2023', country: 'Indonesia' },
  { name: 'Semeru', lat: -8.108, lon: 112.922, elevation: 3676, status: 'erupting', lastEruption: '2024', country: 'Indonesia' },
  { name: 'Popocatépetl', lat: 19.023, lon: -98.622, elevation: 5426, status: 'elevated', lastEruption: '2024', country: 'Mexico' },
  { name: 'Fuego', lat: 14.473, lon: -90.880, elevation: 3763, status: 'erupting', lastEruption: '2024', country: 'Guatemala' },
  { name: 'Sangay', lat: -2.005, lon: -78.341, elevation: 5230, status: 'erupting', lastEruption: '2024', country: 'Ecuador' },
  { name: 'Dukono', lat: 1.693, lon: 127.894, elevation: 1229, status: 'erupting', lastEruption: '2024', country: 'Indonesia' },
  { name: 'Erebus', lat: -77.530, lon: 167.153, elevation: 3794, status: 'elevated', lastEruption: '2023', country: 'Antarctica' },
  { name: 'Mauna Loa', lat: 19.475, lon: -155.608, elevation: 4170, status: 'elevated', lastEruption: '2022', country: 'US' },
  { name: 'Piton de la Fournaise', lat: -21.244, lon: 55.714, elevation: 2632, status: 'warning', lastEruption: '2024', country: 'France' },
  { name: 'Taal', lat: 14.002, lon: 120.993, elevation: 311, status: 'elevated', lastEruption: '2023', country: 'Philippines' },
  { name: 'Lewotolo', lat: -8.272, lon: 123.505, elevation: 1423, status: 'warning', lastEruption: '2024', country: 'Indonesia' },
  { name: 'Nevado del Ruiz', lat: 4.892, lon: -75.322, elevation: 5321, status: 'warning', lastEruption: '2024', country: 'Colombia' },
  { name: 'Sheveluch', lat: 56.653, lon: 161.360, elevation: 3283, status: 'erupting', lastEruption: '2024', country: 'Russia' },
  { name: 'Ebeko', lat: 50.686, lon: 156.014, elevation: 1156, status: 'erupting', lastEruption: '2024', country: 'Russia' },
];

// Major cities for weather monitoring
const WEATHER_CITIES = [
  { name: 'New York', lat: 40.71, lon: -74.01 },
  { name: 'London', lat: 51.51, lon: -0.13 },
  { name: 'Tokyo', lat: 35.68, lon: 139.69 },
  { name: 'Dubai', lat: 25.20, lon: 55.27 },
  { name: 'Sydney', lat: -33.87, lon: 151.21 },
  { name: 'Moscow', lat: 55.76, lon: 37.62 },
  { name: 'Mumbai', lat: 19.08, lon: 72.88 },
  { name: 'São Paulo', lat: -23.55, lon: -46.63 },
  { name: 'Cairo', lat: 30.04, lon: 31.24 },
  { name: 'Beijing', lat: 39.90, lon: 116.41 },
  { name: 'Lagos', lat: 6.52, lon: 3.38 },
  { name: 'Singapore', lat: 1.35, lon: 103.82 },
];

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
  55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Severe thunderstorm',
};

export const fetchGlobalWeather = async (): Promise<WeatherAlert[]> => {
  try {
    const lats = WEATHER_CITIES.map(c => c.lat).join(',');
    const lons = WEATHER_CITIES.map(c => c.lon).join(',');

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`
    );

    if (!res.ok) return [];
    const data = await res.json();

    // Open-Meteo returns array for multiple locations
    const results: WeatherAlert[] = [];
    const items = Array.isArray(data) ? data : [data];

    items.forEach((item: any, i: number) => {
      if (!item.current) return;
      const code = item.current.weather_code || 0;
      const temp = item.current.temperature_2m || 0;
      const wind = item.current.wind_speed_10m || 0;
      const isExtreme = code >= 95 || temp > 45 || temp < -30 || wind > 80;

      results.push({
        city: WEATHER_CITIES[i]?.name || `City ${i}`,
        lat: WEATHER_CITIES[i]?.lat || 0,
        lon: WEATHER_CITIES[i]?.lon || 0,
        temp,
        windSpeed: wind,
        weatherCode: code,
        description: WMO_DESCRIPTIONS[code] || 'Unknown',
        isExtreme,
      });
    });

    return results;
  } catch (e) {
    console.warn('Failed to fetch weather:', e);
    return [];
  }
};
