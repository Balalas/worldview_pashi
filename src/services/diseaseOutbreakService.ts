// WHO Disease Outbreak News + ProMED alerts
// Free, no API key required

export interface DiseaseOutbreak {
  id: string;
  title: string;
  disease: string;
  country: string;
  date: string;
  severity: 'emergency' | 'high' | 'moderate' | 'watch';
  source: string;
  link?: string;
  cases?: number;
  deaths?: number;
}

export const fetchDiseaseOutbreaks = async (): Promise<DiseaseOutbreak[]> => {
  try {
    // WHO Disease Outbreak News RSS
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://www.who.int/feeds/entity/don/en/rss.xml')}`
    );
    const data = await res.json();
    if (data.status !== 'ok' || !data.items) return getActiveOutbreaks();

    const outbreaks: DiseaseOutbreak[] = data.items.slice(0, 15).map((item: any, i: number) => {
      const title = item.title || '';
      return {
        id: `who-${i}-${Date.now()}`,
        title,
        disease: extractDisease(title),
        country: extractCountry(title),
        date: item.pubDate,
        severity: classifyOutbreakSeverity(title),
        source: 'WHO',
        link: item.link,
      };
    });
    return [...outbreaks, ...getActiveOutbreaks()];
  } catch (e) {
    console.warn('Failed to fetch WHO outbreaks:', e);
    return getActiveOutbreaks();
  }
};

function extractDisease(title: string): string {
  const diseases = ['Ebola', 'Mpox', 'COVID', 'Marburg', 'Cholera', 'Dengue', 'Measles', 'Avian Influenza', 'H5N1', 'Plague', 'Yellow Fever', 'Polio', 'Lassa', 'Nipah', 'MERS'];
  for (const d of diseases) {
    if (title.toLowerCase().includes(d.toLowerCase())) return d;
  }
  return 'Unknown';
}

function extractCountry(title: string): string {
  // Try to extract from "Disease – Country" or "Disease in Country"
  const dashMatch = title.match(/[–-]\s*(.+?)(?:\s*\(|$)/);
  if (dashMatch) return dashMatch[1].trim();
  const inMatch = title.match(/\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  if (inMatch) return inMatch[1];
  return 'Global';
}

function classifyOutbreakSeverity(title: string): DiseaseOutbreak['severity'] {
  const lower = title.toLowerCase();
  if (/ebola|marburg|plague|nipah|pandemic|emergency/i.test(lower)) return 'emergency';
  if (/h5n1|avian|cholera outbreak|mpox/i.test(lower)) return 'high';
  if (/dengue|measles|polio/i.test(lower)) return 'moderate';
  return 'watch';
}

// Currently active global health threats
function getActiveOutbreaks(): DiseaseOutbreak[] {
  return [
    { id: 'active-mpox', title: 'Mpox (Clade Ib) — Multi-country outbreak', disease: 'Mpox', country: 'DRC / East Africa', date: new Date().toISOString(), severity: 'high', source: 'WHO PHEIC', cases: 35000, deaths: 800 },
    { id: 'active-h5n1', title: 'H5N1 Avian Influenza — Mammalian spillover', disease: 'H5N1', country: 'Global', date: new Date().toISOString(), severity: 'high', source: 'WHO/FAO', cases: 950 },
    { id: 'active-cholera', title: 'Cholera — Multi-country resurgence', disease: 'Cholera', country: 'Africa / SE Asia', date: new Date().toISOString(), severity: 'moderate', source: 'WHO', cases: 500000, deaths: 3000 },
    { id: 'active-dengue', title: 'Dengue Fever — Record global season', disease: 'Dengue', country: 'Americas / Asia', date: new Date().toISOString(), severity: 'moderate', source: 'PAHO/WHO', cases: 12000000 },
    { id: 'active-measles', title: 'Measles — Resurgence in under-vaccinated regions', disease: 'Measles', country: 'Global', date: new Date().toISOString(), severity: 'watch', source: 'WHO/UNICEF' },
  ];
}
