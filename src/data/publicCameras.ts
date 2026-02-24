export interface PublicCamera {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  city: string;
  category: 'traffic' | 'city' | 'nature' | 'port' | 'airport' | 'landmark' | 'weather' | 'beach';
  embedUrl: string;
  source: string;
  heading?: number; // camera POV direction in degrees
}

export const PUBLIC_CAMERAS: PublicCamera[] = [
  // ── North America ──
  { id: 'nyc-ts', name: 'Times Square', lat: 40.758, lon: -73.9855, country: 'US', city: 'New York', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/AdUw5RdyZxI?autoplay=1&mute=1', source: 'EarthCam', heading: 180 },
  { id: 'nyc-liberty', name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445, country: 'US', city: 'New York', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/2FXSXB_5gq0?autoplay=1&mute=1', source: 'EarthCam', heading: 270 },
  { id: 'la-santa-monica', name: 'Santa Monica Pier', lat: 34.0095, lon: -118.4970, country: 'US', city: 'Los Angeles', category: 'beach', embedUrl: 'https://www.youtube.com/embed/NDhIQsOUamk?autoplay=1&mute=1', source: 'EarthCam', heading: 270 },
  { id: 'miami-beach', name: 'Miami Beach', lat: 25.7907, lon: -80.1300, country: 'US', city: 'Miami', category: 'beach', embedUrl: 'https://www.youtube.com/embed/INolBH0x-AM?autoplay=1&mute=1', source: 'EarthCam', heading: 90 },
  { id: 'sf-ghirardelli', name: 'Ghirardelli Square', lat: 37.8060, lon: -122.4230, country: 'US', city: 'San Francisco', category: 'city', embedUrl: 'https://www.youtube.com/embed/bMr8DKLE65U?autoplay=1&mute=1', source: 'EarthCam', heading: 0 },
  { id: 'vegas-strip', name: 'Las Vegas Strip', lat: 36.1147, lon: -115.1728, country: 'US', city: 'Las Vegas', category: 'city', embedUrl: 'https://www.youtube.com/embed/nLH9dys9CAU?autoplay=1&mute=1', source: 'EarthCam', heading: 200 },
  { id: 'chicago-skyline', name: 'Chicago Skyline', lat: 41.8781, lon: -87.6298, country: 'US', city: 'Chicago', category: 'city', embedUrl: 'https://www.youtube.com/embed/sA5SDXr67LI?autoplay=1&mute=1', source: 'EarthCam', heading: 90 },
  { id: 'bourbon-st', name: 'Bourbon Street', lat: 29.9584, lon: -90.0654, country: 'US', city: 'New Orleans', category: 'city', embedUrl: 'https://www.youtube.com/embed/QN4JE9TXKAY?autoplay=1&mute=1', source: 'EarthCam', heading: 45 },
  { id: 'nashville', name: 'Broadway Nashville', lat: 36.1627, lon: -86.7816, country: 'US', city: 'Nashville', category: 'city', embedUrl: 'https://www.youtube.com/embed/RfL--y0Q24c?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'dc-white-house', name: 'White House', lat: 38.8977, lon: -77.0365, country: 'US', city: 'Washington DC', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/vd3T3jmZhSQ?autoplay=1&mute=1', source: 'EarthCam', heading: 0 },
  { id: 'niagara', name: 'Niagara Falls', lat: 43.0896, lon: -79.0849, country: 'US', city: 'Niagara Falls', category: 'nature', embedUrl: 'https://www.youtube.com/embed/mJR6MbxcEBQ?autoplay=1&mute=1', source: 'EarthCam', heading: 180 },
  { id: 'toronto-cn', name: 'CN Tower Toronto', lat: 43.6426, lon: -79.3871, country: 'CA', city: 'Toronto', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/M9oXMzN-jzI?autoplay=1&mute=1', source: 'Webcam', heading: 180 },
  { id: 'mexico-zocalo', name: 'Zócalo Mexico City', lat: 19.4326, lon: -99.1332, country: 'MX', city: 'Mexico City', category: 'city', embedUrl: 'https://www.youtube.com/embed/05K-Gw7rpJU?autoplay=1&mute=1', source: 'Webcam', heading: 0 },

  // ── Europe ──
  { id: 'london-abbey', name: 'Abbey Road', lat: 51.5320, lon: -0.1783, country: 'GB', city: 'London', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/rPQbmaqzE3E?autoplay=1&mute=1', source: 'EarthCam', heading: 160 },
  { id: 'london-parliament', name: 'Parliament Square', lat: 51.5010, lon: -0.1246, country: 'GB', city: 'London', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/hiMiT5dDBqo?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'paris-eiffel', name: 'Eiffel Tower', lat: 48.8584, lon: 2.2945, country: 'FR', city: 'Paris', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/vLfAtCbE_Jc?autoplay=1&mute=1', source: 'Webcam', heading: 315 },
  { id: 'amsterdam', name: 'Amsterdam Canals', lat: 52.3676, lon: 4.9041, country: 'NL', city: 'Amsterdam', category: 'city', embedUrl: 'https://www.youtube.com/embed/t1ym2dcyBvQ?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'venice', name: 'Venice Grand Canal', lat: 45.4371, lon: 12.3326, country: 'IT', city: 'Venice', category: 'city', embedUrl: 'https://www.youtube.com/embed/vPwA4a0Lz8A?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 90 },
  { id: 'rome-pantheon', name: 'Pantheon Rome', lat: 41.8986, lon: 12.4769, country: 'IT', city: 'Rome', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/P8tH9UhvJxM?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 180 },
  { id: 'rome-trevi', name: 'Trevi Fountain', lat: 41.9009, lon: 12.4833, country: 'IT', city: 'Rome', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/8qTpE82vU6U?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 45 },
  { id: 'naples-vesuvius', name: 'Mt. Vesuvius', lat: 40.8218, lon: 14.4261, country: 'IT', city: 'Naples', category: 'nature', embedUrl: 'https://www.youtube.com/embed/oK6P-kRrUGo?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 90 },
  { id: 'dublin', name: 'Dublin City', lat: 53.3498, lon: -6.2603, country: 'IE', city: 'Dublin', category: 'city', embedUrl: 'https://www.youtube.com/embed/ByED80IKdIU?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 0 },
  { id: 'barcelona-rambla', name: 'La Rambla', lat: 41.3818, lon: 2.1700, country: 'ES', city: 'Barcelona', category: 'city', embedUrl: 'https://www.youtube.com/embed/CcRBbckqvEg?autoplay=1&mute=1', source: 'Webcam', heading: 200 },
  { id: 'prague', name: 'Old Town Square', lat: 50.0875, lon: 14.4213, country: 'CZ', city: 'Prague', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/0TpMLFBPRmo?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'berlin-gate', name: 'Brandenburg Gate', lat: 52.5163, lon: 13.3777, country: 'DE', city: 'Berlin', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/fWkR2s_k2zo?autoplay=1&mute=1', source: 'Webcam', heading: 270 },
  { id: 'stockholm', name: 'Stockholm Harbour', lat: 59.3293, lon: 18.0686, country: 'SE', city: 'Stockholm', category: 'port', embedUrl: 'https://www.youtube.com/embed/8Sj8S7oX3R4?autoplay=1&mute=1', source: 'Webcam', heading: 180 },
  { id: 'helsinki', name: 'Helsinki Cathedral', lat: 60.1699, lon: 24.9384, country: 'FI', city: 'Helsinki', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/s_Bib6_h_eA?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'zagreb', name: 'Ban Jelačić Square', lat: 45.8131, lon: 15.9775, country: 'HR', city: 'Zagreb', category: 'city', embedUrl: 'https://www.youtube.com/embed/IZJRRJL3GOg?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'santorini', name: 'Santorini Sunset', lat: 36.3932, lon: 25.4615, country: 'GR', city: 'Santorini', category: 'nature', embedUrl: 'https://www.youtube.com/embed/aHZDRGMwsGs?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 270 },

  // ── Asia ──
  { id: 'tokyo-shibuya', name: 'Shibuya Crossing', lat: 35.6595, lon: 139.7004, country: 'JP', city: 'Tokyo', category: 'traffic', embedUrl: 'https://www.youtube.com/embed/DjdUEyjx8GM?autoplay=1&mute=1', source: 'LIVE Camera', heading: 180 },
  { id: 'tokyo-shinjuku', name: 'Shinjuku Station', lat: 35.6896, lon: 139.7006, country: 'JP', city: 'Tokyo', category: 'traffic', embedUrl: 'https://www.youtube.com/embed/gFRtAAmiFbE?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'seoul-gangnam', name: 'Gangnam Seoul', lat: 37.4979, lon: 127.0276, country: 'KR', city: 'Seoul', category: 'city', embedUrl: 'https://www.youtube.com/embed/3BnZdo21HGc?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'bangkok', name: 'Bangkok Skyline', lat: 13.7563, lon: 100.5018, country: 'TH', city: 'Bangkok', category: 'city', embedUrl: 'https://www.youtube.com/embed/gFRtAAmiFbE?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'singapore', name: 'Marina Bay', lat: 1.2838, lon: 103.8591, country: 'SG', city: 'Singapore', category: 'city', embedUrl: 'https://www.youtube.com/embed/16UBrkLFLBI?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'hk-victoria', name: 'Victoria Harbour', lat: 22.2855, lon: 114.1577, country: 'HK', city: 'Hong Kong', category: 'port', embedUrl: 'https://www.youtube.com/embed/3SKxm5JVH_o?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'istanbul', name: 'Istanbul Bosphorus', lat: 41.0082, lon: 28.9784, country: 'TR', city: 'Istanbul', category: 'port', embedUrl: 'https://www.youtube.com/embed/LcqDdFQviR0?autoplay=1&mute=1', source: 'Webcam', heading: 45 },
  { id: 'dubai-burj', name: 'Burj Khalifa', lat: 25.1972, lon: 55.2744, country: 'AE', city: 'Dubai', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/7pbqGU-hGKg?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'delhi', name: 'India Gate Delhi', lat: 28.6129, lon: 77.2295, country: 'IN', city: 'Delhi', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/MNe8MPlMJGk?autoplay=1&mute=1', source: 'NDTV', heading: 0 },
  { id: 'jerusalem', name: 'Western Wall', lat: 31.7767, lon: 35.2345, country: 'IL', city: 'Jerusalem', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/DJnv37ORJOE?autoplay=1&mute=1', source: 'Webcam', heading: 270 },
  { id: 'mecca', name: 'Masjid al-Haram', lat: 21.4225, lon: 39.8262, country: 'SA', city: 'Mecca', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/5TY28us7jYk?autoplay=1&mute=1', source: 'Webcam', heading: 0 },

  // ── Oceania ──
  { id: 'sydney-opera', name: 'Sydney Opera House', lat: -33.8568, lon: 151.2153, country: 'AU', city: 'Sydney', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/OhDpK0wnEYk?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'bondi', name: 'Bondi Beach', lat: -33.8915, lon: 151.2767, country: 'AU', city: 'Sydney', category: 'beach', embedUrl: 'https://www.youtube.com/embed/UFNW2kW7YIo?autoplay=1&mute=1', source: 'CoastalWatch', heading: 90 },
  { id: 'auckland', name: 'Auckland Harbour', lat: -36.8485, lon: 174.7633, country: 'NZ', city: 'Auckland', category: 'port', embedUrl: 'https://www.youtube.com/embed/L2HKKpMvxjk?autoplay=1&mute=1', source: 'Webcam', heading: 0 },

  // ── South America ──
  { id: 'rio-copacabana', name: 'Copacabana Beach', lat: -22.9711, lon: -43.1826, country: 'BR', city: 'Rio de Janeiro', category: 'beach', embedUrl: 'https://www.youtube.com/embed/dQd6j6SkAEI?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'buenos-aires', name: 'Buenos Aires Obelisk', lat: -34.6037, lon: -58.3816, country: 'AR', city: 'Buenos Aires', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/JzlfFhnlCys?autoplay=1&mute=1', source: 'Webcam', heading: 0 },

  // ── Africa ──
  { id: 'cape-town', name: 'Table Mountain', lat: -33.9628, lon: 18.4098, country: 'ZA', city: 'Cape Town', category: 'nature', embedUrl: 'https://www.youtube.com/embed/TWxqvRPtF3E?autoplay=1&mute=1', source: 'Webcam', heading: 180 },
  { id: 'african-water', name: 'African Waterhole', lat: -24.0167, lon: 31.4833, country: 'ZA', city: 'Kruger NP', category: 'nature', embedUrl: 'https://www.youtube.com/embed/ydYDqZQpim8?autoplay=1&mute=1', source: 'Explore.org', heading: 0 },

  // ── Arctic / Space ──
  { id: 'iceland-lights', name: 'Northern Lights', lat: 64.1466, lon: -21.9426, country: 'IS', city: 'Reykjavik', category: 'nature', embedUrl: 'https://www.youtube.com/embed/PVTMCwlY3cQ?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'svalbard', name: 'Svalbard Longyearbyen', lat: 78.2232, lon: 15.6267, country: 'NO', city: 'Longyearbyen', category: 'nature', embedUrl: 'https://www.youtube.com/embed/U1E1HkBMb4M?autoplay=1&mute=1', source: 'Webcam', heading: 180 },
];
