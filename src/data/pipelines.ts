// Major oil/gas pipelines worldwide (static data)

export interface Pipeline {
  name: string;
  coordinates: [number, number][]; // [lat, lon] pairs
  type: 'oil' | 'gas' | 'both';
  capacity: string;
  operator: string;
  color: string;
}

export const PIPELINES: Pipeline[] = [
  // Europe
  {
    name: 'Nord Stream (inactive)',
    coordinates: [[59.83, 30.27], [59.3, 24.0], [55.5, 15.0], [54.3, 12.1]],
    type: 'gas', capacity: '55 bcm/yr', operator: 'Gazprom', color: '#ff4444',
  },
  {
    name: 'TurkStream',
    coordinates: [[44.6, 37.8], [43.5, 34.0], [41.7, 28.0]],
    type: 'gas', capacity: '31.5 bcm/yr', operator: 'Gazprom', color: '#ff6b35',
  },
  {
    name: 'TAP (Trans Adriatic)',
    coordinates: [[40.6, 19.8], [40.1, 20.5], [39.6, 21.5], [40.5, 22.9]],
    type: 'gas', capacity: '10 bcm/yr', operator: 'TAP AG', color: '#00aaff',
  },
  {
    name: 'Yamal-Europe',
    coordinates: [[67.5, 72.0], [61.0, 55.0], [55.0, 37.0], [52.2, 21.0], [52.5, 13.4]],
    type: 'gas', capacity: '33 bcm/yr', operator: 'Gazprom', color: '#ff8800',
  },

  // Middle East
  {
    name: 'East-West (Petroline)',
    coordinates: [[26.5, 50.1], [25.5, 46.0], [22.5, 39.2]],
    type: 'oil', capacity: '5M bbl/day', operator: 'Saudi Aramco', color: '#00ff88',
  },
  {
    name: 'IGAT (Iran Gas)',
    coordinates: [[27.2, 52.5], [32.5, 51.7], [35.7, 51.4], [38.1, 48.3]],
    type: 'gas', capacity: '45 bcm/yr', operator: 'NIGC', color: '#ffb000',
  },

  // Americas
  {
    name: 'Keystone XL (partial)',
    coordinates: [[50.4, -108.0], [48.0, -106.0], [44.0, -103.0], [40.0, -97.5], [36.0, -96.0], [29.7, -95.0]],
    type: 'oil', capacity: '830K bbl/day', operator: 'TC Energy', color: '#4488ff',
  },
  {
    name: 'Colonial Pipeline',
    coordinates: [[29.7, -95.0], [30.4, -88.0], [33.7, -84.4], [35.2, -80.8], [36.8, -76.0], [39.3, -76.6], [40.7, -74.2]],
    type: 'oil', capacity: '2.5M bbl/day', operator: 'Colonial', color: '#00d4ff',
  },
  {
    name: 'Trans-Alaska',
    coordinates: [[70.2, -148.5], [66.0, -150.0], [64.8, -148.0], [63.0, -146.0], [61.2, -146.4]],
    type: 'oil', capacity: '600K bbl/day', operator: 'Alyeska', color: '#ff44aa',
  },

  // Russia/Asia
  {
    name: 'Power of Siberia',
    coordinates: [[62.0, 130.0], [56.0, 124.0], [50.5, 128.0], [48.5, 134.5]],
    type: 'gas', capacity: '38 bcm/yr', operator: 'Gazprom', color: '#ff6b35',
  },
  {
    name: 'ESPO (East Siberia-Pacific)',
    coordinates: [[56.0, 97.0], [52.5, 107.0], [50.0, 120.0], [48.0, 130.0], [43.0, 132.0]],
    type: 'oil', capacity: '1.6M bbl/day', operator: 'Transneft', color: '#ff0088',
  },

  // Africa
  {
    name: 'Trans-Saharan (proposed)',
    coordinates: [[4.8, 7.0], [9.0, 7.5], [13.5, 8.0], [20.0, 8.0], [30.0, 10.0], [36.8, 10.2]],
    type: 'gas', capacity: '30 bcm/yr', operator: 'Proposed', color: '#aa44ff',
  },
  {
    name: 'West African Gas Pipeline',
    coordinates: [[6.4, 3.4], [6.2, 1.2], [5.6, -0.2], [5.0, -1.8]],
    type: 'gas', capacity: '5 bcm/yr', operator: 'WAPCo', color: '#ffb000',
  },
];
