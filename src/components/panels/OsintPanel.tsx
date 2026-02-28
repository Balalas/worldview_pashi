import { memo, useState, useEffect, useCallback } from 'react';
import { fetchOsintData, OsintData, OsintPost } from '@/services/osintService';

const SEVERITY_KEYWORDS = /\b(killed|dead|casualties|strike|missile|bomb|attack|war|invasion|offensive)\b/i;
const MEDIUM_KEYWORDS = /\b(troops|deploy|conflict|escalat|drone|artillery|military|intercept|combat)\b/i;

const OsintPanel = memo(() => {
  const [data, setData] = useState<OsintData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOsintData();
      setData(result);
      if (result?.errors && result.errors.length > 0 && (!result.posts || result.posts.length === 0)) {
        setError('Failed to fetch OSINT data');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getSeverityColor = (text: string) => {
    if (SEVERITY_KEYWORDS.test(text)) return 'border-l-destructive bg-destructive/5';
    if (MEDIUM_KEYWORDS.test(text)) return 'border-l-alert-high bg-alert-high/5';
    return 'border-l-primary/30 bg-card-bg/30';
  };

  const getAccountColor = (account: string) => {
    if (account === 'osintwarfare') return 'text-destructive';
    if (account === 'conflict_radar') return 'text-alert-high';
    if (account === 'sentdefender') return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-[10px] font-display tracking-[0.2em] text-foreground">
            X/TWITTER OSINT FEED
          </span>
          <span className="text-[8px] font-data text-muted-foreground">
            @osintwarfare · @conflict_radar · @sentdefender
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-2 py-0.5 text-[8px] font-display tracking-[0.15em] rounded border border-primary/20 text-primary/70 hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-40"
        >
          {loading ? '⏳ SCRAPING...' : '🔄 REFRESH OSINT'}
        </button>
      </div>

      {/* Status */}
      {data && (
        <div className="flex items-center gap-3 text-[8px] font-data text-muted-foreground">
          <span>📡 {data.posts.length} posts found</span>
          <span>⏱ {new Date(data.scrapedAt).toLocaleTimeString('en-US', { hour12: false })}</span>
          {data.errors && data.errors.length > 0 && (
            <span className="text-alert-medium">⚠ {data.errors.length} source errors (using search fallback)</span>
          )}
        </div>
      )}

      {/* Error state */}
      {error && !data?.posts?.length && (
        <div className="p-3 rounded border border-destructive/20 bg-destructive/5 text-[9px] font-data text-destructive">
          {error} — Firecrawl search may not have found recent posts. Try refreshing.
        </div>
      )}

      {/* Posts feed */}
      {data?.posts && data.posts.length > 0 ? (
        <div className="space-y-1.5 max-h-[350px] overflow-y-auto scrollbar-thin">
          {data.posts.map((post: OsintPost, i: number) => (
            <div
              key={i}
              className={`border-l-2 ${getSeverityColor(post.text)} px-2.5 py-1.5 rounded-r transition-colors hover:brightness-110`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[8px] font-data font-bold tracking-wider ${getAccountColor(post.account)}`}>
                  @{post.account}
                </span>
                <span className="text-[7px] font-data text-muted-foreground/50">
                  via {post.source}
                </span>
                {post.url && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[7px] font-data text-primary/40 hover:text-primary ml-auto"
                  >
                    🔗 OPEN
                  </a>
                )}
              </div>
              <p className="text-[9px] font-display tracking-wider text-foreground leading-relaxed">
                {post.text}
              </p>
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className="p-4 text-center text-[9px] font-data text-muted-foreground">
          No OSINT posts available. Click REFRESH OSINT to fetch latest data.
        </div>
      ) : null}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded bg-card-bg/50 animate-pulse" />
          ))}
        </div>
      )}

      {/* Headlines summary for AI */}
      {data?.headlines && data.headlines.length > 0 && (
        <div className="border-t border-border pt-2 mt-2">
          <span className="text-[8px] font-display tracking-[0.2em] text-muted-foreground">
            🧠 {data.headlines.length} HEADLINES FED TO AI CONFLICT ANALYSIS
          </span>
        </div>
      )}
    </div>
  );
});

OsintPanel.displayName = 'OsintPanel';
export default OsintPanel;
