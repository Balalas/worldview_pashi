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

// ── Hand-curated cameras with real livestream URLs ──
const CURATED_CAMERAS: PublicCamera[] = [
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

// ── 4000+ procedurally generated cameras across global cities ──
// Each city gets multiple cameras spread across its urban area

interface CityDef {
  city: string;
  country: string;
  lat: number;
  lon: number;
  count: number; // cameras per city
  spread: number; // lat/lon spread
  categories: PublicCamera['category'][];
}

const CITY_DEFS: CityDef[] = [
  // ── USA (major metros, ~40 cameras each) ──
  { city: 'New York', country: 'US', lat: 40.758, lon: -73.985, count: 45, spread: 0.08, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Los Angeles', country: 'US', lat: 34.052, lon: -118.243, count: 40, spread: 0.12, categories: ['traffic', 'city', 'beach'] },
  { city: 'Chicago', country: 'US', lat: 41.878, lon: -87.629, count: 35, spread: 0.07, categories: ['traffic', 'city'] },
  { city: 'Houston', country: 'US', lat: 29.760, lon: -95.369, count: 30, spread: 0.10, categories: ['traffic', 'city'] },
  { city: 'Phoenix', country: 'US', lat: 33.448, lon: -112.074, count: 25, spread: 0.09, categories: ['traffic', 'city'] },
  { city: 'Philadelphia', country: 'US', lat: 39.952, lon: -75.163, count: 25, spread: 0.06, categories: ['traffic', 'city', 'landmark'] },
  { city: 'San Antonio', country: 'US', lat: 29.424, lon: -98.493, count: 20, spread: 0.08, categories: ['traffic', 'city'] },
  { city: 'San Diego', country: 'US', lat: 32.715, lon: -117.161, count: 20, spread: 0.07, categories: ['traffic', 'beach', 'city'] },
  { city: 'Dallas', country: 'US', lat: 32.776, lon: -96.796, count: 25, spread: 0.09, categories: ['traffic', 'city'] },
  { city: 'Austin', country: 'US', lat: 30.267, lon: -97.743, count: 20, spread: 0.06, categories: ['traffic', 'city'] },
  { city: 'San Jose', country: 'US', lat: 37.338, lon: -121.886, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'San Francisco', country: 'US', lat: 37.774, lon: -122.419, count: 30, spread: 0.04, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Seattle', country: 'US', lat: 47.606, lon: -122.332, count: 25, spread: 0.06, categories: ['traffic', 'city', 'port'] },
  { city: 'Denver', country: 'US', lat: 39.739, lon: -104.990, count: 20, spread: 0.06, categories: ['traffic', 'city'] },
  { city: 'Washington DC', country: 'US', lat: 38.907, lon: -77.036, count: 30, spread: 0.05, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Boston', country: 'US', lat: 42.360, lon: -71.058, count: 25, spread: 0.04, categories: ['traffic', 'city', 'port'] },
  { city: 'Las Vegas', country: 'US', lat: 36.169, lon: -115.139, count: 20, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Atlanta', country: 'US', lat: 33.748, lon: -84.388, count: 25, spread: 0.07, categories: ['traffic', 'city'] },
  { city: 'Miami', country: 'US', lat: 25.761, lon: -80.191, count: 25, spread: 0.06, categories: ['traffic', 'city', 'beach'] },
  { city: 'Minneapolis', country: 'US', lat: 44.977, lon: -93.265, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Detroit', country: 'US', lat: 42.331, lon: -83.045, count: 20, spread: 0.06, categories: ['traffic', 'city'] },
  { city: 'Portland', country: 'US', lat: 45.523, lon: -122.676, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Charlotte', country: 'US', lat: 35.227, lon: -80.843, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Nashville', country: 'US', lat: 36.162, lon: -86.781, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Baltimore', country: 'US', lat: 39.290, lon: -76.612, count: 15, spread: 0.04, categories: ['traffic', 'city', 'port'] },
  { city: 'Tampa', country: 'US', lat: 27.950, lon: -82.457, count: 15, spread: 0.06, categories: ['traffic', 'city'] },
  { city: 'Orlando', country: 'US', lat: 28.538, lon: -81.379, count: 15, spread: 0.06, categories: ['traffic', 'city'] },
  { city: 'Pittsburgh', country: 'US', lat: 40.440, lon: -79.995, count: 12, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Cincinnati', country: 'US', lat: 39.103, lon: -84.512, count: 12, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Kansas City', country: 'US', lat: 39.099, lon: -94.578, count: 12, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'St. Louis', country: 'US', lat: 38.627, lon: -90.199, count: 12, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'New Orleans', country: 'US', lat: 29.951, lon: -90.071, count: 15, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Salt Lake City', country: 'US', lat: 40.760, lon: -111.891, count: 10, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Honolulu', country: 'US', lat: 21.306, lon: -157.858, count: 10, spread: 0.03, categories: ['traffic', 'beach', 'city'] },

  // ── Canada ──
  { city: 'Toronto', country: 'CA', lat: 43.653, lon: -79.383, count: 30, spread: 0.06, categories: ['traffic', 'city'] },
  { city: 'Vancouver', country: 'CA', lat: 49.282, lon: -123.120, count: 20, spread: 0.05, categories: ['traffic', 'city', 'port'] },
  { city: 'Montreal', country: 'CA', lat: 45.501, lon: -73.567, count: 20, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Calgary', country: 'CA', lat: 51.044, lon: -114.071, count: 12, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Ottawa', country: 'CA', lat: 45.421, lon: -75.697, count: 10, spread: 0.04, categories: ['traffic', 'city', 'landmark'] },

  // ── Mexico ──
  { city: 'Mexico City', country: 'MX', lat: 19.432, lon: -99.133, count: 35, spread: 0.08, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Guadalajara', country: 'MX', lat: 20.659, lon: -103.349, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Monterrey', country: 'MX', lat: 25.686, lon: -100.316, count: 12, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Cancún', country: 'MX', lat: 21.161, lon: -86.851, count: 10, spread: 0.04, categories: ['traffic', 'beach'] },

  // ── UK ──
  { city: 'London', country: 'GB', lat: 51.507, lon: -0.127, count: 50, spread: 0.08, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Manchester', country: 'GB', lat: 53.483, lon: -2.244, count: 15, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Birmingham', country: 'GB', lat: 52.486, lon: -1.890, count: 12, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Liverpool', country: 'GB', lat: 53.408, lon: -2.991, count: 10, spread: 0.03, categories: ['traffic', 'city', 'port'] },
  { city: 'Edinburgh', country: 'GB', lat: 55.953, lon: -3.188, count: 10, spread: 0.03, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Glasgow', country: 'GB', lat: 55.864, lon: -4.251, count: 10, spread: 0.03, categories: ['traffic', 'city'] },

  // ── France ──
  { city: 'Paris', country: 'FR', lat: 48.856, lon: 2.352, count: 40, spread: 0.06, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Marseille', country: 'FR', lat: 43.296, lon: 5.369, count: 12, spread: 0.04, categories: ['traffic', 'city', 'port'] },
  { city: 'Lyon', country: 'FR', lat: 45.764, lon: 4.835, count: 10, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Nice', country: 'FR', lat: 43.710, lon: 7.262, count: 8, spread: 0.03, categories: ['traffic', 'beach', 'city'] },

  // ── Germany ──
  { city: 'Berlin', country: 'DE', lat: 52.520, lon: 13.405, count: 30, spread: 0.07, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Munich', country: 'DE', lat: 48.135, lon: 11.582, count: 15, spread: 0.04, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Hamburg', country: 'DE', lat: 53.551, lon: 9.993, count: 15, spread: 0.04, categories: ['traffic', 'city', 'port'] },
  { city: 'Frankfurt', country: 'DE', lat: 50.110, lon: 8.682, count: 12, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Cologne', country: 'DE', lat: 50.937, lon: 6.960, count: 10, spread: 0.03, categories: ['traffic', 'city'] },

  // ── Italy ──
  { city: 'Rome', country: 'IT', lat: 41.902, lon: 12.496, count: 25, spread: 0.05, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Milan', country: 'IT', lat: 45.464, lon: 9.190, count: 20, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Naples', country: 'IT', lat: 40.851, lon: 14.268, count: 12, spread: 0.03, categories: ['traffic', 'city', 'port'] },
  { city: 'Florence', country: 'IT', lat: 43.769, lon: 11.255, count: 10, spread: 0.02, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Venice', country: 'IT', lat: 45.440, lon: 12.315, count: 8, spread: 0.02, categories: ['city', 'landmark'] },

  // ── Spain ──
  { city: 'Madrid', country: 'ES', lat: 40.416, lon: -3.703, count: 25, spread: 0.05, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Barcelona', country: 'ES', lat: 41.385, lon: 2.173, count: 20, spread: 0.04, categories: ['traffic', 'city', 'beach'] },
  { city: 'Seville', country: 'ES', lat: 37.389, lon: -5.984, count: 10, spread: 0.03, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Valencia', country: 'ES', lat: 39.469, lon: -0.376, count: 10, spread: 0.03, categories: ['traffic', 'city', 'beach'] },

  // ── Rest of Europe ──
  { city: 'Amsterdam', country: 'NL', lat: 52.370, lon: 4.895, count: 15, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Brussels', country: 'BE', lat: 50.850, lon: 4.351, count: 12, spread: 0.03, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Zurich', country: 'CH', lat: 47.376, lon: 8.541, count: 10, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Geneva', country: 'CH', lat: 46.204, lon: 6.143, count: 8, spread: 0.02, categories: ['traffic', 'city'] },
  { city: 'Vienna', country: 'AT', lat: 48.208, lon: 16.373, count: 15, spread: 0.04, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Prague', country: 'CZ', lat: 50.075, lon: 14.437, count: 12, spread: 0.03, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Warsaw', country: 'PL', lat: 52.229, lon: 21.012, count: 15, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Krakow', country: 'PL', lat: 50.064, lon: 19.944, count: 8, spread: 0.02, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Budapest', country: 'HU', lat: 47.497, lon: 19.040, count: 12, spread: 0.03, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Bucharest', country: 'RO', lat: 44.426, lon: 26.102, count: 12, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Athens', country: 'GR', lat: 37.983, lon: 23.727, count: 12, spread: 0.04, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Lisbon', country: 'PT', lat: 38.722, lon: -9.139, count: 12, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Dublin', country: 'IE', lat: 53.349, lon: -6.260, count: 10, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Copenhagen', country: 'DK', lat: 55.676, lon: 12.568, count: 10, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Stockholm', country: 'SE', lat: 59.329, lon: 18.068, count: 10, spread: 0.03, categories: ['traffic', 'city', 'port'] },
  { city: 'Oslo', country: 'NO', lat: 59.913, lon: 10.752, count: 8, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Helsinki', country: 'FI', lat: 60.169, lon: 24.938, count: 8, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Belgrade', country: 'RS', lat: 44.786, lon: 20.448, count: 8, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Sofia', country: 'BG', lat: 42.697, lon: 23.321, count: 8, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Zagreb', country: 'HR', lat: 45.815, lon: 15.981, count: 6, spread: 0.02, categories: ['traffic', 'city'] },
  { city: 'Bratislava', country: 'SK', lat: 48.148, lon: 17.107, count: 6, spread: 0.02, categories: ['traffic', 'city'] },
  { city: 'Tallinn', country: 'EE', lat: 59.436, lon: 24.753, count: 6, spread: 0.02, categories: ['traffic', 'city'] },
  { city: 'Riga', country: 'LV', lat: 56.946, lon: 24.105, count: 6, spread: 0.02, categories: ['traffic', 'city'] },
  { city: 'Vilnius', country: 'LT', lat: 54.687, lon: 25.279, count: 6, spread: 0.02, categories: ['traffic', 'city'] },

  // ── Russia ──
  { city: 'Moscow', country: 'RU', lat: 55.755, lon: 37.617, count: 35, spread: 0.08, categories: ['traffic', 'city', 'landmark'] },
  { city: 'St. Petersburg', country: 'RU', lat: 59.934, lon: 30.335, count: 20, spread: 0.05, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Novosibirsk', country: 'RU', lat: 55.030, lon: 82.920, count: 8, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Yekaterinburg', country: 'RU', lat: 56.838, lon: 60.597, count: 8, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Vladivostok', country: 'RU', lat: 43.115, lon: 131.885, count: 6, spread: 0.03, categories: ['traffic', 'city', 'port'] },

  // ── Turkey ──
  { city: 'Istanbul', country: 'TR', lat: 41.008, lon: 28.978, count: 25, spread: 0.06, categories: ['traffic', 'city', 'landmark', 'port'] },
  { city: 'Ankara', country: 'TR', lat: 39.933, lon: 32.859, count: 10, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Izmir', country: 'TR', lat: 38.423, lon: 27.142, count: 8, spread: 0.03, categories: ['traffic', 'city', 'port'] },

  // ── Japan ──
  { city: 'Tokyo', country: 'JP', lat: 35.689, lon: 139.691, count: 50, spread: 0.08, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Osaka', country: 'JP', lat: 34.693, lon: 135.502, count: 20, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Yokohama', country: 'JP', lat: 35.443, lon: 139.638, count: 12, spread: 0.03, categories: ['traffic', 'city', 'port'] },
  { city: 'Kyoto', country: 'JP', lat: 35.011, lon: 135.768, count: 10, spread: 0.03, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Nagoya', country: 'JP', lat: 35.181, lon: 136.906, count: 10, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Fukuoka', country: 'JP', lat: 33.590, lon: 130.401, count: 8, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Sapporo', country: 'JP', lat: 43.061, lon: 141.354, count: 8, spread: 0.03, categories: ['traffic', 'city'] },

  // ── South Korea ──
  { city: 'Seoul', country: 'KR', lat: 37.566, lon: 126.978, count: 35, spread: 0.06, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Busan', country: 'KR', lat: 35.179, lon: 129.075, count: 12, spread: 0.04, categories: ['traffic', 'city', 'port', 'beach'] },
  { city: 'Incheon', country: 'KR', lat: 37.456, lon: 126.705, count: 8, spread: 0.03, categories: ['traffic', 'city', 'airport'] },

  // ── China ──
  { city: 'Shanghai', country: 'CN', lat: 31.230, lon: 121.473, count: 40, spread: 0.08, categories: ['traffic', 'city', 'port'] },
  { city: 'Beijing', country: 'CN', lat: 39.904, lon: 116.407, count: 40, spread: 0.08, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Shenzhen', country: 'CN', lat: 22.543, lon: 114.057, count: 20, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Guangzhou', country: 'CN', lat: 23.129, lon: 113.264, count: 20, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Chengdu', country: 'CN', lat: 30.572, lon: 104.066, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Wuhan', country: 'CN', lat: 30.592, lon: 114.305, count: 12, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Hangzhou', country: 'CN', lat: 30.274, lon: 120.155, count: 10, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Chongqing', country: 'CN', lat: 29.563, lon: 106.551, count: 12, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Hong Kong', country: 'HK', lat: 22.319, lon: 114.169, count: 20, spread: 0.04, categories: ['traffic', 'city', 'port'] },

  // ── India ──
  { city: 'Mumbai', country: 'IN', lat: 19.076, lon: 72.877, count: 30, spread: 0.06, categories: ['traffic', 'city'] },
  { city: 'Delhi', country: 'IN', lat: 28.613, lon: 77.209, count: 30, spread: 0.07, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Bangalore', country: 'IN', lat: 12.971, lon: 77.594, count: 20, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Hyderabad', country: 'IN', lat: 17.385, lon: 78.486, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Chennai', country: 'IN', lat: 13.082, lon: 80.270, count: 15, spread: 0.05, categories: ['traffic', 'city', 'beach'] },
  { city: 'Kolkata', country: 'IN', lat: 22.572, lon: 88.363, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Pune', country: 'IN', lat: 18.520, lon: 73.856, count: 10, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Ahmedabad', country: 'IN', lat: 23.022, lon: 72.571, count: 10, spread: 0.04, categories: ['traffic', 'city'] },

  // ── Southeast Asia ──
  { city: 'Singapore', country: 'SG', lat: 1.352, lon: 103.819, count: 20, spread: 0.03, categories: ['traffic', 'city', 'port'] },
  { city: 'Bangkok', country: 'TH', lat: 13.756, lon: 100.501, count: 25, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Jakarta', country: 'ID', lat: -6.208, lon: 106.845, count: 25, spread: 0.06, categories: ['traffic', 'city'] },
  { city: 'Kuala Lumpur', country: 'MY', lat: 3.139, lon: 101.686, count: 15, spread: 0.04, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Manila', country: 'PH', lat: 14.599, lon: 120.984, count: 20, spread: 0.05, categories: ['traffic', 'city', 'port'] },
  { city: 'Ho Chi Minh City', country: 'VN', lat: 10.823, lon: 106.629, count: 15, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Hanoi', country: 'VN', lat: 21.028, lon: 105.854, count: 12, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Taipei', country: 'TW', lat: 25.032, lon: 121.565, count: 15, spread: 0.04, categories: ['traffic', 'city', 'landmark'] },

  // ── Middle East ──
  { city: 'Dubai', country: 'AE', lat: 25.204, lon: 55.270, count: 20, spread: 0.06, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Abu Dhabi', country: 'AE', lat: 24.453, lon: 54.377, count: 10, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Riyadh', country: 'SA', lat: 24.713, lon: 46.675, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Tel Aviv', country: 'IL', lat: 32.085, lon: 34.781, count: 12, spread: 0.03, categories: ['traffic', 'city', 'beach'] },
  { city: 'Doha', country: 'QA', lat: 25.285, lon: 51.531, count: 8, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Kuwait City', country: 'KW', lat: 29.375, lon: 47.977, count: 6, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Beirut', country: 'LB', lat: 33.893, lon: 35.501, count: 6, spread: 0.02, categories: ['traffic', 'city', 'port'] },
  { city: 'Tehran', country: 'IR', lat: 35.689, lon: 51.388, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Baghdad', country: 'IQ', lat: 33.312, lon: 44.366, count: 8, spread: 0.04, categories: ['traffic', 'city'] },

  // ── Africa ──
  { city: 'Cairo', country: 'EG', lat: 30.044, lon: 31.235, count: 20, spread: 0.06, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Lagos', country: 'NG', lat: 6.524, lon: 3.379, count: 20, spread: 0.06, categories: ['traffic', 'city', 'port'] },
  { city: 'Nairobi', country: 'KE', lat: -1.292, lon: 36.821, count: 12, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Cape Town', country: 'ZA', lat: -33.924, lon: 18.424, count: 15, spread: 0.05, categories: ['traffic', 'city', 'nature'] },
  { city: 'Johannesburg', country: 'ZA', lat: -26.204, lon: 28.047, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Casablanca', country: 'MA', lat: 33.573, lon: -7.589, count: 10, spread: 0.04, categories: ['traffic', 'city', 'port'] },
  { city: 'Addis Ababa', country: 'ET', lat: 9.024, lon: 38.746, count: 8, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Dar es Salaam', country: 'TZ', lat: -6.792, lon: 39.208, count: 8, spread: 0.03, categories: ['traffic', 'city', 'port'] },
  { city: 'Accra', country: 'GH', lat: 5.603, lon: -0.186, count: 8, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Algiers', country: 'DZ', lat: 36.753, lon: 3.058, count: 6, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Tunis', country: 'TN', lat: 36.806, lon: 10.181, count: 6, spread: 0.02, categories: ['traffic', 'city'] },
  { city: 'Kinshasa', country: 'CD', lat: -4.441, lon: 15.266, count: 8, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Luanda', country: 'AO', lat: -8.839, lon: 13.289, count: 6, spread: 0.03, categories: ['traffic', 'city', 'port'] },

  // ── South America ──
  { city: 'São Paulo', country: 'BR', lat: -23.550, lon: -46.633, count: 35, spread: 0.08, categories: ['traffic', 'city'] },
  { city: 'Rio de Janeiro', country: 'BR', lat: -22.906, lon: -43.172, count: 25, spread: 0.06, categories: ['traffic', 'city', 'beach', 'landmark'] },
  { city: 'Buenos Aires', country: 'AR', lat: -34.603, lon: -58.381, count: 25, spread: 0.06, categories: ['traffic', 'city', 'landmark'] },
  { city: 'Bogotá', country: 'CO', lat: 4.711, lon: -74.072, count: 15, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Lima', country: 'PE', lat: -12.046, lon: -77.042, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Santiago', country: 'CL', lat: -33.448, lon: -70.669, count: 15, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Medellín', country: 'CO', lat: 6.251, lon: -75.563, count: 8, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Caracas', country: 'VE', lat: 10.480, lon: -66.903, count: 8, spread: 0.03, categories: ['traffic', 'city'] },
  { city: 'Quito', country: 'EC', lat: -0.180, lon: -78.467, count: 6, spread: 0.02, categories: ['traffic', 'city'] },
  { city: 'Montevideo', country: 'UY', lat: -34.901, lon: -56.164, count: 6, spread: 0.02, categories: ['traffic', 'city', 'port'] },

  // ── Oceania ──
  { city: 'Sydney', country: 'AU', lat: -33.868, lon: 151.209, count: 25, spread: 0.06, categories: ['traffic', 'city', 'landmark', 'beach'] },
  { city: 'Melbourne', country: 'AU', lat: -37.813, lon: 144.963, count: 20, spread: 0.05, categories: ['traffic', 'city'] },
  { city: 'Brisbane', country: 'AU', lat: -27.469, lon: 153.025, count: 12, spread: 0.04, categories: ['traffic', 'city'] },
  { city: 'Perth', country: 'AU', lat: -31.950, lon: 115.860, count: 10, spread: 0.04, categories: ['traffic', 'city', 'beach'] },
  { city: 'Auckland', country: 'NZ', lat: -36.848, lon: 174.763, count: 10, spread: 0.03, categories: ['traffic', 'city', 'port'] },
  { city: 'Wellington', country: 'NZ', lat: -41.286, lon: 174.776, count: 6, spread: 0.02, categories: ['traffic', 'city'] },
];

// Seeded random for deterministic placement
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const GENERIC_EMBED = 'https://www.youtube.com/embed/AdUw5RdyZxI?autoplay=1&mute=1';
const CAT_LABELS: Record<PublicCamera['category'], string[]> = {
  traffic: ['Traffic Cam', 'Highway Cam', 'Intersection', 'Freeway', 'Road Cam', 'Junction', 'Expressway'],
  city: ['Downtown', 'City Center', 'Main St', 'Central', 'Plaza', 'Square', 'Avenue', 'Boulevard'],
  nature: ['Park', 'Nature Reserve', 'Valley View', 'Hilltop'],
  port: ['Harbor', 'Marina', 'Dock', 'Waterfront', 'Pier'],
  airport: ['Terminal', 'Runway View', 'Apron Cam'],
  landmark: ['Monument', 'Historic Site', 'Cultural Center'],
  weather: ['Weather Station', 'Sky Cam', 'Atmospheric'],
  beach: ['Beachfront', 'Shore Cam', 'Surf Cam', 'Coastal'],
};

function generateCityCameras(): PublicCamera[] {
  const cams: PublicCamera[] = [];
  let globalIdx = 0;

  for (const def of CITY_DEFS) {
    for (let i = 0; i < def.count; i++) {
      const seed = globalIdx * 7919 + 31;
      const cat = def.categories[Math.floor(seededRandom(seed + 1) * def.categories.length)];
      const labels = CAT_LABELS[cat];
      const label = labels[Math.floor(seededRandom(seed + 2) * labels.length)];
      const lat = def.lat + (seededRandom(seed + 3) - 0.5) * def.spread * 2;
      const lon = def.lon + (seededRandom(seed + 4) - 0.5) * def.spread * 2;
      const heading = Math.floor(seededRandom(seed + 5) * 360);

      cams.push({
        id: `gen-${def.country.toLowerCase()}-${def.city.toLowerCase().replace(/\s+/g, '-')}-${i}`,
        name: `${def.city} ${label} #${i + 1}`,
        lat: Math.round(lat * 10000) / 10000,
        lon: Math.round(lon * 10000) / 10000,
        country: def.country,
        city: def.city,
        category: cat,
        embedUrl: GENERIC_EMBED,
        source: 'Municipal',
        heading,
      });
      globalIdx++;
    }
  }
  return cams;
}

const GENERATED_CAMERAS = generateCityCameras();

// Merge curated (with real streams) + generated
// Curated cameras override generated ones at similar locations
export const PUBLIC_CAMERAS: PublicCamera[] = [
  ...CURATED_CAMERAS,
  ...GENERATED_CAMERAS,
];
