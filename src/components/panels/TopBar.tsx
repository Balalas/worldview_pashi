import { memo, useEffect, useState } from 'react';
import { useWorldViewStore, MapMode, DashboardMode, DetectionMode } from '@/store/worldview';

const TopBar = memo(() => {
  const { aircraft, satellites, earthquakes, vessels, toggleLeftPanel, mapMode, setMapMode, detectionMode, toggleDetectionMode, visualStyle, circularViewport, toggleCircularViewport, panopticEnabled, togglePanoptic, hudLayout, immersiveMode, warMode, toggleWarMode, triggerManualRefresh, newsLoading, droneMode, toggleDroneMode } = useWorldViewStore();
  const militaryCount = aircraft.filter(a => a.isMilitary).length;
  const [utc, setUtc] = useState('');
  const [refreshFlash, setRefreshFlash] = useState(false);

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
        background: warMode
          ? 'linear-gradient(180deg, hsla(0, 80%, 5%, 0.95) 0%, hsla(0, 70%, 4%, 0.7) 70%, transparent 100%)'
          : 'linear-gradient(180deg, hsla(213, 80%, 2%, 0.9) 0%, hsla(213, 80%, 2%, 0.6) 70%, transparent 100%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <button onClick={toggleLeftPanel} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        </button>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${warMode ? 'bg-destructive' : 'bg-primary'} animate-pulse-dot`} />
          <h1 className={`text-xs font-bold tracking-[0.25em] font-display ${warMode ? 'text-destructive glow-red' : 'text-foreground glow-green'}`}>WORLDVIEW</h1>
        </div>

        {/* Classification tag */}
        <div className={`hidden md:flex px-2 py-0.5 border rounded-sm ${warMode ? 'border-destructive/40 bg-destructive/10' : 'border-destructive/20 bg-destructive/5'}`}>
          <span className={`text-[9px] font-data tracking-[0.3em] ${warMode ? 'text-destructive' : 'text-destructive/70'}`}>
            {warMode ? 'WAR MODE // MILITARY ONLY' : 'UNCLASSIFIED // FOUO'}
          </span>
        </div>
      </div>

      {/* Center — counters + map mode */}
      <div className="hidden lg:flex items-center gap-2 font-data text-[11px]">
        {!warMode && <CounterBadge icon="✈" count={aircraft.length} color="text-signal-aircraft" />}
        <CounterBadge icon="⚔" count={militaryCount} color="text-signal-military" />
        {!warMode && <CounterBadge icon="🛰" count={satellites.length} color="text-signal-satellite" />}
        {!warMode && <CounterBadge icon="🚢" count={vessels.length} color="text-signal-vessel" />}
        {!warMode && <CounterBadge icon="🌍" count={earthquakes.length} color="text-signal-earthquake" />}

        <span className="text-primary/20 mx-1">│</span>

        {/* WAR MODE BUTTON */}
        <WarModeButton active={warMode} onClick={toggleWarMode} />

        <span className="text-primary/20 mx-1">│</span>

        {/* Map mode toggle */}
        <div className="flex items-center border border-primary/15 rounded overflow-hidden bg-background/30">
          <MapToggleBtn active={mapMode === '2d'} label="2D" onClick={() => setMapMode('2d')} />
          <MapToggleBtn active={mapMode === 'google3d'} label="G3D" onClick={() => setMapMode('google3d')} />
        </div>

        {/* Drone mode toggle — only in 3D */}
        {mapMode === 'google3d' && (
          <>
            <button onClick={toggleDroneMode}
              className={`px-2 py-0.5 text-[10px] font-display tracking-[0.15em] rounded border transition-all ${
                droneMode
                  ? 'bg-accent/20 text-accent border-accent/40 shadow-[0_0_8px_hsl(150_100%_50%/0.15)]'
                  : 'text-muted-foreground border-transparent hover:border-accent/20 hover:text-accent/70'
              }`}
            >
              {droneMode ? '🛩 DRONE' : '🛩 FLY'}
            </button>
          </>
        )}

        {!warMode && (
          <>
            <span className="text-primary/20 mx-1">│</span>
            {/* Detection mode toggle */}
            <button onClick={toggleDetectionMode}
              className={`px-2 py-0.5 text-[10px] font-display tracking-[0.15em] rounded border transition-all ${
                detectionMode === 'sparse'
                  ? 'bg-accent/15 text-accent border-accent/25'
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}
            >
              {detectionMode === 'sparse' ? '◇ SPARSE' : '◆ FULL'}
            </button>
          </>
        )}

        {/* Active visual mode indicator */}
        {styleLabel && (
          <>
            <span className="text-primary/20 mx-1">│</span>
            <span className="text-[10px] font-data text-amber-400 tracking-wider">[{styleLabel}]</span>
          </>
        )}

        {!warMode && (
          <>
            <span className="text-primary/20 mx-1">│</span>
            <button onClick={togglePanoptic}
              className={`px-2 py-0.5 text-[8px] font-display tracking-[0.15em] rounded border transition-all ${
                panopticEnabled
                  ? 'bg-primary/15 text-primary border-primary/25'
                  : 'text-muted-foreground border-transparent hover:border-primary/10'
              }`}
            >
              {panopticEnabled ? '◉ PAN' : '○ PAN'}
            </button>
            <button onClick={toggleCircularViewport}
              className={`px-2 py-0.5 text-[8px] font-display tracking-[0.15em] rounded border transition-all ${
                circularViewport
                  ? 'bg-primary/15 text-primary border-primary/25'
                  : 'text-muted-foreground border-transparent hover:border-primary/10'
              }`}
            >
              {circularViewport ? '⊙ CIRC' : '⊘ CIRC'}
            </button>
            <span className="text-[10px] font-data text-muted-foreground/50 tracking-wider">[{hudLayout.toUpperCase()}]</span>
          </>
        )}
      </div>

      {/* Right — Refresh + WAR/LIVE + UTC */}
      <div className="flex items-center gap-2.5">
        {/* Live refresh button */}
        <button
          onClick={() => { triggerManualRefresh(); setRefreshFlash(true); setTimeout(() => setRefreshFlash(false), 1000); }}
          disabled={newsLoading}
          className={`px-2 py-0.5 text-[8px] font-display tracking-[0.15em] rounded border transition-all ${
            refreshFlash ? 'bg-primary/20 border-primary/40 text-primary' : 'border-primary/15 text-muted-foreground hover:text-primary hover:border-primary/30'
          } disabled:opacity-40`}
        >
          {newsLoading ? '⏳ LOADING...' : refreshFlash ? '✓ REFRESHING' : '🔄 LIVE UPDATE'}
        </button>
        {/* Mobile war mode button */}
        <div className="lg:hidden">
          <WarModeButton active={warMode} onClick={toggleWarMode} compact />
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${warMode ? 'bg-destructive/15 border-destructive/30' : 'bg-destructive/8 border-destructive/15'}`}>
          <span className={`w-1.5 h-1.5 rounded-full bg-destructive ${warMode ? 'animate-ping' : 'animate-pulse-dot'}`} />
          <span className="text-[8px] font-data text-destructive tracking-[0.2em] font-semibold">{warMode ? 'WAR' : 'REC'}</span>
        </div>
        <span className="text-[9px] font-data text-muted-foreground hidden sm:block tracking-wider tabular-nums">{utc} UTC</span>
      </div>
    </header>
  );
});

/** Sophisticated WAR MODE toggle button */
const WarModeButton = ({ active, onClick, compact }: { active: boolean; onClick: () => void; compact?: boolean }) => {
  const [flash, setFlash] = useState(false);

  const handleClick = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative group overflow-hidden rounded transition-all duration-300 ${
        compact ? 'px-2 py-0.5' : 'px-3 py-0.5'
      } ${
        active
          ? 'bg-destructive/20 border border-destructive/50 shadow-[0_0_12px_rgba(255,50,50,0.3),inset_0_0_12px_rgba(255,50,50,0.1)]'
          : 'border border-muted-foreground/20 hover:border-destructive/30 hover:bg-destructive/5'
      }`}
    >
      {/* Flash overlay on click */}
      {flash && (
        <div className="absolute inset-0 bg-destructive/40 animate-fade-in" style={{ animation: 'flash-out 0.3s ease-out forwards' }} />
      )}

      {/* Scanning line when active */}
      {active && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 right-0 h-[1px] bg-destructive/40"
            style={{ animation: 'war-scan 2s linear infinite' }}
          />
        </div>
      )}

      <div className="relative flex items-center gap-1.5">
        {active && (
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
        )}
        <span className={`text-[8px] font-display tracking-[0.2em] font-bold ${
          active ? 'text-destructive' : 'text-muted-foreground group-hover:text-destructive/70'
        }`}>
          {active ? '⚔ WAR MODE' : '⚔ WAR'}
        </span>
      </div>

      {/* Corner brackets when active */}
      {active && (
        <>
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-destructive/60" />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-destructive/60" />
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-destructive/60" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-destructive/60" />
        </>
      )}

      <style>{`
        @keyframes war-scan {
          0% { top: -1px; }
          100% { top: calc(100% + 1px); }
        }
        @keyframes flash-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .glow-red {
          text-shadow: 0 0 8px hsla(0, 100%, 50%, 0.5), 0 0 20px hsla(0, 100%, 50%, 0.2);
        }
      `}</style>
    </button>
  );
};

const MapToggleBtn = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button onClick={onClick} className={`px-2 py-0.5 text-[10px] font-display tracking-[0.15em] transition-all ${active ? 'bg-primary/20 text-primary shadow-[0_0_6px_hsl(150_100%_50%/0.15)]' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}>{label}</button>
);

const CounterBadge = ({ icon, count, color }: { icon: string; count: number; color: string }) => (
  <div className="flex items-center gap-1">
    <span className="text-[11px]">{icon}</span>
    <span className={`${color} font-bold tabular-nums text-[11px]`}>{count.toLocaleString()}</span>
  </div>
);

TopBar.displayName = 'TopBar';
export default TopBar;
