import { memo, useState } from 'react';
import { GLOBAL_WEBCAMS, WebcamFeed } from '@/data/regionalFeeds';

// Extract YouTube video ID from embed URL
function getYouTubeId(url: string): string | null {
  const match = url.match(/youtube\.com\/embed\/([^?]+)/);
  return match ? match[1] : null;
}

const WebcamGrid = memo(() => {
  const [filter, setFilter] = useState<'all' | 'strategic'>('all');
  const [activeWebcam, setActiveWebcam] = useState<WebcamFeed | null>(null);

  const filtered = filter === 'strategic' 
    ? GLOBAL_WEBCAMS.filter(w => w.strategic) 
    : GLOBAL_WEBCAMS;

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground">📹 GLOBAL WEBCAM NETWORK</h2>
        <span className="text-[9px] font-data text-text-secondary">● {filtered.length} FEEDS</span>
        <div className="flex gap-1 ml-auto">
          {(['all', 'strategic'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[8px] font-display tracking-wider px-1.5 py-0.5 rounded ${filter === f ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted-custom hover:text-muted-foreground'}`}>
              {f === 'all' ? 'ALL' : '⚠ STRATEGIC'}
            </button>
          ))}
        </div>
      </div>

      {/* Active webcam view */}
      {activeWebcam && (
        <div className="mb-3 relative">
          <div className="w-full h-[300px] rounded-lg overflow-hidden border border-primary/20">
            <iframe src={activeWebcam.url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={activeWebcam.title} />
          </div>
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse-dot" />
            <span className="text-[9px] font-data text-alert-critical">LIVE</span>
            <span className="text-[9px] font-display tracking-wider text-foreground">{activeWebcam.title} — {activeWebcam.location}</span>
          </div>
          <button onClick={() => setActiveWebcam(null)}
            className="absolute top-2 right-2 text-[10px] text-muted-foreground hover:text-foreground bg-background/80 rounded px-2 py-0.5">
            ✕ CLOSE
          </button>
        </div>
      )}

      {/* Grid of webcam cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {filtered.map(cam => {
          const ytId = getYouTubeId(cam.url);
          const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;

          return (
            <button key={cam.id} onClick={() => setActiveWebcam(cam)}
              className={`text-left bg-card-bg/60 rounded border overflow-hidden transition-colors cursor-pointer hover:bg-card-hover ${
                cam.strategic ? 'border-alert-critical/30 ring-1 ring-alert-critical/10' : 'border-border'
              } ${activeWebcam?.id === cam.id ? 'bg-primary/10 border-primary/30' : ''}`}
            >
              {/* Thumbnail */}
              {thumbUrl && (
                <div className="relative w-full aspect-video bg-muted/20 overflow-hidden">
                  <img
                    src={thumbUrl}
                    alt={cam.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute top-1 left-1 flex items-center gap-1 bg-background/70 backdrop-blur-sm rounded px-1 py-0.5">
                    <span className="w-1 h-1 rounded-full bg-alert-critical animate-pulse-dot" />
                    <span className="text-[7px] font-data text-alert-critical">LIVE</span>
                  </div>
                  {cam.strategic && (
                    <div className="absolute top-1 right-1 text-[6px] font-data text-alert-critical bg-alert-critical/15 backdrop-blur-sm px-1 rounded">
                      STRAT
                    </div>
                  )}
                </div>
              )}

              <div className="p-1.5">
                {!thumbUrl && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse-dot flex-shrink-0" />
                    {cam.strategic && <span className="text-[7px] font-data text-alert-critical bg-alert-critical/10 px-1 rounded">STRAT</span>}
                  </div>
                )}
                <div className="text-[10px] font-display tracking-wide text-foreground truncate">{cam.title}</div>
                <div className="text-[8px] font-data text-text-secondary mt-0.5">{cam.location}</div>
                <div className="text-[7px] font-data text-text-muted-custom">{cam.region}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
WebcamGrid.displayName = 'WebcamGrid';

export default WebcamGrid;
