import { memo, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useWorldViewStore, NewsItem, TwitterOsintPost } from '@/store/worldview';
import { CountryData } from '@/services/countryService';
import { PUBLIC_CAMERAS } from '@/data/publicCameras';
import { CONFLICT_ZONES } from '@/data/conflictZones';
import { LIVESTREAM_FEEDS, LivestreamFeed } from '@/services/dataServices';
import { fetchAINewsEnrichment, AINewsEnrichment } from '@/services/aiEnrichService';
import { fetchPerplexityCountryIntel, PerplexityIntel } from '@/services/perplexityIntelService';


type DossierTab = 'war' | 'intelligence' | 'cyber' | 'crime' | 'xosint' | 'perplexity' | 'cameras' | 'tv' | 'all';

const TAB_CONFIG: { key: DossierTab; label: string; icon: string; keywords: RegExp }[] = [
  { key: 'all', label: 'ALL INTEL', icon: '📡', keywords: /./i },
  { key: 'war', label: 'WAR & CONFLICT', icon: '⚔️', keywords: /\b(war|airstrike|missile|bombing|shelling|casualties|killed|troops|invasion|offensive|ceasefire|artillery|mortar|combat|frontline|siege|drone strike|battle|military|army|navy|airforce|weapon|tank|helicopter|fighter jet|raid|occupation)\b/i },
  { key: 'intelligence', label: 'INTELLIGENCE', icon: '🕵️', keywords: /\b(intelligen|espionage|spy|surveillance|covert|classified|cia|mossad|fbi|mi6|fsb|sigint|operation|agent|defect|leak|whistleblow|intercept|sanction|diplomacy|ambassador|embassy|treaty|negotiation)\b/i },
  { key: 'cyber', label: 'CYBER', icon: '🔒', keywords: /\b(cyber|hack|breach|ransomware|ddos|malware|phishing|data leak|exploit|vulnerability|zero.day|apt|botnet|encryption|internet|outage|infrastructure|grid|network)\b/i },
  { key: 'crime', label: 'CRIME', icon: '🚨', keywords: /\b(crime|murder|arrest|drug|cartel|gang|trafficking|smuggling|corruption|fraud|launder|theft|robbery|terrorist|extremist|organized crime|kidnap|prison|sentence|trial|court|prosecution)\b/i },
  { key: 'xosint', label: '𝕏 OSINT', icon: '𝕏', keywords: /./i },
  { key: 'perplexity', label: 'AI INTEL', icon: '🔍', keywords: /./i },
  { key: 'tv', label: 'LIVE TV', icon: '📺', keywords: /./i },
  { key: 'cameras', label: 'CCTV', icon: '📹', keywords: /./i },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-alert-critical border-alert-critical/30 bg-alert-critical/5',
  high: 'text-alert-high border-alert-high/30 bg-alert-high/5',
  medium: 'text-alert-medium border-alert-medium/30 bg-alert-medium/5',
  low: 'text-primary border-primary/30 bg-primary/5',
  info: 'text-muted-foreground border-border bg-muted/5',
};

// Categorize a text string into intel categories
function categorizeText(text: string): DossierTab[] {
  const cats: DossierTab[] = [];
  const tabs = TAB_CONFIG.filter(t => !['all', 'xosint', 'perplexity', 'tv', 'cameras'].includes(t.key));
  for (const tab of tabs) {
    if (tab.keywords.test(text)) cats.push(tab.key);
  }
  return cats.length > 0 ? cats : ['intelligence'];
}

// AI Intel categorized result
interface CategorizedIntel {
  war: string[];
  intelligence: string[];
  cyber: string[];
  crime: string[];
}

function categorizeIntelResults(intel: PerplexityIntel): CategorizedIntel {
  const result: CategorizedIntel = { war: [], intelligence: [], cyber: [], crime: [] };
  const allItems = [...(intel.developments || []), ...(intel.risks || [])];
  for (const item of allItems) {
    const cats = categorizeText(item);
    for (const cat of cats) {
      if (cat in result) {
        (result as any)[cat].push(item);
      }
    }
  }
  // If briefing exists, categorize it too
  if (intel.briefing) {
    const cats = categorizeText(intel.briefing);
    for (const cat of cats) {
      if (cat in result && (result as any)[cat].length === 0) {
        (result as any)[cat].push(intel.briefing);
      }
    }
  }
  return result;
}

