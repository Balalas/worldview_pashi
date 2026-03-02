import { memo, useState } from 'react';
import { useWorldViewStore } from '@/store/worldview';

const HoloBrowser = memo(() => {
  const { inAppUrl, closeInAppBrowser } = useWorldViewStore();
  const [loading, setLoading] = useState(true);

  if (!inAppUrl) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center" onClick={closeInAppBrowser}>
      <div className="absolute inset-0 bg-void/80 backdrop-blur-md" />

      <div
        className="relative w-[92vw] h-[88vh] max-w-[1400px] rounded-lg border border-primary/30 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--background) / 0.97) 0%, hsl(var(--card-bg) / 0.95) 100%)',
          boxShadow: '0 0 40px hsla(150, 100%, 50%, 0.08), 0 0 80px hsla(150, 100%, 50%, 0.04), inset 0 1px 0 hsla(150, 100%, 50%, 0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/40 rounded-tl-lg pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/40 rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/40 rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/40 rounded-br-lg pointer-events-none" />

        {/* Scan line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div
            className="absolute left-0 right-0 h-px bg-primary/15"
            style={{ animation: 'holo-scan 4s linear infinite' }}
          />
        </div>

        {/* Header bar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border/40 bg-card-bg/50 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
            <span className="text-[9px] font-data tracking-[0.2em] text-primary">SECURE BROWSER</span>
          </div>

          {/* URL bar */}
          <div className="flex-1 flex items-center gap-2 px-3 py-1 rounded border border-border/30 bg-background/50 min-w-0">
            <span className="text-[8px] font-data text-primary/50">🔒</span>
            <span className="text-[9px] font-data text-muted-foreground truncate">{inAppUrl}</span>
          </div>

          <button
            onClick={() => window.open(inAppUrl, '_blank', 'noopener')}
            className="text-[8px] font-display tracking-wider text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border/30 hover:border-primary/30 transition-colors"
          >
            ↗ EXTERNAL
          </button>

          <button
            onClick={closeInAppBrowser}
            className="w-7 h-7 flex items-center justify-center rounded border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute top-[41px] left-0 right-0 h-0.5 z-20 overflow-hidden">
            <div className="h-full bg-primary/60" style={{ animation: 'loading-bar 1.5s ease-in-out infinite', width: '30%' }} />
          </div>
        )}

        {/* iframe */}
        <iframe
          src={inAppUrl}
          className="w-full h-[calc(100%-41px)]"
          onLoad={() => setLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          referrerPolicy="no-referrer"
          title="In-app browser"
        />

        <style>{`
          @keyframes holo-scan {
            0% { top: -1px; }
            100% { top: 100%; }
          }
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(150%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </div>
    </div>
  );
});

HoloBrowser.displayName = 'HoloBrowser';
export default HoloBrowser;
