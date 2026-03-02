// Nuclear reactor data — Global power plant database
// Free, no API key required

export interface NuclearReactor {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  status: 'operational' | 'under_construction' | 'shutdown' | 'decommissioned';
  type: string;
  capacityMW: number;
  yearCommissioned?: number;
}

// Major global nuclear reactors — sourced from IAEA PRIS public data
export const NUCLEAR_REACTORS: NuclearReactor[] = [
  // United States
  { id: 'us-vogtle-3', name: 'Vogtle 3', country: 'US', lat: 33.1416, lon: -81.7595, status: 'operational', type: 'AP1000', capacityMW: 1117, yearCommissioned: 2023 },
  { id: 'us-vogtle-4', name: 'Vogtle 4', country: 'US', lat: 33.1416, lon: -81.7595, status: 'operational', type: 'AP1000', capacityMW: 1117, yearCommissioned: 2024 },
  { id: 'us-diablo', name: 'Diablo Canyon', country: 'US', lat: 35.2115, lon: -120.8554, status: 'operational', type: 'PWR', capacityMW: 2256 },
  { id: 'us-palo-verde', name: 'Palo Verde', country: 'US', lat: 33.3886, lon: -112.8613, status: 'operational', type: 'PWR', capacityMW: 3937 },
  { id: 'us-south-texas', name: 'South Texas', country: 'US', lat: 28.7958, lon: -96.0489, status: 'operational', type: 'PWR', capacityMW: 2710 },
  // France
  { id: 'fr-gravelines', name: 'Gravelines', country: 'FR', lat: 50.9915, lon: 2.1086, status: 'operational', type: 'PWR', capacityMW: 5460 },
  { id: 'fr-flamanville', name: 'Flamanville 3', country: 'FR', lat: 49.5373, lon: -1.8815, status: 'operational', type: 'EPR', capacityMW: 1630, yearCommissioned: 2025 },
  { id: 'fr-cattenom', name: 'Cattenom', country: 'FR', lat: 49.4067, lon: 6.2189, status: 'operational', type: 'PWR', capacityMW: 5448 },
  // Russia
  { id: 'ru-kursk-2', name: 'Kursk II-1', country: 'RU', lat: 51.6750, lon: 35.6111, status: 'under_construction', type: 'VVER-TOI', capacityMW: 1255 },
  { id: 'ru-novovoronezh', name: 'Novovoronezh II', country: 'RU', lat: 51.2747, lon: 39.2208, status: 'operational', type: 'VVER-1200', capacityMW: 2400 },
  // China
  { id: 'cn-taishan', name: 'Taishan', country: 'CN', lat: 21.9147, lon: 112.9800, status: 'operational', type: 'EPR', capacityMW: 3380 },
  { id: 'cn-hualong', name: 'Fuqing 5 (Hualong One)', country: 'CN', lat: 25.4417, lon: 119.4500, status: 'operational', type: 'HPR1000', capacityMW: 1161, yearCommissioned: 2021 },
  { id: 'cn-sanmen', name: 'Sanmen', country: 'CN', lat: 29.1000, lon: 121.4667, status: 'operational', type: 'AP1000', capacityMW: 2234 },
  // Japan
  { id: 'jp-kashiwazaki', name: 'Kashiwazaki-Kariwa', country: 'JP', lat: 37.4292, lon: 138.5983, status: 'shutdown', type: 'BWR/ABWR', capacityMW: 8212 },
  { id: 'jp-fukushima-daini', name: 'Fukushima Daini', country: 'JP', lat: 37.3167, lon: 141.0250, status: 'decommissioned', type: 'BWR', capacityMW: 4400 },
  // UK
  { id: 'uk-hinkley-c', name: 'Hinkley Point C', country: 'GB', lat: 51.2082, lon: -3.1313, status: 'under_construction', type: 'EPR', capacityMW: 3260 },
  { id: 'uk-sizewell-b', name: 'Sizewell B', country: 'GB', lat: 52.2156, lon: 1.6195, status: 'operational', type: 'PWR', capacityMW: 1198 },
  // India
  { id: 'in-kudankulam', name: 'Kudankulam', country: 'IN', lat: 8.1697, lon: 77.7103, status: 'operational', type: 'VVER-1000', capacityMW: 2000 },
  { id: 'in-tarapur', name: 'Tarapur', country: 'IN', lat: 19.8304, lon: 72.6523, status: 'operational', type: 'PHWR', capacityMW: 1400 },
  // South Korea
  { id: 'kr-shin-kori', name: 'Shin Kori 3&4', country: 'KR', lat: 35.3203, lon: 129.2842, status: 'operational', type: 'APR-1400', capacityMW: 2800 },
  // Ukraine
  { id: 'ua-zaporizhzhia', name: 'Zaporizhzhia', country: 'UA', lat: 47.5069, lon: 34.5897, status: 'shutdown', type: 'VVER-1000', capacityMW: 6000 },
  // Iran
  { id: 'ir-bushehr', name: 'Bushehr', country: 'IR', lat: 28.8303, lon: 50.8861, status: 'operational', type: 'VVER-1000', capacityMW: 1000 },
  // Pakistan
  { id: 'pk-karachi', name: 'KANUPP-2', country: 'PK', lat: 24.8427, lon: 66.7838, status: 'operational', type: 'HPR1000', capacityMW: 1100, yearCommissioned: 2021 },
  // Egypt (under construction)
  { id: 'eg-dabaa', name: 'El Dabaa', country: 'EG', lat: 31.0333, lon: 28.4667, status: 'under_construction', type: 'VVER-1200', capacityMW: 4800 },
  // Turkey (under construction)
  { id: 'tr-akkuyu', name: 'Akkuyu', country: 'TR', lat: 36.1447, lon: 33.5264, status: 'under_construction', type: 'VVER-1200', capacityMW: 4800 },
];

export const getNuclearStats = () => {
  const operational = NUCLEAR_REACTORS.filter(r => r.status === 'operational');
  const underConstruction = NUCLEAR_REACTORS.filter(r => r.status === 'under_construction');
  const totalCapacity = operational.reduce((sum, r) => sum + r.capacityMW, 0);
  return {
    totalReactors: NUCLEAR_REACTORS.length,
    operational: operational.length,
    underConstruction: underConstruction.length,
    totalCapacityGW: (totalCapacity / 1000).toFixed(1),
  };
};
