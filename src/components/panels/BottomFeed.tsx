import { memo } from 'react';
import { MOCK_NEWS, MARKET_DATA } from '@/store/worldview';

const BottomFeed = memo(() => {
  return (
    <div className="glass-panel border-t border-border flex flex-col overflow-hidden z-30">
      {/* Market Ticker */}
      <div className="h-6 border-b border-border flex items-center overflow-hidden bg-card-bg/50">
        <div className="flex items-center animate-ticker-scroll whitespace-nowrap">
          {[...MARKET_DATA, ...MARKET_DATA].map((m, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 mx-4 text-[10px] font-data">
              <span className="text-muted-foreground">{m.symbol}</span>
              <span className="text-foreground">{m.value}</span>
              <span className={m.up ? 'text-signal-aircraft' : 'text-alert-critical'}>
                {m.up ? '▲' : '▼'}{m.change}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* News Feed */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">INTELLIGENCE FEED</h2>
          <span className="text-[9px] font-data text-text-secondary">● {MOCK_NEWS.length} ITEMS</span>
          <div className="flex gap-1 ml-auto">
            {['ALL', 'CRITICAL', 'MILITARY'].map((f) => (
              <button
                key={f}
                className={`text-[8px] font-display tracking-wider px-1.5 py-0.5 rounded ${
                  f === 'ALL' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted-custom hover:text-muted-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
          {MOCK_NEWS.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
});

const NewsCard = ({ item }: { item: typeof MOCK_NEWS[0] }) => {
  const severityColor = {
    critical: 'border-l-alert-critical',
    high: 'border-l-alert-high',
    medium: 'border-l-alert-medium',
    low: 'border-l-alert-low',
    info: 'border-l-alert-info',
  }[item.severity];

  const severityDot = {
    critical: 'bg-alert-critical',
    high: 'bg-alert-high',
    medium: 'bg-alert-medium',
    low: 'bg-alert-low',
    info: 'bg-alert-info',
  }[item.severity];

  const timeAgo = getTimeAgo(item.time);

  return (
    <div className={`bg-card-bg/60 border-l-2 ${severityColor} rounded-r px-2 py-1.5 hover:bg-card-hover transition-colors cursor-pointer`}>
      <div className="flex items-start gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${severityDot} mt-1 flex-shrink-0 ${item.severity === 'critical' ? 'animate-pulse-dot' : ''}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-foreground leading-tight line-clamp-2">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[8px] font-data text-text-secondary">{item.source}</span>
            <span className="text-[8px] text-text-muted-custom">·</span>
            <span className="text-[8px] font-data text-text-muted-custom">{timeAgo}</span>
            <span className="text-[8px] font-data text-text-muted-custom">T{item.tier}</span>
            {item.isStateMedia && (
              <span className="text-[7px] px-1 py-0 rounded bg-alert-high/20 text-alert-high">STATE</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getTimeAgo = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
};

BottomFeed.displayName = 'BottomFeed';
export default BottomFeed;
