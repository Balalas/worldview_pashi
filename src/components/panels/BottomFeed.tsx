import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useWorldViewStore, MARKET_DATA, NewsItem, BottomPanelTab, INSTABILITY_DATA } from '@/store/worldview';
import { PENTAGON_PIZZA_DATA, LIVESTREAM_FEEDS, LivestreamFeed } from '@/services/dataServices';
import { ACTIVE_VOLCANOES } from '@/services/weatherService';
import { SUBMARINE_CABLES } from '@/data/submarineCables';
import { RADIO_STATIONS, RadioStation } from '@/data/radioStations';
import { CONFLICT_ZONES } from '@/data/conflictZones';
import { fetchMarketSnapshot, MarketSnapshot } from '@/services/marketService';
import { fetchTrendingSignals, TrendingSignal } from '@/services/trendingService';
import { detectConvergenceZones, ConvergenceZone } from '@/services/convergenceService';

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

type NewsFilter = 'ALL' | 'CRITICAL' | 'MILITARY' | 'PROTEST' | 'CYBER';

const BottomFeed = memo(() => {
  const { bottomTab, setBottomTab, bottomPanelCollapsed, toggleBottomPanel, bottomPanelExpanded, setBottomPanelExpanded } = useWorldViewStore();

  const isExpandable = bottomTab === 'indexes' || bottomTab === 'posture' || bottomTab === 'instability' || bottomTab === 'risk' || bottomTab === 'markets' || bottomTab === 'trending' || bottomTab === 'convergence' || bottomTab === 'sources' || bottomTab === 'predictions';

  return (
    <div className="glass-panel border-t border-primary/8 flex flex-col overflow-hidden z-30 h-full">
      <div className="h-6 border-b border-border flex items-center overflow-hidden bg-card-bg/50 relative">
        <div className="flex items-center animate-ticker-scroll whitespace-nowrap">
          {[...MARKET_DATA, ...MARKET_DATA].map((m, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 mx-4 text-[10px] font-data">
              <span className="text-muted-foreground">{m.symbol}</span>
              <span className="text-foreground">{m.value}</span>
              <span className={m.up ? 'text-signal-aircraft' : 'text-alert-critical'}>{m.up ? '▲' : '▼'}{m.change}</span>
            </span>
          ))}
        </div>
        <div className="absolute right-1 top-0.5 z-10 flex items-center gap-1">
          {isExpandable && !bottomPanelCollapsed && (
            <button onClick={() => setBottomPanelExpanded(!bottomPanelExpanded)} className="px-1.5 py-0.5 text-[8px] font-data text-muted-foreground hover:text-primary bg-background/60 backdrop-blur-sm rounded transition-colors">
              {bottomPanelExpanded ? '⊟' : '⊞'}
            </button>
          )}
          <button onClick={() => { toggleBottomPanel(); if (bottomPanelExpanded) setBottomPanelExpanded(false); }} className="px-1.5 py-0.5 text-[8px] font-data text-muted-foreground hover:text-primary bg-background/60 backdrop-blur-sm rounded transition-colors">
            {bottomPanelCollapsed ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {!bottomPanelCollapsed && (
        <>
          <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-card-bg/30 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => { setBottomTab(tab.key); if (tab.key === 'indexes') setBottomPanelExpanded(true); }}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-display tracking-wider rounded transition-colors whitespace-nowrap ${bottomTab === tab.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}>
                <span className="text-[9px]">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {bottomTab === 'news' && <NewsFeed />}
            {bottomTab === 'livestream' && <LivestreamPanel />}
            {bottomTab === 'radio' && <RadioPanel />}
            {bottomTab === 'markets' && <MarketsPanel />}
            {bottomTab === 'trending' && <TrendingPanel />}
            {bottomTab === 'convergence' && <ConvergencePanel />}
            {bottomTab === 'predictions' && <PredictionsPanel />}
            {bottomTab === 'sources' && <SourcesHealthPanel />}
            {bottomTab === 'indexes' && <CombinedIndexesPanel />}
            {bottomTab === 'posture' && <StrategicPosturePanel />}
            {bottomTab === 'instability' && <InstabilityIndexPanel />}
            {bottomTab === 'risk' && <StrategicRiskPanel />}
            {bottomTab === 'weather' && <WeatherPanel />}
            {bottomTab === 'stats' && <WorldStatsPanel />}
            {bottomTab === 'pizza' && <PizzaIndexPanel />}
          </div>
        </>
      )}
    </div>
  );
});

