import { memo, useState } from 'react';
import { useWorldViewStore, MARKET_DATA, NewsItem, BottomPanelTab } from '@/store/worldview';
import { PIZZA_INDEX_DATA, LIVESTREAM_FEEDS, LivestreamFeed } from '@/services/dataServices';
import { ACTIVE_VOLCANOES } from '@/services/weatherService';
import { SUBMARINE_CABLES } from '@/data/submarineCables';

const TABS: { key: BottomPanelTab; label: string; icon: string }[] = [
  { key: 'news', label: 'INTEL FEED', icon: '📡' },
  { key: 'livestream', label: 'LIVESTREAMS', icon: '📺' },
  { key: 'weather', label: 'WEATHER', icon: '🌤' },
  { key: 'stats', label: 'WORLD STATS', icon: '📊' },
  { key: 'pizza', label: 'PIZZA INDEX', icon: '🍕' },
];

type NewsFilter = 'ALL' | 'CRITICAL' | 'MILITARY' | 'PROTEST' | 'CYBER';

const BottomFeed = memo(() => {
  const { bottomTab, setBottomTab } = useWorldViewStore();
  return (
    <div className="glass-panel border-t border-primary/8 flex flex-col overflow-hidden z-30 h-full">
      <div className="h-6 border-b border-border flex items-center overflow-hidden bg-card-bg/50">
        <div className="flex items-center animate-ticker-scroll whitespace-nowrap">
          {[...MARKET_DATA, ...MARKET_DATA].map((m, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 mx-4 text-[10px] font-data">
              <span className="text-muted-foreground">{m.symbol}</span>
              <span className="text-foreground">{m.value}</span>
              <span className={m.up ? 'text-signal-aircraft' : 'text-alert-critical'}>{m.up ? '▲' : '▼'}{m.change}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-card-bg/30">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setBottomTab(tab.key)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-display tracking-wider rounded transition-colors ${bottomTab === tab.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'}`}>
            <span className="text-[9px]">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {bottomTab === 'news' && <NewsFeed />}
        {bottomTab === 'livestream' && <LivestreamPanel />}
        {bottomTab === 'weather' && <WeatherPanel />}
        {bottomTab === 'stats' && <WorldStatsPanel />}
        {bottomTab === 'pizza' && <PizzaIndexPanel />}
      </div>
    </div>
  );
});

const NewsFeed = memo(() => {
  const { news, newsLoading } = useWorldViewStore();
  const [filter, setFilter] = useState<NewsFilter>('ALL');

  const filtered = news.filter((item) => {
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

const PizzaIndexPanel = memo(() => (
  <div className="h-full overflow-y-auto p-3">
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">PURCHASING POWER PARITY — BIG MAC INDEX</h2>
      <span className="text-[9px] font-data text-text-secondary">● {PIZZA_INDEX_DATA.length} COUNTRIES</span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
      {PIZZA_INDEX_DATA.map((entry) => (
        <div key={entry.country} className={`bg-card-bg/60 rounded border p-2 ${entry.overUnder === 'over' ? 'border-alert-high/30' : entry.overUnder === 'base' ? 'border-primary/30' : 'border-alert-info/30'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">{entry.flag}</span>
            <span className="text-[10px] font-display tracking-wide text-foreground truncate">{entry.country}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[14px] font-data font-bold text-data-text">${entry.usdPrice.toFixed(2)}</span>
            <span className="text-[8px] font-data text-text-muted-custom">USD</span>
          </div>
          <div className="text-[9px] font-data text-text-secondary mt-0.5">{entry.localPrice}</div>
          <div className="mt-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-display tracking-wider text-muted-foreground">INDEX</span>
              <span className={`text-[11px] font-data font-bold ${entry.index > 105 ? 'text-alert-high' : entry.index >= 95 ? 'text-primary' : 'text-alert-info'}`}>{entry.index}</span>
            </div>
            <div className="w-full h-1 bg-card-hover rounded-full mt-0.5 overflow-hidden">
              <div className={`h-full rounded-full ${entry.index > 105 ? 'bg-alert-high' : entry.index >= 95 ? 'bg-primary' : 'bg-alert-info'}`} style={{ width: `${Math.min(entry.index, 150) / 1.5}%` }} />
            </div>
            <div className="text-[8px] font-data text-text-muted-custom mt-0.5">
              {entry.overUnder === 'over' ? `+${entry.index - 100}% overvalued` : entry.overUnder === 'base' ? 'BASELINE' : `${100 - entry.index}% undervalued`}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

const getTimeAgo = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

NewsFeed.displayName = 'NewsFeed';
LivestreamPanel.displayName = 'LivestreamPanel';
WeatherPanel.displayName = 'WeatherPanel';
WorldStatsPanel.displayName = 'WorldStatsPanel';
PizzaIndexPanel.displayName = 'PizzaIndexPanel';
BottomFeed.displayName = 'BottomFeed';
export default BottomFeed;
