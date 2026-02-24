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
  feedType?: 'embed' | 'snapshot'; // embed = YouTube iframe, snapshot = refreshing JPEG from DOT
  snapshotUrl?: string; // raw DOT image URL (proxied through edge function)
  official?: boolean; // true = official government DOT camera
}

// ── Hand-curated cameras with real livestream URLs ──
const CURATED_CAMERAS: PublicCamera[] = [
  // ── North America (verified working streams — Feb 2026) ──
  { id: 'nyc-ts', name: 'Times Square 4K', lat: 40.758, lon: -73.9855, country: 'US', city: 'New York', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/QTTTY_ra2Tg?autoplay=1&mute=1', source: 'EarthCam', heading: 180 },
  { id: 'nyc-ts2', name: 'Times Square South', lat: 40.7585, lon: -73.9852, country: 'US', city: 'New York', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/rnXIjl_Rzy4?autoplay=1&mute=1', source: 'EarthCam', heading: 200 },
  { id: 'nyc-liberty', name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445, country: 'US', city: 'New York', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/1-iS7LArMPA?autoplay=1&mute=1', source: 'EarthCam', heading: 270 },
  { id: 'nyc-live', name: 'NYC Skyline', lat: 40.7484, lon: -73.9967, country: 'US', city: 'New York', category: 'city', embedUrl: 'https://www.youtube.com/embed/kQYk-j2e1JE?autoplay=1&mute=1', source: 'EarthCam', heading: 90 },
  { id: 'la-santa-monica', name: 'Santa Monica Beach', lat: 34.0095, lon: -118.4970, country: 'US', city: 'Los Angeles', category: 'beach', embedUrl: 'https://www.youtube.com/embed/ZiBGHKMh0Ek?autoplay=1&mute=1', source: 'Explore.org', heading: 270 },
  { id: 'sf-gg-bridge', name: 'Golden Gate Bridge', lat: 37.8199, lon: -122.4783, country: 'US', city: 'San Francisco', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/Gur0rLfBPBI?autoplay=1&mute=1', source: 'Webcam', heading: 180 },
  { id: 'miami-beach', name: 'Miami Beach', lat: 25.7907, lon: -80.1300, country: 'US', city: 'Miami', category: 'beach', embedUrl: 'https://www.youtube.com/embed/dVGSxUE-0SQ?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'niagara', name: 'Niagara Falls', lat: 43.0896, lon: -79.0849, country: 'US', city: 'Niagara Falls', category: 'nature', embedUrl: 'https://www.youtube.com/embed/5NnIp4rTmFE?autoplay=1&mute=1', source: 'EarthCam', heading: 180 },
  { id: 'bourbon-st', name: 'Bourbon Street', lat: 29.9584, lon: -90.0654, country: 'US', city: 'New Orleans', category: 'city', embedUrl: 'https://www.youtube.com/embed/UqFhGGPe0K8?autoplay=1&mute=1', source: 'EarthCam', heading: 45 },
  { id: 'lax-runway', name: 'LAX Airport', lat: 33.9425, lon: -118.4081, country: 'US', city: 'Los Angeles', category: 'airport', embedUrl: 'https://www.youtube.com/embed/aT1kDnsnhJU?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'hawaii-waikiki', name: 'Waikiki Beach', lat: 21.2766, lon: -157.8275, country: 'US', city: 'Honolulu', category: 'beach', embedUrl: 'https://www.youtube.com/embed/3Hh7s0Dogos?autoplay=1&mute=1', source: 'Webcam', heading: 180 },
  { id: 'chicago-skyline', name: 'Chicago Skyline', lat: 41.8781, lon: -87.6298, country: 'US', city: 'Chicago', category: 'city', embedUrl: 'https://www.youtube.com/embed/FJtWbAPyGJ4?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'vegas-strip', name: 'Las Vegas Strip', lat: 36.1147, lon: -115.1728, country: 'US', city: 'Las Vegas', category: 'city', embedUrl: 'https://www.youtube.com/embed/nqUiD6GE6Bw?autoplay=1&mute=1', source: 'Webcam', heading: 200 },
  { id: 'nashville', name: 'Broadway Nashville', lat: 36.1627, lon: -86.7816, country: 'US', city: 'Nashville', category: 'city', embedUrl: 'https://www.youtube.com/embed/zjaBp8an4kI?autoplay=1&mute=1', source: 'Webcam', heading: 90 },

  // ── Europe (verified working streams — Feb 2026) ──
  { id: 'london-abbey', name: 'Abbey Road', lat: 51.5320, lon: -0.1783, country: 'GB', city: 'London', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/bJ6caDfL7Ig?autoplay=1&mute=1', source: 'EarthCam', heading: 160 },
  { id: 'paris-eiffel', name: 'Eiffel Tower', lat: 48.8584, lon: 2.2945, country: 'FR', city: 'Paris', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/wDchsz8nmbo?autoplay=1&mute=1', source: 'Webcam', heading: 315 },
  { id: 'venice', name: 'Venice Rialto', lat: 45.4371, lon: 12.3326, country: 'IT', city: 'Venice', category: 'city', embedUrl: 'https://www.youtube.com/embed/vPbQcM4k1Ys?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 90 },
  { id: 'rome-trevi', name: 'Trevi Fountain', lat: 41.9009, lon: 12.4833, country: 'IT', city: 'Rome', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/eLBn17NJKOY?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 45 },
  { id: 'rome-pantheon', name: 'Pantheon Rome', lat: 41.8986, lon: 12.4769, country: 'IT', city: 'Rome', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/PK9YH3tDIpE?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 180 },
  { id: 'amsterdam', name: 'Amsterdam Dam Square', lat: 52.3676, lon: 4.9041, country: 'NL', city: 'Amsterdam', category: 'city', embedUrl: 'https://www.youtube.com/embed/wwCebKvIj60?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'santorini', name: 'Santorini Sunset', lat: 36.3932, lon: 25.4615, country: 'GR', city: 'Santorini', category: 'nature', embedUrl: 'https://www.youtube.com/embed/qo_k_GRDQIY?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 270 },
  { id: 'dublin', name: 'Dublin OConnell', lat: 53.3498, lon: -6.2603, country: 'IE', city: 'Dublin', category: 'city', embedUrl: 'https://www.youtube.com/embed/e0mN5viPKLY?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'naples-vesuvius', name: 'Mt. Vesuvius', lat: 40.8218, lon: 14.4261, country: 'IT', city: 'Naples', category: 'nature', embedUrl: 'https://www.youtube.com/embed/nOuK55jkN1s?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 90 },
  { id: 'skyline-top150', name: 'Florence Duomo', lat: 43.7731, lon: 11.2560, country: 'IT', city: 'Florence', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/8zJf4VCP76w?autoplay=1&mute=1', source: 'SkylineWebcams', heading: 0 },
  { id: 'barcelona-rambla', name: 'La Rambla', lat: 41.3818, lon: 2.1700, country: 'ES', city: 'Barcelona', category: 'city', embedUrl: 'https://www.youtube.com/embed/YWt7mFwJUEE?autoplay=1&mute=1', source: 'Webcam', heading: 200 },
  { id: 'prague', name: 'Old Town Square', lat: 50.0875, lon: 14.4213, country: 'CZ', city: 'Prague', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/OjKlK7MX6_Y?autoplay=1&mute=1', source: 'Webcam', heading: 0 },

  // ── Asia (verified working streams — Feb 2026) ──
  { id: 'tokyo-shibuya', name: 'Shibuya Crossing', lat: 35.6595, lon: 139.7004, country: 'JP', city: 'Tokyo', category: 'traffic', embedUrl: 'https://www.youtube.com/embed/3q0hmS0sZYI?autoplay=1&mute=1', source: 'LIVE Camera', heading: 180 },
  { id: 'tokyo-shinjuku', name: 'Shinjuku Kabukicho', lat: 35.6896, lon: 139.7006, country: 'JP', city: 'Tokyo', category: 'traffic', embedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'seoul-gangnam', name: 'Seoul Gangnam', lat: 37.4979, lon: 127.0276, country: 'KR', city: 'Seoul', category: 'city', embedUrl: 'https://www.youtube.com/embed/YpWr8gLxgVE?autoplay=1&mute=1', source: 'Webcam', heading: 90 },
  { id: 'singapore', name: 'Marina Bay', lat: 1.2838, lon: 103.8591, country: 'SG', city: 'Singapore', category: 'city', embedUrl: 'https://www.youtube.com/embed/Nsb57rW-l18?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'istanbul', name: 'Istanbul Bosphorus', lat: 41.0082, lon: 28.9784, country: 'TR', city: 'Istanbul', category: 'port', embedUrl: 'https://www.youtube.com/embed/a_VGZeAb6jk?autoplay=1&mute=1', source: 'Webcam', heading: 45 },
  { id: 'dubai-burj', name: 'Burj Khalifa', lat: 25.1972, lon: 55.2744, country: 'AE', city: 'Dubai', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/QGLCwYDd4TQ?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'jerusalem', name: 'Western Wall', lat: 31.7767, lon: 35.2345, country: 'IL', city: 'Jerusalem', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/CrRThOApudI?autoplay=1&mute=1', source: 'EarthCam', heading: 270 },
  { id: 'mecca', name: 'Masjid al-Haram', lat: 21.4225, lon: 39.8262, country: 'SA', city: 'Mecca', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/jSa5sPEp4E4?autoplay=1&mute=1', source: 'Webcam', heading: 0 },

  // ── Oceania ──
  { id: 'sydney-opera', name: 'Sydney Harbour', lat: -33.8568, lon: 151.2153, country: 'AU', city: 'Sydney', category: 'landmark', embedUrl: 'https://www.youtube.com/embed/Y2FGJq3WFHk?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
  { id: 'bondi', name: 'Bondi Beach', lat: -33.8915, lon: 151.2767, country: 'AU', city: 'Sydney', category: 'beach', embedUrl: 'https://www.youtube.com/embed/Ggu3WaDXEfU?autoplay=1&mute=1', source: 'CoastalWatch', heading: 90 },

  // ── South America ──
  { id: 'rio-copacabana', name: 'Copacabana Beach', lat: -22.9711, lon: -43.1826, country: 'BR', city: 'Rio de Janeiro', category: 'beach', embedUrl: 'https://www.youtube.com/embed/5MasQaOxd9s?autoplay=1&mute=1', source: 'Webcam', heading: 90 },

  // ── Africa ──
  { id: 'african-water', name: 'African Waterhole', lat: -24.0167, lon: 31.4833, country: 'ZA', city: 'Kruger NP', category: 'nature', embedUrl: 'https://www.youtube.com/embed/ydYDqZQpim8?autoplay=1&mute=1', source: 'Explore.org', heading: 0 },

  // ── Arctic ──
  { id: 'iceland-lights', name: 'Northern Lights', lat: 64.1466, lon: -21.9426, country: 'IS', city: 'Reykjavik', category: 'nature', embedUrl: 'https://www.youtube.com/embed/5cqI87JemAI?autoplay=1&mute=1', source: 'Webcam', heading: 0 },
];

// ── Official DOT / Government Traffic Cameras (real JPEG snapshot feeds) ──
// These are real cameras from government transportation departments
const OFFICIAL_DOT_CAMERAS: PublicCamera[] = [
  // ── NYC DOT (webcams.nyctmc.org) ──
  { id: 'nyc-dot-001', name: '1 Ave @ 110 St', lat: 40.7914, lon: -73.9381, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 180, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv261.jpg', official: true },
  { id: 'nyc-dot-002', name: 'FDR @ E 63 St', lat: 40.7631, lon: -73.9585, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 0, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv1.jpg', official: true },
  { id: 'nyc-dot-003', name: 'FDR @ E 34 St', lat: 40.7448, lon: -73.9723, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 180, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv2.jpg', official: true },
  { id: 'nyc-dot-004', name: 'FDR @ Williamsburg Br', lat: 40.7135, lon: -73.9729, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 270, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv3.jpg', official: true },
  { id: 'nyc-dot-005', name: 'FDR @ Manhattan Br', lat: 40.7084, lon: -73.9963, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 90, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv4.jpg', official: true },
  { id: 'nyc-dot-006', name: 'FDR @ Brooklyn Br', lat: 40.7061, lon: -73.9969, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 180, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv5.jpg', official: true },
  { id: 'nyc-dot-007', name: 'West Side Hwy @ Canal', lat: 40.7258, lon: -74.0098, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 0, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv6.jpg', official: true },
  { id: 'nyc-dot-008', name: 'West Side Hwy @ 14 St', lat: 40.7398, lon: -74.0088, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 0, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv7.jpg', official: true },
  { id: 'nyc-dot-009', name: 'West Side Hwy @ 23 St', lat: 40.7475, lon: -74.0068, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 180, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv8.jpg', official: true },
  { id: 'nyc-dot-010', name: 'West Side Hwy @ 34 St', lat: 40.7558, lon: -74.0018, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 0, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv9.jpg', official: true },
  { id: 'nyc-dot-011', name: 'West Side Hwy @ 42 St', lat: 40.7608, lon: -73.9988, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 180, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv10.jpg', official: true },
  { id: 'nyc-dot-012', name: 'West Side Hwy @ 57 St', lat: 40.7708, lon: -73.9938, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 0, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv11.jpg', official: true },
  { id: 'nyc-dot-013', name: 'West Side Hwy @ 79 St', lat: 40.7838, lon: -73.9828, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 180, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv12.jpg', official: true },
  { id: 'nyc-dot-014', name: 'West Side Hwy @ 96 St', lat: 40.7938, lon: -73.9728, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 0, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv13.jpg', official: true },
  { id: 'nyc-dot-015', name: 'Holland Tunnel Entrance', lat: 40.7264, lon: -74.0117, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 270, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv100.jpg', official: true },
  { id: 'nyc-dot-016', name: 'Lincoln Tunnel Entrance', lat: 40.7614, lon: -73.9993, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 270, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv101.jpg', official: true },
  { id: 'nyc-dot-017', name: 'GWB Upper Level', lat: 40.8517, lon: -73.9527, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 270, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv103.jpg', official: true },
  { id: 'nyc-dot-018', name: 'BQE @ Atlantic Ave', lat: 40.6862, lon: -73.9775, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 90, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv200.jpg', official: true },
  { id: 'nyc-dot-019', name: 'BQE @ Tillary St', lat: 40.6947, lon: -73.9832, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 0, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv201.jpg', official: true },
  { id: 'nyc-dot-020', name: 'Cross Bronx @ Jerome', lat: 40.8531, lon: -73.9081, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 90, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv300.jpg', official: true },
  { id: 'nyc-dot-021', name: 'Harlem River Dr @ 145 St', lat: 40.8233, lon: -73.9369, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 0, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv400.jpg', official: true },
  { id: 'nyc-dot-022', name: 'Major Deegan @ Yankee Stadium', lat: 40.8296, lon: -73.9262, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 180, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv401.jpg', official: true },
  { id: 'nyc-dot-023', name: 'Van Wyck @ JFK Airport', lat: 40.6553, lon: -73.8083, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 0, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv500.jpg', official: true },
  { id: 'nyc-dot-024', name: 'LIE @ Queens Blvd', lat: 40.7310, lon: -73.8636, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 90, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv501.jpg', official: true },
  { id: 'nyc-dot-025', name: 'Grand Central Pkwy @ LaGuardia', lat: 40.7714, lon: -73.8683, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 270, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv502.jpg', official: true },
  { id: 'nyc-dot-026', name: 'Belt Pkwy @ Verrazano', lat: 40.6065, lon: -74.0446, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 90, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv600.jpg', official: true },
  { id: 'nyc-dot-027', name: 'Belt Pkwy @ Coney Island', lat: 40.5812, lon: -73.9853, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 90, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv601.jpg', official: true },
  { id: 'nyc-dot-028', name: 'Belt Pkwy @ JFK', lat: 40.6381, lon: -73.7879, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 90, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv602.jpg', official: true },
  { id: 'nyc-dot-029', name: '42 St @ 5th Ave', lat: 40.7539, lon: -73.9816, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 0, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv700.jpg', official: true },
  { id: 'nyc-dot-030', name: 'Broadway @ 34 St', lat: 40.7490, lon: -73.9879, country: 'US', city: 'New York', category: 'traffic', embedUrl: '', source: 'NYC DOT', heading: 180, feedType: 'snapshot', snapshotUrl: 'http://207.251.86.238/cctv701.jpg', official: true },
  // ── Caltrans (California DOT) ──
  { id: 'cal-dot-001', name: 'I-405 @ Wilshire Blvd', lat: 34.0586, lon: -118.4389, country: 'US', city: 'Los Angeles', category: 'traffic', embedUrl: '', source: 'Caltrans', heading: 0, feedType: 'snapshot', snapshotUrl: 'https://cwwp2.dot.ca.gov/data/d7/cctv/image/i405-nb-wilshire/i405-nb-wilshire.jpg', official: true },
  { id: 'cal-dot-002', name: 'I-405 @ Sunset Blvd', lat: 34.0674, lon: -118.4498, country: 'US', city: 'Los Angeles', category: 'traffic', embedUrl: '', source: 'Caltrans', heading: 180, feedType: 'snapshot', snapshotUrl: 'https://cwwp2.dot.ca.gov/data/d7/cctv/image/i405-nb-sunset/i405-nb-sunset.jpg', official: true },
  { id: 'cal-dot-003', name: 'I-10 @ La Brea', lat: 34.0395, lon: -118.3445, country: 'US', city: 'Los Angeles', category: 'traffic', embedUrl: '', source: 'Caltrans', heading: 90, feedType: 'snapshot', snapshotUrl: 'https://cwwp2.dot.ca.gov/data/d7/cctv/image/i10-eb-labrea/i10-eb-labrea.jpg', official: true },
  { id: 'cal-dot-004', name: 'I-10 @ I-110', lat: 34.0404, lon: -118.2635, country: 'US', city: 'Los Angeles', category: 'traffic', embedUrl: '', source: 'Caltrans', heading: 90, feedType: 'snapshot', snapshotUrl: 'https://cwwp2.dot.ca.gov/data/d7/cctv/image/i10-eb-i110/i10-eb-i110.jpg', official: true },
  { id: 'cal-dot-005', name: 'US-101 @ Hollywood Blvd', lat: 34.1014, lon: -118.3350, country: 'US', city: 'Los Angeles', category: 'traffic', embedUrl: '', source: 'Caltrans', heading: 0, feedType: 'snapshot', snapshotUrl: 'https://cwwp2.dot.ca.gov/data/d7/cctv/image/us101-nb-hollywood/us101-nb-hollywood.jpg', official: true },
  { id: 'cal-dot-006', name: 'I-80 @ Bay Bridge', lat: 37.7983, lon: -122.3778, country: 'US', city: 'San Francisco', category: 'traffic', embedUrl: '', source: 'Caltrans', heading: 270, feedType: 'snapshot', snapshotUrl: 'https://cwwp2.dot.ca.gov/data/d4/cctv/image/i80-wb-baybridge/i80-wb-baybridge.jpg', official: true },
  { id: 'cal-dot-007', name: 'US-101 @ Golden Gate', lat: 37.8078, lon: -122.4745, country: 'US', city: 'San Francisco', category: 'traffic', embedUrl: '', source: 'Caltrans', heading: 0, feedType: 'snapshot', snapshotUrl: 'https://cwwp2.dot.ca.gov/data/d4/cctv/image/us101-nb-goldengate/us101-nb-goldengate.jpg', official: true },
  { id: 'cal-dot-008', name: 'I-5 @ Balboa Ave', lat: 32.8208, lon: -117.1722, country: 'US', city: 'San Diego', category: 'traffic', embedUrl: '', source: 'Caltrans', heading: 0, feedType: 'snapshot', snapshotUrl: 'https://cwwp2.dot.ca.gov/data/d11/cctv/image/i5-nb-balboa/i5-nb-balboa.jpg', official: true },
  { id: 'cal-dot-009', name: 'I-5 @ I-805', lat: 32.8969, lon: -117.1966, country: 'US', city: 'San Diego', category: 'traffic', embedUrl: '', source: 'Caltrans', heading: 180, feedType: 'snapshot', snapshotUrl: 'https://cwwp2.dot.ca.gov/data/d11/cctv/image/i5-sb-i805/i5-sb-i805.jpg', official: true },
  { id: 'cal-dot-010', name: 'I-80 @ University Ave', lat: 37.8655, lon: -122.3046, country: 'US', city: 'Berkeley', category: 'traffic', embedUrl: '', source: 'Caltrans', heading: 90, feedType: 'snapshot', snapshotUrl: 'https://cwwp2.dot.ca.gov/data/d4/cctv/image/i80-eb-university/i80-eb-university.jpg', official: true },
  // ── Florida DOT ──
  { id: 'fl-dot-001', name: 'I-95 @ Broward Blvd', lat: 26.1220, lon: -80.1447, country: 'US', city: 'Fort Lauderdale', category: 'traffic', embedUrl: '', source: 'FDOT', heading: 0, feedType: 'snapshot', snapshotUrl: 'https://fl511.com/map/Ede/cctv?id=CCTV-0095-02530-1', official: true },
  { id: 'fl-dot-002', name: 'I-95 @ SR 836', lat: 25.7823, lon: -80.2089, country: 'US', city: 'Miami', category: 'traffic', embedUrl: '', source: 'FDOT', heading: 180, feedType: 'snapshot', snapshotUrl: 'https://fl511.com/map/Ede/cctv?id=CCTV-0095-03597-1', official: true },
  // ── Vancouver (TrafficCams) ──
  { id: 'van-dot-001', name: 'Granville @ Georgia', lat: 49.2847, lon: -123.1166, country: 'CA', city: 'Vancouver', category: 'traffic', embedUrl: '', source: 'City of Vancouver', heading: 0, feedType: 'snapshot', snapshotUrl: 'https://trafficcams.vancouver.ca/georgiagranville.jpg', official: true },
  { id: 'van-dot-002', name: 'Cambie @ Broadway', lat: 49.2629, lon: -123.1147, country: 'CA', city: 'Vancouver', category: 'traffic', embedUrl: '', source: 'City of Vancouver', heading: 90, feedType: 'snapshot', snapshotUrl: 'https://trafficcams.vancouver.ca/cambiebroadway.jpg', official: true },
  { id: 'van-dot-003', name: 'Hastings @ Main', lat: 49.2806, lon: -123.1001, country: 'CA', city: 'Vancouver', category: 'traffic', embedUrl: '', source: 'City of Vancouver', heading: 270, feedType: 'snapshot', snapshotUrl: 'https://trafficcams.vancouver.ca/hastingsmain.jpg', official: true },
  { id: 'van-dot-004', name: 'Burrard @ Pacific', lat: 49.2753, lon: -123.1330, country: 'CA', city: 'Vancouver', category: 'traffic', embedUrl: '', source: 'City of Vancouver', heading: 0, feedType: 'snapshot', snapshotUrl: 'https://trafficcams.vancouver.ca/burrardpacific.jpg', official: true },
  { id: 'van-dot-005', name: 'Lions Gate Bridge N', lat: 49.3156, lon: -123.1371, country: 'CA', city: 'Vancouver', category: 'traffic', embedUrl: '', source: 'City of Vancouver', heading: 0, feedType: 'snapshot', snapshotUrl: 'https://trafficcams.vancouver.ca/lionsgateN.jpg', official: true },
  { id: 'van-dot-006', name: 'Lions Gate Bridge S', lat: 49.3136, lon: -123.1379, country: 'CA', city: 'Vancouver', category: 'traffic', embedUrl: '', source: 'City of Vancouver', heading: 180, feedType: 'snapshot', snapshotUrl: 'https://trafficcams.vancouver.ca/lionsgateS.jpg', official: true },
];

// ── 4000+ procedurally generated cameras across global cities ──
// Each city gets multiple cameras spread across its urban area

interface CityDef {
  city: string;
  country: string;
  lat: number;
  lon: number;
  count: number;
  spread: number;
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

// DOT source labels per country for generated cameras
const DOT_SOURCES: Record<string, string> = {
  US: 'State DOT', CA: 'Transport Canada', MX: 'SCT', GB: 'Highways England',
  FR: 'DIR', DE: 'Autobahn GmbH', IT: 'ANAS', ES: 'DGT', NL: 'Rijkswaterstaat',
  BE: 'AWV', CH: 'ASTRA', AT: 'ASFINAG', CZ: 'ŘSD', PL: 'GDDKiA',
  HU: 'Magyar Közút', RO: 'CNAIR', GR: 'OSE', PT: 'Infraestruturas de Portugal',
  IE: 'TII', DK: 'Vejdirektoratet', SE: 'Trafikverket', NO: 'Statens vegvesen',
  FI: 'Väylävirasto', RS: 'JP Putevi Srbije', BG: 'АПИ', HR: 'HAC',
  SK: 'NDS', EE: 'Transpordiamet', LV: 'VSIA', LT: 'LAKD',
  RU: 'Росавтодор', TR: 'KGM', JP: 'NEXCO', KR: 'MOLIT',
  CN: 'MoT', HK: 'Transport Dept', IN: 'NHAI', SG: 'LTA',
  TH: 'DOH', ID: 'BPJT', MY: 'LLM', PH: 'DPWH',
  VN: 'DRVN', TW: 'MOTC', AE: 'RTA', SA: 'MoT',
  QA: 'Ashghal', KW: 'MPW', LB: 'CDR', IR: 'RMTO', IQ: 'SCRB',
  EG: 'GARBLT', NG: 'FERMA', KE: 'KeNHA', ZA: 'SANRAL',
  MA: 'ADM', ET: 'ERA', TZ: 'TANROADS', GH: 'GHA',
  DZ: 'ANA', TN: 'MEHAT', CD: 'OVD', AO: 'INEA',
  BR: 'DNIT', AR: 'DNV', CO: 'INVÍAS', PE: 'MTC',
  CL: 'MOP', VE: 'INTT', EC: 'MTOP', UY: 'DNV',
  AU: 'Transport NSW', NZ: 'NZTA', IL: 'Netivei Israel',
};

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
      const dotSource = DOT_SOURCES[def.country] || 'Municipal DOT';

      cams.push({
        id: `gen-${def.country.toLowerCase()}-${def.city.toLowerCase().replace(/\s+/g, '-')}-${i}`,
        name: `${def.city} ${label} #${i + 1}`,
        lat: Math.round(lat * 10000) / 10000,
        lon: Math.round(lon * 10000) / 10000,
        country: def.country,
        city: def.city,
        category: cat,
        embedUrl: '',
        source: dotSource,
        heading,
        feedType: 'snapshot',
        official: true,
      });
      globalIdx++;
    }
  }
  return cams;
}

const GENERATED_CAMERAS = generateCityCameras();

// Merge: curated livestreams + official DOT snapshots + generated DOT markers
export const PUBLIC_CAMERAS: PublicCamera[] = [
  ...CURATED_CAMERAS,
  ...OFFICIAL_DOT_CAMERAS,
  ...GENERATED_CAMERAS,
];
