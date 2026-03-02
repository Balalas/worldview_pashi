import { memo, useState, useRef, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useWorldViewStore, MARKET_DATA, NewsItem, BottomPanelTab, INSTABILITY_DATA } from '@/store/worldview';
import { fetchForexRates, ForexRate } from '@/services/forexService';
import { fetchAirQuality, AirQualityStation } from '@/services/airQualityService';
import { PENTAGON_PIZZA_DATA, LIVESTREAM_FEEDS, LivestreamFeed } from '@/services/dataServices';
import { ACTIVE_VOLCANOES } from '@/services/weatherService';
import { SUBMARINE_CABLES } from '@/data/submarineCables';
import { RADIO_STATIONS, RadioStation } from '@/data/radioStations';
import { CONFLICT_ZONES } from '@/data/conflictZones';
import { fetchMarketSnapshot, MarketSnapshot } from '@/services/marketService';
import { fetchTrendingSignals, TrendingSignal } from '@/services/trendingService';
import { detectConvergenceZones, ConvergenceZone } from '@/services/convergenceService';
import { fetchSolarSnapshot, SolarSnapshot } from '@/services/solarWeatherService';
import { fetchUSGSVolcanoAlerts, VolcanoAlert } from '@/services/volcanoService';
import { fetchInternetOutages, InternetOutage } from '@/services/internetOutageService';
import { NUCLEAR_REACTORS, getNuclearStats } from '@/services/nuclearService';
import { fetchRadiationData, RadiationStation } from '@/services/radioactivityService';
import { fetchDiseaseOutbreaks, DiseaseOutbreak } from '@/services/diseaseOutbreakService';
import { ACTIVE_SANCTIONS_REGIMES } from '@/services/sanctionsService';
import { CABLE_INCIDENTS, getCableIncidentStats } from '@/services/cableCutService';
import AIInsightsPanel from './AIInsightsPanel';
import WebcamGrid from './WebcamGrid';
import { fetchAINewsEnrichment, AINewsEnrichment } from '@/services/aiEnrichService';
import RegionalNewsPanel from './RegionalNewsPanel';
import InfrastructureCascade from './InfrastructureCascade';
import OsintPanel from './OsintPanel';
import CyprusIntelPanel from './CyprusIntelPanel';

const TABS: { key: BottomPanelTab; label: string; icon: string }[] = [
  { key: 'news', label: 'INTEL FEED', icon: '📡' },
  { key: 'livestream', label: 'LIVESTREAMS', icon: '📺' },
  { key: 'radio', label: 'RADIO', icon: '📻' },
  { key: 'markets', label: 'MARKETS', icon: '📈' },
  { key: 'trending', label: 'TRENDING', icon: '🔥' },
  { key: 'convergence', label: 'CONVERGENCE', icon: '🎯' },
  { key: 'predictions', label: 'PREDICTIONS', icon: '🔮' },
  { key: 'sources', label: 'SOURCES', icon: '🩺' },
  { key: 'indexes', label: 'INDEXES', icon: '📊' },
  { key: 'posture', label: 'STRATEGIC POSTURE', icon: '🎯' },
  { key: 'instability', label: 'INSTABILITY INDEX', icon: '⚠' },
  { key: 'risk', label: 'RISK OVERVIEW', icon: '🛡' },
  { key: 'weather', label: 'WEATHER', icon: '🌤' },
  { key: 'stats', label: 'WORLD STATS', icon: '📊' },
  { key: 'pizza', label: 'PIZZA INDEX', icon: '🍕' },
];

// (NewsFilter type defined below in section config block)

// --- Section configuration for customizable layout ---
export interface SectionConfig {
  id: string;
  title: string;
  icon: string;
  defaultOpen: boolean;
  visible: boolean;
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'cyprus', title: 'CYPRUS INTELLIGENCE', icon: '🇨🇾', defaultOpen: true, visible: true },
  { id: 'osint', title: 'X/TWITTER OSINT', icon: '🕵', defaultOpen: true, visible: true },
  { id: 'conflicts', title: 'ACTIVE CONFLICTS & WORLD TV', icon: '💥', defaultOpen: true, visible: true },
  { id: 'intel', title: 'INTELLIGENCE & MARKETS', icon: '📡', defaultOpen: true, visible: true },
  { id: 'strategic', title: 'STRATEGIC ANALYSIS', icon: '🛡', defaultOpen: true, visible: true },
  { id: 'trending', title: 'TRENDING & PREDICTIONS', icon: '🔥', defaultOpen: false, visible: true },
  { id: 'indexes', title: 'INDEXES & ENVIRONMENT', icon: '📊', defaultOpen: false, visible: true },
  { id: 'sigint', title: 'SIGINT — SENSORS & MONITORING', icon: '📡', defaultOpen: false, visible: true },
  { id: 'cbrn', title: 'CBRN — HAZARDS & SANCTIONS', icon: '☢', defaultOpen: false, visible: true },
  { id: 'ai', title: 'AI INSIGHTS', icon: '🧠', defaultOpen: false, visible: true },
  { id: 'webcams', title: 'LIVE WEBCAMS', icon: '📹', defaultOpen: false, visible: true },
  { id: 'regional', title: 'REGIONAL NEWS', icon: '🗞', defaultOpen: false, visible: true },
  { id: 'infra', title: 'INFRASTRUCTURE CASCADE', icon: '🏗', defaultOpen: false, visible: true },
  { id: 'media', title: 'MEDIA & SOURCES', icon: '📺', defaultOpen: false, visible: true },
];

const STORAGE_KEY = 'worldview-section-layout';

function loadSections(): SectionConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as SectionConfig[];
      // Merge with defaults in case new sections were added
      const savedIds = new Set(saved.map(s => s.id));
      const merged = [...saved];
      for (const def of DEFAULT_SECTIONS) {
        if (!savedIds.has(def.id)) merged.push(def);
      }
      return merged;
    }
  } catch {}
  return DEFAULT_SECTIONS.map(s => ({ ...s }));
}

function saveSections(sections: SectionConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  } catch {}
}

type NewsFilter = 'ALL' | 'CRITICAL' | 'MILITARY' | 'CONFLICT' | 'PROTEST' | 'CYBER' | 'NUCLEAR' | 'ECONOMIC';