const CountryDossier = memo(() => {
  const { countryDossier, closeCountryDossier, news, earthquakes, fires, protests, outages, setActiveLivestream, setDetailPanel, setMapCenter, twitterPosts } = useWorldViewStore();
  const [activeTab, setActiveTab] = useState<DossierTab>('all');
  const [aiIntel, setAiIntel] = useState<PerplexityIntel | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [categorized, setCategorized] = useState<CategorizedIntel | null>(null);
  const dossierRef = useRef<HTMLDivElement>(null);

  const country = countryDossier;
  const countryName = country?.name.toLowerCase() ?? '';
  const countryCode = country?.code ?? '';

  // Match news to this country
  const countryNews = useMemo(() => {
    if (!country) return [];
    return news.filter(n => {
      const titleLower = n.title.toLowerCase();
      const srcCountry = n.country?.toLowerCase();
      return (
        srcCountry === countryName ||
        titleLower.includes(countryName) ||
        (country.capital && titleLower.includes(country.capital.toLowerCase()))
      );
    });
  }, [news, countryName, country]);

  // Filter by active tab
  const filteredNews = useMemo(() => {
    if (activeTab === 'cameras' || activeTab === 'xosint' || activeTab === 'perplexity') return [];
    const tabCfg = TAB_CONFIG.find(t => t.key === activeTab);
    if (!tabCfg || activeTab === 'all') return countryNews;
    return countryNews.filter(n => tabCfg.keywords.test(n.title));
  }, [countryNews, activeTab]);

  // X/Twitter OSINT posts matching this country
  const countryXPosts = useMemo(() => {
    if (!country) return [];
    const searchTerms = [countryName, country.capital?.toLowerCase(), countryCode.toLowerCase()].filter(Boolean);
    return twitterPosts.filter(p => {
      const textLower = p.text.toLowerCase();
      return searchTerms.some(term => term && textLower.includes(term));
    });
  }, [twitterPosts, countryName, country, countryCode]);

  // Live cameras in this country
  const countryCameras = useMemo(() => {
    if (!country) return [];
    return PUBLIC_CAMERAS.filter(c =>
      c.country === countryCode &&
      (c.embedUrl || c.snapshotUrl)
    );
  }, [countryCode, country]);

  // TV channels matching this country/region
  const countryTVChannels = useMemo(() => {
    if (!country) return [];
    const REGION_MAP: Record<string, string[]> = {
      'US': ['US', 'Americas'], 'GB': ['UK', 'Europe'], 'FR': ['Europe'], 'DE': ['Germany', 'Europe'],
      'RU': ['Russia', 'Europe'], 'CN': ['China', 'Asia'], 'JP': ['Japan', 'Asia'], 'IN': ['India', 'Asia'],
      'KR': ['South Korea', 'Asia'], 'TR': ['Turkey', 'Europe'], 'IL': ['Middle East'], 'PS': ['Middle East'],
      'SA': ['Middle East'], 'QA': ['Middle East', 'Global'], 'AE': ['Middle East'], 'SG': ['Asia', 'Singapore'],
      'UA': ['Europe', 'Kyiv'], 'IR': ['Middle East'], 'IQ': ['Middle East'], 'SY': ['Middle East'],
      'LB': ['Middle East'], 'YE': ['Middle East'], 'EG': ['Middle East', 'Africa'], 'NG': ['Africa'],
      'AU': ['Asia'], 'BR': ['Americas'],
    };
    const regions = REGION_MAP[countryCode] || [country.region, country.subregion];
    return LIVESTREAM_FEEDS.filter(f =>
      f.category === 'news' && (
        regions.some(r => f.region?.toLowerCase().includes(r.toLowerCase())) ||
        f.region === 'Global'
      )
    );
  }, [countryCode, country]);

  // Conflict zones in this country
  const countryConflicts = useMemo(() => {
    if (!country) return [];
    return CONFLICT_ZONES.filter(z =>
      z.name.toLowerCase().includes(countryName) ||
      countryName.includes(z.name.split('–')[0].trim().toLowerCase())
    );
  }, [countryName, country]);

  // Country earthquakes
  const countryQuakes = useMemo(() => {
    if (!country) return [];
    return earthquakes.filter(eq => {
      const dist = Math.sqrt(Math.pow(eq.lat - country.lat, 2) + Math.pow(eq.lon - country.lon, 2));
      return dist < 10;
    }).slice(0, 5);
  }, [earthquakes, country]);

  // Country fires
  const countryFires = useMemo(() => {
    if (!country) return 0;
    return fires.filter(f => {
      const dist = Math.sqrt(Math.pow(f.lat - country.lat, 2) + Math.pow(f.lon - country.lon, 2));
      return dist < 10;
    }).length;
  }, [fires, country]);

  // AI category counts (from categorized intel)
  const aiCategoryCounts = useMemo(() => {
    if (!categorized) return { war: 0, intelligence: 0, cyber: 0, crime: 0 };
    return {
      war: categorized.war.length,
      intelligence: categorized.intelligence.length,
      cyber: categorized.cyber.length,
      crime: categorized.crime.length,
    };
  }, [categorized]);

  // Main SCAN button
  const handleScanCountry = useCallback(async () => {
    if (!country) return;
    setAiLoading(true);
    const intel = await fetchPerplexityCountryIntel(country.name);
    if (intel) {
      setAiIntel(intel);
      setCategorized(categorizeIntelResults(intel));
    }
    setAiLoading(false);
  }, [country]);

  // Auto-scan on mount
  useEffect(() => {
    if (country && !aiIntel && !aiLoading) {
      handleScanCountry();
    }
  }, [country?.code]);

  // PDF Download
  const handleDownloadPDF = useCallback(() => {
    if (!country) return;
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#020810';
    ctx.fillRect(0, 0, 800, 1200);
    ctx.strokeStyle = 'rgba(0,255,136,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 780, 1180);

    // Header
    ctx.fillStyle = 'rgba(0,255,136,0.08)';
    ctx.fillRect(10, 10, 780, 80);
    ctx.font = '700 24px Rajdhani, sans-serif';
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'center';
    ctx.fillText(`${country.flag} ${country.name.toUpperCase()} — INTELLIGENCE DOSSIER`, 400, 42);
    ctx.font = '400 10px JetBrains Mono, monospace';
    ctx.fillStyle = '#cc2244';
    ctx.fillText('UNCLASSIFIED // FOUO', 400, 60);
    ctx.fillStyle = '#7eaac8';
    ctx.fillText(new Date().toISOString(), 400, 75);

    let y = 110;
    ctx.textAlign = 'left';

    const section = (title: string) => {
      ctx.fillStyle = 'rgba(0,255,136,0.1)';
      ctx.fillRect(20, y - 14, 760, 20);
      ctx.font = '600 12px Rajdhani, sans-serif';
      ctx.fillStyle = '#00ff88';
      ctx.fillText(title, 30, y);
      y += 24;
    };

    const line = (label: string, value: string, color = '#d4e4f0') => {
      ctx.font = '400 10px JetBrains Mono, monospace';
      ctx.fillStyle = '#7eaac8';
      ctx.fillText(label, 40, y);
      ctx.fillStyle = color;
      ctx.fillText(value, 260, y);
      y += 16;
    };

    const wrapText = (text: string, maxWidth: number) => {
      const words = text.split(' ');
      let currentLine = '';
      const lines: string[] = [];
      for (const word of words) {
        const test = currentLine + (currentLine ? ' ' : '') + word;
        ctx.font = '400 10px JetBrains Mono, monospace';
        if (ctx.measureText(test).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    // 1. Country Vitals
    section('1. COUNTRY VITALS');
    line('OFFICIAL NAME', country.officialName);
    line('ISO CODE', countryCode);
    line('CAPITAL', country.capital || 'N/A');
    line('POPULATION', formatPop(country.population));
    line('REGION', `${country.region} / ${country.subregion}`);
    line('LANGUAGES', country.languages.slice(0, 3).join(', '));
    line('CURRENCIES', country.currencies.slice(0, 2).join(', '));
    y += 8;

    // 2. Threat Assessment
    section('2. THREAT ASSESSMENT');
    const threatLvl = aiIntel?.threatLevel || 'UNKNOWN';
    const tlColor = threatLvl === 'CRITICAL' ? '#cc2244' : threatLvl === 'HIGH' ? '#cc6633' : threatLvl === 'MEDIUM' ? '#ccaa33' : '#00ff88';
    line('THREAT LEVEL', threatLvl, tlColor);
    line('ACTIVE CONFLICTS', String(countryConflicts.length), countryConflicts.length > 0 ? '#cc2244' : '#d4e4f0');
    line('EARTHQUAKES', String(countryQuakes.length));
    line('ACTIVE FIRES', String(countryFires));
    line('NEWS ITEMS', String(countryNews.length));
    line('𝕏 OSINT POSTS', String(countryXPosts.length));
    if (categorized) {
      line('WAR INTEL', String(categorized.war.length), '#cc2244');
      line('CYBER INTEL', String(categorized.cyber.length), '#cc6633');
      line('CRIME INTEL', String(categorized.crime.length), '#ccaa33');
      line('INTELLIGENCE', String(categorized.intelligence.length), '#7eaac8');
    }
    y += 8;

    // 3. AI Briefing
    if (aiIntel?.briefing) {
      section('3. AI INTELLIGENCE BRIEFING');
      ctx.font = '400 10px JetBrains Mono, monospace';
      ctx.fillStyle = '#d4e4f0';
      const briefLines = wrapText(aiIntel.briefing, 720);
      for (const bl of briefLines.slice(0, 8)) {
        ctx.fillText(bl, 40, y);
        y += 14;
      }
      y += 8;
    }

    // 4. Key Developments
    if (aiIntel?.developments && aiIntel.developments.length > 0) {
      section('4. KEY DEVELOPMENTS');
      for (const dev of aiIntel.developments.slice(0, 6)) {
        ctx.fillStyle = '#d4e4f0';
        ctx.font = '400 10px JetBrains Mono, monospace';
        const devLines = wrapText(`▸ ${dev}`, 720);
        for (const dl of devLines.slice(0, 2)) {
          ctx.fillText(dl, 40, y);
          y += 14;
        }
      }
      y += 8;
    }

    // 5. Risks
    if (aiIntel?.risks && aiIntel.risks.length > 0) {
      section('5. RISK ASSESSMENT');
      for (const risk of aiIntel.risks.slice(0, 4)) {
        ctx.fillStyle = '#cc6633';
        ctx.font = '400 10px JetBrains Mono, monospace';
        const rLines = wrapText(`⚠ ${risk}`, 720);
        for (const rl of rLines.slice(0, 2)) {
          ctx.fillText(rl, 40, y);
          y += 14;
        }
      }
    }

    // Footer
    y = 1150;
    ctx.fillStyle = 'rgba(0,255,136,0.05)';
    ctx.fillRect(10, y - 10, 780, 40);
    ctx.font = '400 8px JetBrains Mono, monospace';
    ctx.fillStyle = '#3f5f78';
    ctx.textAlign = 'center';
    ctx.fillText('Sources: Perplexity AI, GDELT, OSINT, NASA, USGS | WORLDVIEW Intelligence Platform', 400, y + 4);
    ctx.fillText(`Generated: ${new Date().toISOString()}`, 400, y + 16);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dossier-${country.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [country, aiIntel, categorized, countryConflicts, countryQuakes, countryFires, countryNews, countryXPosts, countryCode]);

  if (!country) return null;

  const handleNewsClick = (item: NewsItem) => {
    if (item.link) window.open(item.link, '_blank', 'noopener');
  };

  const handleCameraClick = (cam: typeof PUBLIC_CAMERAS[0]) => {
    setActiveLivestream(cam.embedUrl || null);
    setDetailPanel({ type: 'camera', data: cam });
    setMapCenter({ lat: cam.lat, lon: cam.lon, zoom: 14 });
  };

  const threatLevel = aiIntel?.threatLevel || 'UNKNOWN';
  const threatBadgeColor = threatLevel === 'CRITICAL' ? 'bg-alert-critical/20 text-alert-critical border-alert-critical/30' :
    threatLevel === 'HIGH' ? 'bg-alert-high/20 text-alert-high border-alert-high/30' :
    threatLevel === 'MEDIUM' ? 'bg-alert-medium/20 text-alert-medium border-alert-medium/30' :
    threatLevel === 'LOW' ? 'bg-primary/20 text-primary border-primary/30' :
    'bg-muted/20 text-muted-foreground border-border';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={closeCountryDossier}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void/80 backdrop-blur-md" />

      {/* Holographic Dossier Card */}
      <div
        ref={dossierRef}
        className="relative w-[90vw] max-w-[1100px] h-[85vh] max-h-[800px] animate-fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, hsl(var(--background) / 0.95), hsl(var(--background) / 0.85))',
          border: '1px solid hsl(var(--primary) / 0.3)',
          borderRadius: '8px',
          boxShadow: '0 0 60px hsl(var(--primary) / 0.1), 0 0 120px hsl(var(--primary) / 0.05), inset 0 1px 0 hsl(var(--primary) / 0.1)',
        }}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.02) 2px, hsl(var(--primary) / 0.02) 4px)',
          }}
        />

        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/50 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/50 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/50 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/50 rounded-br-lg" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-primary/20">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{country.flag}</span>
            <div>
              <h1 className="text-xl font-display tracking-[0.15em] text-foreground font-bold">
                {country.name.toUpperCase()}
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[9px] font-data text-muted-foreground tracking-wider">{country.officialName}</span>
                <span className="text-[8px] font-data text-primary/60">ISO: {countryCode}</span>
                <span className="text-[8px] font-data text-primary/60">CAPITAL: {country.capital}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Threat level badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded border ${threatBadgeColor}`}>
              {aiLoading ? (
                <span className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              )}
              <span className="text-[10px] font-data font-bold tracking-wider">
                {aiLoading ? 'SCANNING...' : threatLevel}
              </span>
            </div>

            {/* SCAN button */}
            <button
              onClick={handleScanCountry}
              disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary transition-all disabled:opacity-50 font-display tracking-wider text-[10px]"
            >
              {aiLoading ? (
                <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>🛰️</span>
              )}
              {aiLoading ? 'SCANNING...' : 'SCAN COUNTRY'}
            </button>

            {/* PDF Download */}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-2 rounded border border-border/50 bg-muted/10 hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-all text-[10px] font-display tracking-wider"
              title="Download Intelligence Report"
            >
              <span>📄</span>
              <span>EXPORT</span>
            </button>

            <button
              onClick={closeCountryDossier}
              className="w-8 h-8 flex items-center justify-center rounded border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 px-4 py-2 border-b border-border/30 overflow-x-auto">
          {TAB_CONFIG.map(tab => {
            const count = tab.key === 'cameras' ? countryCameras.length :
              tab.key === 'tv' ? countryTVChannels.length :
              tab.key === 'xosint' ? countryXPosts.length :
              tab.key === 'perplexity' ? -1 :
              tab.key === 'all' ? countryNews.length + (categorized ? categorized.war.length + categorized.cyber.length + categorized.crime.length + categorized.intelligence.length : 0) :
              tab.key === 'war' ? countryNews.filter(n => tab.keywords.test(n.title)).length + (aiCategoryCounts.war || 0) :
              tab.key === 'cyber' ? countryNews.filter(n => tab.keywords.test(n.title)).length + (aiCategoryCounts.cyber || 0) :
              tab.key === 'crime' ? countryNews.filter(n => tab.keywords.test(n.title)).length + (aiCategoryCounts.crime || 0) :
              tab.key === 'intelligence' ? countryNews.filter(n => tab.keywords.test(n.title)).length + (aiCategoryCounts.intelligence || 0) :
                countryNews.filter(n => tab.keywords.test(n.title)).length;

            const hasAIItems = categorized && tab.key in aiCategoryCounts && (aiCategoryCounts as any)[tab.key] > 0;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-data tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`ml-1 px-1 rounded text-[8px] ${
                  activeTab === tab.key ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'
                }`}>{count === -1 ? '🔍' : count}</span>
                {hasAIItems && <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100% - 140px)' }}>
          <div className="h-full flex gap-0">
            {/* Left sidebar — country stats */}
            <div className="w-[240px] border-r border-border/30 p-4 overflow-y-auto flex-shrink-0 space-y-4">
              {/* Country vitals */}
              <div className="space-y-2">
                <h3 className="text-[9px] font-data text-primary/70 tracking-[0.2em] border-b border-primary/10 pb-1">VITALS</h3>
                <StatRow label="POPULATION" value={formatPop(country.population)} />
                <StatRow label="AREA" value={`${country.area.toLocaleString()} km²`} />
                <StatRow label="REGION" value={country.region} />
                <StatRow label="SUBREGION" value={country.subregion} />
                <StatRow label="LANGUAGES" value={country.languages.slice(0, 3).join(', ')} />
                <StatRow label="CURRENCIES" value={country.currencies.slice(0, 2).join(', ')} />
                <StatRow label="TIMEZONE" value={country.timezones[0] || 'N/A'} />
                <StatRow label="BORDERS" value={country.borders.length > 0 ? country.borders.join(', ') : 'Island/None'} />
                <StatRow label="UN MEMBER" value={country.unMember ? '✓ YES' : '✗ NO'} />
                {country.gini && <StatRow label="GINI INDEX" value={String(country.gini)} />}
              </div>

              {/* Active conflicts */}
              {countryConflicts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[9px] font-data text-alert-critical/80 tracking-[0.2em] border-b border-alert-critical/10 pb-1">⚔️ ACTIVE CONFLICTS</h3>
                  {countryConflicts.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse flex-shrink-0" />
                      <span className="font-data text-foreground/80">{c.name}</span>
                      <span className="text-muted-foreground ml-auto">{c.intensity}/10</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Situational counts — updated with AI data */}
              <div className="space-y-2">
                <h3 className="text-[9px] font-data text-primary/70 tracking-[0.2em] border-b border-primary/10 pb-1">SITUATION</h3>
                <StatRow label="THREAT LEVEL" value={threatLevel} highlight={threatLevel === 'CRITICAL' || threatLevel === 'HIGH'} />
                <StatRow label="EARTHQUAKES" value={String(countryQuakes.length)} />
                <StatRow label="ACTIVE FIRES" value={String(countryFires)} />
                <StatRow label="LIVE CAMERAS" value={String(countryCameras.length)} />
                <StatRow label="NEWS ITEMS" value={String(countryNews.length)} />
                <StatRow label="𝕏 OSINT" value={String(countryXPosts.length)} />
              </div>

              {/* AI Intel Categories */}
              {categorized && (
                <div className="space-y-2">
                  <h3 className="text-[9px] font-data text-primary/70 tracking-[0.2em] border-b border-primary/10 pb-1">🧠 AI INTEL BREAKDOWN</h3>
                  <StatRow label="⚔️ WAR & CONFLICT" value={String(categorized.war.length)} highlight={categorized.war.length > 0} />
                  <StatRow label="🔒 CYBER" value={String(categorized.cyber.length)} highlight={categorized.cyber.length > 0} />
                  <StatRow label="🚨 CRIME" value={String(categorized.crime.length)} highlight={categorized.crime.length > 0} />
                  <StatRow label="🕵️ INTELLIGENCE" value={String(categorized.intelligence.length)} />
                </div>
              )}

              {/* Download button in sidebar */}
              <button
                onClick={handleDownloadPDF}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors text-[9px] font-display tracking-wider"
              >
                📄 DOWNLOAD REPORT
              </button>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'cameras' ? (
                <CameraGrid cameras={countryCameras} onCameraClick={handleCameraClick} />
              ) : activeTab === 'tv' ? (
                <CountryTVPanel channels={countryTVChannels} />
              ) : activeTab === 'xosint' ? (
                <XOsintFeed posts={countryXPosts} countryName={country.name} />
              ) : activeTab === 'perplexity' ? (
                <PerplexityIntelPanel countryName={country.name} intel={aiIntel} loading={aiLoading} onRefresh={handleScanCountry} />
              ) : (
                <>
                  {/* AI Intel Summary Banner */}
                  {aiIntel && (
                    <AIIntelBanner intel={aiIntel} categorized={categorized} activeTab={activeTab} onTabSwitch={setActiveTab} />
                  )}
                  {aiLoading && !aiIntel && (
                    <div className="flex items-center gap-2 mb-3 p-3 rounded border border-primary/20 bg-primary/5">
                      <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-data text-primary tracking-wider">AI SCANNING {country.name.toUpperCase()}...</span>
                    </div>
                  )}
                  {/* Show AI-categorized items for filtered tabs */}
                  {categorized && activeTab !== 'all' && (categorized as any)[activeTab]?.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      <div className="text-[8px] font-display tracking-[0.15em] text-primary/70 flex items-center gap-1.5">
                        <span>🧠</span> AI-SOURCED {activeTab.toUpperCase()} INTEL
                      </div>
                      {(categorized as any)[activeTab].map((item: string, i: number) => (
                        <div key={`ai-${i}`} className="rounded border border-primary/20 bg-primary/5 px-3 py-2 text-[9px] font-data text-foreground/80 leading-relaxed">
                          <span className="text-primary/60 mr-1.5">▸</span>{item}
                        </div>
                      ))}
                    </div>
                  )}
                  {countryXPosts.length > 0 && activeTab === 'all' && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px]">𝕏</span>
                        <span className="text-[8px] font-display tracking-[0.15em] text-primary/70">LATEST X/OSINT</span>
                        <span className="text-[7px] font-data text-muted-foreground">{countryXPosts.length} posts</span>
                      </div>
                      {countryXPosts.slice(0, 3).map(post => (
                        <div key={post.id} className="rounded border border-border/20 bg-card-bg/20 px-2.5 py-1.5 mb-1 cursor-pointer hover:border-primary/30 transition-colors"
                          onClick={() => window.open(post.url, '_blank', 'noopener')}>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-data text-primary/70">@{post.account}</span>
                            <span className="text-[7px] font-data text-muted-foreground/40 ml-auto">{new Date(post.createdAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[9px] font-data text-foreground/70 leading-relaxed mt-0.5 line-clamp-2">{post.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <NewsFeed news={filteredNews} onNewsClick={handleNewsClick} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// AI Intel Summary Banner — shows categorized overview at top of feed
const AIIntelBanner = memo(({ intel, categorized, activeTab, onTabSwitch }: {
  intel: PerplexityIntel;
  categorized: CategorizedIntel | null;
  activeTab: DossierTab;
  onTabSwitch: (tab: DossierTab) => void;
}) => {
  const threatColor = intel.threatLevel === 'CRITICAL' ? 'text-alert-critical border-alert-critical/30 bg-alert-critical/5' :
    intel.threatLevel === 'HIGH' ? 'text-alert-high border-alert-high/30 bg-alert-high/5' :
    intel.threatLevel === 'MEDIUM' ? 'text-alert-medium border-alert-medium/30 bg-alert-medium/5' :
    'text-primary border-primary/30 bg-primary/5';

  return (
    <div className={`rounded border px-3 py-2.5 mb-3 ${threatColor}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px]">🧠</span>
        <span className="text-[9px] font-display tracking-[0.15em] text-primary">AI INTELLIGENCE SUMMARY</span>
        <span className={`text-[8px] font-data font-bold tracking-wider ${threatColor.split(' ')[0]}`}>● {intel.threatLevel}</span>
        {intel.dualSource && <span className="text-[7px] font-data text-primary/50 bg-primary/10 px-1 rounded">DUAL-SOURCE</span>}
        <span className="text-[7px] font-data text-muted-foreground/40 ml-auto">
          {intel.fetchedAt ? new Date(intel.fetchedAt).toLocaleTimeString('en-US', { hour12: false }) : ''}
        </span>
      </div>
      <p className="text-[10px] font-data text-foreground/90 leading-relaxed mb-2">{intel.briefing}</p>

      {/* Category quick-nav chips */}
      {categorized && (
        <div className="flex flex-wrap gap-1.5">
          {categorized.war.length > 0 && (
            <button onClick={() => onTabSwitch('war')} className="flex items-center gap-1 px-2 py-0.5 rounded border border-alert-critical/20 bg-alert-critical/5 text-[8px] font-data text-alert-critical hover:bg-alert-critical/10 transition-colors">
              ⚔️ {categorized.war.length} WAR
            </button>
          )}
          {categorized.cyber.length > 0 && (
            <button onClick={() => onTabSwitch('cyber')} className="flex items-center gap-1 px-2 py-0.5 rounded border border-alert-high/20 bg-alert-high/5 text-[8px] font-data text-alert-high hover:bg-alert-high/10 transition-colors">
              🔒 {categorized.cyber.length} CYBER
            </button>
          )}
          {categorized.crime.length > 0 && (
            <button onClick={() => onTabSwitch('crime')} className="flex items-center gap-1 px-2 py-0.5 rounded border border-alert-medium/20 bg-alert-medium/5 text-[8px] font-data text-alert-medium hover:bg-alert-medium/10 transition-colors">
              🚨 {categorized.crime.length} CRIME
            </button>
          )}
          {categorized.intelligence.length > 0 && (
            <button onClick={() => onTabSwitch('intelligence')} className="flex items-center gap-1 px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-[8px] font-data text-primary hover:bg-primary/10 transition-colors">
              🕵️ {categorized.intelligence.length} INTEL
            </button>
          )}
        </div>
      )}
    </div>
  );
});
AIIntelBanner.displayName = 'AIIntelBanner';