const WAR_NEWS_KEYWORDS = /\b(war|airstrike|strike|missile|killed|casualties|troops|offensive|invasion|bombing|shelling|artillery|mortar|combat|battle|drone strike|frontline|ceasefire|military|conflict|attack|dead|bomb|weapon|army|navy|soldier)\b/i;

const NewsFeed = memo(() => {
  const { news, newsLoading, warMode } = useWorldViewStore();
  const [filter, setFilter] = useState<NewsFilter>('ALL');

  const filtered = news.filter((item) => {
    // War mode overrides — only show war/conflict/military news
    if (warMode) {
      return item.category === 'military' || item.category === 'conflict' || WAR_NEWS_KEYWORDS.test(item.title);
    }
    if (filter === 'CRITICAL') return item.severity === 'critical' || item.severity === 'high';
    if (filter === 'MILITARY') return item.category === 'military' || item.category === 'conflict';
    if (filter === 'PROTEST') return item.category === 'protest';
    if (filter === 'CYBER') return item.category === 'cyber';
    return true;
  });

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">INTELLIGENCE FEED</h2>
        {newsLoading && <span className="text-[9px] font-data text-primary animate-pulse-dot">FETCHING...</span>}
        <span className="text-[9px] font-data text-text-secondary">● {filtered.length} ITEMS</span>
        <div className="flex gap-1 ml-auto">
          {(['ALL', 'CRITICAL', 'MILITARY', 'PROTEST', 'CYBER'] as NewsFilter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[8px] font-display tracking-wider px-1.5 py-0.5 rounded ${filter === f ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted-custom hover:text-muted-foreground'}`}>{f}</button>
          ))}
        </div>
      </div>
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

  return (
    <div className={`bg-card-bg/60 border-l-2 ${severityColor} rounded-r px-2 py-1.5 hover:bg-card-hover transition-colors cursor-pointer`}
      onClick={() => item.link && window.open(item.link, '_blank')}>
      <div className="flex items-start gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${severityDot} mt-1 flex-shrink-0 ${item.severity === 'critical' ? 'animate-pulse-dot' : ''}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-foreground leading-tight line-clamp-2">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {catBadge && <span className="text-[9px]">{catBadge}</span>}
            <span className="text-[8px] font-data text-text-secondary">{item.source}</span>
            <span className="text-[8px] text-text-muted-custom">·</span>
            <span className="text-[8px] font-data text-text-muted-custom">{getTimeAgo(item.time)}</span>
            <span className="text-[8px] font-data text-text-muted-custom">T{item.tier}</span>
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
    <div className="h-full flex overflow-hidden">
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
    <div className="h-full overflow-y-auto p-3">
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
    <div className="h-full overflow-y-auto p-3">
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
    <div className="h-full overflow-y-auto p-3">
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
    <div className="h-full flex overflow-hidden">
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
    <div className="h-full overflow-y-auto p-3">
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
    <div className="h-full overflow-y-auto p-3">
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
    <div className="h-full overflow-y-auto p-3">
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
    <div className="h-full overflow-y-auto p-3">
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
    <div className="h-full overflow-y-auto p-3">
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
    <div className="h-full overflow-y-auto p-3">
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
    <div className="h-full overflow-y-auto p-3">
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
];

const SourcesHealthPanel = memo(() => {
  const { lastRefresh } = useWorldViewStore();
  const now = Date.now();
  const refreshAge = Math.floor((now - lastRefresh.getTime()) / 1000);

  return (
    <div className="h-full overflow-y-auto p-3">
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
    <div className="h-full overflow-y-auto p-3">
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
BottomFeed.displayName = 'BottomFeed';
export default BottomFeed;
