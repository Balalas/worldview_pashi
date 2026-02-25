import { memo, useEffect, useState } from 'react';
import { useWorldViewStore, MapMode, DashboardMode, DetectionMode } from '@/store/worldview';

const TopBar = memo(() => {
  const { aircraft, satellites, earthquakes, vessels, toggleLeftPanel, mapMode, setMapMode, detectionMode, toggleDetectionMode, visualStyle } = useWorldViewStore();
  const militaryCount = aircraft.filter(a => a.isMilitary).length;
  const [utc, setUtc] = useState('');

  useEffect(() => {
    const tick = () => setUtc(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  const styleLabel = visualStyle !== 'normal' ? visualStyle.toUpperCase() : null;

  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-3 h-9 pointer-events-auto"
      style={{
        background: 'linear-gradient(180deg, hsla(213, 80%, 2%, 0.9) 0%, hsla(213, 80%, 2%, 0.6) 70%, transparent 100%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <button onClick={toggleLeftPanel} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        </button>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
          <h1 className="text-xs font-bold tracking-[0.25em] text-foreground font-display glow-green">WORLDVIEW</h1>
        </div>

        {/* Classification tag */}
        <div className="hidden md:flex px-2 py-0.5 border border-destructive/20 bg-destructive/5 rounded-sm">
          <span className="text-[7px] font-data tracking-[0.3em] text-destructive/70">UNCLASSIFIED // FOUO</span>
        </div>
      </div>

      {/* Center — counters + map mode */}
      <div className="hidden lg:flex items-center gap-2 font-data text-[9px]">
        <CounterBadge icon="✈" count={aircraft.length} color="text-signal-aircraft" />
        <CounterBadge icon="⚔" count={militaryCount} color="text-signal-military" />
        <CounterBadge icon="🛰" count={satellites.length} color="text-signal-satellite" />
        <CounterBadge icon="🚢" count={vessels.length} color="text-signal-vessel" />
        <CounterBadge icon="🌍" count={earthquakes.length} color="text-signal-earthquake" />

        <span className="text-primary/20 mx-1">│</span>

        {/* Map mode toggle */}
        <div className="flex items-center border border-primary/15 rounded overflow-hidden bg-background/30">
          <MapToggleBtn active={mapMode === '2d'} label="2D" onClick={() => setMapMode('2d')} />
          <MapToggleBtn active={mapMode === 'google3d'} label="G3D" onClick={() => setMapMode('google3d')} />
        </div>

        <span className="text-primary/20 mx-1">│</span>

        {/* Detection mode toggle */}
        <button onClick={toggleDetectionMode}
          className={`px-2 py-0.5 text-[8px] font-display tracking-[0.15em] rounded border transition-all ${
            detectionMode === 'sparse'
              ? 'bg-accent/15 text-accent border-accent/25'
              : 'bg-primary/10 text-primary border-primary/20'
          }`}
        >
          {detectionMode === 'sparse' ? '◇ SPARSE' : '◆ FULL'}
        </button>

        {/* Active visual mode indicator */}
        {styleLabel && (
          <>
            <span className="text-primary/20 mx-1">│</span>
            <span className="text-[8px] font-data text-amber-400 tracking-wider">[{styleLabel}]</span>
          </>
        )}
      </div>

      {/* Right — LIVE + UTC */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-destructive/8 border border-destructive/15">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse-dot" />
          <span className="text-[8px] font-data text-destructive tracking-[0.2em] font-semibold">REC</span>
        </div>
        <span className="text-[9px] font-data text-muted-foreground hidden sm:block tracking-wider tabular-nums">{utc} UTC</span>
      </div>
    </header>
  );
});

const MapToggleBtn = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button onClick={onClick} className={`px-2 py-0.5 text-[8px] font-display tracking-[0.15em] transition-all ${active ? 'bg-primary/20 text-primary shadow-[0_0_6px_hsl(150_100%_50%/0.15)]' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}>{label}</button>
);

const CounterBadge = ({ icon, count, color }: { icon: string; count: number; color: string }) => (
  <div className="flex items-center gap-1">
    <span className="text-[9px]">{icon}</span>
    <span className={`${color} font-bold tabular-nums text-[9px]`}>{count.toLocaleString()}</span>
  </div>
);

TopBar.displayName = 'TopBar';
export default TopBar;