// Sub-components

const StatRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex justify-between text-[9px]">
    <span className="font-data text-muted-foreground tracking-wider">{label}</span>
    <span className={`font-data text-right max-w-[120px] truncate ${highlight ? 'text-alert-critical font-bold' : 'text-foreground/80'}`}>{value}</span>
  </div>
);

const XOsintFeed = memo(({ posts, countryName }: { posts: TwitterOsintPost[]; countryName?: string }) => {
  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-30">𝕏</div>
          <div className="text-[10px] font-data text-muted-foreground tracking-wider">NO X/OSINT POSTS FOR THIS COUNTRY</div>
          <div className="text-[8px] font-data text-muted-foreground/50 mt-1">Auto-refreshes every 60 seconds</div>
        </div>
      </div>
    );
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'NOW';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">𝕏</span>
        <span className="text-[9px] font-display tracking-[0.15em] text-primary">LIVE OSINT FEED</span>
        <span className="flex items-center gap-0.5">
          <span className="w-1 h-1 rounded-full bg-alert-critical animate-pulse" />
          <span className="text-[7px] font-data text-alert-critical">LIVE</span>
        </span>
        <span className="text-[8px] font-data text-muted-foreground ml-auto">{posts.length} posts</span>
      </div>
      {posts.map(post => (
        <div
          key={post.id}
          className="rounded border border-border/30 bg-card-bg/30 p-3 hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => window.open(post.url, '_blank', 'noopener')}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-data text-primary/80">@{post.account}</span>
            <div className="flex items-center gap-1.5">
              {post.geo && (
                <span className="text-[7px] font-data text-primary/60 bg-primary/10 px-1 rounded">📍 {post.geo.place}</span>
              )}
              <span className="text-[7px] font-data text-muted-foreground/50">{timeAgo(post.createdAt)}</span>
            </div>
          </div>
          <p className="text-[10px] font-data text-foreground/80 leading-relaxed">{post.text}</p>
          {post.metrics && (
            <div className="flex items-center gap-3 mt-1.5">
              {post.metrics.retweet_count !== undefined && post.metrics.retweet_count > 0 && (
                <span className="text-[7px] font-data text-muted-foreground/40">🔁 {post.metrics.retweet_count}</span>
              )}
              {post.metrics.like_count !== undefined && post.metrics.like_count > 0 && (
                <span className="text-[7px] font-data text-muted-foreground/40">♥ {post.metrics.like_count}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
XOsintFeed.displayName = 'XOsintFeed';

const PerplexityIntelPanel = memo(({ countryName, intel, loading, onRefresh }: {
  countryName: string;
  intel: PerplexityIntel | null;
  loading: boolean;
  onRefresh: () => void;
}) => {
  const threatColor = intel?.threatLevel === 'CRITICAL' ? 'text-alert-critical border-alert-critical/30 bg-alert-critical/5' :
    intel?.threatLevel === 'HIGH' ? 'text-alert-high border-alert-high/30 bg-alert-high/5' :
    intel?.threatLevel === 'MEDIUM' ? 'text-alert-medium border-alert-medium/30 bg-alert-medium/5' :
    'text-primary border-primary/30 bg-primary/5';

  if (loading && !intel) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <div className="text-[10px] font-data text-muted-foreground tracking-wider">QUERYING AI SOURCES...</div>
          <div className="text-[8px] font-data text-muted-foreground/50 mt-1">Real-time intel scan for {countryName}</div>
        </div>
      </div>
    );
  }

  if (!intel) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-30">🔍</div>
          <div className="text-[10px] font-data text-muted-foreground tracking-wider">NO AI INTEL AVAILABLE</div>
          <button onClick={onRefresh} className="mt-2 text-[9px] font-data text-primary hover:underline">SCAN NOW</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">🛰️</span>
          <span className="text-[9px] font-display tracking-[0.15em] text-primary">AI INTELLIGENCE REPORT</span>
          <span className="flex items-center gap-0.5">
            <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <span className="text-[7px] font-data text-primary">LIVE</span>
          </span>
          {intel.dualSource && <span className="text-[7px] font-data text-primary/50 bg-primary/10 px-1 rounded">DUAL-SOURCE</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[8px] font-data font-bold tracking-wider ${threatColor.split(' ')[0]}`}>● {intel.threatLevel}</span>
          <button onClick={onRefresh} disabled={loading} className="text-[7px] font-data text-primary/60 hover:text-primary disabled:opacity-50">🔄</button>
        </div>
      </div>

      <div className={`rounded border px-3 py-2.5 ${threatColor}`}>
        <div className="text-[8px] font-display tracking-[0.15em] text-primary/70 mb-1">SITUATION BRIEFING</div>
        <p className="text-[10px] font-data text-foreground leading-relaxed">{intel.briefing}</p>
      </div>

      {intel.developments && intel.developments.length > 0 && (
        <div>
          <div className="text-[8px] font-display tracking-[0.15em] text-primary/70 mb-1.5">KEY DEVELOPMENTS</div>
          <div className="space-y-1.5">
            {intel.developments.map((dev, i) => (
              <div key={i} className="flex items-start gap-2 rounded border border-border/30 bg-card-bg/30 px-3 py-2">
                <span className="text-[8px] font-data text-primary/60 mt-0.5 flex-shrink-0">▸</span>
                <p className="text-[9px] font-data text-foreground/80 leading-relaxed">{dev}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {intel.risks && intel.risks.length > 0 && (
        <div>
          <div className="text-[8px] font-display tracking-[0.15em] text-alert-high/70 mb-1.5">⚠ RISK ASSESSMENT</div>
          <div className="space-y-1">
            {intel.risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-2 text-[9px]">
                <span className="text-alert-high/60 flex-shrink-0">●</span>
                <span className="font-data text-foreground/70">{risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {intel.keywords && intel.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {intel.keywords.map((kw, i) => (
            <span key={i} className="text-[7px] font-data text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">#{kw}</span>
          ))}
        </div>
      )}

      {intel.citations && intel.citations.length > 0 && (
        <div className="border-t border-border/30 pt-2">
          <div className="text-[7px] font-data text-muted-foreground/50 tracking-wider mb-1">SOURCES</div>
          <div className="space-y-0.5">
            {intel.citations.slice(0, 5).map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="block text-[7px] font-data text-primary/50 hover:text-primary truncate transition-colors">
                🔗 {url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border/20 pt-1.5">
        <span className="text-[7px] font-data text-muted-foreground/40">
          {intel.perplexityAvailable ? '🌐 Perplexity' : ''} {intel.aiAnalysisAvailable ? '🧠 Gemini' : ''}
        </span>
        <span className="text-[7px] font-data text-muted-foreground/30">
          Updated {intel.fetchedAt ? new Date(intel.fetchedAt).toLocaleTimeString('en-US', { hour12: false }) : '—'} UTC
        </span>
      </div>
    </div>
  );
});
PerplexityIntelPanel.displayName = 'PerplexityIntelPanel';

const NewsFeed = memo(({ news, onNewsClick }: { news: NewsItem[]; onNewsClick: (n: NewsItem) => void }) => {
  if (news.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-30">📡</div>
          <div className="text-[10px] font-data text-muted-foreground tracking-wider">NO INTELLIGENCE ITEMS FOR THIS CATEGORY</div>
          <div className="text-[8px] font-data text-muted-foreground/50 mt-1">Data refreshes every 60 seconds</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {news.map((item, i) => {
        const severityClass = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.info;
        return (
          <div
            key={item.id || i}
            className={`group border rounded px-3 py-2.5 cursor-pointer hover:brightness-110 transition-all ${severityClass}`}
            onClick={() => onNewsClick(item)}
          >
            <div className="flex items-start gap-3">
              {item.image && (
                <img src={item.image} alt="" className="w-16 h-12 object-cover rounded flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                  onError={e => (e.currentTarget.style.display = 'none')} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] font-data tracking-wider px-1.5 py-0.5 rounded ${
                    item.severity === 'critical' ? 'bg-alert-critical/20 text-alert-critical' :
                    item.severity === 'high' ? 'bg-alert-high/20 text-alert-high' :
                    'bg-muted/30 text-muted-foreground'
                  }`}>{item.severity?.toUpperCase() || 'INFO'}</span>
                  <span className="text-[8px] font-data text-primary/60 tracking-wider">{item.source}</span>
                  {item.isStateMedia && (
                    <span className="text-[7px] font-data text-amber-400 bg-amber-400/10 px-1 rounded">STATE MEDIA</span>
                  )}
                  <span className="text-[7px] font-data text-muted-foreground/50 ml-auto">
                    {item.time instanceof Date ? item.time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-[11px] font-display tracking-wide text-foreground leading-tight group-hover:text-primary transition-colors">{item.title}</p>
                {item.category && (
                  <span className="text-[7px] font-data text-primary/40 tracking-wider mt-1 inline-block">{item.category.toUpperCase()}</span>
                )}
                {item.link && (
                  <div className="text-[7px] font-data text-primary/50 tracking-wider mt-0.5 group-hover:text-primary/80">🔗 CLICK TO OPEN SOURCE</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
NewsFeed.displayName = 'NewsFeed';

const CameraGrid = memo(({ cameras, onCameraClick }: {
  cameras: typeof PUBLIC_CAMERAS;
  onCameraClick: (cam: typeof PUBLIC_CAMERAS[0]) => void;
}) => {
  if (cameras.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-30">📹</div>
          <div className="text-[10px] font-data text-muted-foreground tracking-wider">NO LIVE CAMERAS IN THIS COUNTRY</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {cameras.map(cam => (
        <div key={cam.id} className="group border border-border/40 rounded overflow-hidden cursor-pointer hover:border-primary/50 transition-all bg-background/50"
          onClick={() => onCameraClick(cam)}>
          <div className="relative w-full h-28 bg-muted/20 flex items-center justify-center">
            <span className="text-3xl opacity-20">📹</span>
            <div className="absolute top-1 left-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-[7px] font-data text-destructive tracking-wider">LIVE</span>
            </div>
            {cam.official && (
              <span className="absolute top-1 right-1 text-[6px] font-data text-amber-400 bg-amber-400/10 px-1 rounded">DOT</span>
            )}
          </div>
          <div className="px-2 py-1.5">
            <div className="text-[9px] font-data text-foreground tracking-wider truncate group-hover:text-primary transition-colors">{cam.name}</div>
            <div className="text-[7px] font-data text-muted-foreground tracking-wider">{cam.city} • {cam.category.toUpperCase()} • {cam.source}</div>
          </div>
        </div>
      ))}
    </div>
  );
});
CameraGrid.displayName = 'CameraGrid';

const CountryTVPanel = memo(({ channels }: { channels: LivestreamFeed[] }) => {
  const [activeChannel, setActiveChannel] = useState<LivestreamFeed | null>(null);
  const [volume, setVolume] = useState(30);

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-30">📺</div>
          <div className="text-[10px] font-data text-muted-foreground tracking-wider">NO TV CHANNELS FOR THIS REGION</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 h-full" style={{ minHeight: 320 }}>
      <div className="w-[180px] space-y-1 overflow-y-auto flex-shrink-0">
        <div className="text-[8px] font-data text-muted-foreground tracking-[0.15em] mb-2">{channels.length} CHANNELS</div>
        {channels.map(ch => (
          <button key={ch.id} onClick={() => setActiveChannel(ch)}
            className={`w-full text-left px-2 py-1.5 rounded text-[9px] transition-colors flex items-center gap-1.5 ${
              activeChannel?.id === ch.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-card-hover border border-transparent'
            }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse-dot flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-foreground font-display tracking-wide truncate">{ch.title.replace(' – LIVE', '')}</div>
              <div className="text-[7px] font-data text-muted-foreground">{ch.source} • {ch.region}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col rounded overflow-hidden border border-border/30">
        {activeChannel ? (
          <>
            <div className="flex-1 relative min-h-0">
              <iframe src={activeChannel.url.replace('mute=1', 'mute=0')} className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen title={activeChannel.title} />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-void/80 backdrop-blur-sm rounded px-2 py-1">
                <span className="w-2 h-2 rounded-full bg-alert-critical animate-pulse" />
                <span className="text-[9px] font-data text-alert-critical font-bold">LIVE</span>
                <span className="text-[9px] font-display tracking-wider text-foreground">{activeChannel.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5 border-t border-border bg-card-bg/60 flex-shrink-0">
              <span className="text-[10px]">🔊</span>
              <input type="range" min="0" max="100" value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="flex-1 h-1 accent-primary cursor-pointer" style={{ maxWidth: 120 }} />
              <span className="text-[8px] font-data text-muted-foreground w-8">{volume}%</span>
              <span className="text-[8px] font-data text-primary/50 ml-auto">{activeChannel.source}</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl mb-2 block opacity-30">📺</span>
              <p className="text-[10px] font-display tracking-[0.15em] text-muted-foreground">SELECT A CHANNEL</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
CountryTVPanel.displayName = 'CountryTVPanel';

function formatPop(pop: number): string {
  if (pop >= 1e9) return `${(pop / 1e9).toFixed(2)}B`;
  if (pop >= 1e6) return `${(pop / 1e6).toFixed(1)}M`;
  if (pop >= 1e3) return `${(pop / 1e3).toFixed(1)}K`;
  return String(pop);
}

CountryDossier.displayName = 'CountryDossier';
export default CountryDossier;
