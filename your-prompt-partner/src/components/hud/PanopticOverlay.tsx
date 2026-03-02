import { memo } from 'react';
import { useWorldViewStore } from '@/store/worldview';

// Deterministic label generator
const toLabel = (prefix: string, index: number) => {
  const hex = ((index * 2654435761) >>> 0).toString(16).toUpperCase().slice(0, 4);
  return `${prefix}-${hex}`;
};

const PanopticOverlay = memo(() => {
  const { panopticEnabled, panopticDensity, aircraft, satellites, vessels, earthquakes } = useWorldViewStore();
  if (!panopticEnabled) return null;

  const densityFactor = panopticDensity / 100;
  const acfSlice = aircraft.slice(0, Math.max(1, Math.floor(aircraft.length * densityFactor)));
  const satSlice = satellites.slice(0, Math.max(1, Math.floor(satellites.length * densityFactor)));
  const vslSlice = vessels.slice(0, Math.max(1, Math.floor(vessels.length * densityFactor)));
  const eqSlice = earthquakes.slice(0, Math.max(1, Math.floor(earthquakes.length * densityFactor)));

  const totalVisible = acfSlice.length + satSlice.length + vslSlice.length + eqSlice.length;
  const totalAll = aircraft.length + satellites.length + vessels.length + earthquakes.length;

  return (
    <div className="absolute inset-0 pointer-events-none z-15">
      {/* Stats bar */}
      <div className="absolute top-[52px] left-3 flex items-center gap-2 bg-background/40 backdrop-blur-sm border border-primary/15 rounded px-2 py-0.5">
        <span className="text-[7px] font-data text-primary tracking-[0.2em] font-bold">PANOPTIC</span>
        <span className="text-[7px] text-primary/20">│</span>
        <span className="text-[7px] font-data text-muted-foreground">VIS: <span className="text-data-text font-bold">{totalVisible}</span></span>
        <span className="text-[7px] text-primary/20">│</span>
        <span className="text-[7px] font-data text-muted-foreground">TOT: <span className="text-data-text">{totalAll}</span></span>
        <span className="text-[7px] text-primary/20">│</span>
        <span className="text-[7px] font-data text-muted-foreground">DNS: <span className="text-data-text">{panopticDensity}%</span></span>
      </div>

      {/* Scrolling entity feed */}
      <div className="absolute top-[70px] left-3 max-h-[200px] overflow-y-auto w-[140px] space-y-0.5 bg-background/20 backdrop-blur-sm rounded border border-primary/8 p-1">
        {acfSlice.slice(0, 8).map((a, i) => (
          <div key={`a-${i}`} className="text-[6px] font-data text-signal-aircraft/70 truncate">
            {toLabel('ACF', i)} {a.callsign}
          </div>
        ))}
        {satSlice.slice(0, 5).map((s, i) => (
          <div key={`s-${i}`} className="text-[6px] font-data text-signal-satellite/70 truncate">
            {toLabel('SAT', i)} {s.name}
          </div>
        ))}
        {vslSlice.slice(0, 5).map((v, i) => (
          <div key={`v-${i}`} className="text-[6px] font-data text-signal-vessel/70 truncate">
            {toLabel('VSL', i)} {v.name}
          </div>
        ))}
        {eqSlice.slice(0, 3).map((e, i) => (
          <div key={`e-${i}`} className="text-[6px] font-data text-signal-earthquake/70 truncate">
            {toLabel('EQK', i)} M{e.magnitude.toFixed(1)}
          </div>
        ))}
      </div>
    </div>
  );
});

PanopticOverlay.displayName = 'PanopticOverlay';
export default PanopticOverlay;
