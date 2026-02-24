import { memo, useState, useEffect } from 'react';
import { useWorldViewStore } from '@/store/worldview';

const HudOverlay = memo(() => {
  const { aircraft, satellites, earthquakes, vessels, protests, outages, volcanoes, weatherAlerts, mapMode } = useWorldViewStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const utcStr = time.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
  const dayOfYear = Math.floor((time.getTime() - new Date(time.getFullYear(), 0, 0).getTime()) / 86400000);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden animate-fade-in">
      {/* Corner Brackets — subtle glow */}
      <CornerBracket position="top-left" />
      <CornerBracket position="top-right" />
      <CornerBracket position="bottom-left" />
      <CornerBracket position="bottom-right" />

      {/* Classification Banner */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2">
        <div className="px-8 py-0.5 bg-destructive/8 border border-destructive/20 text-[8px] font-data tracking-[0.35em] text-destructive/80 backdrop-blur-sm">
          UNCLASSIFIED // FOUO
        </div>
      </div>

      {/* Recording Badge — Top Right */}
      <div className="absolute top-1.5 right-14 flex items-center gap-2 bg-background/40 backdrop-blur-sm rounded px-2 py-0.5 border border-destructive/10">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse-dot" />
          <span className="text-[8px] font-data text-destructive tracking-[0.2em]">REC</span>
        </div>
        <span className="text-[8px] font-data text-muted-foreground/80 tabular-nums">{utcStr}</span>
      </div>

      {/* Left Telemetry Strip */}
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 bg-background/30 backdrop-blur-sm rounded border border-border/50 px-1 py-1.5">
        <TelemetryItem label="ALT" value="ORBIT" />
        <TelemetryItem label="HDG" value="---" />
        <TelemetryItem label="SPD" value="---" />
        <TelemetryItem label="FOV" value="60" />
        <div className="w-full h-px bg-primary/10 my-0.5" />
        <TelemetryItem label="ACF" value={String(aircraft.length)} color="text-signal-aircraft" />
        <TelemetryItem label="SAT" value={String(satellites.length)} color="text-signal-satellite" />
        <TelemetryItem label="EQ" value={String(earthquakes.length)} color="text-signal-earthquake" />
        <TelemetryItem label="VSL" value={String(vessels.length)} color="text-signal-vessel" />
      </div>

      {/* Right Telemetry Strip */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 bg-background/30 backdrop-blur-sm rounded border border-border/50 px-1 py-1.5">
        <TelemetryItem label="THR" value={String(protests.length + outages.length)} color="text-alert-high" />
        <TelemetryItem label="VOL" value={String(volcanoes.filter(v => v.status === 'erupting').length)} color="text-alert-critical" />
        <TelemetryItem label="WX" value={String(weatherAlerts.filter(w => w.isExtreme).length)} color="text-alert-medium" />
      </div>

      {/* Bottom Metadata Bar */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3 bg-background/50 backdrop-blur-sm border border-primary/10 rounded-sm px-3 py-0.5">
          <span className="text-[7px] font-data text-muted-foreground/60 tabular-nums">JD {dayOfYear}</span>
          <span className="text-[7px] text-primary/30">│</span>
          <span className="text-[7px] font-data text-primary/70">{mapMode === 'google3d' ? 'GOOGLE 3D TILES' : mapMode === '3d' ? 'GLOBE.GL' : 'LEAFLET 2D'}</span>
          <span className="text-[7px] text-primary/30">│</span>
          <span className="text-[7px] font-data text-muted-foreground/60">WGS84</span>
          <span className="text-[7px] text-primary/30">│</span>
          <span className="text-[7px] font-data text-signal-aircraft tabular-nums">{aircraft.length} ACF</span>
          <span className="text-[7px] font-data text-signal-satellite tabular-nums">{satellites.length} SAT</span>
          <span className="text-[7px] font-data text-signal-vessel tabular-nums">{vessels.length} VSL</span>
        </div>
      </div>

      {/* Subtle horizontal scan line */}
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent animate-scan-line" />
    </div>
  );
});

const CornerBracket = ({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
  const isTop = position.includes('top');
  const isLeft = position.includes('left');

  return (
    <div className={`absolute ${isTop ? 'top-0.5' : 'bottom-0.5'} ${isLeft ? 'left-0.5' : 'right-0.5'}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" className="text-primary/30">
        {isTop && isLeft && <path d="M0 10 L0 0 L10 0" fill="none" stroke="currentColor" strokeWidth="1" />}
        {isTop && !isLeft && <path d="M6 0 L16 0 L16 10" fill="none" stroke="currentColor" strokeWidth="1" />}
        {!isTop && isLeft && <path d="M0 6 L0 16 L10 16" fill="none" stroke="currentColor" strokeWidth="1" />}
        {!isTop && !isLeft && <path d="M6 16 L16 16 L16 6" fill="none" stroke="currentColor" strokeWidth="1" />}
      </svg>
    </div>
  );
};

const TelemetryItem = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div className="flex flex-col items-center min-w-[24px]">
    <span className="text-[6px] font-data text-muted-foreground/50 tracking-[0.15em]">{label}</span>
    <span className={`text-[9px] font-data font-bold tabular-nums ${color || 'text-foreground/80'}`}>{value}</span>
  </div>
);

HudOverlay.displayName = 'HudOverlay';
export default HudOverlay;
