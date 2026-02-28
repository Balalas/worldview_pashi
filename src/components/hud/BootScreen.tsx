import { memo, useEffect, useState, useRef } from 'react';

interface BootScreenProps {
  onComplete: () => void;
}

const BOOT_MESSAGES = [
  { text: '[SYS] Initializing WORLDVIEW intelligence platform...', delay: 200 },
  { text: '[NET] Establishing secure data channels...', delay: 400 },
  { text: '[SAT] Loading orbital propagation engine (SGP4)...', delay: 600 },
  { text: '[MAP] Initializing Google 3D Globe renderer...', delay: 800 },
  { text: '[INT] Connecting to OpenSky Network (ADS-B)...', delay: 1000 },
  { text: '[INT] Connecting to USGS seismic feeds...', delay: 1100 },
  { text: '[INT] Connecting to NASA EONET...', delay: 1200 },
  { text: '[INT] Connecting to RSS intelligence aggregators...', delay: 1300 },
  { text: '[INT] Initializing CoinGecko market feeds...', delay: 1400 },
  { text: '[SEC] Loading conflict zone database (22 active zones)...', delay: 1600 },
  { text: '[SEC] Initializing Country Instability Index (CII)...', delay: 1800 },
  { text: '[SEC] Loading convergence detection engine...', delay: 2000 },
  { text: '[HUD] Configuring tactical HUD overlays...', delay: 2200 },
  { text: '[VIS] Loading visual filter modes (8 modes)...', delay: 2400 },
  { text: '[CAM] Indexing global CCTV camera feeds...', delay: 2600 },
  { text: '[AIS] Connecting to maritime vessel tracking...', delay: 2800 },
  { text: '[TRN] Connecting to EU rail APIs (FI/DE/CH)...', delay: 2900 },
  { text: '[WX]  Loading global weather stations...', delay: 3000 },
  { text: '[OK]  All systems nominal. 24+ data layers active.', delay: 3400 },
  { text: '[OK]  WORLDVIEW ready. Welcome, operator.', delay: 3800 },
];

const BootScreen = memo(({ onComplete }: BootScreenProps) => {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        return prev + 1.5;
      });
    }, 40);

    // Boot messages
    BOOT_MESSAGES.forEach((msg, i) => {
      setTimeout(() => setVisibleLines(i + 1), msg.delay);
    });

    // Fade out and complete
    const completeTimeout = setTimeout(() => setFadeOut(true), 4200);
    const doneTimeout = setTimeout(onComplete, 4800);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimeout);
      clearTimeout(doneTimeout);
    };
  }, [onComplete]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Animated rings */}
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-2 border border-primary/20 rounded-full animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }} />
        <div className="absolute inset-4 border border-accent/15 rounded-full animate-spin" style={{ animationDuration: '7s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse-dot" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-display tracking-[0.5em] text-primary font-bold mb-1 glow-green">WORLDVIEW</h1>
      <div className="text-[9px] font-data tracking-[0.4em] text-primary/40 mb-6">GLOBAL INTELLIGENCE PLATFORM</div>

      {/* Classification banner */}
      <div className="px-3 py-1 border border-destructive/20 bg-destructive/5 rounded-sm mb-6">
        <span className="text-[7px] font-data tracking-[0.3em] text-destructive/60">UNCLASSIFIED // FOUO</span>
      </div>

      {/* Progress bar */}
      <div className="w-80 mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-[8px] font-data text-muted-foreground tracking-wider">INITIALIZING</span>
          <span className="text-[8px] font-data text-primary">{Math.min(Math.round(progress), 100)}%</span>
        </div>
        <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
          <div className="h-full bg-primary/60 rounded-full transition-all duration-100"
            style={{ width: `${Math.min(progress, 100)}%`, boxShadow: '0 0 8px hsl(150 100% 50% / 0.4)' }}
          />
        </div>
      </div>

      {/* Boot console */}
      <div ref={containerRef}
        className="w-96 h-48 bg-card/50 border border-border/50 rounded-lg p-3 overflow-y-auto font-data text-[9px]">
        {BOOT_MESSAGES.slice(0, visibleLines).map((msg, i) => {
          const isOk = msg.text.startsWith('[OK]');
          const isSec = msg.text.startsWith('[SEC]');
          return (
            <div key={i} className={`leading-relaxed animate-fade-in ${isOk ? 'text-primary' : isSec ? 'text-alert-medium' : 'text-muted-foreground'}`}>
              {msg.text}
            </div>
          );
        })}
        {visibleLines < BOOT_MESSAGES.length && (
          <span className="text-primary animate-pulse-dot">█</span>
        )}
      </div>

      {/* Skip button */}
      <button onClick={onComplete}
        className="mt-4 text-[8px] font-data text-muted-foreground/40 hover:text-muted-foreground tracking-wider transition-colors">
        PRESS TO SKIP
      </button>
    </div>
  );
});

BootScreen.displayName = 'BootScreen';
export default BootScreen;
