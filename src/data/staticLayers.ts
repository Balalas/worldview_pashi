// Static geospatial data: military bases, spaceports, chokepoints, datacenters, critical minerals

export const MILITARY_BASES = [
  { name: 'Camp Lemonnier', lat: 11.55, lon: 43.15, country: 'Djibouti', operator: 'US', type: 'naval' },
  { name: 'Diego Garcia', lat: -7.32, lon: 72.42, country: 'BIOT', operator: 'US/UK', type: 'naval' },
  { name: 'Ramstein', lat: 49.44, lon: 7.60, country: 'Germany', operator: 'US', type: 'air' },
  { name: 'Incirlik', lat: 37.00, lon: 35.43, country: 'Turkey', operator: 'US/Turkey', type: 'air' },
  { name: 'Yokosuka', lat: 35.28, lon: 139.67, country: 'Japan', operator: 'US', type: 'naval' },
  { name: 'Pine Gap', lat: -23.80, lon: 133.74, country: 'Australia', operator: 'US/AU', type: 'intel' },
  { name: 'Guantanamo Bay', lat: 19.90, lon: -75.10, country: 'Cuba', operator: 'US', type: 'naval' },
  { name: 'RAF Lakenheath', lat: 52.41, lon: 0.56, country: 'UK', operator: 'US', type: 'air' },
  { name: 'Thule', lat: 76.53, lon: -68.70, country: 'Greenland', operator: 'US', type: 'space' },
  { name: 'Kaliningrad', lat: 54.71, lon: 20.51, country: 'Russia', operator: 'Russia', type: 'naval' },
  { name: 'Tartus', lat: 34.89, lon: 35.89, country: 'Syria', operator: 'Russia', type: 'naval' },
  { name: 'Hainan', lat: 18.25, lon: 109.50, country: 'China', operator: 'China', type: 'naval' },
  { name: 'Djibouti (CN)', lat: 11.59, lon: 43.05, country: 'Djibouti', operator: 'China', type: 'naval' },
  { name: 'Sevastopol', lat: 44.62, lon: 33.53, country: 'Crimea', operator: 'Russia', type: 'naval' },
];

export const SPACEPORTS = [
  { name: 'Cape Canaveral', lat: 28.39, lon: -80.60, country: 'US' },
  { name: 'Kennedy Space Center', lat: 28.57, lon: -80.65, country: 'US' },
  { name: 'Vandenberg SFB', lat: 34.74, lon: -120.57, country: 'US' },
  { name: 'Baikonur', lat: 45.97, lon: 63.31, country: 'Kazakhstan' },
  { name: 'Plesetsk', lat: 62.93, lon: 40.58, country: 'Russia' },
  { name: 'Xichang', lat: 28.25, lon: 102.03, country: 'China' },
  { name: 'Wenchang', lat: 19.61, lon: 110.95, country: 'China' },
  { name: 'Satish Dhawan', lat: 13.72, lon: 80.23, country: 'India' },
  { name: 'Tanegashima', lat: 30.40, lon: 131.00, country: 'Japan' },
  { name: 'Guiana Space Centre', lat: 5.24, lon: -52.77, country: 'French Guiana' },
  { name: 'Esrange', lat: 67.89, lon: 21.10, country: 'Sweden' },
  { name: 'Mahia', lat: -39.26, lon: 177.86, country: 'New Zealand' },
];

export const CHOKEPOINTS = [
  { name: 'Strait of Hormuz', lat: 26.59, lon: 56.25, flow: '21M bbl/day' },
  { name: 'Strait of Malacca', lat: 2.50, lon: 101.30, flow: '16M bbl/day' },
  { name: 'Suez Canal', lat: 30.46, lon: 32.35, flow: '5.5M bbl/day' },
  { name: 'Bab el-Mandeb', lat: 12.58, lon: 43.33, flow: '4.8M bbl/day' },
  { name: 'Turkish Straits', lat: 41.12, lon: 29.05, flow: '2.4M bbl/day' },
  { name: 'Panama Canal', lat: 9.08, lon: -79.68, flow: '0.9M bbl/day' },
  { name: 'GIUK Gap', lat: 63.0, lon: -15.0, flow: 'NATO ASW' },
  { name: 'Taiwan Strait', lat: 24.5, lon: 119.5, flow: '88% chip trade' },
];

export const DATACENTERS = [
  { name: 'Ashburn (Data Center Alley)', lat: 39.04, lon: -77.49, operator: 'Various', capacity: '2GW+' },
  { name: 'Google The Dalles', lat: 45.59, lon: -121.18, operator: 'Google', capacity: '300MW' },
  { name: 'Meta Luleå', lat: 65.58, lon: 22.15, operator: 'Meta', capacity: '120MW' },
  { name: 'Microsoft Dublin', lat: 53.35, lon: -6.26, operator: 'Microsoft', capacity: '200MW' },
  { name: 'AWS Singapore', lat: 1.35, lon: 103.82, operator: 'AWS', capacity: '150MW' },
  { name: 'Equinix Tokyo', lat: 35.68, lon: 139.73, operator: 'Equinix', capacity: '100MW' },
  { name: 'Interxion Frankfurt', lat: 50.11, lon: 8.68, operator: 'Interxion', capacity: '180MW' },
  { name: 'HKIX Tseung Kwan O', lat: 22.31, lon: 114.26, operator: 'HK Govt', capacity: '80MW' },
];

export const CRITICAL_MINERALS = [
  { name: 'Escondida (Copper)', lat: -24.27, lon: -69.07, mineral: 'Copper', country: 'Chile' },
  { name: 'Grasberg (Copper/Gold)', lat: -4.05, lon: 137.12, mineral: 'Copper/Gold', country: 'Indonesia' },
  { name: 'Pilbara (Iron)', lat: -22.30, lon: 118.20, mineral: 'Iron Ore', country: 'Australia' },
  { name: 'Kolwezi (Cobalt)', lat: -10.72, lon: 25.47, mineral: 'Cobalt', country: 'DRC' },
  { name: 'Bayan Obo (Rare Earth)', lat: 41.80, lon: 110.00, mineral: 'Rare Earth', country: 'China' },
  { name: 'Greenbushes (Lithium)', lat: -33.87, lon: 116.06, mineral: 'Lithium', country: 'Australia' },
  { name: 'Salar de Atacama (Lithium)', lat: -23.50, lon: -68.20, mineral: 'Lithium', country: 'Chile' },
  { name: 'Norilsk (Nickel/Palladium)', lat: 69.35, lon: 88.20, mineral: 'Nickel', country: 'Russia' },
  { name: 'Carajás (Iron)', lat: -6.07, lon: -50.18, mineral: 'Iron Ore', country: 'Brazil' },
];
