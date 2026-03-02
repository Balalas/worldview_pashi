import { memo, useState } from 'react';
import { useWorldViewStore, TwitterOsintPost } from '@/store/worldview';

const SEVERITY_KEYWORDS: Record<string, RegExp> = {
  critical: /\b(missile|nuclear|explosion|strike|killed|casualties|airstrike|bomb|wmd|chemical|biological)\b/i,
  high: /\b(attack|troops|invasion|offensive|shelling|drone|intercepted|ceasefire|breach|escalation)\b/i,
  medium: /\b(military|forces|border|tension|sanction|warning|deployed|exercise|intelligence)\b/i,
};

function classifyTweet(text: string): 'critical' | 'high' | 'medium' | 'low' {
  if (SEVERITY_KEYWORDS.critical.test(text)) return 'critical';
  if (SEVERITY_KEYWORDS.high.test(text)) return 'high';
  if (SEVERITY_KEYWORDS.medium.test(text)) return 'medium';
  return 'low';
}

const severityColors: Record<string, string> = {
  critical: 'border-alert-critical/40 bg-alert-critical/5',
  high: 'border-alert-high/40 bg-alert-high/5',
  medium: 'border-alert-medium/30 bg-alert-medium/5',
  low: 'border-primary/20 bg-primary/5',
};

const severityDot: Record<string, string> = {
  critical: 'bg-alert-critical',
  high: 'bg-alert-high',
  medium: 'bg-alert-medium',
  low: 'bg-primary/60',
};

const XOsintCard = memo(() => {
  const { twitterPosts, twitterGeoMarkers, twitterLastFetch, setMapCenter } = useWorldViewStore();
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState<'all' | 'geo' | 'critical'>('all');

  if (twitterPosts.length === 0) return null;

  const sorted = [...twitterPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered = sorted.filter(p => {
    if (filter === 'geo') return p.geo !== null;
    if (filter === 'critical') return classifyTweet(p.text) === 'critical' || classifyTweet(p.text) === 'high';
    return true;
  });

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'NOW';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div
      className="absolute top-12 right-2 z-40 pointer-events-auto animate-fade-in"
      style={{ maxHeight: 'calc(100vh - 60px)' }}
    >
      <div
        className="w-[260px] rounded-lg overflow-hidden flex flex-col"
        style={{
          background: 'hsla(210, 60%, 4%, 0.92)',
          backdropFilter: 'blur(20px) saturate(1.3)',
          border: '1px solid hsla(30, 100%, 50%, 0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 1px hsla(30, 100%, 50%, 0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-sm">𝕏</span>
            <span className="text-[9px] font-display tracking-[0.15em] text-foreground">OSINT FEED</span>
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-1 rounded-full bg-alert-critical animate-pulse-dot" />
              <span className="text-[7px] font-data text-alert-critical">LIVE</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[7px] font-data text-muted-foreground">
              {twitterLastFetch ? timeAgo(twitterLastFetch) : '—'}
            </span>
            <span className="text-[7px] font-data text-primary/50">{twitterPosts.length}</span>
            <button onClick={() => setExpanded(!expanded)} className="text-[9px] text-muted-foreground hover:text-foreground">
              {expanded ? '▾' : '▸'}
            </button>
          </div>
        </div>

        {expanded && (
          <>
            {/* Filter bar */}
            <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border/30">
              {(['all', 'geo', 'critical'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 text-[8px] font-data tracking-wider rounded transition-colors ${
                    filter === f
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-muted-foreground/60 hover:text-foreground border border-transparent'
                  }`}
                >
                  {f === 'all' ? `ALL (${sorted.length})` : f === 'geo' ? `📍 GEO (${sorted.filter(p => p.geo).length})` : `🔴 HIGH`}
                </button>
              ))}
            </div>

            {/* Stats bar */}
            <div className="flex items-center justify-between px-3 py-1 border-b border-border/20">
              <div className="flex items-center gap-2">
                <span className="text-[7px] font-data text-muted-foreground/50">GEOLOCATED</span>
                <span className="text-[8px] font-data text-primary">{twitterGeoMarkers.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[7px] font-data text-muted-foreground/50">ACCOUNTS</span>
                <span className="text-[8px] font-data text-primary">{new Set(twitterPosts.map(p => p.account)).size}</span>
              </div>
            </div>

            {/* Posts */}
            <div className="overflow-y-auto max-h-[400px] divide-y divide-border/20">
              {filtered.map(post => {
                const severity = classifyTweet(post.text);
                return (
                  <div
                    key={post.id}
                    className={`px-3 py-2 border-l-2 ${severityColors[severity]} hover:bg-primary/5 transition-colors cursor-pointer`}
                    onClick={() => {
                      if (post.geo) {
                        setMapCenter({ lat: post.geo.lat, lon: post.geo.lon, zoom: 8 });
                      }
                      window.open(post.url, '_blank', 'noopener');
                    }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${severityDot[severity]} flex-shrink-0`} />
                        <span className="text-[9px] font-data text-primary/80">@{post.account}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {post.geo && (
                          <span className="text-[7px] font-data text-primary/60 bg-primary/10 px-1 rounded">
                            📍 {post.geo.place.substring(0, 12)}
                          </span>
                        )}
                        <span className="text-[7px] font-data text-muted-foreground/50">{timeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-[9px] font-data text-foreground/80 leading-tight line-clamp-3">{post.text}</p>
                    {post.metrics && (
                      <div className="flex items-center gap-2 mt-1">
                        {post.metrics.retweet_count !== undefined && post.metrics.retweet_count > 0 && (
                          <span className="text-[7px] font-data text-muted-foreground/40">🔁 {post.metrics.retweet_count}</span>
                        )}
                        {post.metrics.like_count !== undefined && post.metrics.like_count > 0 && (
                          <span className="text-[7px] font-data text-muted-foreground/40">♥ {post.metrics.like_count}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 border-t border-border/30 flex items-center justify-between">
              <span className="text-[7px] font-data text-muted-foreground/40">AUTO-REFRESH 60s</span>
              <span className="text-[7px] font-data text-muted-foreground/30">TWITTER API v2</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
XOsintCard.displayName = 'XOsintCard';

export default XOsintCard;
