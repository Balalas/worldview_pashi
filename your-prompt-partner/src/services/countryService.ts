// Country enrichment data from RestCountries API (free, no key needed)

export interface CountryData {
  name: string;
  officialName: string;
  code: string; // ISO alpha-2
  flag: string;
  population: number;
  area: number; // sq km
  region: string;
  subregion: string;
  capital: string;
  languages: string[];
  currencies: string[];
  timezones: string[];
  borders: string[];
  gini?: number; // inequality index
  lat: number;
  lon: number;
  unMember: boolean;
  landlocked: boolean;
  coatOfArms?: string;
  maps?: string;
}

let countryCache: Map<string, CountryData> = new Map();
let allCountriesLoaded = false;

export const fetchAllCountries = async (): Promise<CountryData[]> => {
  if (allCountriesLoaded) return Array.from(countryCache.values());
  
  try {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flag,population,area,region,subregion,capital,languages,currencies,timezones,borders,gini,latlng,unMember,landlocked,coatOfArms,maps');
    if (!res.ok) throw new Error('RestCountries error');
    const data = await res.json();
    
    const countries: CountryData[] = data.map((c: any) => ({
      name: c.name?.common || '',
      officialName: c.name?.official || '',
      code: c.cca2 || '',
      flag: c.flag || '',
      population: c.population || 0,
      area: c.area || 0,
      region: c.region || '',
      subregion: c.subregion || '',
      capital: c.capital?.[0] || '',
      languages: c.languages ? Object.values(c.languages) : [],
      currencies: c.currencies ? Object.values(c.currencies).map((cur: any) => `${cur.name} (${cur.symbol || ''})`) : [],
      timezones: c.timezones || [],
      borders: c.borders || [],
      gini: c.gini ? Object.values(c.gini)[0] as number : undefined,
      lat: c.latlng?.[0] || 0,
      lon: c.latlng?.[1] || 0,
      unMember: c.unMember || false,
      landlocked: c.landlocked || false,
      coatOfArms: c.coatOfArms?.svg,
      maps: c.maps?.googleMaps,
    }));
    
    countries.forEach(c => countryCache.set(c.code, c));
    allCountriesLoaded = true;
    return countries;
  } catch (e) {
    console.warn('Failed to fetch countries:', e);
    return [];
  }
};

export const getCountryByCode = (code: string): CountryData | undefined => {
  return countryCache.get(code.toUpperCase());
};

export const searchCountries = (query: string): CountryData[] => {
  const term = query.toLowerCase();
  return Array.from(countryCache.values()).filter(
    c => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term) || c.capital.toLowerCase().includes(term)
  );
};

export const formatPopulation = (pop: number): string => {
  if (pop >= 1e9) return `${(pop / 1e9).toFixed(2)}B`;
  if (pop >= 1e6) return `${(pop / 1e6).toFixed(1)}M`;
  if (pop >= 1e3) return `${(pop / 1e3).toFixed(1)}K`;
  return String(pop);
};

export const formatArea = (area: number): string => {
  if (area >= 1e6) return `${(area / 1e6).toFixed(2)}M km²`;
  return `${area.toLocaleString()} km²`;
};