// Collapsible section wrapper
const CollapsibleRow = ({ title, icon, defaultOpen = true, children }: { title: string; icon: string; defaultOpen?: boolean; children: ReactNode }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-1.5 bg-card-bg/30 hover:bg-card-bg/60 transition-colors text-left"
      >
        <span className="text-[12px]">{icon}</span>
        <span className="text-[11px] font-display tracking-[0.2em] text-muted-foreground flex-1">{title}</span>
        <span className="text-[11px] font-data text-primary/50">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

// Customization panel
const SectionCustomizer = memo(({ sections, onUpdate, onClose }: {
  sections: SectionConfig[];
  onUpdate: (sections: SectionConfig[]) => void;
  onClose: () => void;
}) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[idx], next[target]] = [next[target], next[idx]];
    onUpdate(next);
  };

  const toggleVisibility = (id: string) => {
    onUpdate(sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  };

  const startRename = (s: SectionConfig) => {
    setEditing(s.id);
    setEditTitle(s.title);
  };

  const commitRename = () => {
    if (editing && editTitle.trim()) {
      onUpdate(sections.map(s => s.id === editing ? { ...s, title: editTitle.trim() } : s));
    }
    setEditing(null);
  };

  const resetAll = () => {
    onUpdate(DEFAULT_SECTIONS.map(s => ({ ...s })));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-void/70 backdrop-blur-sm" />
      <div className="relative w-[480px] max-h-[80vh] rounded-lg border border-primary/30 overflow-hidden"
        style={{ background: 'hsl(var(--background) / 0.95)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚙️</span>
            <h2 className="text-[11px] font-display tracking-[0.2em] text-foreground">CUSTOMIZE DASHBOARD LAYOUT</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetAll} className="text-[8px] font-data text-alert-medium hover:text-alert-high px-2 py-1 rounded border border-border hover:border-alert-medium/30 transition-colors">RESET DEFAULT</button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg px-1">✕</button>
          </div>
        </div>
        <div className="p-3 overflow-y-auto max-h-[calc(80vh-60px)]">
          <p className="text-[9px] font-data text-muted-foreground mb-3">Drag sections up/down, toggle visibility, or click the title to rename. Changes save automatically.</p>
          <div className="space-y-1">
            {sections.map((s, idx) => (
              <div key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded border transition-all ${s.visible ? 'border-border bg-card-bg/40' : 'border-border/30 bg-card-bg/10 opacity-50'}`}>
                {/* Move buttons */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                    className="text-[10px] text-muted-foreground hover:text-primary disabled:opacity-20 leading-none">▲</button>
                  <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}
                    className="text-[10px] text-muted-foreground hover:text-primary disabled:opacity-20 leading-none">▼</button>
                </div>
                {/* Icon */}
                <span className="text-sm flex-shrink-0">{s.icon}</span>
                {/* Title / editable */}
                {editing === s.id ? (
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => e.key === 'Enter' && commitRename()}
                    autoFocus
                    className="flex-1 text-[10px] font-display tracking-wider bg-card-bg border border-primary/30 rounded px-2 py-1 text-foreground outline-none"
                  />
                ) : (
                  <button onClick={() => startRename(s)} className="flex-1 text-left text-[10px] font-display tracking-[0.15em] text-foreground hover:text-primary transition-colors">
                    {s.title}
                  </button>
                )}
                {/* Position label */}
                <span className="text-[8px] font-data text-muted-foreground/50 w-5 text-center flex-shrink-0">{idx + 1}</span>
                {/* Visibility toggle */}
                <button onClick={() => toggleVisibility(s.id)}
                  className={`text-[9px] font-data px-2 py-0.5 rounded border transition-colors flex-shrink-0 ${s.visible ? 'text-signal-aircraft border-signal-aircraft/30 bg-signal-aircraft/10' : 'text-muted-foreground border-border'}`}>
                  {s.visible ? '👁 ON' : '👁‍🗨 OFF'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
SectionCustomizer.displayName = 'SectionCustomizer';
// War Status Panel — live overview of all active conflicts
const WarStatusPanel = memo(() => {
  const { news, warMode } = useWorldViewStore();
  
  const warNews = news.filter(n => 
    n.category === 'conflict' || n.category === 'military' || 
    /\b(war|airstrike|missile|killed|casualties|bombing|shelling|troops|offensive|invasion)\b/i.test(n.title)
  );

  const conflictStats = CONFLICT_ZONES.map(zone => {
    const relatedNews = warNews.filter(n => {
      const parts = zone.name.toLowerCase().split('–').map(p => p.trim());
      return parts.some(p => n.title.toLowerCase().includes(p));
    });
    return { ...zone, newsCount: relatedNews.length, latestNews: relatedNews.slice(0, 3) };
  }).sort((a, b) => b.intensity - a.intensity);

  const activeWars = conflictStats.filter(c => c.type === 'war' || c.intensity >= 8);
  const activeConflicts = conflictStats.filter(c => c.type !== 'war' && c.intensity >= 5 && c.intensity < 8);
  const tensions = conflictStats.filter(c => c.intensity < 5);

  const typeColors: Record<string, string> = {
    war: 'text-alert-critical', conflict: 'text-alert-high', civil_war: 'text-alert-high',
    insurgency: 'text-alert-medium', tension: 'text-primary', gang_violence: 'text-alert-medium',
    instability: 'text-muted-foreground',
  };

  const renderConflict = (c: typeof conflictStats[0]) => (
    <div key={c.name} className={`border-l-2 ${c.intensity >= 8 ? 'border-l-alert-critical' : c.intensity >= 6 ? 'border-l-alert-high' : 'border-l-alert-medium'} bg-card-bg/40 rounded-r px-2 py-1.5 hover:bg-card-hover transition-colors cursor-pointer`}
      onClick={() => useWorldViewStore.getState().setMapCenter({ lat: c.lat, lon: c.lon, zoom: 7 })}
    >
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-display tracking-wider ${typeColors[c.type] || 'text-muted-foreground'} font-bold`}>
          {c.type === 'war' ? '🔴' : c.intensity >= 6 ? '🟠' : '🟡'} {c.name}
        </span>
        <span className="text-[8px] font-data text-muted-foreground ml-auto">{c.intensity}/10</span>
        <span className="text-[7px] font-data text-primary/40 uppercase">{c.type}</span>
      </div>
      {c.newsCount > 0 && (
        <div className="mt-1 space-y-0.5">
          {c.latestNews.map((n, i) => (
            <div key={i} className="text-[8px] text-muted-foreground/80 leading-tight truncate cursor-pointer hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); n.link && window.open(n.link, '_blank'); }}>
              ↗ {n.source}: {n.title.substring(0, 60)}...
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`p-2 ${warMode ? 'bg-alert-critical/5' : ''}`}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-alert-critical">ACTIVE CONFLICT TRACKER</h2>
        <span className="text-[9px] font-data text-alert-critical/70">● {activeWars.length} WARS</span>
        <span className="text-[9px] font-data text-alert-high/70">● {activeConflicts.length} CONFLICTS</span>
        <span className="text-[9px] font-data text-alert-medium/70">● {tensions.length} TENSIONS</span>
        <span className="text-[8px] font-data text-primary/40 ml-auto">{warNews.length} RELATED ARTICLES</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {conflictStats.slice(0, 12).map(renderConflict)}
      </div>
    </div>
  );
});

// World TV Card — inline TV player with volume + channel list
const WorldTVCard = memo(() => {
  const { setActiveLivestream } = useWorldViewStore();
  const [selectedChannel, setSelectedChannel] = useState<LivestreamFeed | null>(null);
  const [volume, setVolume] = useState(30);
  const [catFilter, setCatFilter] = useState<'all' | LivestreamFeed['category']>('all');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const cats: { key: typeof catFilter; label: string; icon: string }[] = [
    { key: 'all', label: 'ALL', icon: '📺' },
    { key: 'news', label: 'NEWS', icon: '📡' },
    { key: 'traffic', label: 'WEBCAMS', icon: '📹' },
    { key: 'conflict', label: 'CONFLICT', icon: '💥' },
    { key: 'space', label: 'SPACE', icon: '🛰' },
    { key: 'weather', label: 'WEATHER', icon: '🌤' },
    { key: 'nature', label: 'NATURE', icon: '🌿' },
  ];

  const newsChannels = LIVESTREAM_FEEDS.filter(f => catFilter === 'all' || f.category === catFilter);

  const handleSelect = (ch: LivestreamFeed) => {
    setSelectedChannel(ch);
    setActiveLivestream(ch.id);
  };

  // Build iframe URL with volume parameter
  const getIframeUrl = (ch: LivestreamFeed) => {
    const base = ch.url.replace('mute=1', 'mute=0').replace('autoplay=0', 'autoplay=1');
    return base;
  };

  return (
    <div className="flex h-full">
      {/* Channel list */}
      <div className="w-[200px] border-r border-border overflow-y-auto p-1.5 flex-shrink-0">
        <div className="flex items-center gap-0.5 mb-1.5 flex-wrap">
          {cats.map(c => (
            <button key={c.key} onClick={() => setCatFilter(c.key)}
              className={`text-[7px] font-data tracking-wider px-1 py-0.5 rounded ${catFilter === c.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        <div className="space-y-0.5">
          {newsChannels.map(ch => (
            <button key={ch.id} onClick={() => handleSelect(ch)}
              className={`w-full text-left px-1.5 py-1 rounded text-[9px] transition-colors flex items-center gap-1.5 ${
                selectedChannel?.id === ch.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-card-hover border border-transparent'
              }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse-dot flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-foreground font-display tracking-wide truncate text-[9px]">{ch.title.replace(' – LIVE', '')}</div>
                <div className="text-[7px] font-data text-muted-foreground">{ch.source} • {ch.region}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* TV screen + volume controls */}
      <div className="flex-1 flex flex-col bg-void/50">
        {selectedChannel ? (
          <>
            <div className="flex-1 relative min-h-0">
              <iframe
                ref={iframeRef}
                src={getIframeUrl(selectedChannel)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={selectedChannel.title}
              />
              {/* Live badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-void/80 backdrop-blur-sm rounded px-2 py-1">
                <span className="w-2 h-2 rounded-full bg-alert-critical animate-pulse" />
                <span className="text-[9px] font-data text-alert-critical font-bold">LIVE</span>
                <span className="text-[9px] font-display tracking-wider text-foreground">{selectedChannel.title}</span>
              </div>
            </div>
            {/* Volume + controls bar */}
            <div className="flex items-center gap-3 px-3 py-1.5 border-t border-border bg-card-bg/60 flex-shrink-0">
              <span className="text-[10px]">🔊</span>
              <input
                type="range" min="0" max="100" value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="flex-1 h-1 accent-primary cursor-pointer"
                style={{ maxWidth: 120 }}
              />
              <span className="text-[8px] font-data text-muted-foreground w-8">{volume}%</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[8px] font-data text-primary/50">{newsChannels.length} CHANNELS</span>
                <span className="text-[8px] font-data text-muted-foreground">{selectedChannel.source}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl mb-2 block opacity-30">📺</span>
              <p className="text-[10px] font-display tracking-[0.15em] text-muted-foreground">SELECT A CHANNEL</p>
              <p className="text-[8px] font-data text-muted-foreground/50 mt-1">{LIVESTREAM_FEEDS.length} live channels worldwide</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
WorldTVCard.displayName = 'WorldTVCard';

const BottomFeed = memo(() => {
  const [forexRates, setForexRates] = useState<ForexRate[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityStation[]>([]);

  const [solarData, setSolarData] = useState<SolarSnapshot | null>(null);
  const [volcanoAlerts, setVolcanoAlerts] = useState<VolcanoAlert[]>([]);
  const [internetOutages, setInternetOutages] = useState<InternetOutage[]>([]);
  const [radiationStations, setRadiationStations] = useState<RadiationStation[]>([]);
  const [diseaseOutbreaks, setDiseaseOutbreaks] = useState<DiseaseOutbreak[]>([]);
  const [sections, setSections] = useState<SectionConfig[]>(loadSections);
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    fetchForexRates().then(setForexRates);
    fetchAirQuality().then(setAirQuality);
    fetchSolarSnapshot().then(setSolarData);
    fetchUSGSVolcanoAlerts().then(setVolcanoAlerts);
    fetchInternetOutages().then(setInternetOutages);
    fetchRadiationData().then(setRadiationStations);
    fetchDiseaseOutbreaks().then(setDiseaseOutbreaks);
    const forexInterval = setInterval(() => fetchForexRates().then(setForexRates), 60000);
    const aqInterval = setInterval(() => fetchAirQuality().then(setAirQuality), 300000);
    const solarInterval = setInterval(() => fetchSolarSnapshot().then(setSolarData), 300000);
    const outageInterval = setInterval(() => fetchInternetOutages().then(setInternetOutages), 300000);
    return () => { clearInterval(forexInterval); clearInterval(aqInterval); clearInterval(solarInterval); clearInterval(outageInterval); };
  }, []);

  const handleUpdateSections = useCallback((updated: SectionConfig[]) => {
    setSections(updated);
    saveSections(updated);
  }, []);

  const allTicker = [
    ...MARKET_DATA,
    ...forexRates.map(r => ({ symbol: r.symbol, value: r.value, change: r.change, up: r.up })),
  ];

  // Section content renderer
  const renderSection = (s: SectionConfig) => {
    switch (s.id) {
      case 'conflicts': return (
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="border-r border-border max-h-[420px] overflow-y-auto scrollbar-thin"><WarStatusPanel /></div>
          <div className="max-h-[420px] overflow-hidden"><WorldTVCard /></div>
        </div>
      );
      case 'intel': return (
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="border-r border-border max-h-[420px] overflow-y-auto scrollbar-thin"><NewsFeed /></div>
          <div className="max-h-[420px] overflow-y-auto scrollbar-thin"><MarketsPanel /></div>
        </div>
      );
      case 'strategic': return (
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><StrategicRiskPanel /></div>
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><StrategicPosturePanel /></div>
          <div className="max-h-[380px] overflow-y-auto scrollbar-thin"><InstabilityIndexPanel /></div>
        </div>
      );
      case 'trending': return (
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><TrendingPanel /></div>
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><ConvergencePanel /></div>
          <div className="max-h-[380px] overflow-y-auto scrollbar-thin"><PredictionsPanel /></div>
        </div>
      );
      case 'indexes': return (
        <div className="grid grid-cols-1 lg:grid-cols-4">
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><CombinedIndexesPanel /></div>
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><WorldStatsPanel /></div>
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><WeatherPanel /></div>
          <div className="max-h-[380px] overflow-y-auto scrollbar-thin"><AirQualityPanel stations={airQuality} /></div>
        </div>
      );
      case 'sigint': return (
        <div className="grid grid-cols-1 lg:grid-cols-4">
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><SolarWeatherPanel data={solarData} /></div>
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><VolcanoAlertsPanel alerts={volcanoAlerts} /></div>
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><InternetOutagePanel outages={internetOutages} /></div>
          <div className="max-h-[380px] overflow-y-auto scrollbar-thin"><NuclearReactorPanel /></div>
        </div>
      );
      case 'cbrn': return (
        <div className="grid grid-cols-1 lg:grid-cols-4">
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><RadioactivityPanel stations={radiationStations} /></div>
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><DiseaseOutbreakPanel outbreaks={diseaseOutbreaks} /></div>
          <div className="border-r border-border max-h-[380px] overflow-y-auto scrollbar-thin"><SanctionsPanel /></div>
          <div className="max-h-[380px] overflow-y-auto scrollbar-thin"><CableIncidentPanel /></div>
        </div>
      );
      case 'osint': return <div className="max-h-[450px] overflow-y-auto scrollbar-thin"><OsintPanel /></div>;
      case 'cyprus': return <div className="max-h-[500px] overflow-y-auto scrollbar-thin"><CyprusIntelPanel /></div>;
      case 'ai': return <div className="max-h-[450px] overflow-y-auto scrollbar-thin"><AIInsightsPanel /></div>;
      case 'webcams': return <div className="max-h-[500px] overflow-y-auto scrollbar-thin"><WebcamGrid /></div>;
      case 'regional': return <div className="max-h-[400px] overflow-y-auto scrollbar-thin"><RegionalNewsPanel /></div>;
      case 'infra': return <div className="max-h-[450px] overflow-y-auto scrollbar-thin"><InfrastructureCascade /></div>;
      case 'media': return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
          <div className="border-r border-border max-h-[350px] overflow-y-auto scrollbar-thin"><LivestreamPanel /></div>
          <div className="border-r border-border max-h-[350px] overflow-y-auto scrollbar-thin"><RadioPanel /></div>
          <div className="border-r border-border max-h-[350px] overflow-y-auto scrollbar-thin"><SourcesHealthPanel /></div>
          <div className="max-h-[350px] overflow-y-auto scrollbar-thin"><PizzaIndexPanel /></div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="glass-panel border-t border-primary/8 flex flex-col z-30">
      {/* Market ticker + customize button */}
      <div className="h-7 border-b border-border flex items-center overflow-hidden bg-card-bg/50 relative flex-shrink-0">
        <button onClick={() => setShowCustomizer(true)}
          className="absolute left-1 z-10 text-[8px] font-data text-primary/60 hover:text-primary bg-card-bg/80 backdrop-blur-sm px-2 py-0.5 rounded border border-primary/20 hover:border-primary/40 transition-colors flex-shrink-0">
          ⚙️ CUSTOMIZE
        </button>
        <div className="flex items-center animate-ticker-scroll whitespace-nowrap ml-[90px]">
          {[...allTicker, ...allTicker].map((m, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 mx-4 text-[10px] font-data">
              <span className="text-muted-foreground">{m.symbol}</span>
              <span className="text-foreground">{m.value}</span>
              <span className={m.up ? 'text-signal-aircraft' : 'text-alert-critical'}>{m.up ? '▲' : '▼'}{m.change}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Dynamic sections based on user config */}
      <div>
        {sections.filter(s => s.visible).map(s => (
          <CollapsibleRow key={s.id} title={s.title} icon={s.icon} defaultOpen={s.defaultOpen}>
            {renderSection(s)}
          </CollapsibleRow>
        ))}
      </div>

      {showCustomizer && (
        <SectionCustomizer sections={sections} onUpdate={handleUpdateSections} onClose={() => setShowCustomizer(false)} />
      )}
    </div>
  );
});

const WAR_NEWS_KEYWORDS = /\b(war|airstrike|strike|missile|killed|casualties|troops|offensive|invasion|bombing|shelling|artillery|mortar|combat|battle|drone strike|frontline|ceasefire|military|conflict|attack|dead|bomb|weapon|army|navy|soldier)\b/i;

const AIFeedBanner = memo(({ headlines, context, countryName }: { headlines: string[]; context: 'global' | 'country'; countryName?: string }) => {
  const [enrichment, setEnrichment] = useState<AINewsEnrichment | null>(null);
  const [loading, setLoading] = useState(false);
  const lastHeadlineCountRef = useRef(0);

  const fetchEnrichment = useCallback(async () => {
    if (headlines.length === 0) return;
    setLoading(true);
    const result = await fetchAINewsEnrichment(headlines, context, countryName);
    if (result) setEnrichment(result);
    setLoading(false);
  }, [headlines.length, context, countryName]);

  // Auto-fetch when headlines change significantly
  useEffect(() => {
    if (headlines.length > 0 && Math.abs(headlines.length - lastHeadlineCountRef.current) >= 2) {
      lastHeadlineCountRef.current = headlines.length;
      fetchEnrichment();
    }
  }, [headlines.length, fetchEnrichment]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (headlines.length === 0) return;
    const interval = setInterval(fetchEnrichment, 60_000);
    return () => clearInterval(interval);
  }, [fetchEnrichment, headlines.length]);

  const threatColor = enrichment?.threatLevel === 'CRITICAL' ? 'text-alert-critical border-alert-critical/30 bg-alert-critical/5' :
    enrichment?.threatLevel === 'HIGH' ? 'text-alert-high border-alert-high/30 bg-alert-high/5' :
    enrichment?.threatLevel === 'MEDIUM' ? 'text-alert-medium border-alert-medium/30 bg-alert-medium/5' :
    'text-signal-aircraft border-primary/20 bg-primary/5';

  if (!enrichment && !loading) return null;

  return (
    <div className={`rounded border px-3 py-2 mb-2 ${enrichment ? threatColor : 'border-border bg-card-bg/40'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px]">🧠</span>
        <span className="text-[9px] font-display tracking-[0.15em] text-primary">AI ANALYSIS</span>
        {loading && <span className="text-[8px] font-data text-primary animate-pulse">ANALYZING...</span>}
        {enrichment?.threatLevel && (
          <span className={`text-[8px] font-data font-bold tracking-wider ${threatColor.split(' ')[0]}`}>
            ● {enrichment.threatLevel}
          </span>
        )}
        <button onClick={fetchEnrichment} disabled={loading}
          className="text-[7px] font-data text-primary/60 hover:text-primary ml-auto disabled:opacity-50">🔄 REFRESH</button>
      </div>
      {enrichment && (
        <>
          <p className="text-[10px] font-data text-foreground leading-relaxed mb-1.5">{enrichment.summary}</p>
          {enrichment.flashAlert && (
            <div className="text-[9px] font-data text-alert-critical bg-alert-critical/10 px-2 py-1 rounded mb-1.5">
              ⚡ FLASH: {enrichment.flashAlert}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {enrichment.keyDevelopments?.slice(0, 3).map((d, i) => (
              <span key={i} className="text-[8px] font-data text-foreground/80 bg-card-bg/60 px-1.5 py-0.5 rounded">↗ {d}</span>
            ))}
          </div>
          {enrichment.hotTopics && enrichment.hotTopics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {enrichment.hotTopics.map((t, i) => (
                <span key={i} className="text-[7px] font-data text-primary/70 bg-primary/5 px-1 py-0.5 rounded border border-primary/10">#{t}</span>
              ))}
            </div>
          )}
          {enrichment.outlook && (
            <p className="text-[8px] font-data text-muted-foreground mt-1 italic">📊 Outlook: {enrichment.outlook}</p>
          )}
        </>
      )}
    </div>
  );
});
AIFeedBanner.displayName = 'AIFeedBanner';

const NewsFeed = memo(() => {
  const { news, newsLoading, warMode } = useWorldViewStore();
  const [filter, setFilter] = useState<NewsFilter>('ALL');

  const filtered = news.filter((item) => {
    if (warMode) {
      return item.category === 'military' || item.category === 'conflict' || WAR_NEWS_KEYWORDS.test(item.title);
    }
    if (filter === 'CRITICAL') return item.severity === 'critical' || item.severity === 'high';
    if (filter === 'MILITARY') return item.category === 'military';
    if (filter === 'CONFLICT') return item.category === 'conflict';
    if (filter === 'PROTEST') return item.category === 'protest';
    if (filter === 'CYBER') return item.category === 'cyber';
    if (filter === 'NUCLEAR') return item.title.toLowerCase().includes('nuclear') || item.title.toLowerCase().includes('missile');
    if (filter === 'ECONOMIC') return item.title.toLowerCase().includes('econom') || item.title.toLowerCase().includes('inflation') || item.title.toLowerCase().includes('recession');
    return true;
  });

  const headlines = filtered.slice(0, 25).map(n => `[${n.severity.toUpperCase()}] ${n.source}: ${n.title}`);

  return (
    <div className="p-2">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">INTELLIGENCE FEED</h2>
        {newsLoading && <span className="text-[9px] font-data text-primary animate-pulse-dot">FETCHING...</span>}
        <span className="text-[9px] font-data text-text-secondary">● {filtered.length} ITEMS</span>
        <div className="flex gap-1 ml-auto flex-wrap">
          {(['ALL', 'CRITICAL', 'MILITARY', 'CONFLICT', 'PROTEST', 'CYBER', 'NUCLEAR', 'ECONOMIC'] as NewsFilter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[8px] font-display tracking-wider px-1.5 py-0.5 rounded ${filter === f ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted-custom hover:text-muted-foreground'}`}>{f}</button>
          ))}
        </div>
      </div>
      <AIFeedBanner headlines={headlines} context="global" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
        {filtered.slice(0, 20).map((item) => <NewsCard key={item.id} item={item} />)}
      </div>
    </div>
  );
});

const NewsCard = ({ item }: { item: NewsItem }) => {
  const severityColor = { critical: 'border-l-alert-critical', high: 'border-l-alert-high', medium: 'border-l-alert-medium', low: 'border-l-alert-low', info: 'border-l-alert-info' }[item.severity];
  const severityDot = { critical: 'bg-alert-critical', high: 'bg-alert-high', medium: 'bg-alert-medium', low: 'bg-alert-low', info: 'bg-alert-info' }[item.severity];
  const catBadge = item.category && item.category !== 'general' ? { protest: '✊', cyber: '🔒', military: '⚔', conflict: '💥' }[item.category] : null;
  const tierLabel = { 1: 'WIRE', 2: 'QUAL', 3: 'BCAST', 4: 'REG' }[item.tier] || 'REG';
  const tierColor = item.tier === 1 ? 'text-primary' : item.tier === 2 ? 'text-signal-aircraft' : 'text-text-muted-custom';

  return (
    <div className={`bg-card-bg/60 border-l-2 ${severityColor} rounded-r px-2 py-1.5 hover:bg-card-hover transition-colors cursor-pointer`}
      onClick={() => item.link && window.open(item.link, '_blank')}>
      <div className="flex items-start gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${severityDot} mt-1 flex-shrink-0 ${item.severity === 'critical' ? 'animate-pulse-dot' : ''}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-foreground leading-tight line-clamp-2">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {catBadge && <span className="text-[9px]">{catBadge}</span>}
            <span className="text-[8px] font-data text-text-secondary truncate max-w-[100px]">{item.source}</span>
            <span className={`text-[7px] font-data ${tierColor} bg-card-bg/80 px-1 rounded`}>{tierLabel}</span>
            {item.isStateMedia && <span className="text-[7px] font-data text-alert-critical bg-alert-critical/10 px-1 rounded">STATE</span>}
            {item.country && <span className="text-[7px] font-data text-muted-foreground bg-card-bg/80 px-1 rounded uppercase">{item.country}</span>}
            <span className="text-[8px] font-data text-text-muted-custom">{getTimeAgo(item.time)}</span>
            {item.link && <span className="text-[7px] text-primary">↗</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

const LivestreamPanel = memo(() => {
  const { activeLivestream, setActiveLivestream } = useWorldViewStore();
  const [catFilter, setCatFilter] = useState<'all' | LivestreamFeed['category']>('all');
  const cats: { key: typeof catFilter; label: string }[] = [
    { key: 'all', label: 'ALL' }, { key: 'news', label: 'NEWS' }, { key: 'traffic', label: 'CAMS' },
    { key: 'space', label: 'SPACE' }, { key: 'weather', label: 'WEATHER' }, { key: 'nature', label: 'NATURE' },
  ];
  const filtered = catFilter === 'all' ? LIVESTREAM_FEEDS : LIVESTREAM_FEEDS.filter(f => f.category === catFilter);
  const activeStream = LIVESTREAM_FEEDS.find(f => f.id === activeLivestream);

  return (
    <div className="flex min-h-[250px]">
      <div className="w-[260px] border-r border-border overflow-y-auto p-2">
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {cats.map((c) => (
            <button key={c.key} onClick={() => setCatFilter(c.key)} className={`text-[8px] font-display tracking-wider px-1.5 py-0.5 rounded ${catFilter === c.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted-custom hover:text-muted-foreground'}`}>{c.label}</button>
          ))}
        </div>
        <div className="space-y-1">
          {filtered.map((stream) => (
            <button key={stream.id} onClick={() => setActiveLivestream(stream.id)} className={`w-full text-left px-2 py-1.5 rounded text-[10px] transition-colors ${activeLivestream === stream.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-card-hover border border-transparent'}`}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse-dot flex-shrink-0" />
                <span className="text-foreground font-display tracking-wide truncate">{stream.title}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 ml-3">
                <span className="text-[8px] font-data text-text-secondary">{stream.source}</span>
                <span className="text-[8px] font-data text-text-muted-custom">{stream.region}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-background/50">
        {activeStream ? (
          <div className="w-full h-full relative">
            <iframe src={activeStream.url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={activeStream.title} />
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse-dot" />
              <span className="text-[9px] font-data text-alert-critical">LIVE</span>
              <span className="text-[9px] font-display tracking-wider text-foreground">{activeStream.title}</span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-2xl mb-2 block">📺</span>
            <p className="text-[11px] font-display tracking-wider text-muted-foreground">SELECT A STREAM</p>
            <p className="text-[9px] font-data text-text-muted-custom mt-1">{LIVESTREAM_FEEDS.length} live feeds available</p>
          </div>
        )}
      </div>
    </div>
  );
});

const WeatherPanel = memo(() => {
  const { weatherAlerts, volcanoes } = useWorldViewStore();
  return (
    <div className="p-3">
      <div className="flex items-center gap-4 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">GLOBAL WEATHER & VOLCANIC ACTIVITY</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-[9px] font-display tracking-wider text-muted-foreground mb-2">🌤 CITY WEATHER</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {weatherAlerts.map((w) => (
              <div key={w.city} className={`bg-card-bg/60 rounded border p-2 ${w.isExtreme ? 'border-alert-critical/40' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-display tracking-wide text-foreground">{w.city}</span>
                  <span className={`font-data text-sm font-bold ${w.temp > 35 ? 'text-alert-high' : w.temp < 0 ? 'text-signal-satellite' : 'text-foreground'}`}>{Math.round(w.temp)}°C</span>
                </div>
                <div className="text-[9px] font-data text-text-secondary mt-0.5">{w.description}</div>
                <div className="text-[8px] font-data text-text-muted-custom">Wind: {Math.round(w.windSpeed)} km/h</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-[9px] font-display tracking-wider text-muted-foreground mb-2">🌋 ACTIVE VOLCANOES</h3>
          <div className="space-y-1">
            {volcanoes.map((v) => (
              <div key={v.name} className={`flex items-center justify-between px-2 py-1 rounded bg-card-bg/60 border ${v.status === 'erupting' ? 'border-alert-critical/30' : v.status === 'warning' ? 'border-alert-high/30' : 'border-border'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs">🌋</span>
                  <div>
                    <span className="text-[10px] font-display tracking-wide text-foreground">{v.name}</span>
                    <span className="text-[8px] font-data text-text-muted-custom ml-1.5">{v.country}</span>
                  </div>
                </div>
                <span className={`text-[8px] font-data font-bold px-1.5 py-0.5 rounded ${v.status === 'erupting' ? 'text-alert-critical bg-alert-critical/10' : v.status === 'warning' ? 'text-alert-high bg-alert-high/10' : 'text-alert-medium bg-alert-medium/10'}`}>{v.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

const AirQualityPanel = memo(({ stations }: { stations: AirQualityStation[] }) => {
  const aqiColor = (level: string) => {
    switch (level) {
      case 'good': return 'text-signal-aircraft bg-signal-aircraft/10 border-signal-aircraft/20';
      case 'moderate': return 'text-alert-medium bg-alert-medium/10 border-alert-medium/20';
      case 'unhealthy_sensitive': return 'text-alert-high bg-alert-high/10 border-alert-high/20';
      case 'unhealthy': return 'text-alert-critical bg-alert-critical/10 border-alert-critical/20';
      case 'very_unhealthy': return 'text-alert-critical bg-alert-critical/20 border-alert-critical/30';
      case 'hazardous': return 'text-alert-critical bg-alert-critical/30 border-alert-critical/40';
      default: return 'text-muted-foreground bg-card-bg border-border';
    }
  };

  const sorted = [...stations].sort((a, b) => b.aqi - a.aqi);

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🌫️ GLOBAL AIR QUALITY INDEX</h2>
        <span className="text-[9px] font-data text-text-secondary">● {stations.length} STATIONS</span>
      </div>
      <div className="space-y-1">
        {sorted.map((s) => {
          const colors = aqiColor(s.level);
          return (
            <div key={s.id} className={`flex items-center justify-between px-2 py-1.5 rounded bg-card-bg/60 border ${colors.split(' ').pop()}`}>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-display tracking-wide text-foreground truncate">{s.city}</div>
                <div className="text-[8px] font-data text-text-muted-custom">PM2.5: {s.pm25}{s.pm10 ? ` · PM10: ${s.pm10}` : ''}</div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-[11px] font-data font-bold ${colors.split(' ')[0]}`}>{s.aqi}</span>
                <span className={`text-[7px] font-data font-bold px-1 py-0.5 rounded ${colors}`}>
                  {s.level.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
        {stations.length === 0 && (
          <div className="text-center py-4">
            <span className="text-[10px] font-data text-muted-foreground">Loading air quality data...</span>
          </div>
        )}
      </div>
    </div>
  );
});
AirQualityPanel.displayName = 'AirQualityPanel';

const WorldStatsPanel = memo(() => {
  const { aircraft, satellites, earthquakes, volcanoes, vessels, protests, outages } = useWorldViewStore();
  const stats = [
    { label: 'Total Aircraft', value: aircraft.length, icon: '✈️', color: 'text-signal-aircraft' },
    { label: 'Military Aircraft', value: aircraft.filter(a => a.isMilitary).length, icon: '⚔️', color: 'text-signal-military' },
    { label: 'Active Satellites', value: satellites.length, icon: '🛰️', color: 'text-signal-satellite' },
    { label: 'Total Vessels', value: vessels.length, icon: '🚢', color: 'text-signal-vessel' },
    { label: 'Superyachts', value: vessels.filter(v => v.type === 'yacht').length, icon: '🛥️', color: 'text-alert-medium' },
    { label: 'Military Ships', value: vessels.filter(v => v.type === 'military').length, icon: '⚓', color: 'text-alert-critical' },
    { label: 'Earthquakes (24h)', value: earthquakes.length, icon: '🌍', color: 'text-signal-earthquake' },
    { label: 'Erupting Volcanoes', value: volcanoes.filter(v => v.status === 'erupting').length, icon: '🌋', color: 'text-alert-high' },
    { label: 'Active Protests', value: protests.length, icon: '✊', color: 'text-signal-protest' },
    { label: 'Cyber/Outages', value: outages.length, icon: '🔒', color: 'text-signal-outage' },
    { label: 'Submarine Cables', value: SUBMARINE_CABLES.length, icon: '🔌', color: 'text-signal-cable' },
    { label: 'Conflict Zones', value: 20, icon: '💥', color: 'text-alert-critical' },
  ];

  return (
    <div className="p-3">
      <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-3">GLOBAL MONITORING STATISTICS</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="bg-card-bg/60 rounded border border-border p-2.5 text-center">
            <div className="text-lg mb-1">{s.icon}</div>
            <div className={`font-data text-lg font-bold ${s.color}`}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
            <div className="text-[8px] font-display tracking-wider text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

const PizzaIndexPanel = memo(() => {
  const maxOrders = Math.max(...PENTAGON_PIZZA_DATA.map(d => d.orders));
  const spikeDays = PENTAGON_PIZZA_DATA.filter(d => d.spike);
  const latestSpike = spikeDays[0];

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🍕 PENTAGON PIZZA INDEX — DELIVERY TRACKER</h2>
        <span className="text-[9px] font-data text-text-secondary">● {PENTAGON_PIZZA_DATA.length} DAYS</span>
        {latestSpike && (
          <span className="text-[8px] font-data text-alert-critical animate-pulse-dot ml-auto">⚠ SPIKE DETECTED</span>
        )}
      </div>
      <div className="text-[8px] font-data text-muted-foreground mb-2 leading-relaxed">
        Late-night pizza deliveries to the Pentagon historically spike before major military operations. 
        A surge above baseline ({PENTAGON_PIZZA_DATA[0]?.baseline} orders/night) may indicate extended NatSec briefings.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
        {PENTAGON_PIZZA_DATA.map((entry) => {
          const ratio = entry.orders / maxOrders;
          const borderColor = entry.threatLevel === 'critical' ? 'border-alert-critical/50' : entry.threatLevel === 'high' ? 'border-alert-high/40' : entry.threatLevel === 'elevated' ? 'border-alert-medium/30' : 'border-border';
          const barColor = entry.threatLevel === 'critical' ? 'bg-alert-critical' : entry.threatLevel === 'high' ? 'bg-alert-high' : entry.threatLevel === 'elevated' ? 'bg-alert-medium' : 'bg-primary/40';
          return (
            <div key={entry.date} className={`bg-card-bg/60 rounded border p-2 ${borderColor} ${entry.spike ? 'ring-1 ring-alert-critical/20' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-data text-muted-foreground">{entry.date.slice(5)}</span>
                {entry.spike && <span className="text-[7px] font-data text-alert-critical bg-alert-critical/10 px-1 rounded">SPIKE</span>}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[9px]">🍕</span>
                <span className={`text-[16px] font-data font-bold ${entry.spike ? 'text-alert-critical' : 'text-data-text'}`}>{entry.orders}</span>
                <span className="text-[8px] font-data text-text-muted-custom">orders</span>
              </div>
              <div className="w-full h-1.5 bg-card-hover rounded-full overflow-hidden mb-1">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${ratio * 100}%` }} />
              </div>
              <div className="h-1 bg-primary/10 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-primary/30 rounded-full" style={{ width: `${(entry.baseline / maxOrders) * 100}%` }} />
              </div>
              <div className="text-[7px] font-data text-text-muted-custom">BASE: {entry.baseline}</div>
              {entry.note && <div className="text-[7px] font-data text-alert-critical mt-1 leading-tight">{entry.note}</div>}
              <div className={`text-[7px] font-data mt-0.5 ${entry.threatLevel === 'critical' ? 'text-alert-critical' : entry.threatLevel === 'high' ? 'text-alert-high' : entry.threatLevel === 'elevated' ? 'text-alert-medium' : 'text-muted-foreground'}`}>
                THREAT: {entry.threatLevel.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
const getTimeAgo = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const RadioPanel = memo(() => {
  const { setMapCenter } = useWorldViewStore();
  const [regionFilter, setRegionFilter] = useState<'all' | RadioStation['region']>('all');
  const [activeStation, setActiveStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const regions: { key: typeof regionFilter; label: string; emoji: string }[] = [
    { key: 'all', label: 'ALL', emoji: '🌍' },
    { key: 'americas', label: 'AMERICAS', emoji: '🌎' },
    { key: 'europe', label: 'EUROPE', emoji: '🇪🇺' },
    { key: 'asia', label: 'ASIA', emoji: '🌏' },
    { key: 'middle-east', label: 'MENA', emoji: '🕌' },
    { key: 'africa', label: 'AFRICA', emoji: '🌍' },
    { key: 'oceania', label: 'OCEANIA', emoji: '🦘' },
  ];

  const filtered = regionFilter === 'all' ? RADIO_STATIONS : RADIO_STATIONS.filter(s => s.region === regionFilter);

  const playStation = useCallback((station: RadioStation) => {
    // Stop current
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setActiveStation(station);
    setIsPlaying(true);
    // Fly to station location
    setMapCenter({ lat: station.lat, lon: station.lon, zoom: 8 });
    // Create new audio
    const audio = new Audio(station.streamUrl);
    audio.crossOrigin = 'anonymous';
    audio.volume = 0.7;
    audio.play().catch(() => setIsPlaying(false));
    audioRef.current = audio;
    audio.onerror = () => setIsPlaying(false);
  }, [setMapCenter]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setActiveStation(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  return (
    <div className="flex min-h-[250px]">
      {/* Station list */}
      <div className="w-[320px] border-r border-border overflow-y-auto p-2">
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {regions.map((r) => (
            <button key={r.key} onClick={() => setRegionFilter(r.key)}
              className={`text-[8px] font-display tracking-wider px-1.5 py-0.5 rounded ${regionFilter === r.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted-custom hover:text-muted-foreground'}`}>
              {r.emoji} {r.label}
            </button>
          ))}
        </div>
        <div className="text-[8px] font-data text-muted-foreground/60 mb-1.5 px-1">{filtered.length} STATIONS</div>
        <div className="space-y-0.5">
          {filtered.map((station) => (
            <button key={station.id}
              onClick={() => playStation(station)}
              className={`w-full text-left px-2 py-1.5 rounded text-[10px] transition-colors ${
                activeStation?.id === station.id
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-card-hover border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{station.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {activeStation?.id === station.id && isPlaying && (
                      <span className="flex gap-[1px]">
                        <span className="w-[2px] h-2 bg-primary animate-pulse" style={{ animationDelay: '0s' }} />
                        <span className="w-[2px] h-3 bg-primary animate-pulse" style={{ animationDelay: '0.15s' }} />
                        <span className="w-[2px] h-1.5 bg-primary animate-pulse" style={{ animationDelay: '0.3s' }} />
                      </span>
                    )}
                    <span className="font-display tracking-wide text-foreground truncate">{station.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] font-data text-text-secondary">{station.country}</span>
                    <span className="text-[8px] font-data text-text-muted-custom">· {station.genre}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Now playing */}
      <div className="flex-1 flex items-center justify-center bg-background/50">
        {activeStation ? (
          <div className="text-center">
            <div className="text-4xl mb-3">{activeStation.flag}</div>
            <div className="text-[13px] font-display tracking-[0.15em] text-foreground mb-1">{activeStation.name}</div>
            <div className="text-[10px] font-data text-muted-foreground mb-1">{activeStation.country} — {activeStation.genre}</div>
            <div className="flex items-center justify-center gap-3 mt-3">
              {/* Audio visualizer bars */}
              {isPlaying && (
                <div className="flex items-end gap-[2px] h-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="w-[3px] bg-primary rounded-sm animate-pulse"
                      style={{
                        height: `${8 + Math.random() * 16}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: `${0.4 + Math.random() * 0.4}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <button onClick={stopPlayback}
              className="mt-3 text-[9px] font-display tracking-wider text-destructive/70 hover:text-destructive px-3 py-1 border border-destructive/20 rounded transition-colors">
              ■ STOP
            </button>
            <div className="text-[7px] font-data text-muted-foreground/40 mt-2">
              {activeStation.lat.toFixed(2)}°N {activeStation.lon.toFixed(2)}°E
            </div>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-2xl mb-2 block">📻</span>
            <p className="text-[11px] font-display tracking-wider text-muted-foreground">SELECT A STATION</p>
            <p className="text-[9px] font-data text-text-muted-custom mt-1">{RADIO_STATIONS.length} stations worldwide</p>
          </div>
        )}
      </div>
    </div>
  );
});

// ── Strategic Posture Panel ──
interface TheaterData {
  name: string;
  region: string;
  status: 'CRIT' | 'ELEV' | 'NORM';
  airAssets: number;
  seaAssets: number;
  trend: 'escalating' | 'stable' | 'de-escalating';
  notes?: string;
}

const THEATER_DATA: TheaterData[] = [
  { name: 'Iran Theater', region: 'CENTCOM', status: 'CRIT', airAssets: 12, seaAssets: 5, trend: 'escalating', notes: 'Carrier strike group deployed. B-2 sorties detected.' },
  { name: 'Baltic Theater', region: 'EUCOM', status: 'ELEV', airAssets: 8, seaAssets: 3, trend: 'stable', notes: 'NATO enhanced air policing active.' },
  { name: 'Taiwan Strait', region: 'INDOPACOM', status: 'ELEV', airAssets: 6, seaAssets: 4, trend: 'escalating', notes: 'PLA exercises near median line.' },
  { name: 'Black Sea', region: 'EUCOM', status: 'NORM', airAssets: 4, seaAssets: 2, trend: 'stable' },
  { name: 'Korean DMZ', region: 'INDOPACOM', status: 'NORM', airAssets: 3, seaAssets: 1, trend: 'stable' },
  { name: 'South China Sea', region: 'INDOPACOM', status: 'NORM', airAssets: 2, seaAssets: 3, trend: 'stable' },
  { name: 'E. Mediterranean', region: 'EUCOM', status: 'ELEV', airAssets: 5, seaAssets: 4, trend: 'escalating', notes: 'Israeli ops ongoing. USS fleet presence.' },
  { name: 'Gaza/Sinai', region: 'CENTCOM', status: 'CRIT', airAssets: 3, seaAssets: 1, trend: 'stable', notes: 'Ceasefire fragile. Humanitarian corridor active.' },
  { name: 'Red Sea/Bab el-Mandeb', region: 'CENTCOM', status: 'ELEV', airAssets: 4, seaAssets: 6, trend: 'stable', notes: 'Houthi anti-ship threat persists.' },
  { name: 'Horn of Africa', region: 'AFRICOM', status: 'NORM', airAssets: 2, seaAssets: 2, trend: 'stable' },
  { name: 'Sahel Region', region: 'AFRICOM', status: 'NORM', airAssets: 1, seaAssets: 0, trend: 'escalating', notes: 'Wagner/Africa Corps repositioning.' },
  { name: 'Cyprus Buffer Zone', region: 'EUCOM', status: 'NORM', airAssets: 1, seaAssets: 1, trend: 'stable', notes: 'UNFICYP monitoring. Turkish drills nearby.' },
];

const StrategicPosturePanel = memo(() => {
  const critCount = THEATER_DATA.filter(t => t.status === 'CRIT').length;
  const elevCount = THEATER_DATA.filter(t => t.status === 'ELEV').length;

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🎯 AI STRATEGIC POSTURE — THEATER ANALYSIS</h2>
        <span className="text-[9px] font-data text-text-secondary">● {THEATER_DATA.length} THEATERS</span>
        {critCount > 0 && <span className="text-[8px] font-data text-alert-critical animate-pulse-dot ml-auto">⚠ {critCount} CRITICAL</span>}
        {elevCount > 0 && <span className="text-[8px] font-data text-alert-medium">{elevCount} ELEVATED</span>}
      </div>
      <div className="text-[8px] font-data text-muted-foreground mb-2 leading-relaxed">
        Aggregates military aircraft, naval vessels, and intelligence signals by geographic theater. 
        Status based on force concentration thresholds and operational tempo.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {THEATER_DATA.map((theater) => {
          const statusColor = theater.status === 'CRIT' ? 'text-alert-critical' : theater.status === 'ELEV' ? 'text-alert-medium' : 'text-signal-aircraft';
          const statusBg = theater.status === 'CRIT' ? 'bg-alert-critical/10' : theater.status === 'ELEV' ? 'bg-alert-medium/10' : 'bg-primary/5';
          const borderColor = theater.status === 'CRIT' ? 'border-alert-critical/40' : theater.status === 'ELEV' ? 'border-alert-medium/30' : 'border-border';
          const trendIcon = theater.trend === 'escalating' ? '↗' : theater.trend === 'de-escalating' ? '↘' : '→';
          const trendColor = theater.trend === 'escalating' ? 'text-alert-critical' : theater.trend === 'de-escalating' ? 'text-signal-aircraft' : 'text-muted-foreground';
          return (
            <div key={theater.name} className={`${statusBg} rounded border p-2.5 ${borderColor} ${theater.status === 'CRIT' ? 'ring-1 ring-alert-critical/20' : ''}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-display tracking-wider text-foreground">{theater.name}</span>
                <span className={`text-[8px] font-data font-bold px-1.5 py-0.5 rounded ${statusColor} ${statusBg}`}>{theater.status}</span>
              </div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center gap-1">
                  <span className="text-[9px]">✈️</span>
                  <span className="text-[11px] font-data font-bold text-data-text">{theater.airAssets}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px]">⚓</span>
                  <span className="text-[11px] font-data font-bold text-data-text">{theater.seaAssets}</span>
                </div>
                <span className={`text-[9px] font-data ${trendColor} ml-auto`}>{trendIcon} {theater.trend}</span>
              </div>
              <div className="text-[7px] font-data text-text-muted-custom">{theater.region}</div>
              {theater.notes && <div className="text-[7px] font-data text-text-secondary mt-1 leading-tight">{theater.notes}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Country Instability Index Panel ──
const InstabilityIndexPanel = memo(() => {
  const sorted = [...INSTABILITY_DATA].sort((a, b) => b.score - a.score);
  const criticalCount = sorted.filter(c => c.level === 'critical').length;
  const highCount = sorted.filter(c => c.level === 'high').length;
  const { setMapCenter } = useWorldViewStore();

  // rough lat/lon for fly-to
  const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
    Syria: { lat: 35, lon: 38 }, Ukraine: { lat: 48.5, lon: 31 }, Sudan: { lat: 15.5, lon: 32.5 },
    Yemen: { lat: 15.5, lon: 48 }, Somalia: { lat: 5, lon: 46 }, 'DR Congo': { lat: -2.5, lon: 24 },
    Afghanistan: { lat: 33.9, lon: 67.7 }, Iraq: { lat: 33.2, lon: 43.7 }, Haiti: { lat: 19, lon: -72.3 },
    Myanmar: { lat: 19.7, lon: 96.2 }, Libya: { lat: 26.3, lon: 17.2 }, Lebanon: { lat: 33.9, lon: 35.5 },
    Ethiopia: { lat: 9.1, lon: 40.5 }, Pakistan: { lat: 30.4, lon: 69.3 }, Venezuela: { lat: 6.4, lon: -66.6 },
    'North Korea': { lat: 40, lon: 127 }, Cyprus: { lat: 35.1, lon: 33.4 }, Iran: { lat: 32.4, lon: 53.7 },
    Nigeria: { lat: 9.1, lon: 8.7 }, Mali: { lat: 17.6, lon: -4 }, 'Burkina Faso': { lat: 12.4, lon: -1.5 },
    Niger: { lat: 17.6, lon: 8.1 }, Mozambique: { lat: -18.7, lon: 35.5 }, Colombia: { lat: 4.6, lon: -74.1 },
    Tunisia: { lat: 33.9, lon: 9.5 }, Georgia: { lat: 42.3, lon: 43.4 }, Egypt: { lat: 26.8, lon: 30.8 },
    Turkey: { lat: 38.9, lon: 35.2 }, Taiwan: { lat: 23.7, lon: 121 },
  };

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">⚠ COUNTRY INSTABILITY INDEX</h2>
        <span className="text-[9px] font-data text-text-secondary">● {sorted.length} COUNTRIES</span>
        {criticalCount > 0 && <span className="text-[8px] font-data text-alert-critical animate-pulse-dot ml-auto">🔴 {criticalCount} CRITICAL</span>}
        <span className="text-[8px] font-data text-alert-high">🟠 {highCount} HIGH</span>
      </div>
      <div className="text-[8px] font-data text-muted-foreground mb-2 leading-relaxed">
        Composite score (0-100) blending: Unrest (civil disorder), Conflict (armed intensity), Security (military activity), Information (news velocity). Click to fly to country.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
        {sorted.map((c, i) => {
          const levelColor = c.level === 'critical' ? 'border-l-alert-critical' : c.level === 'high' ? 'border-l-alert-high' : c.level === 'medium' ? 'border-l-alert-medium' : 'border-l-primary/30';
          const scoreColor = c.level === 'critical' ? 'text-alert-critical' : c.level === 'high' ? 'text-alert-high' : c.level === 'medium' ? 'text-alert-medium' : 'text-data-text';
          const trendIcon = c.trend === 'up' ? '↗' : c.trend === 'down' ? '↘' : '→';
          const trendColor = c.trend === 'up' ? 'text-alert-critical' : c.trend === 'down' ? 'text-signal-aircraft' : 'text-muted-foreground';
          const coords = COUNTRY_COORDS[c.country];
          return (
            <div key={c.country}
              onClick={() => coords && setMapCenter({ lat: coords.lat, lon: coords.lon, zoom: 6 })}
              className={`bg-card-bg/60 border-l-2 ${levelColor} rounded-r px-2.5 py-1.5 cursor-pointer hover:bg-card-hover transition-colors`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-data text-text-muted-custom">#{i + 1}</span>
                  <span className="text-sm">{c.flag}</span>
                  <span className="text-[10px] font-display tracking-wide text-foreground">{c.country}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[14px] font-data font-bold ${scoreColor}`}>{c.score}</span>
                  <span className={`text-[9px] font-data ${trendColor}`}>{trendIcon}</span>
                </div>
              </div>
              <div className="mt-1">
                <div className="w-full h-1 bg-card-hover rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${c.level === 'critical' ? 'bg-alert-critical' : c.level === 'high' ? 'bg-alert-high' : c.level === 'medium' ? 'bg-alert-medium' : 'bg-primary/40'}`}
                    style={{ width: `${c.score}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Strategic Risk Overview Panel ──
const StrategicRiskPanel = memo(() => {
  const { earthquakes, protests, outages, fires, aircraft } = useWorldViewStore();

  // Calculate composite risk score
  const instabilityTop5 = [...INSTABILITY_DATA].sort((a, b) => b.score - a.score).slice(0, 5);
  const instabilityScore = instabilityTop5.reduce((sum, c) => sum + c.score, 0) / 5;
  const conflictScore = CONFLICT_ZONES.filter(c => c.intensity >= 8).length * 8;
  const infraScore = Math.min((outages.length * 5 + fires.length * 3), 30);
  const milScore = Math.min(aircraft.filter(a => a.isMilitary).length * 0.5, 20);

  const compositeRaw = (instabilityScore * 0.5) + (conflictScore * 0.2) + (infraScore * 0.15) + (milScore * 0.15);
  const compositeScore = Math.min(Math.round(compositeRaw), 100);

  const riskLevel = compositeScore >= 70 ? 'CRITICAL' : compositeScore >= 50 ? 'HIGH' : compositeScore >= 30 ? 'ELEVATED' : 'LOW';
  const riskColor = compositeScore >= 70 ? 'text-alert-critical' : compositeScore >= 50 ? 'text-alert-high' : compositeScore >= 30 ? 'text-alert-medium' : 'text-signal-aircraft';
  const riskBg = compositeScore >= 70 ? 'bg-alert-critical' : compositeScore >= 50 ? 'bg-alert-high' : compositeScore >= 30 ? 'bg-alert-medium' : 'bg-signal-aircraft';

  const critTheaters = THEATER_DATA.filter(t => t.status === 'CRIT').length;
  const escalatingTheaters = THEATER_DATA.filter(t => t.trend === 'escalating').length;
  const highAlerts = INSTABILITY_DATA.filter(c => c.level === 'critical' || c.level === 'high').length;
  const activeConflicts = CONFLICT_ZONES.filter(c => c.intensity >= 7).length;

  const metrics = [
    { label: 'COMPOSITE SCORE', value: compositeScore, max: 100, color: riskBg },
    { label: 'INSTABILITY AVG (TOP 5)', value: Math.round(instabilityScore), max: 100, color: 'bg-alert-high' },
    { label: 'ACTIVE CONFLICTS (INT≥7)', value: activeConflicts, max: 20, color: 'bg-alert-critical' },
    { label: 'CRITICAL THEATERS', value: critTheaters, max: 12, color: 'bg-alert-critical' },
    { label: 'ESCALATING THEATERS', value: escalatingTheaters, max: 12, color: 'bg-alert-medium' },
    { label: 'HIGH ALERT COUNTRIES', value: highAlerts, max: 29, color: 'bg-alert-high' },
    { label: 'INFRA EVENTS', value: outages.length + fires.length, max: 50, color: 'bg-signal-outage' },
    { label: 'MIL AIRCRAFT TRACKED', value: aircraft.filter(a => a.isMilitary).length, max: 100, color: 'bg-signal-military' },
  ];

  const recentAlerts = [
    ...INSTABILITY_DATA.filter(c => c.trend === 'up' && c.score >= 40).map(c => ({
      icon: '📊', level: c.level, text: `${c.country} instability rising (score: ${c.score})`, driver: 'Trend: ↗ escalating',
    })),
    ...THEATER_DATA.filter(t => t.status === 'CRIT').map(t => ({
      icon: '🎯', level: 'critical' as const, text: `${t.name} — CRITICAL posture`, driver: t.notes || 'High force concentration',
    })),
  ].slice(0, 6);

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🛡 STRATEGIC RISK OVERVIEW</h2>
        <span className="text-[9px] font-data text-primary">● LIVE</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Big score */}
        <div className="flex flex-col items-center justify-center bg-card-bg/60 rounded border border-border p-4">
          <div className={`text-[48px] font-data font-bold ${riskColor}`}>{compositeScore}</div>
          <div className={`text-[10px] font-display tracking-[0.2em] ${riskColor} mt-1`}>{riskLevel}</div>
          <div className="text-[8px] font-data text-muted-foreground mt-2">TREND</div>
          <div className="text-[10px] font-data text-foreground">→ Stable</div>
        </div>
        {/* Metrics grid */}
        <div className="col-span-1 space-y-2">
          {metrics.slice(0, 4).map((m) => (
            <div key={m.label}>
              <div className="flex justify-between mb-0.5">
                <span className="text-[8px] font-data text-muted-foreground">{m.label}</span>
                <span className="text-[9px] font-data text-data-text font-bold">{m.value}</span>
              </div>
              <div className="w-full h-1.5 bg-card-hover rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${m.color}`} style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-1 space-y-2">
          {metrics.slice(4).map((m) => (
            <div key={m.label}>
              <div className="flex justify-between mb-0.5">
                <span className="text-[8px] font-data text-muted-foreground">{m.label}</span>
                <span className="text-[9px] font-data text-data-text font-bold">{m.value}</span>
              </div>
              <div className="w-full h-1.5 bg-card-hover rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${m.color}`} style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Recent alerts */}
      {recentAlerts.length > 0 && (
        <div className="mt-3">
          <h3 className="text-[9px] font-display tracking-wider text-muted-foreground mb-1.5">RECENT ALERTS ({recentAlerts.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {recentAlerts.map((alert, i) => {
              const alertColor = alert.level === 'critical' ? 'border-l-alert-critical' : alert.level === 'high' ? 'border-l-alert-high' : 'border-l-alert-medium';
              return (
                <div key={i} className={`bg-card-bg/60 border-l-2 ${alertColor} rounded-r px-2 py-1.5`}>
                  <div className="text-[9px] text-foreground leading-tight">{alert.icon} {alert.text}</div>
                  <div className="text-[7px] font-data text-text-muted-custom mt-0.5">{alert.driver}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

// ── Combined Indexes Panel (Grid of Squares) ──
const CombinedIndexesPanel = memo(() => {
  const { earthquakes, protests, outages, fires, aircraft, setMapCenter } = useWorldViewStore();
  const sorted = [...INSTABILITY_DATA].sort((a, b) => b.score - a.score);

  // Risk score calculation
  const instabilityTop5 = sorted.slice(0, 5);
  const instabilityScore = instabilityTop5.reduce((sum, c) => sum + c.score, 0) / 5;
  const conflictScore = CONFLICT_ZONES.filter(c => c.intensity >= 8).length * 8;
  const infraScore = Math.min((outages.length * 5 + fires.length * 3), 30);
  const milScore = Math.min(aircraft.filter(a => a.isMilitary).length * 0.5, 20);
  const compositeRaw = (instabilityScore * 0.5) + (conflictScore * 0.2) + (infraScore * 0.15) + (milScore * 0.15);
  const compositeScore = Math.min(Math.round(compositeRaw), 100);
  const riskLevel = compositeScore >= 70 ? 'CRITICAL' : compositeScore >= 50 ? 'HIGH' : compositeScore >= 30 ? 'ELEVATED' : 'LOW';
  const riskColor = compositeScore >= 70 ? 'text-alert-critical' : compositeScore >= 50 ? 'text-alert-high' : compositeScore >= 30 ? 'text-alert-medium' : 'text-signal-aircraft';

  const critTheaters = THEATER_DATA.filter(t => t.status === 'CRIT').length;
  const escalatingTheaters = THEATER_DATA.filter(t => t.trend === 'escalating').length;

  const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
    Syria: { lat: 35, lon: 38 }, Ukraine: { lat: 48.5, lon: 31 }, Sudan: { lat: 15.5, lon: 32.5 },
    Yemen: { lat: 15.5, lon: 48 }, Somalia: { lat: 5, lon: 46 }, 'DR Congo': { lat: -2.5, lon: 24 },
    Afghanistan: { lat: 33.9, lon: 67.7 }, Iraq: { lat: 33.2, lon: 43.7 }, Haiti: { lat: 19, lon: -72.3 },
    Myanmar: { lat: 19.7, lon: 96.2 }, Libya: { lat: 26.3, lon: 17.2 }, Lebanon: { lat: 33.9, lon: 35.5 },
    Ethiopia: { lat: 9.1, lon: 40.5 }, Pakistan: { lat: 30.4, lon: 69.3 }, Venezuela: { lat: 6.4, lon: -66.6 },
    'North Korea': { lat: 40, lon: 127 }, Cyprus: { lat: 35.1, lon: 33.4 }, Iran: { lat: 32.4, lon: 53.7 },
    Nigeria: { lat: 9.1, lon: 8.7 }, Mali: { lat: 17.6, lon: -4 }, 'Burkina Faso': { lat: 12.4, lon: -1.5 },
    Niger: { lat: 17.6, lon: 8.1 }, Mozambique: { lat: -18.7, lon: 35.5 }, Colombia: { lat: 4.6, lon: -74.1 },
    Tunisia: { lat: 33.9, lon: 9.5 }, Georgia: { lat: 42.3, lon: 43.4 }, Egypt: { lat: 26.8, lon: 30.8 },
    Turkey: { lat: 38.9, lon: 35.2 }, Taiwan: { lat: 23.7, lon: 121 },
  };

  return (
    <div className="p-3">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-auto">

        {/* ── STRATEGIC RISK ── */}
        <div className="bg-card-bg/60 rounded-lg border border-border p-3 min-h-[200px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🛡 STRATEGIC RISK OVERVIEW</h3>
            <span className="text-[8px] font-data text-primary animate-pulse-dot">● LIVE</span>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-center">
              <div className={`text-[42px] font-data font-bold ${riskColor} leading-none`}>{compositeScore}</div>
              <div className={`text-[9px] font-display tracking-[0.15em] ${riskColor} mt-1`}>{riskLevel}</div>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between text-[8px] font-data">
                <span className="text-muted-foreground">INSTABILITY</span>
                <span className="text-data-text">{Math.round(instabilityScore)}</span>
              </div>
              <div className="w-full h-1 bg-card-hover rounded-full overflow-hidden">
                <div className="h-full bg-alert-high rounded-full" style={{ width: `${instabilityScore}%` }} />
              </div>
              <div className="flex justify-between text-[8px] font-data">
                <span className="text-muted-foreground">CONFLICTS</span>
                <span className="text-data-text">{conflictScore}</span>
              </div>
              <div className="w-full h-1 bg-card-hover rounded-full overflow-hidden">
                <div className="h-full bg-alert-critical rounded-full" style={{ width: `${Math.min(conflictScore, 100)}%` }} />
              </div>
              <div className="flex justify-between text-[8px] font-data">
                <span className="text-muted-foreground">INFRA</span>
                <span className="text-data-text">{infraScore}</span>
              </div>
              <div className="w-full h-1 bg-card-hover rounded-full overflow-hidden">
                <div className="h-full bg-signal-outage rounded-full" style={{ width: `${(infraScore / 30) * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="text-[8px] font-data text-muted-foreground">TREND → Stable</div>
        </div>

        {/* ── STRATEGIC POSTURE ── */}
        <div className="bg-card-bg/60 rounded-lg border border-border p-3 min-h-[200px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🎯 AI STRATEGIC POSTURE</h3>
            {critTheaters > 0 && <span className="text-[8px] font-data text-alert-critical animate-pulse-dot">⚠ {critTheaters} CRIT</span>}
          </div>
          <div className="space-y-1.5 max-h-[calc(100%-30px)] overflow-y-auto">
            {THEATER_DATA.map((t) => {
              const sc = t.status === 'CRIT' ? 'text-alert-critical' : t.status === 'ELEV' ? 'text-alert-medium' : 'text-signal-aircraft';
              const sbg = t.status === 'CRIT' ? 'bg-alert-critical/10' : t.status === 'ELEV' ? 'bg-alert-medium/10' : 'bg-primary/5';
              const trendIcon = t.trend === 'escalating' ? '↗' : t.trend === 'de-escalating' ? '↘' : '→';
              const trendColor = t.trend === 'escalating' ? 'text-alert-critical' : t.trend === 'de-escalating' ? 'text-signal-aircraft' : 'text-muted-foreground';
              return (
                <div key={t.name} className={`${sbg} rounded border p-2 ${t.status === 'CRIT' ? 'border-alert-critical/40' : t.status === 'ELEV' ? 'border-alert-medium/30' : 'border-border'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-display tracking-wide text-foreground">{t.name}</span>
                    <span className={`text-[7px] font-data font-bold px-1 py-0.5 rounded ${sc} ${sbg}`}>{t.status}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[8px] font-data text-data-text">✈️ {t.airAssets}</span>
                    <span className="text-[8px] font-data text-data-text">⚓ {t.seaAssets}</span>
                    <span className={`text-[8px] font-data ${trendColor} ml-auto`}>{trendIcon} {t.trend}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── INSTABILITY INDEX ── */}
        <div className="bg-card-bg/60 rounded-lg border border-border p-3 min-h-[200px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">⚠ COUNTRY INSTABILITY</h3>
            <span className="text-[8px] font-data text-text-secondary">{sorted.length} COUNTRIES</span>
          </div>
          <div className="space-y-1 max-h-[calc(100%-30px)] overflow-y-auto">
            {sorted.map((c, i) => {
              const levelColor = c.level === 'critical' ? 'border-l-alert-critical' : c.level === 'high' ? 'border-l-alert-high' : c.level === 'medium' ? 'border-l-alert-medium' : 'border-l-primary/30';
              const scoreColor = c.level === 'critical' ? 'text-alert-critical' : c.level === 'high' ? 'text-alert-high' : c.level === 'medium' ? 'text-alert-medium' : 'text-data-text';
              const trendIcon = c.trend === 'up' ? '↗' : c.trend === 'down' ? '↘' : '→';
              const trendColor = c.trend === 'up' ? 'text-alert-critical' : c.trend === 'down' ? 'text-signal-aircraft' : 'text-muted-foreground';
              const coords = COUNTRY_COORDS[c.country];
              return (
                <div key={c.country}
                  onClick={() => coords && setMapCenter({ lat: coords.lat, lon: coords.lon, zoom: 6 })}
                  className={`bg-card-bg/40 border-l-2 ${levelColor} rounded-r px-2 py-1 cursor-pointer hover:bg-card-hover transition-colors`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[7px] font-data text-text-muted-custom">#{i + 1}</span>
                      <span className="text-xs">{c.flag}</span>
                      <span className="text-[9px] font-display tracking-wide text-foreground">{c.country}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[12px] font-data font-bold ${scoreColor}`}>{c.score}</span>
                      <span className={`text-[8px] font-data ${trendColor}`}>{trendIcon}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── WORLD STATS SUMMARY ── */}
        <div className="bg-card-bg/60 rounded-lg border border-border p-3 min-h-[200px]">
          <h3 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">📊 MONITORING STATS</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Aircraft', value: aircraft.length, icon: '✈️', color: 'text-signal-aircraft' },
              { label: 'Military', value: aircraft.filter(a => a.isMilitary).length, icon: '⚔️', color: 'text-signal-military' },
              { label: 'Earthquakes', value: earthquakes.length, icon: '🌍', color: 'text-signal-earthquake' },
              { label: 'Protests', value: protests.length, icon: '✊', color: 'text-signal-protest' },
              { label: 'Cyber/Outages', value: outages.length, icon: '🔒', color: 'text-signal-outage' },
              { label: 'Fires', value: fires.length, icon: '🔥', color: 'text-alert-high' },
              { label: 'Theaters CRIT', value: critTheaters, icon: '🎯', color: 'text-alert-critical' },
              { label: 'Escalating', value: escalatingTheaters, icon: '↗', color: 'text-alert-medium' },
            ].map((s) => (
              <div key={s.label} className="bg-card-bg/40 rounded border border-border p-2 text-center">
                <div className="text-sm mb-0.5">{s.icon}</div>
                <div className={`font-data text-base font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[7px] font-display tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CONFLICT ZONES ── */}
        <div className="bg-card-bg/60 rounded-lg border border-border p-3 min-h-[200px]">
          <h3 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">⚔ ACTIVE CONFLICTS</h3>
          <div className="space-y-1 max-h-[calc(100%-30px)] overflow-y-auto">
            {CONFLICT_ZONES.sort((a, b) => b.intensity - a.intensity).map((cz) => {
              const c = cz.intensity >= 8 ? 'text-alert-critical' : cz.intensity >= 6 ? 'text-alert-high' : 'text-alert-medium';
              const bg = cz.intensity >= 8 ? 'border-alert-critical/40' : cz.intensity >= 6 ? 'border-alert-high/30' : 'border-border';
              return (
                <div key={cz.name}
                  onClick={() => setMapCenter({ lat: cz.lat, lon: cz.lon, zoom: 7 })}
                  className={`flex items-center justify-between px-2 py-1.5 rounded bg-card-bg/40 border cursor-pointer hover:bg-card-hover transition-colors ${bg}`}>
                  <span className="text-[9px] font-display tracking-wide text-foreground">{cz.name}</span>
                  <span className={`text-[9px] font-data font-bold ${c}`}>{cz.intensity}/10</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RECENT ESCALATION ALERTS ── */}
        <div className="bg-card-bg/60 rounded-lg border border-border p-3 min-h-[200px]">
          <h3 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">🔴 ESCALATION ALERTS</h3>
          <div className="space-y-1.5 max-h-[calc(100%-30px)] overflow-y-auto">
            {[
              ...INSTABILITY_DATA.filter(c => c.trend === 'up' && c.score >= 40).map(c => ({
                icon: '📊', level: c.level, text: `${c.flag} ${c.country} instability rising → ${c.score}`,
              })),
              ...THEATER_DATA.filter(t => t.status === 'CRIT').map(t => ({
                icon: '🎯', level: 'critical' as const, text: `${t.name} — CRITICAL posture`,
              })),
              ...THEATER_DATA.filter(t => t.trend === 'escalating').map(t => ({
                icon: '↗', level: 'high' as const, text: `${t.name} — escalating`,
              })),
            ].slice(0, 12).map((a, i) => {
              const ac = a.level === 'critical' ? 'border-l-alert-critical' : a.level === 'high' ? 'border-l-alert-high' : 'border-l-alert-medium';
              return (
                <div key={i} className={`bg-card-bg/40 border-l-2 ${ac} rounded-r px-2 py-1.5`}>
                  <span className="text-[9px] text-foreground">{a.icon} {a.text}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
});

// ── Markets Panel ──
const MarketsPanel = memo(() => {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketSnapshot().then(s => { setSnapshot(s); setLoading(false); });
    const interval = setInterval(() => fetchMarketSnapshot().then(setSnapshot), 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><span className="text-[10px] font-data text-primary animate-pulse-dot">FETCHING MARKET DATA...</span></div>;

  const fgColor = (snapshot?.fearGreed?.value ?? 50) <= 25 ? 'text-alert-critical' : (snapshot?.fearGreed?.value ?? 50) >= 75 ? 'text-signal-aircraft' : (snapshot?.fearGreed?.value ?? 50) >= 50 ? 'text-alert-medium' : 'text-alert-high';

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">📈 MARKETS & CRYPTO</h2>
        <span className="text-[8px] font-data text-primary animate-pulse-dot">● LIVE</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Fear & Greed + BTC Hashrate */}
        <div className="bg-card-bg/60 rounded border border-border p-3">
          <h3 className="text-[9px] font-display tracking-wider text-muted-foreground mb-2">SENTIMENT</h3>
          {snapshot?.fearGreed && (
            <div className="text-center mb-3">
              <div className={`text-[36px] font-data font-bold ${fgColor}`}>{snapshot.fearGreed.value}</div>
              <div className={`text-[9px] font-display tracking-wider ${fgColor}`}>{snapshot.fearGreed.classification.toUpperCase()}</div>
              <div className="text-[7px] font-data text-muted-foreground mt-1">FEAR & GREED INDEX</div>
            </div>
          )}
          {snapshot?.btcHashrate && (
            <div className="flex justify-between items-center border-t border-border pt-2">
              <span className="text-[8px] font-data text-muted-foreground">BTC HASHRATE</span>
              <span className="text-[10px] font-data text-data-text font-bold">{snapshot.btcHashrate.toFixed(0)} EH/s</span>
            </div>
          )}
          {snapshot?.globalMarketCap && (
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-[8px] font-data text-muted-foreground">GLOBAL MCAP</span>
              <span className="text-[10px] font-data text-data-text font-bold">${(snapshot.globalMarketCap / 1e12).toFixed(2)}T</span>
            </div>
          )}
        </div>
        {/* Crypto prices */}
        <div className="col-span-2 bg-card-bg/60 rounded border border-border p-3">
          <h3 className="text-[9px] font-display tracking-wider text-muted-foreground mb-2">CRYPTO</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {snapshot?.crypto.map(c => (
              <div key={c.id} className="bg-card-bg/40 rounded border border-border p-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-display tracking-wide text-foreground">{c.symbol}</span>
                  <span className={`text-[8px] font-data ${c.change24h >= 0 ? 'text-signal-aircraft' : 'text-alert-critical'}`}>
                    {c.change24h >= 0 ? '▲' : '▼'}{Math.abs(c.change24h).toFixed(1)}%
                  </span>
                </div>
                <div className="text-[14px] font-data font-bold text-data-text mt-0.5">
                  ${c.price >= 1000 ? c.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : c.price.toFixed(2)}
                </div>
                <div className="text-[7px] font-data text-muted-foreground">{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Trending Signals Panel ──
const TrendingPanel = memo(() => {
  const [signals, setSignals] = useState<TrendingSignal[]>([]);
  useEffect(() => {
    fetchTrendingSignals().then(setSignals);
    const interval = setInterval(() => fetchTrendingSignals().then(setSignals), 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🔥 TRENDING SIGNALS</h2>
        <span className="text-[8px] font-data text-text-secondary">● {signals.length} TOPICS</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {signals.map(s => {
          const levelColor = s.level === 'critical' ? 'border-l-alert-critical' : s.level === 'high' ? 'border-l-alert-high' : s.level === 'medium' ? 'border-l-alert-medium' : 'border-l-primary/30';
          const volColor = s.level === 'critical' ? 'bg-alert-critical' : s.level === 'high' ? 'bg-alert-high' : s.level === 'medium' ? 'bg-alert-medium' : 'bg-primary/40';
          const velIcon = s.velocity === 'rising' ? '↗' : s.velocity === 'falling' ? '↘' : '→';
          const velColor = s.velocity === 'rising' ? 'text-alert-critical' : s.velocity === 'falling' ? 'text-signal-aircraft' : 'text-muted-foreground';
          return (
            <div key={s.id} className={`bg-card-bg/60 border-l-2 ${levelColor} rounded-r px-3 py-2`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-display tracking-wide text-foreground">{s.name}</span>
                <span className={`text-[9px] font-data ${velColor}`}>{velIcon} {s.change24h > 0 ? '+' : ''}{s.change24h}%</span>
              </div>
              <div className="w-full h-1.5 bg-card-hover rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${volColor}`} style={{ width: `${s.volume}%` }} />
              </div>
              <div className="text-[7px] font-data text-muted-foreground mt-1">VOL: {s.volume} | {s.velocity.toUpperCase()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Convergence Detection Panel ──
const ConvergencePanel = memo(() => {
  const { earthquakes, protests, outages, fires, aircraft, setMapCenter } = useWorldViewStore();
  const milCount = aircraft.filter(a => a.isMilitary).length;
  const zones = detectConvergenceZones(earthquakes, protests, outages, fires, milCount);

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🎯 CONVERGENCE ZONES</h2>
        <span className="text-[8px] font-data text-text-secondary">● {zones.length} DETECTED</span>
        {zones.some(z => z.level === 'critical') && <span className="text-[8px] font-data text-alert-critical animate-pulse-dot ml-auto">⚠ CRITICAL CONVERGENCE</span>}
      </div>
      <div className="text-[8px] font-data text-muted-foreground mb-2">
        Detects geographic areas where multiple event types co-occur (earthquake + protest + conflict = convergence zone).
      </div>
      {zones.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-[10px] font-data">No convergence zones detected. Enable more data layers to improve detection.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {zones.map((z, i) => {
            const borderColor = z.level === 'critical' ? 'border-alert-critical/50' : z.level === 'high' ? 'border-alert-high/40' : 'border-border';
            const scoreColor = z.level === 'critical' ? 'text-alert-critical' : z.level === 'high' ? 'text-alert-high' : 'text-alert-medium';
            return (
              <div key={i} onClick={() => setMapCenter({ lat: z.lat, lon: z.lon, zoom: 7 })}
                className={`bg-card-bg/60 rounded border p-3 cursor-pointer hover:bg-card-hover transition-colors ${borderColor}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-display tracking-wide text-foreground">{z.locationName || `${z.lat.toFixed(1)}°, ${z.lon.toFixed(1)}°`}</span>
                  <span className={`text-[14px] font-data font-bold ${scoreColor}`}>{z.score}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {z.types.map(t => (
                    <span key={t} className="text-[7px] font-data bg-primary/10 text-primary px-1.5 py-0.5 rounded">{t.toUpperCase()}</span>
                  ))}
                </div>
                <div className="text-[7px] font-data text-muted-foreground">{z.eventCount} events • {z.types.length} types • Click to fly</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

// ── Data Sources Health Panel ──
const DATA_SOURCES = [
  { name: 'OpenSky (Aircraft)', endpoint: 'opensky-network.org', interval: '15s', icon: '✈️' },
  { name: 'USGS Earthquakes', endpoint: 'earthquake.usgs.gov', interval: '5min', icon: '🌍' },
  { name: 'NASA EONET (Fires)', endpoint: 'eonet.gsfc.nasa.gov', interval: '10min', icon: '🔥' },
  { name: 'OpenWeather', endpoint: 'api.openweathermap.org', interval: '10min', icon: '🌤' },
  { name: 'CoinGecko (Crypto)', endpoint: 'api.coingecko.com', interval: '2min', icon: '₿' },
  { name: 'Fear & Greed Index', endpoint: 'api.alternative.me', interval: '2min', icon: '😱' },
  { name: 'Mempool (Hashrate)', endpoint: 'mempool.space', interval: '2min', icon: '⛏' },
  { name: 'RSS News Feeds', endpoint: 'various', interval: '3min', icon: '📰' },
  { name: 'ISS Position', endpoint: 'api.wheretheiss.at', interval: '10s', icon: '🛰' },
  { name: 'NOAA Solar Weather', endpoint: 'services.swpc.noaa.gov', interval: '5min', icon: '☀️' },
  { name: 'NASA DONKI (Flares)', endpoint: 'api.nasa.gov/DONKI', interval: '5min', icon: '🌞' },
  { name: 'USGS Volcanoes', endpoint: 'volcanoes.usgs.gov', interval: '5min', icon: '🌋' },
  { name: 'IODA (Internet)', endpoint: 'api.ioda.inetintel.cc', interval: '5min', icon: '🌐' },
  { name: 'Safecast (Radiation)', endpoint: 'api.safecast.org', interval: '5min', icon: '☢️' },
  { name: 'WHO Outbreaks', endpoint: 'who.int/feeds', interval: '10min', icon: '🦠' },
  { name: 'Frankfurter (Forex)', endpoint: 'api.frankfurter.app', interval: '1min', icon: '💱' },
  { name: 'WAQI (Air Quality)', endpoint: 'api.waqi.info', interval: '5min', icon: '🌫️' },
  { name: 'RestCountries', endpoint: 'restcountries.com', interval: 'once', icon: '🗺️' },
];

const SourcesHealthPanel = memo(() => {
  const { lastRefresh } = useWorldViewStore();
  const now = Date.now();
  const refreshAge = Math.floor((now - lastRefresh.getTime()) / 1000);

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🩺 DATA SOURCES HEALTH</h2>
        <span className="text-[8px] font-data text-primary animate-pulse-dot">● MONITORING</span>
        <span className="text-[8px] font-data text-muted-foreground ml-auto">LAST REFRESH: {refreshAge}s AGO</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {DATA_SOURCES.map(src => {
          // Simulate status based on refresh age
          const isFresh = refreshAge < 60;
          const isStale = refreshAge >= 60 && refreshAge < 300;
          const statusColor = isFresh ? 'bg-signal-aircraft' : isStale ? 'bg-alert-medium' : 'bg-alert-critical';
          const statusLabel = isFresh ? 'FRESH' : isStale ? 'STALE' : 'ERROR';
          const statusText = isFresh ? 'text-signal-aircraft' : isStale ? 'text-alert-medium' : 'text-alert-critical';
          return (
            <div key={src.name} className="bg-card-bg/60 rounded border border-border p-2.5 flex items-start gap-2">
              <span className="text-sm">{src.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-display tracking-wide text-foreground">{src.name}</span>
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor} ${isFresh ? 'animate-pulse' : ''}`} />
                    <span className={`text-[7px] font-data font-bold ${statusText}`}>{statusLabel}</span>
                  </div>
                </div>
                <div className="text-[7px] font-data text-muted-foreground mt-0.5">{src.endpoint}</div>
                <div className="text-[7px] font-data text-text-muted-custom">INTERVAL: {src.interval}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Prediction Markets Panel ──
const PREDICTION_MARKETS = [
  { question: 'China invades Taiwan by 2027', probability: 8, category: 'MILITARY', trend: 'stable' },
  { question: 'Russia-Ukraine ceasefire by Dec 2025', probability: 22, category: 'CONFLICT', trend: 'up' },
  { question: 'Iran develops nuclear weapon by 2026', probability: 12, category: 'NUCLEAR', trend: 'up' },
  { question: 'US enters recession by Q4 2025', probability: 35, category: 'ECONOMIC', trend: 'down' },
  { question: 'Bitcoin exceeds $200K by 2025', probability: 18, category: 'CRYPTO', trend: 'up' },
  { question: 'NATO Article 5 invoked by 2026', probability: 4, category: 'MILITARY', trend: 'stable' },
  { question: 'Major cyberattack on US grid by 2025', probability: 15, category: 'CYBER', trend: 'up' },
  { question: 'AI causes >$10B economic disruption', probability: 42, category: 'TECH', trend: 'up' },
  { question: 'Oil exceeds $120/bbl by 2025', probability: 20, category: 'ENERGY', trend: 'down' },
  { question: 'North Korea ICBM test 2025', probability: 55, category: 'MILITARY', trend: 'stable' },
  { question: 'Red Sea shipping crisis resolved 2025', probability: 30, category: 'MARITIME', trend: 'down' },
  { question: 'Global food crisis (FAO emergency) 2025', probability: 25, category: 'HUMANITARIAN', trend: 'up' },
];

const PredictionsPanel = memo(() => {
  const sorted = [...PREDICTION_MARKETS].sort((a, b) => b.probability - a.probability);

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🔮 PREDICTION MARKETS</h2>
        <span className="text-[8px] font-data text-text-secondary">● {sorted.length} SCENARIOS</span>
      </div>
      <div className="text-[8px] font-data text-muted-foreground mb-2">
        Curated geopolitical prediction probabilities aggregated from Polymarket, Metaculus, and analyst estimates.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {sorted.map((p, i) => {
          const probColor = p.probability >= 50 ? 'text-alert-critical' : p.probability >= 25 ? 'text-alert-high' : p.probability >= 10 ? 'text-alert-medium' : 'text-signal-aircraft';
          const barColor = p.probability >= 50 ? 'bg-alert-critical' : p.probability >= 25 ? 'bg-alert-high' : p.probability >= 10 ? 'bg-alert-medium' : 'bg-signal-aircraft';
          const trendIcon = p.trend === 'up' ? '↗' : p.trend === 'down' ? '↘' : '→';
          const trendColor = p.trend === 'up' ? 'text-alert-critical' : p.trend === 'down' ? 'text-signal-aircraft' : 'text-muted-foreground';
          return (
            <div key={i} className="bg-card-bg/60 rounded border border-border p-2.5">
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-[9px] text-foreground leading-tight flex-1 mr-2">{p.question}</span>
                <span className={`text-[16px] font-data font-bold ${probColor} flex-shrink-0`}>{p.probability}%</span>
              </div>
              <div className="w-full h-1.5 bg-card-hover rounded-full overflow-hidden mb-1.5">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${p.probability}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[7px] font-data bg-primary/10 text-primary px-1.5 py-0.5 rounded">{p.category}</span>
                <span className={`text-[8px] font-data ${trendColor}`}>{trendIcon} {p.trend.toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Solar Weather Panel ──
const SolarWeatherPanel = memo(({ data }: { data: SolarSnapshot | null }) => {
  if (!data) return <div className="p-3 text-center"><span className="text-[10px] font-data text-primary animate-pulse-dot">LOADING SOLAR DATA...</span></div>;
  const kpColor = (data.kpIndex ?? 0) >= 7 ? 'text-alert-critical' : (data.kpIndex ?? 0) >= 5 ? 'text-alert-high' : (data.kpIndex ?? 0) >= 4 ? 'text-alert-medium' : 'text-signal-aircraft';
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">☀️ SOLAR WEATHER & GEOMAGNETIC</h2>
        {data.stormLevel !== 'none' && <span className="text-[8px] font-data text-alert-critical animate-pulse-dot ml-auto">⚠ {data.stormLevel.toUpperCase()} STORM</span>}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-card-bg/60 rounded border border-border p-2 text-center">
          <div className={`text-[24px] font-data font-bold ${kpColor}`}>{data.kpIndex?.toFixed(1) ?? '—'}</div>
          <div className="text-[7px] font-display tracking-wider text-muted-foreground">Kp INDEX</div>
        </div>
        <div className="bg-card-bg/60 rounded border border-border p-2 text-center">
          <div className="text-[18px] font-data font-bold text-data-text">{data.solarWind?.speed ?? '—'}</div>
          <div className="text-[7px] font-display tracking-wider text-muted-foreground">WIND km/s</div>
        </div>
        <div className="bg-card-bg/60 rounded border border-border p-2 text-center">
          <div className="text-[18px] font-data font-bold text-data-text">{data.flares.length}</div>
          <div className="text-[7px] font-display tracking-wider text-muted-foreground">FLARES (7D)</div>
        </div>
      </div>
      {data.flares.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-[9px] font-display tracking-wider text-muted-foreground">RECENT FLARES</h3>
          {data.flares.slice(0, 5).map(f => {
            const isX = f.classType.startsWith('X');
            const isM = f.classType.startsWith('M');
            return (
              <div key={f.id} className={`flex items-center justify-between px-2 py-1 rounded bg-card-bg/60 border ${isX ? 'border-alert-critical/40' : isM ? 'border-alert-high/30' : 'border-border'}`}>
                <span className="text-[9px] font-display text-foreground">{f.classType}</span>
                <span className="text-[8px] font-data text-muted-foreground">{new Date(f.peakTime).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

// ── Volcano Alerts Panel ──
const VolcanoAlertsPanel = memo(({ alerts }: { alerts: VolcanoAlert[] }) => {
  const activeAlerts = alerts.filter(a => a.alertLevel !== 'normal');
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🌋 USGS VOLCANO ALERTS</h2>
        <span className="text-[9px] font-data text-text-secondary">● {alerts.length} MONITORED</span>
        {activeAlerts.length > 0 && <span className="text-[8px] font-data text-alert-high animate-pulse-dot ml-auto">⚠ {activeAlerts.length} ACTIVE</span>}
      </div>
      <div className="space-y-1">
        {(activeAlerts.length > 0 ? activeAlerts : alerts).slice(0, 10).map(v => {
          const aColor = v.alertLevel === 'warning' ? 'border-alert-critical/40 text-alert-critical' : v.alertLevel === 'watch' ? 'border-alert-high/30 text-alert-high' : v.alertLevel === 'advisory' ? 'border-alert-medium/30 text-alert-medium' : 'border-border text-signal-aircraft';
          return (
            <div key={v.id} className={`flex items-center justify-between px-2 py-1.5 rounded bg-card-bg/60 border ${aColor.split(' ')[0]}`}>
              <div>
                <span className="text-[10px] font-display tracking-wide text-foreground">{v.name}</span>
                <span className="text-[8px] font-data text-text-muted-custom ml-1.5">{v.country}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[8px] font-data px-1 py-0.5 rounded bg-card-bg/80 ${aColor.split(' ')[1]}`}>{v.aviationColor}</span>
                <span className={`text-[7px] font-data font-bold px-1 py-0.5 rounded ${aColor.split(' ')[1]} bg-card-bg/80`}>{v.alertLevel.toUpperCase()}</span>
              </div>
            </div>
          );
        })}
        {alerts.length === 0 && <div className="text-center py-4 text-[10px] font-data text-muted-foreground">Loading volcano data...</div>}
      </div>
    </div>
  );
});

// ── Internet Outage Panel ──
const InternetOutagePanel = memo(({ outages }: { outages: InternetOutage[] }) => {
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🌐 INTERNET OUTAGES (IODA)</h2>
        {outages.length > 0 && <span className="text-[8px] font-data text-alert-critical animate-pulse-dot ml-auto">⚠ {outages.length} DISRUPTIONS</span>}
      </div>
      {outages.length === 0 ? (
        <div className="text-center py-6">
          <span className="text-2xl mb-2 block">✅</span>
          <p className="text-[10px] font-data text-signal-aircraft">NO SIGNIFICANT OUTAGES DETECTED</p>
          <p className="text-[8px] font-data text-muted-foreground mt-1">Global connectivity nominal</p>
        </div>
      ) : (
        <div className="space-y-1">
          {outages.slice(0, 12).map(o => {
            const sevColor = o.severity === 'critical' ? 'border-l-alert-critical text-alert-critical' : o.severity === 'major' ? 'border-l-alert-high text-alert-high' : 'border-l-alert-medium text-alert-medium';
            return (
              <div key={o.countryCode} className={`bg-card-bg/60 border-l-2 ${sevColor.split(' ')[0]} rounded-r px-2 py-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-display tracking-wide text-foreground">{o.country}</span>
                  <span className={`text-[11px] font-data font-bold ${sevColor.split(' ')[1]}`}>↓{o.dropPercent}%</span>
                </div>
                <div className="w-full h-1 bg-card-hover rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-signal-aircraft rounded-full" style={{ width: `${o.score}%` }} />
                </div>
                <div className="text-[7px] font-data text-muted-foreground mt-0.5">Connectivity: {o.score}% | {o.severity.toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

// ── Nuclear Reactor Panel ──
const NuclearReactorPanel = memo(() => {
  const stats = getNuclearStats();
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">☢️ NUCLEAR REACTOR STATUS</h2>
        <span className="text-[9px] font-data text-text-secondary">● {stats.totalReactors} TRACKED</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-card-bg/60 rounded border border-border p-2 text-center">
          <div className="text-[20px] font-data font-bold text-signal-aircraft">{stats.operational}</div>
          <div className="text-[7px] font-display tracking-wider text-muted-foreground">OPERATIONAL</div>
        </div>
        <div className="bg-card-bg/60 rounded border border-border p-2 text-center">
          <div className="text-[20px] font-data font-bold text-alert-medium">{stats.underConstruction}</div>
          <div className="text-[7px] font-display tracking-wider text-muted-foreground">UNDER CONSTRUCTION</div>
        </div>
      </div>
      <div className="bg-card-bg/60 rounded border border-border p-2 text-center mb-3">
        <div className="text-[16px] font-data font-bold text-data-text">{stats.totalCapacityGW} GW</div>
        <div className="text-[7px] font-display tracking-wider text-muted-foreground">TOTAL CAPACITY</div>
      </div>
      <div className="space-y-1 max-h-[180px] overflow-y-auto">
        {NUCLEAR_REACTORS.filter(r => r.status !== 'operational').map(r => {
          const sColor = r.status === 'shutdown' ? 'text-alert-high' : r.status === 'under_construction' ? 'text-alert-medium' : 'text-muted-foreground';
          return (
            <div key={r.id} className="flex items-center justify-between px-2 py-1 rounded bg-card-bg/60 border border-border">
              <div>
                <span className="text-[9px] font-display text-foreground">{r.name}</span>
                <span className="text-[7px] font-data text-muted-foreground ml-1">{r.country}</span>
              </div>
              <span className={`text-[7px] font-data font-bold ${sColor}`}>{r.status.replace(/_/g, ' ').toUpperCase()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Radioactivity Panel ──
const RadioactivityPanel = memo(({ stations }: { stations: RadiationStation[] }) => {
  const elevated = stations.filter(s => s.status !== 'normal');
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">☢️ RADIOACTIVITY MONITOR</h2>
        <span className="text-[9px] font-data text-text-secondary">● {stations.length} STATIONS</span>
        {elevated.length > 0 && <span className="text-[8px] font-data text-alert-high animate-pulse-dot ml-auto">⚠ {elevated.length} ELEVATED</span>}
      </div>
      <div className="space-y-1">
        {stations.slice(0, 12).map(s => {
          const color = s.status === 'alert' ? 'border-l-alert-critical text-alert-critical' : s.status === 'high' ? 'border-l-alert-high text-alert-high' : s.status === 'elevated' ? 'border-l-alert-medium text-alert-medium' : 'border-l-signal-aircraft/30 text-signal-aircraft';
          return (
            <div key={s.id} className={`bg-card-bg/60 border-l-2 ${color.split(' ')[0]} rounded-r px-2 py-1.5`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-display tracking-wide text-foreground">{s.name}</span>
                  {s.country && <span className="text-[8px] font-data text-muted-foreground ml-1">{s.country}</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[12px] font-data font-bold ${color.split(' ')[1]}`}>{s.doseRate}</span>
                  <span className="text-[7px] font-data text-muted-foreground">nSv/h</span>
                </div>
              </div>
              <div className="text-[7px] font-data text-muted-foreground mt-0.5">{s.status.toUpperCase()} | Background: 40-200 nSv/h</div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Disease Outbreak Panel ──
const DiseaseOutbreakPanel = memo(({ outbreaks }: { outbreaks: DiseaseOutbreak[] }) => {
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🦠 DISEASE OUTBREAKS</h2>
        <span className="text-[9px] font-data text-text-secondary">● {outbreaks.length} ACTIVE</span>
        {outbreaks.some(o => o.severity === 'emergency') && <span className="text-[8px] font-data text-alert-critical animate-pulse-dot ml-auto">⚠ PHEIC</span>}
      </div>
      <div className="space-y-1">
        {outbreaks.slice(0, 10).map(o => {
          const sevColor = o.severity === 'emergency' ? 'border-l-alert-critical' : o.severity === 'high' ? 'border-l-alert-high' : o.severity === 'moderate' ? 'border-l-alert-medium' : 'border-l-primary/30';
          const sevText = o.severity === 'emergency' ? 'text-alert-critical' : o.severity === 'high' ? 'text-alert-high' : o.severity === 'moderate' ? 'text-alert-medium' : 'text-muted-foreground';
          return (
            <div key={o.id} className={`bg-card-bg/60 border-l-2 ${sevColor} rounded-r px-2 py-1.5`}>
              <div className="text-[10px] font-display tracking-wide text-foreground leading-tight">{o.disease}</div>
              <div className="text-[8px] font-data text-muted-foreground mt-0.5">{o.country}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[7px] font-data font-bold ${sevText}`}>{o.severity.toUpperCase()}</span>
                {o.cases && <span className="text-[7px] font-data text-data-text">{o.cases.toLocaleString()} cases</span>}
                {o.deaths && <span className="text-[7px] font-data text-alert-critical">{o.deaths.toLocaleString()} deaths</span>}
                <span className="text-[7px] font-data text-muted-foreground">{o.source}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Sanctions Panel ──
const SanctionsPanel = memo(() => {
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🚫 SANCTIONS & WATCHLISTS</h2>
        <span className="text-[9px] font-data text-text-secondary">● {ACTIVE_SANCTIONS_REGIMES.length} REGIMES</span>
      </div>
      <div className="space-y-1.5">
        {ACTIVE_SANCTIONS_REGIMES.map(r => (
          <div key={r.regime} className="bg-card-bg/60 rounded border border-border px-2.5 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-display tracking-wide text-foreground">{r.regime}</span>
              <span className="text-[9px] font-data font-bold text-alert-high">{r.entities.toLocaleString()}</span>
            </div>
            <div className="text-[7px] font-data text-muted-foreground">{r.authority}</div>
            <div className="text-[8px] font-data text-text-secondary mt-0.5">{r.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Cable Incident Panel ──
const CableIncidentPanel = memo(() => {
  const stats = getCableIncidentStats();
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🔌 SUBMARINE CABLE INCIDENTS</h2>
        {stats.activeIncidents > 0 && <span className="text-[8px] font-data text-alert-critical animate-pulse-dot ml-auto">⚠ {stats.activeIncidents} UNRESOLVED</span>}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-card-bg/60 rounded border border-border p-2 text-center">
          <div className="text-[16px] font-data font-bold text-data-text">{stats.totalIncidents}</div>
          <div className="text-[7px] font-display tracking-wider text-muted-foreground">INCIDENTS</div>
        </div>
        <div className="bg-card-bg/60 rounded border border-border p-2 text-center">
          <div className="text-[16px] font-data font-bold text-alert-critical">{stats.criticalIncidents}</div>
          <div className="text-[7px] font-display tracking-wider text-muted-foreground">CRITICAL</div>
        </div>
        <div className="bg-card-bg/60 rounded border border-border p-2 text-center">
          <div className="text-[16px] font-data font-bold text-alert-high">{stats.affectedCountries}</div>
          <div className="text-[7px] font-display tracking-wider text-muted-foreground">COUNTRIES</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {CABLE_INCIDENTS.map(inc => {
          const sevColor = inc.severity === 'critical' ? 'border-l-alert-critical' : inc.severity === 'major' ? 'border-l-alert-high' : 'border-l-alert-medium';
          return (
            <div key={inc.id} className={`bg-card-bg/60 border-l-2 ${sevColor} rounded-r px-2 py-1.5`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-display text-foreground">{inc.cableName}</span>
                <span className={`text-[7px] font-data font-bold ${inc.restored ? 'text-signal-aircraft' : 'text-alert-critical'}`}>{inc.restored ? 'RESTORED' : 'ACTIVE'}</span>
              </div>
              <div className="text-[8px] font-data text-muted-foreground mt-0.5">{inc.location} — {inc.date}</div>
              <div className="text-[7px] font-data text-text-secondary mt-0.5">{inc.suspectedCause}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

NewsFeed.displayName = 'NewsFeed';
LivestreamPanel.displayName = 'LivestreamPanel';
RadioPanel.displayName = 'RadioPanel';
MarketsPanel.displayName = 'MarketsPanel';
TrendingPanel.displayName = 'TrendingPanel';
ConvergencePanel.displayName = 'ConvergencePanel';
SourcesHealthPanel.displayName = 'SourcesHealthPanel';
PredictionsPanel.displayName = 'PredictionsPanel';
WeatherPanel.displayName = 'WeatherPanel';
WorldStatsPanel.displayName = 'WorldStatsPanel';
PizzaIndexPanel.displayName = 'PizzaIndexPanel';
StrategicPosturePanel.displayName = 'StrategicPosturePanel';
InstabilityIndexPanel.displayName = 'InstabilityIndexPanel';
StrategicRiskPanel.displayName = 'StrategicRiskPanel';
CombinedIndexesPanel.displayName = 'CombinedIndexesPanel';
SolarWeatherPanel.displayName = 'SolarWeatherPanel';
VolcanoAlertsPanel.displayName = 'VolcanoAlertsPanel';
InternetOutagePanel.displayName = 'InternetOutagePanel';
NuclearReactorPanel.displayName = 'NuclearReactorPanel';
RadioactivityPanel.displayName = 'RadioactivityPanel';
DiseaseOutbreakPanel.displayName = 'DiseaseOutbreakPanel';
SanctionsPanel.displayName = 'SanctionsPanel';
CableIncidentPanel.displayName = 'CableIncidentPanel';
BottomFeed.displayName = 'BottomFeed';
export default BottomFeed;
