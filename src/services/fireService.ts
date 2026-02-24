import { FireEvent } from '@/store/worldview';

// NASA EONET (Earth Observatory Natural Event Tracker) - free, no API key
export const fetchActiveFiresEONET = async (): Promise<FireEvent[]> => {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&limit=80');
    if (!res.ok) return [];
    const data = await res.json();
    
    return (data.events || []).map((event: any) => {
      const geo = event.geometry?.[event.geometry.length - 1]; // latest geometry
      if (!geo?.coordinates) return null;
      return {
        id: event.id,
        title: event.title,
        lat: geo.coordinates[1],
        lon: geo.coordinates[0],
        date: geo.date,
        source: event.sources?.[0]?.id || 'NASA',
        link: event.sources?.[0]?.url || event.link,
        category: 'wildfire' as const,
      };
    }).filter(Boolean) as FireEvent[];
  } catch (e) {
    console.warn('Failed to fetch EONET fires:', e);
    return [];
  }
};

// NASA EONET - all natural events (volcanoes, storms, floods, etc.)
export const fetchNaturalDisasters = async (): Promise<FireEvent[]> => {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50');
    if (!res.ok) return [];
    const data = await res.json();

    return (data.events || [])
      .filter((e: any) => {
        const cat = e.categories?.[0]?.id;
        // Exclude wildfires (fetched separately) and ice
        return cat && cat !== 'wildfires' && cat !== 'seaLakeIce';
      })
      .map((event: any) => {
        const geo = event.geometry?.[event.geometry.length - 1];
        if (!geo?.coordinates) return null;
        const catId = event.categories?.[0]?.id || 'other';
        const categoryMap: Record<string, FireEvent['category']> = {
          volcanoes: 'volcano',
          severeStorms: 'storm',
          floods: 'flood',
          earthquakes: 'earthquake',
          drought: 'drought',
          landslides: 'landslide',
          snow: 'storm',
          tempExtremes: 'storm',
        };
        return {
          id: event.id,
          title: event.title,
          lat: geo.coordinates[1],
          lon: geo.coordinates[0],
          date: geo.date,
          source: event.sources?.[0]?.id || 'NASA',
          link: event.sources?.[0]?.url,
          category: categoryMap[catId] || 'other',
        };
      })
      .filter(Boolean) as FireEvent[];
  } catch (e) {
    console.warn('Failed to fetch EONET events:', e);
    return [];
  }
};
