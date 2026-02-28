// Air quality data from OpenAQ v3 (free, no key needed for v2 legacy)

export interface AirQualityStation {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  aqi: number; // PM2.5-based AQI
  pm25: number;
  pm10?: number;
  o3?: number;
  no2?: number;
  lastUpdated: string;
  level: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
}

function pm25ToAqi(pm25: number): number {
  if (pm25 <= 12) return Math.round((50 / 12) * pm25);
  if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
  if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
  if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
  if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
  return Math.round(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301);
}

function aqiLevel(aqi: number): AirQualityStation['level'] {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy_sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very_unhealthy';
  return 'hazardous';
}

// Fetch from WAQI (World Air Quality Index) public API - free, no key
export const fetchAirQuality = async (): Promise<AirQualityStation[]> => {
  try {
    // Use the WAQI map API for global data
    const cities = [
      'beijing', 'delhi', 'mumbai', 'shanghai', 'tokyo', 'seoul',
      'london', 'paris', 'berlin', 'moscow', 'istanbul',
      'new york', 'los angeles', 'mexico city', 'sao paulo',
      'cairo', 'lagos', 'nairobi', 'johannesburg',
      'dubai', 'bangkok', 'jakarta', 'manila', 'dhaka',
      'sydney', 'singapore', 'hong kong', 'taipei',
      'karachi', 'tehran', 'baghdad', 'riyadh',
      'lima', 'bogota', 'buenos aires', 'santiago',
    ];

    const results = await Promise.allSettled(
      cities.map(async (city) => {
        const res = await fetch(`https://api.waqi.info/feed/${city}/?token=demo`);
        const data = await res.json();
        if (data.status === 'ok' && data.data) {
          const d = data.data;
          const pm25 = d.iaqi?.pm25?.v ?? d.aqi ?? 0;
          const aqi = typeof d.aqi === 'number' ? d.aqi : pm25ToAqi(pm25);
          return {
            id: String(d.idx),
            name: d.city?.name || city,
            city: city.charAt(0).toUpperCase() + city.slice(1),
            country: d.city?.name?.split(',').pop()?.trim() || '',
            lat: d.city?.geo?.[0] ?? 0,
            lon: d.city?.geo?.[1] ?? 0,
            aqi,
            pm25,
            pm10: d.iaqi?.pm10?.v,
            o3: d.iaqi?.o3?.v,
            no2: d.iaqi?.no2?.v,
            lastUpdated: d.time?.iso || new Date().toISOString(),
            level: aqiLevel(aqi),
          } as AirQualityStation;
        }
        return null;
      })
    );

    return results
      .filter((r): r is PromiseFulfilledResult<AirQualityStation | null> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((s): s is AirQualityStation => s !== null && s.lat !== 0);
  } catch (e) {
    console.warn('Failed to fetch air quality:', e);
    return [];
  }
};
