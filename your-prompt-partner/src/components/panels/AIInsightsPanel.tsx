import { memo, useState, useEffect, useCallback } from 'react';
import { useWorldViewStore } from '@/store/worldview';
import { fetchAIWorldBrief, AIWorldBrief } from '@/services/aiBriefService';

const AIInsightsPanel = memo(() => {
  const { news, earthquakes, fires } = useWorldViewStore();
  const [brief, setBrief] = useState<AIWorldBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBrief = useCallback(async () => {
    if (news.length === 0) return;
    setLoading(true);
    setError(null);
    const headlines = news.slice(0, 30).map(n => `[${n.severity.toUpperCase()}] ${n.source}: ${n.title}`);
    const result = await fetchAIWorldBrief(headlines, earthquakes.length, fires.length, 'Iran, Gaza, Taiwan Strait');
    if (result) {
      setBrief(result);
      setLastFetched(new Date());
    } else {
      setError('Failed to generate brief');
    }
    setLoading(false);
  }, [news, earthquakes.length, fires.length]);

  // Auto-fetch on mount if we have news
  useEffect(() => {
    if (news.length > 0 && !brief && !loading) {
      fetchBrief();
    }
  }, [news.length > 0]);

  const sentimentLabel = brief?.sentiment?.label;
  const sentimentColor = sentimentLabel === 'CRITICAL' ? 'text-alert-critical' : 
    sentimentLabel === 'TENSE' ? 'text-alert-high' : 
    sentimentLabel === 'CAUTIOUS' ? 'text-alert-medium' : 'text-signal-aircraft';

  const sentimentBg = sentimentLabel === 'CRITICAL' ? 'bg-alert-critical' : 
    sentimentLabel === 'TENSE' ? 'bg-alert-high' : 
    sentimentLabel === 'CAUTIOUS' ? 'bg-alert-medium' : 'bg-signal-aircraft';

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🧠 AI WORLD BRIEF — INTELLIGENCE SUMMARY</h2>
        <span className="text-[9px] font-data text-primary">● AI-POWERED</span>
        {lastFetched && (
          <span className="text-[8px] font-data text-text-muted-custom ml-auto">
            Updated {lastFetched.toLocaleTimeString()}
          </span>
        )}
        <button
          onClick={fetchBrief}
          disabled={loading}
          className="text-[8px] font-display tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-50 transition-colors"
        >
          {loading ? '⏳ ANALYZING...' : '🔄 REFRESH'}
        </button>
      </div>

      {loading && !brief && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-[10px] font-data text-muted-foreground">GENERATING AI BRIEF...</span>
          </div>
        </div>
      )}

      {error && !brief && (
        <div className="text-center py-6">
          <span className="text-[10px] font-data text-alert-medium">{error}</span>
          <button onClick={fetchBrief} className="block mx-auto mt-2 text-[9px] font-data text-primary hover:underline">Retry</button>
        </div>
      )}

      {brief && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main brief */}
          <div className="lg:col-span-2">
            <div className="bg-card-bg/60 rounded border border-border p-3">
              <h3 className="text-[9px] font-display tracking-wider text-muted-foreground mb-2">EXECUTIVE SUMMARY</h3>
              <p className="text-[10px] text-foreground leading-relaxed whitespace-pre-line">{brief.brief}</p>
            </div>

            {/* Velocity tracking */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="bg-alert-critical/5 rounded border border-alert-critical/20 p-2">
                <h4 className="text-[8px] font-display tracking-wider text-alert-critical mb-1.5">↗ ESCALATING</h4>
                {(brief.velocity?.escalating ?? []).map((t, i) => (
                  <div key={i} className="text-[9px] font-data text-foreground mb-0.5">• {t}</div>
                ))}
              </div>
              <div className="bg-signal-aircraft/5 rounded border border-signal-aircraft/20 p-2">
                <h4 className="text-[8px] font-display tracking-wider text-signal-aircraft mb-1.5">↘ DE-ESCALATING</h4>
                {(brief.velocity?.deescalating ?? []).map((t, i) => (
                  <div key={i} className="text-[9px] font-data text-foreground mb-0.5">• {t}</div>
                ))}
              </div>
              <div className="bg-primary/5 rounded border border-primary/20 p-2">
                <h4 className="text-[8px] font-display tracking-wider text-primary mb-1.5">⬆ EMERGING</h4>
                {(brief.velocity?.emerging ?? []).map((t, i) => (
                  <div key={i} className="text-[9px] font-data text-foreground mb-0.5">• {t}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar: sentiment + focal points */}
          <div className="space-y-2">
            {/* Sentiment gauge */}
            <div className="bg-card-bg/60 rounded border border-border p-3 text-center">
              <h4 className="text-[8px] font-display tracking-wider text-muted-foreground mb-2">GLOBAL SENTIMENT</h4>
              <div className={`text-[32px] font-data font-bold ${sentimentColor} leading-none`}>
                {(brief.sentiment?.score ?? 0) > 0 ? '+' : ''}{brief.sentiment?.score ?? 0}
              </div>
              <div className={`text-[10px] font-display tracking-[0.15em] ${sentimentColor} mt-1`}>
                {brief.sentiment?.label ?? 'UNKNOWN'}
              </div>
              <div className="w-full h-2 bg-card-hover rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full ${sentimentBg} transition-all`}
                  style={{ width: `${Math.min(Math.abs(brief.sentiment?.score ?? 0), 100)}%` }} />
              </div>
              <div className="mt-2 space-y-0.5">
                {(brief.sentiment?.drivers ?? []).map((d, i) => (
                  <div key={i} className="text-[8px] font-data text-text-secondary">• {d}</div>
                ))}
              </div>
            </div>

            {/* Focal points */}
            <div className="bg-card-bg/60 rounded border border-border p-3">
              <h4 className="text-[8px] font-display tracking-wider text-muted-foreground mb-2">FOCAL POINTS</h4>
              <div className="space-y-1.5">
                {(brief.focalPoints ?? []).map((fp, i) => {
                  const threatColor = fp.threat === 'HIGH' ? 'border-l-alert-critical text-alert-critical' : fp.threat === 'MEDIUM' ? 'border-l-alert-medium text-alert-medium' : 'border-l-primary/30 text-signal-aircraft';
                  return (
                    <div key={i} className={`border-l-2 ${threatColor.split(' ')[0]} pl-2 py-1`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-display tracking-wide text-foreground">{fp.region}</span>
                        <span className={`text-[7px] font-data font-bold ${threatColor.split(' ')[1]}`}>{fp.threat}</span>
                      </div>
                      <p className="text-[8px] font-data text-text-secondary mt-0.5">{fp.summary}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
AIInsightsPanel.displayName = 'AIInsightsPanel';

export default AIInsightsPanel;
