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
  heading?: number;
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
  { id: 'hawaii-waikiki', name: 'Waikiki Beach', lat: 21.2766, lon: -157.8275, country: 'US', city: 'Honolulu', category: 'beach', embedUrl: 'https://www.youtube.com/embed/LhS_sfKwIHQ?autoplay=1&mute=1', source: 'EarthCam', heading: 180 },
  { id: 'la-hollywood', name: 'Hollywood Sign', lat: 34.1341, lon: -118.3215, country: 'US', city: 'Los Angeles', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/IJEBpHqCQ-c?autoplay=1&mute=1', source: 'EarthCam', heading: 0 },
  { id: 'sf-gg-bridge', name: 'Golden Gate Bridge', lat: 37.8199, lon: -122.4783, country: 'US', city: 'San Francisco', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/X6xkDPPCyao?autoplay=1&mute=1', source: 'EarthCam', heading: 180 },
  { id: 'boston-harbor', name: 'Boston Harbor', lat: 42.3601, lon: -71.0478, country: 'US', city: 'Boston', category: 'port', embedUrl: 'https://www.youtube.com/embed/ZxjnCKxvSgY?autoplay=1&mute=1', source: 'EarthCam', heading: 90 },
  { id: 'seattle-pike', name: 'Pike Place Market', lat: 47.6097, lon: -122.3425, country: 'US', city: 'Seattle', category: 'city', embedUrl: 'https://www.youtube.com/embed/sAsRtZEGMMQ?autoplay=1&mute=1', source: 'EarthCam', heading: 270 },
  { id: 'denver-downtown', name: 'Denver Downtown', lat: 39.7392, lon: -104.9903, country: 'US', city: 'Denver', category: 'city', embedUrl: 'https://www.youtube.com/embed/TxgaeCKiqY4?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'vancouver-harbour', name: 'Vancouver Harbour', lat: 49.2827, lon: -123.1207, country: 'CA', city: 'Vancouver', category: 'port', embedUrl: 'https://www.youtube.com/embed/F6KHfGfN_Xg?autoplay=1&mute=1', source: 'Webcam', heading: 180 },
  { id: 'montreal-oldport', name: 'Old Port Montreal', lat: 45.5017, lon: -73.5540, country: 'CA', city: 'Montreal', category: 'port', embedUrl: 'https://www.youtube.com/embed/WQyBNiwCL5o?autoplay=1&mute=1', source: 'Webcam', heading: 90 },

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
  { id: 'vienna-stephansdom', name: 'Stephansdom Vienna', lat: 48.2082, lon: 16.3738, country: 'AT', city: 'Vienna', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/pY6cxqpWMks?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'lisbon-commerce', name: 'Commerce Square', lat: 38.7077, lon: -9.1365, country: 'PT', city: 'Lisbon', category: 'city', embedUrl: 'https://www.youtube.com/embed/K-J36drRV-g?autoplay=1&mute=1', source: 'Webcam', heading: 180 },
  { id: 'madrid-puerta', name: 'Puerta del Sol', lat: 40.4168, lon: -3.7038, country: 'ES', city: 'Madrid', category: 'city', embedUrl: 'https://www.youtube.com/embed/Tj2xbwgmJEE?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'munich-marienplatz', name: 'Marienplatz Munich', lat: 48.1371, lon: 11.5754, country: 'DE', city: 'Munich', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/Wv_d7XcBu14?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'oslo-harbour', name: 'Oslo Harbour', lat: 59.9139, lon: 10.7522, country: 'NO', city: 'Oslo', category: 'port', embedUrl: 'https://www.youtube.com/embed/9gqP9AYm4C4?autoplay=1&mute=1', source: 'Webcam', heading: 180 },
  { id: 'copenhagen-nyhavn', name: 'Nyhavn Copenhagen', lat: 55.6794, lon: 12.5876, country: 'DK', city: 'Copenhagen', category: 'city', embedUrl: 'https://www.youtube.com/embed/DYx_wEfuHxE?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'warsaw-old-town', name: 'Warsaw Old Town', lat: 52.2497, lon: 21.0122, country: 'PL', city: 'Warsaw', category: 'city', embedUrl: 'https://www.youtube.com/embed/xfBFHmNqJmo?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'budapest-parliament', name: 'Parliament Budapest', lat: 47.5072, lon: 19.0452, country: 'HU', city: 'Budapest', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/i6rlK_l8tds?autoplay=1&mute=1', source: 'Webcam', heading: 270 },
  { id: 'athens-acropolis', name: 'Acropolis Athens', lat: 37.9715, lon: 23.7267, country: 'GR', city: 'Athens', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/6HVRr4Z0c7w?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'edinburgh-castle', name: 'Edinburgh Castle', lat: 55.9486, lon: -3.1999, country: 'GB', city: 'Edinburgh', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/E2stBdHfXys?autoplay=1&mute=1', source: 'Webcam', heading: 180 },
  { id: 'florence-duomo', name: 'Duomo Florence', lat: 43.7731, lon: 11.2560, country: 'IT', city: 'Florence', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/6MeGHQT6Jt4?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 0 },
  { id: 'milan-duomo', name: 'Duomo Milan', lat: 45.4642, lon: 9.1900, country: 'IT', city: 'Milan', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/qjX1YSTnm3c?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 90 },

  // ── Asia ──
  { id: 'tokyo-shibuya', name: 'Shibuya Crossing', lat: 35.6595, lon: 139.7004, country: 'JP', city: 'Tokyo', category: 'traffic', embedUrl: 'https://www.youtube.com/embed/DjdUEyjx8GM?autoplay=1&mute=1', source: 'LIVE Camera', heading: 180 },
  { id: 'tokyo-shinjuku', name: 'Shinjuku Station', lat: 35.6896, lon: 139.7006, country: 'JP', city: 'Tokyo', category: 'traffic', embedUrl: 'https://www.youtube.com/embed/gFRtAAmiFbE?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'tokyo-skytree', name: 'Tokyo Skytree', lat: 35.7101, lon: 139.8107, country: 'JP', city: 'Tokyo', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/t_lxCjMGK60?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'seoul-gangnam', name: 'Gangnam Seoul', lat: 37.4979, lon: 127.0276, country: 'KR', city: 'Seoul', category: 'city', embedUrl: 'https://www.youtube.com/embed/3BnZdo21HGc?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'bangkok', name: 'Bangkok Skyline', lat: 13.7563, lon: 100.5018, country: 'TH', city: 'Bangkok', category: 'city', embedUrl: 'https://www.youtube.com/embed/gFRtAAmiFbE?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'singapore', name: 'Marina Bay', lat: 1.2838, lon: 103.8591, country: 'SG', city: 'Singapore', category: 'city', embedUrl: 'https://www.youtube.com/embed/16UBrkLFLBI?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'hk-victoria', name: 'Victoria Harbour', lat: 22.2855, lon: 114.1577, country: 'HK', city: 'Hong Kong', category: 'port', embedUrl: 'https://www.youtube.com/embed/3SKxm5JVH_o?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'istanbul', name: 'Istanbul Bosphorus', lat: 41.0082, lon: 28.9784, country: 'TR', city: 'Istanbul', category: 'port', embedUrl: 'https://www.youtube.com/embed/LcqDdFQviR0?autoplay=1&mute=1', source: 'Webcam', heading: 45 },
  { id: 'dubai-burj', name: 'Burj Khalifa', lat: 25.1972, lon: 55.2744, country: 'AE', city: 'Dubai', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/7pbqGU-hGKg?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'delhi', name: 'India Gate Delhi', lat: 28.6129, lon: 77.2295, country: 'IN', city: 'Delhi', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/MNe8MPlMJGk?autoplay=1&mute=1', source: 'NDTV', heading: 0 },
  { id: 'jerusalem', name: 'Western Wall', lat: 31.7767, lon: 35.2345, country: 'IL', city: 'Jerusalem', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/DJnv37ORJOE?autoplay=1&mute=1', source: 'Webcam', heading: 270 },
  { id: 'mecca', name: 'Masjid al-Haram', lat: 21.4225, lon: 39.8262, country: 'SA', city: 'Mecca', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/5TY28us7jYk?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'osaka-dotonbori', name: 'Dotonbori Osaka', lat: 34.6687, lon: 135.5031, country: 'JP', city: 'Osaka', category: 'city', embedUrl: 'https://www.youtube.com/embed/iIp7T-vPg6o?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'taipei-101', name: 'Taipei 101', lat: 25.0339, lon: 121.5645, country: 'TW', city: 'Taipei', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/UVTEmfZxDQQ?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'mumbai-marine', name: 'Marine Drive Mumbai', lat: 18.9442, lon: 72.8234, country: 'IN', city: 'Mumbai', category: 'city', embedUrl: 'https://www.youtube.com/embed/pCyQIv0CGSY?autoplay=1&mute=1', source: 'Webcam', heading: 270 },
  { id: 'hanoi-hoan-kiem', name: 'Hoan Kiem Lake', lat: 21.0285, lon: 105.8542, country: 'VN', city: 'Hanoi', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/H2Y_k3tT4Ug?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'kuala-lumpur-towers', name: 'KL Twin Towers', lat: 3.1579, lon: 101.7116, country: 'MY', city: 'Kuala Lumpur', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/7D1_SxC1iKg?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'manila-bay', name: 'Manila Bay', lat: 14.5833, lon: 120.9667, country: 'PH', city: 'Manila', category: 'port', embedUrl: 'https://www.youtube.com/embed/Qgh3hSG52Lo?autoplay=1&mute=1', source: 'Webcam', heading: 270 },

  // ── Oceania ──
  { id: 'sydney-opera', name: 'Sydney Opera House', lat: -33.8568, lon: 151.2153, country: 'AU', city: 'Sydney', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/OhDpK0wnEYk?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'bondi', name: 'Bondi Beach', lat: -33.8915, lon: 151.2767, country: 'AU', city: 'Sydney', category: 'beach', embedUrl: 'https://www.youtube.com/embed/UFNW2kW7YIo?autoplay=1&mute=1', source: 'CoastalWatch', heading: 90 },
  { id: 'auckland', name: 'Auckland Harbour', lat: -36.8485, lon: 174.7633, country: 'NZ', city: 'Auckland', category: 'port', embedUrl: 'https://www.youtube.com/embed/L2HKKpMvxjk?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'melbourne-flinders', name: 'Flinders St Melbourne', lat: -37.8183, lon: 144.9671, country: 'AU', city: 'Melbourne', category: 'city', embedUrl: 'https://www.youtube.com/embed/RYfHU3mEwuY?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'perth-beach', name: 'Cottesloe Beach', lat: -31.9911, lon: 115.7515, country: 'AU', city: 'Perth', category: 'beach', embedUrl: 'https://www.youtube.com/embed/3hVq-pO_u9w?autoplay=1&mute=1', source: 'Webcam', heading: 270 },

  // ── South America ──
  { id: 'rio-copacabana', name: 'Copacabana Beach', lat: -22.9711, lon: -43.1826, country: 'BR', city: 'Rio de Janeiro', category: 'beach', embedUrl: 'https://www.youtube.com/embed/dQd6j6SkAEI?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'buenos-aires', name: 'Buenos Aires Obelisk', lat: -34.6037, lon: -58.3816, country: 'AR', city: 'Buenos Aires', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/JzlfFhnlCys?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'bogota-plaza', name: 'Plaza Bolívar Bogotá', lat: 4.5981, lon: -74.0758, country: 'CO', city: 'Bogotá', category: 'city', embedUrl: 'https://www.youtube.com/embed/4v8_7NBCRF4?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'lima-miraflores', name: 'Miraflores Lima', lat: -12.1214, lon: -77.0300, country: 'PE', city: 'Lima', category: 'city', embedUrl: 'https://www.youtube.com/embed/2PY_Gl27LWQ?autoplay=1&mute=1', source: 'Webcam', heading: 270 },
  { id: 'santiago-plaza', name: 'Plaza de Armas Santiago', lat: -33.4372, lon: -70.6506, country: 'CL', city: 'Santiago', category: 'city', embedUrl: 'https://www.youtube.com/embed/kFfzL7pnOWs?autoplay=1&mute=1', source: 'Webcam', heading: 90 },

  // ── Africa ──
  { id: 'cape-town', name: 'Table Mountain', lat: -33.9628, lon: 18.4098, country: 'ZA', city: 'Cape Town', category: 'nature', embedUrl: 'https://www.youtube.com/embed/TWxqvRPtF3E?autoplay=1&mute=1', source: 'Webcam', heading: 180 },
  { id: 'african-water', name: 'African Waterhole', lat: -24.0167, lon: 31.4833, country: 'ZA', city: 'Kruger NP', category: 'nature', embedUrl: 'https://www.youtube.com/embed/ydYDqZQpim8?autoplay=1&mute=1', source: 'Explore.org', heading: 0 },
  { id: 'nairobi-skyline', name: 'Nairobi Skyline', lat: -1.2864, lon: 36.8172, country: 'KE', city: 'Nairobi', category: 'city', embedUrl: 'https://www.youtube.com/embed/j0D04_NyJ3Y?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'cairo-pyramids', name: 'Pyramids of Giza', lat: 29.9792, lon: 31.1342, country: 'EG', city: 'Cairo', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/AlXd6m0zhZc?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'marrakech-jemaa', name: 'Jemaa el-Fnaa', lat: 31.6258, lon: -7.9891, country: 'MA', city: 'Marrakech', category: 'city', embedUrl: 'https://www.youtube.com/embed/DJLIbhGqXjQ?autoplay=1&mute=1', source: 'Webcam', heading: 90 },

  // ── Arctic / Space ──
  { id: 'iceland-lights', name: 'Northern Lights', lat: 64.1466, lon: -21.9426, country: 'IS', city: 'Reykjavik', category: 'nature', embedUrl: 'https://www.youtube.com/embed/PVTMCwlY3cQ?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'svalbard', name: 'Svalbard Longyearbyen', lat: 78.2232, lon: 15.6267, country: 'NO', city: 'Longyearbyen', category: 'nature', embedUrl: 'https://www.youtube.com/embed/U1E1HkBMb4M?autoplay=1&mute=1', source: 'Webcam', heading: 180 },

  // ── Airports ──
  { id: 'lax-runway', name: 'LAX Runway', lat: 33.9425, lon: -118.4081, country: 'US', city: 'Los Angeles', category: 'airport', embedUrl: 'https://www.youtube.com/embed/qNE-a9FpYkQ?autoplay=1&mute=1', source: 'EarthCam', heading: 90 },
  { id: 'sfo-runway', name: 'SFO Airport', lat: 37.6213, lon: -122.3790, country: 'US', city: 'San Francisco', category: 'airport', embedUrl: 'https://www.youtube.com/embed/ZZ_fWPDCL4A?autoplay=1&mute=1', source: 'Webcam', heading: 270 },
  { id: 'heathrow', name: 'Heathrow Airport', lat: 51.4700, lon: -0.4543, country: 'GB', city: 'London', category: 'airport', embedUrl: 'https://www.youtube.com/embed/BwU-SArqx4o?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'narita', name: 'Narita Airport', lat: 35.7647, lon: 140.3864, country: 'JP', city: 'Tokyo', category: 'airport', embedUrl: 'https://www.youtube.com/embed/T3VpN1DfhBc?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'changi', name: 'Changi Airport', lat: 1.3644, lon: 103.9915, country: 'SG', city: 'Singapore', category: 'airport', embedUrl: 'https://www.youtube.com/embed/7w6T8NQblZQ?autoplay=1&mute=1', source: 'Webcam', heading: 270 },
];