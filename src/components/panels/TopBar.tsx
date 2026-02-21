import { memo } from 'react';
import { useWorldViewStore, MARKET_DATA } from '@/store/worldview';

const TopBar = memo(() => {
  const { aircraft, satellites, earthquakes, lastRefresh, toggleLeftPanel } = useWorldViewStore();
  const militaryCount = aircraft.filter(a => a.isMilitary).length;

  return (
    <header className="glass-panel flex items-center justify-between px-4 h-12 z-50 border-b border-border">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <button onClick={toggleLeftPanel} className="text-muted-foreground hover:text-foreground transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
          <h1 className="text-lg font-bold tracking-widest text-foreground font-display">
            WORLDVIEW
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-1 ml-2">
          {['WORLD', 'TECH', 'FINANCE'].map((tab) => (
            <button
              key={tab}
              className={`px-2 py-0.5 text-[10px] font-display tracking-wider rounded ${
                tab === 'WORLD'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Live counters */}
      <div className="hidden lg:flex items-center gap-4 font-data text-xs">
        <CounterBadge icon="✈" count={aircraft.length} color="text-signal-aircraft" label="" />
        <CounterBadge icon="⚔" count={militaryCount} color="text-signal-military" label="" />
        <CounterBadge icon="🛰" count={satellites.length} color="text-signal-satellite" label="" />
        <CounterBadge icon="🌍" count={earthquakes.length} color="text-signal-earthquake" label="" />
      </div>

      {/* Right: Status */}
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

const CounterBadge = ({ icon, count, color, label }: { icon: string; count: number; color: string; label: string }) => (
  <div className="flex items-center gap-1">
    <span className="text-xs">{icon}</span>
    <span className={`${color} font-bold`}>{count.toLocaleString()}</span>
    {label && <span className="text-muted-foreground">{label}</span>}
  </div>
);

TopBar.displayName = 'TopBar';
export default TopBar;
