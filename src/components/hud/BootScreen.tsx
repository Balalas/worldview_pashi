import { memo, useEffect, useState, useRef } from 'react';

interface BootScreenProps {
  onComplete: () => void;
}

const BOOT_MESSAGES = [
  { text: '[SYS] Initializing WARMONITOR intelligence platform...', delay: 200 },
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
  { text: '[OK]  WARMONITOR ready. Welcome, operator.', delay: 3800 },
];

const CREDENTIALS = [
  { label: 'OPERATOR', value: 'SIERRA-7X', mask: false },
  { label: 'CLEARANCE', value: 'TS//SCI//NOFORN', mask: false },
  { label: 'AUTH TOKEN', value: 'a9f3c1d8-7e2b-4f0a-b6c5-3d8e1f2a4b7c', mask: true },
  { label: 'SESSION', value: 'WV-2026-0302-1947Z', mask: false },
];

const BootScreen = memo(({ onComplete }: BootScreenProps) => {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [credPhase, setCredPhase] = useState(0); // 0=hidden, 1-4=typing each cred, 5=done
  const [typedChars, setTypedChars] = useState(0);
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

    // Start credential typing after boot messages
    const credStart = setTimeout(() => setCredPhase(1), 4000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(credStart);
    };
  }, [onComplete]);

  // Credential typing effect
  useEffect(() => {
    if (credPhase < 1 || credPhase > CREDENTIALS.length) return;
    const cred = CREDENTIALS[credPhase - 1];
    const target = cred.value.length;
    if (typedChars < target) {
      const speed = cred.mask ? 15 : 30 + Math.random() * 40;
      const t = setTimeout(() => setTypedChars(prev => prev + 1), speed);
      return () => clearTimeout(t);
    } else {
      // Move to next credential
      const t = setTimeout(() => {
        setCredPhase(prev => prev + 1);
        setTypedChars(0);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [credPhase, typedChars]);

  // When all credentials done, fade out
  useEffect(() => {
    if (credPhase > CREDENTIALS.length) {
      const t1 = setTimeout(() => setFadeOut(true), 600);
      const t2 = setTimeout(onComplete, 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [credPhase, onComplete]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines, credPhase, typedChars]);

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
      <h1 className="text-2xl font-display tracking-[0.5em] text-primary font-bold mb-1 glow-green">WARMONITOR</h1>
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
        {visibleLines < BOOT_MESSAGES.length && credPhase === 0 && (
          <span className="text-primary animate-pulse-dot">█</span>
        )}
        {/* Credential typing */}
        {credPhase >= 1 && (
          <div className="mt-2 border-t border-border/30 pt-2 space-y-1">
            <div className="text-accent text-[8px] tracking-widest mb-1">[AUTH] CREDENTIAL VERIFICATION</div>
            {CREDENTIALS.map((cred, i) => {
              const idx = i + 1;
              if (credPhase < idx) return null;
              const isCurrent = credPhase === idx;
              const displayVal = isCurrent
                ? (cred.mask
                    ? '•'.repeat(typedChars)
                    : cred.value.slice(0, typedChars))
                : (cred.mask
                    ? '•'.repeat(cred.value.length)
                    : cred.value);
              return (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-muted-foreground w-20 text-right">{cred.label}:</span>
                  <span className={`${credPhase > idx ? 'text-primary' : 'text-foreground'}`}>
                    {displayVal}
                    {isCurrent && <span className="text-primary animate-pulse-dot">█</span>}
                  </span>
                  {credPhase > idx && <span className="text-primary text-[7px]">✓</span>}
                </div>
              );
            })}
            {credPhase > CREDENTIALS.length && (
              <div className="text-primary mt-1 animate-fade-in">[OK] Authentication successful. Access granted.</div>
            )}
          </div>
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
