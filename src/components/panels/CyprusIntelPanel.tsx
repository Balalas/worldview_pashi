import { memo, useState, useEffect, useCallback } from 'react';
import { fetchCyprusNews, CyprusNewsData, CyprusArticle } from '@/services/cyprusNewsService';
import { useWorldViewStore, GeoEvent } from '@/store/worldview';

// Spread articles across real Cyprus cities so markers don't stack
const CYPRUS_LOCATIONS = [
  { lat: 35.1856, lon: 33.3823, name: 'Nicosia' },
  { lat: 34.6786, lon: 33.0413, name: 'Limassol' },
  { lat: 34.7720, lon: 32.4297, name: 'Paphos' },
  { lat: 35.0400, lon: 33.9600, name: 'Famagusta' },
  { lat: 34.9167, lon: 33.6333, name: 'Larnaca' },
  { lat: 35.3500, lon: 33.3200, name: 'Kyrenia' },
  { lat: 34.7071, lon: 33.0226, name: 'Akrotiri' },
  { lat: 35.1000, lon: 33.9500, name: 'Paralimni' },
  { lat: 34.8833, lon: 33.6167, name: 'Dhekelia' },
  { lat: 35.0167, lon: 32.4167, name: 'Polis' },
];

function cyprusArticlesToGeoEvents(articles: CyprusArticle[]): GeoEvent[] {
  const categoryToType: Record<string, string> = {
    security: 'military', politics: 'protest', economy: 'general',
    energy: 'general', society: 'protest', general: 'general',
  };
  const categoryToSeverity: Record<string, GeoEvent['severity']> = {
    security: 'high', politics: 'medium', economy: 'low',
    energy: 'medium', society: 'low', general: 'info',
  };
  return articles.map((a, i) => {
    const loc = CYPRUS_LOCATIONS[i % CYPRUS_LOCATIONS.length];
    // Add slight jitter so overlapping markers spread
    const jitter = () => (Math.random() - 0.5) * 0.05;
    return {
      id: `cy-${i}-${a.title.substring(0, 10).replace(/\s/g, '')}`,
      title: a.title,
      lat: loc.lat + jitter(),
      lon: loc.lon + jitter(),
      country: 'Cyprus',
      severity: categoryToSeverity[a.category] || 'info',
      category: a.category,
      source: a.source,
      time: new Date().toISOString(),
      type: categoryToType[a.category] || 'general',
    };
  });
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  security: { icon: '🔴', color: 'border-l-destructive bg-destructive/5' },
  politics: { icon: '🏛', color: 'border-l-primary bg-primary/5' },
  economy: { icon: '💰', color: 'border-l-alert-medium bg-alert-medium/5' },
  energy: { icon: '⚡', color: 'border-l-alert-high bg-alert-high/5' },
  society: { icon: '👥', color: 'border-l-signal-aircraft bg-signal-aircraft/5' },
  general: { icon: '📰', color: 'border-l-muted-foreground/30 bg-card-bg/30' },
};

type CategoryFilter = 'all' | 'security' | 'politics' | 'economy' | 'energy' | 'society' | 'general';

