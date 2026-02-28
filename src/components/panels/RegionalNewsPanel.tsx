import { memo, useState, useEffect } from 'react';
import { REGIONAL_FEEDS, RegionalFeedConfig } from '@/data/regionalFeeds';

interface RegionalNewsItem {
  title: string;
  source: string;
  link: string;
  pubDate: string;
}

const RegionalNewsPanel = memo(() => {
  const [activeRegion, setActiveRegion] = useState(REGIONAL_FEEDS[0].region);
  const [newsItems, setNewsItems] = useState<RegionalNewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const region = REGIONAL_FEEDS.find(r => r.region === activeRegion);
    if (!region) return;

    setLoading(true);
    setNewsItems([]);

    const fetchRegion = async () => {
      const allItems: RegionalNewsItem[] = [];
      await Promise.allSettled(
        region.feeds.map(async (feed) => {
          try {
            const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
            const data = await res.json();
            if (data.status === 'ok' && data.items) {
              data.items.slice(0, 5).forEach((item: any) => {
                allItems.push({
                  title: item.title,
                  source: feed.source,
                  link: item.link,
                  pubDate: item.pubDate,
                });
              });
            }
          } catch { /* skip failed feed */ }
        })
      );
      allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      setNewsItems(allItems);
      setLoading(false);
    };

    fetchRegion();
  }, [activeRegion]);

  const getTimeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">🌐 REGIONAL NEWS FEEDS</h2>
        <span className="text-[9px] font-data text-text-secondary">● {newsItems.length} ARTICLES</span>
      </div>

      {/* Region tabs */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {REGIONAL_FEEDS.map(r => (
          <button key={r.region} onClick={() => setActiveRegion(r.region)}
            className={`text-[8px] font-display tracking-wider px-2 py-1 rounded transition-colors ${
              activeRegion === r.region
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-text-muted-custom hover:text-muted-foreground border border-transparent'
            }`}>
            {r.emoji} {r.region}
          </button>
        ))}
      </div>

      {/* News grid */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-4 h-4 border border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-data text-muted-foreground ml-2">LOADING {activeRegion}...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
          {newsItems.map((item, i) => (
            <div key={i}
              onClick={() => item.link && window.open(item.link, '_blank')}
              className="bg-card-bg/60 border-l-2 border-l-primary/30 rounded-r px-2 py-1.5 hover:bg-card-hover transition-colors cursor-pointer">
              <p className="text-[10px] text-foreground leading-tight line-clamp-2">{item.title}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[8px] font-data text-text-secondary">{item.source}</span>
                <span className="text-[8px] font-data text-text-muted-custom">{getTimeAgo(item.pubDate)}</span>
                <span className="text-[7px] text-primary ml-auto">↗</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
RegionalNewsPanel.displayName = 'RegionalNewsPanel';

export default RegionalNewsPanel;
