// IP Geolocation via ip-api.com (free, no key needed, 45 req/min)

export interface GeoLocation {
  lat: number;
  lon: number;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  timezone: string;
  isp: string;
  ip: string;
}

export const fetchUserLocation = async (): Promise<GeoLocation | null> => {
  try {
    const res = await fetch('http://ip-api.com/json/?fields=lat,lon,city,regionName,country,countryCode,timezone,isp,query');
    if (!res.ok) throw new Error('ip-api error');
    const data = await res.json();
    if (data.lat && data.lon) {
      return {
        lat: data.lat,
        lon: data.lon,
        city: data.city || '',
        region: data.regionName || '',
        country: data.country || '',
        countryCode: data.countryCode || '',
        timezone: data.timezone || '',
        isp: data.isp || '',
        ip: data.query || '',
      };
    }
    return null;
  } catch (e) {
    console.warn('Failed to geolocate user:', e);
    return null;
  }
};
