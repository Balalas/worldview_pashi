// Smithsonian GVP + USGS Volcano Hazards — live volcano data
// Free, no API key required

export interface VolcanoAlert {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation: number;
  country: string;
  alertLevel: 'normal' | 'advisory' | 'watch' | 'warning';
  aviationColor: string;
  lastUpdate: string;
  link?: string;
}

export const fetchUSGSVolcanoAlerts = async (): Promise<VolcanoAlert[]> => {
  try {
    const res = await fetch('https://volcanoes.usgs.gov/vsc/api/volcanoApi/alertsummaries');
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.features) return [];
    return data.features.map((f: any) => ({
      id: f.attributes?.vnum || `vol-${f.attributes?.volcanoName}`,
      name: f.attributes?.volcanoName || 'Unknown',
      lat: f.attributes?.latitude || 0,
      lon: f.attributes?.longitude || 0,
      elevation: f.attributes?.elevM || 0,
      country: f.attributes?.country || '',
      alertLevel: (f.attributes?.alertLevel || 'normal').toLowerCase(),
      aviationColor: f.attributes?.colorCode || 'GREEN',
      lastUpdate: f.attributes?.updateDate || '',
      link: f.attributes?.volcanoUrl,
    }));
  } catch (e) {
    console.warn('Failed to fetch USGS volcano alerts:', e);
    return [];
  }
};

// GVP weekly volcanic activity report (RSS)
export const fetchGVPWeekly = async (): Promise<{ title: string; date: string; link: string }[]> => {
  try {
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://volcano.si.edu/news/WeeklyVolcanoRSS.xml')}`
    );
    const data = await res.json();
    if (data.status !== 'ok') return [];
    return data.items.slice(0, 10).map((item: any) => ({
      title: item.title,
      date: item.pubDate,
      link: item.link,
    }));
  } catch (e) {
    console.warn('Failed to fetch GVP weekly:', e);
    return [];
  }
};