const CyprusIntelPanel = memo(() => {
  const [data, setData] = useState<CyprusNewsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchCyprusNews('full');
      setData(result);
      // Push Cyprus articles as geo markers onto the map
      if (result?.articles?.length) {
        const cyprusGeo = cyprusArticlesToGeoEvents(result.articles);
        const state = useWorldViewStore.getState();
        // Merge: remove old Cyprus events, add new ones
        const existing = state.geoEvents.filter(e => !e.id.startsWith('cy-'));
        state.setGeoEvents([...existing, ...cyprusGeo]);
      }
    } catch {
      // handled in service
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const iv = setInterval(async () => {
      const result = await fetchCyprusNews('quick');
      if (result) {
        setData(result);
        if (result.articles?.length) {
          const cyprusGeo = cyprusArticlesToGeoEvents(result.articles);
          const state = useWorldViewStore.getState();
          const existing = state.geoEvents.filter(e => !e.id.startsWith('cy-'));
          state.setGeoEvents([...existing, ...cyprusGeo]);
        }
      }
    }, 120_000);
    return () => clearInterval(iv);
  }, []);

  const filtered = data?.articles?.filter(
    (a) => filter === 'all' || a.category === filter
  ) || [];

  const categoryCounts = data?.articles?.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🇨🇾</span>
          <span className="text-[10px] font-display tracking-[0.2em] text-foreground">
            CYPRUS INTELLIGENCE MONITOR
          </span>
          {data && (
            <span className="text-[8px] font-data text-muted-foreground">
              {data.uniqueCount} articles from {data.totalFound} sources
            </span>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-2 py-0.5 text-[8px] font-display tracking-[0.15em] rounded border border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-40"
        >
          {loading ? '⏳ SCANNING...' : '🔄 SCAN CYPRUS'}
        </button>
      </div>

      {/* Category filters */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`text-[8px] font-display tracking-wider px-2 py-0.5 rounded transition-colors ${
            filter === 'all'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-muted-foreground hover:text-foreground border border-transparent'
          }`}
        >
          ALL ({data?.articles?.length || 0})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilter(key as CategoryFilter)}
            className={`text-[8px] font-display tracking-wider px-2 py-0.5 rounded transition-colors ${
              filter === key
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            {cfg.icon} {key.toUpperCase()} ({categoryCounts[key] || 0})
          </button>
        ))}
      </div>

      {/* Status bar */}
      {data && (
        <div className="flex items-center gap-3 text-[8px] font-data text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-aircraft animate-pulse" />
            LIVE MONITORING
          </span>
          <span>⏱ {new Date(data.scrapedAt).toLocaleTimeString('en-US', { hour12: false })}</span>
          {data.sources && (
            <>
              <span className="text-primary">🧠 AI: {data.sources.perplexity}</span>
              <span>🔍 Web: {data.sources.firecrawl}</span>
              <span>𝕏 Posts: {data.sources.xPosts}</span>
              <span>📄 Scraped: {data.sources.scraped}</span>
            </>
          )}
          {data.errors && data.errors.length > 0 && (
            <span className="text-alert-medium">⚠ {data.errors.length} source errors</span>
          )}
        </div>
      )}

      {/* Articles */}
      {loading && !data ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded bg-card-bg/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 max-h-[400px] overflow-y-auto scrollbar-thin">
          {filtered.map((article, i) => {
            const cfg = CATEGORY_CONFIG[article.category] || CATEGORY_CONFIG.general;
            return (
              <div
                key={i}
                onClick={() => article.url && window.open(article.url, '_blank')}
                className={`border-l-2 ${cfg.color} rounded-r px-2.5 py-2 hover:brightness-110 transition-all cursor-pointer`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[8px]">{cfg.icon}</span>
                  <span className="text-[7px] font-data tracking-wider text-muted-foreground uppercase">
                    {article.category}
                  </span>
                  {article.type === 'x-post' && (
                    <span className="text-[7px] font-data text-primary/60">𝕏</span>
                  )}
                </div>
                <p className="text-[10px] text-foreground leading-tight line-clamp-2 font-display tracking-wide">
                  {article.title}
                </p>
                {article.description && (
                  <p className="text-[8px] text-muted-foreground leading-tight line-clamp-1 mt-0.5">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[7px] font-data text-muted-foreground/70">{article.source}</span>
                  <span className="text-[7px] text-primary ml-auto">↗</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 text-center text-[9px] font-data text-muted-foreground">
          No Cyprus articles found. Click SCAN CYPRUS to fetch latest intelligence.
        </div>
      )}

      {/* AI feed indicator */}
      {data?.headlines && data.headlines.length > 0 && (
        <div className="border-t border-border pt-2">
          <span className="text-[8px] font-display tracking-[0.2em] text-muted-foreground">
            🧠 {data.headlines.length} CYPRUS HEADLINES FED TO AI ANALYSIS ENGINE
          </span>
        </div>
      )}
    </div>
  );
});

CyprusIntelPanel.displayName = 'CyprusIntelPanel';
export default CyprusIntelPanel;
