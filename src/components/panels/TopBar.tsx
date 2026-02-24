import { memo, useEffect, useState } from 'react';
import { useWorldViewStore, MapMode, DashboardMode } from '@/store/worldview';

const TopBar = memo(() => {
  const { aircraft, satellites, earthquakes, volcanoes, weatherAlerts, vessels, protests, outages, lastRefresh, toggleLeftPanel, mapMode, setMapMode, dashboardMode, setDashboardMode } = useWorldViewStore();
  const militaryCount = aircraft.filter(a => a.isMilitary).length;
  const yachtCount = vessels.filter(v => v.type === 'yacht').length;
  const [utc, setUtc] = useState('');

  useEffect(() => {
    const tick = () => setUtc(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="glass-panel-elevated flex items-center justify-between px-3 h-10 z-50 border-b border-border">
      <div className="flex items-center gap-2.5">
        <button onClick={toggleLeftPanel} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        </button>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
          <h1 className="text-sm font-bold tracking-[0.2em] text-foreground font-display glow-green">WORLDVIEW</h1>
        </div>
        <div className="hidden md:flex items-center gap-0.5 ml-1">
          {(['WORLD', 'TECH', 'FINANCE'] as DashboardMode[]).map((tab) => (
            <button key={tab} onClick={() => setDashboardMode(tab)}
              className={`px-2 py-0.5 text-[9px] font-display tracking-[0.15em] rounded transition-all ${dashboardMode === tab ? 'bg-primary/15 text-primary border border-primary/25 shadow-[0_0_8px_hsl(150_100%_50%/0.1)]' : 'text-muted-foreground hover:text-foreground hover:bg-card-hover'}`}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2 font-data text-[10px]">
        <CounterBadge icon="✈" count={aircraft.length} color="text-signal-aircraft" />
        <span className="text-border">│</span>
        <CounterBadge icon="⚔" count={militaryCount} color="text-signal-military" />
        <span className="text-border">│</span>
        <CounterBadge icon="🛰" count={satellites.length} color="text-signal-satellite" />
        <span className="text-border">│</span>
        <CounterBadge icon="🚢" count={vessels.length} color="text-signal-vessel" />
        <span className="text-border">│</span>
        <CounterBadge icon="🌍" count={earthquakes.length} color="text-signal-earthquake" />

        <div className="flex items-center border border-primary/15 rounded overflow-hidden ml-2 bg-background/40">
          <MapToggleBtn active={mapMode === '2d'} label="2D" onClick={() => setMapMode('2d')} />
          <MapToggleBtn active={mapMode === '3d'} label="3D" onClick={() => setMapMode('3d')} />
          <MapToggleBtn active={mapMode === 'google3d'} label="G3D" onClick={() => setMapMode('google3d')} />
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-destructive/10 border border-destructive/20">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse-dot" />
          <span className="text-[9px] font-data text-destructive tracking-[0.15em] font-semibold">LIVE</span>
        </div>
        <span className="text-[9px] font-data text-muted-foreground hidden sm:block tracking-wider">{utc} UTC</span>
      </div>
    </header>
  );
});

const MapToggleBtn = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button onClick={onClick} className={`px-2 py-0.5 text-[9px] font-display tracking-[0.15em] transition-all ${active ? 'bg-primary/20 text-primary shadow-[0_0_6px_hsl(150_100%_50%/0.15)]' : 'text-muted-foreground hover:text-foreground hover:bg-card-hover'}`}>{label}</button>
);

const CounterBadge = ({ icon, count, color }: { icon: string; count: number; color: string }) => (
  <div className="flex items-center gap-1">
    <span className="text-[10px]">{icon}</span>
    <span className={`${color} font-bold tabular-nums`}>{count.toLocaleString()}</span>
  </div>
);

TopBar.displayName = 'TopBar';
export default TopBar;
