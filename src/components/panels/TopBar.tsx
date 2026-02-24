import { memo } from 'react';
import { useWorldViewStore, MapMode, DashboardMode } from '@/store/worldview';

const TopBar = memo(() => {
  const { aircraft, satellites, earthquakes, volcanoes, weatherAlerts, vessels, protests, outages, lastRefresh, toggleLeftPanel, mapMode, setMapMode, dashboardMode, setDashboardMode } = useWorldViewStore();
  const militaryCount = aircraft.filter(a => a.isMilitary).length;
  const eruptingCount = volcanoes.filter(v => v.status === 'erupting').length;
  const yachtCount = vessels.filter(v => v.type === 'yacht').length;

  return (
    <header className="glass-panel flex items-center justify-between px-4 h-12 z-50 border-b border-border">
      <div className="flex items-center gap-3">
        <button onClick={toggleLeftPanel} className="text-muted-foreground hover:text-foreground transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
          <h1 className="text-lg font-bold tracking-widest text-foreground font-display">WORLDVIEW</h1>
        </div>
        <div className="hidden md:flex items-center gap-1 ml-2">
          {(['WORLD', 'TECH', 'FINANCE'] as DashboardMode[]).map((tab) => (
            <button key={tab} onClick={() => setDashboardMode(tab)}
              className={`px-2 py-0.5 text-[10px] font-display tracking-wider rounded ${dashboardMode === tab ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'}`}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-3 font-data text-xs">
        <CounterBadge icon="✈" count={aircraft.length} color="text-signal-aircraft" />
        <CounterBadge icon="⚔" count={militaryCount} color="text-signal-military" />
        <CounterBadge icon="🛰" count={satellites.length} color="text-signal-satellite" />
        <CounterBadge icon="🚢" count={vessels.length} color="text-signal-vessel" />
        <CounterBadge icon="🛥" count={yachtCount} color="text-alert-medium" />
        <CounterBadge icon="🌍" count={earthquakes.length} color="text-signal-earthquake" />
        <CounterBadge icon="✊" count={protests.length} color="text-signal-protest" />
        <CounterBadge icon="🔒" count={outages.length} color="text-signal-outage" />

        <div className="flex items-center border border-border rounded overflow-hidden ml-2">
          <MapToggleBtn active={mapMode === '2d'} label="2D" onClick={() => setMapMode('2d')} />
          <MapToggleBtn active={mapMode === '3d'} label="3D" onClick={() => setMapMode('3d')} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-alert-critical animate-pulse-dot" />
          <span className="text-[10px] font-data text-alert-critical tracking-wider">LIVE</span>
        </div>
        <span className="text-[10px] font-data text-muted-foreground hidden sm:block">
          {lastRefresh.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })} UTC
        </span>
      </div>
    </header>
  );
});

const MapToggleBtn = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button onClick={onClick} className={`px-2.5 py-0.5 text-[10px] font-display tracking-wider transition-colors ${active ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>
);

const CounterBadge = ({ icon, count, color }: { icon: string; count: number; color: string }) => (
  <div className="flex items-center gap-1">
    <span className="text-xs">{icon}</span>
    <span className={`${color} font-bold`}>{count.toLocaleString()}</span>
  </div>
);

TopBar.displayName = 'TopBar';
export default TopBar;
