import { memo, useState, useEffect } from 'react';
import { useWorldViewStore } from '@/store/worldview';

const HudOverlay = memo(() => {
  const { aircraft, satellites, earthquakes, vessels, mapMode } = useWorldViewStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dayOfYear = Math.floor((time.getTime() - new Date(time.getFullYear(), 0, 0).getTime()) / 86400000);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Corner Brackets */}
      <CornerBracket position="top-left" />
      <CornerBracket position="top-right" />
      <CornerBracket position="bottom-left" />
      <CornerBracket position="bottom-right" />

      {/* Left Telemetry Strip */}
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 bg-background/20 backdrop-blur-sm rounded border border-primary/8 px-1 py-1.5">
        <TelemetryItem label="ACF" value={String(aircraft.length)} color="text-signal-aircraft" />
        <TelemetryItem label="SAT" value={String(satellites.length)} color="text-signal-satellite" />
        <TelemetryItem label="EQ" value={String(earthquakes.length)} color="text-signal-earthquake" />
        <TelemetryItem label="VSL" value={String(vessels.length)} color="text-signal-vessel" />
      </div>

      {/* Bottom Metadata */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3 bg-background/30 backdrop-blur-sm border border-primary/8 rounded-sm px-3 py-0.5">
          <span className="text-[7px] font-data text-muted-foreground/50 tabular-nums">JD {dayOfYear}</span>
          <span className="text-[7px] text-primary/20">│</span>
          <span className="text-[7px] font-data text-primary/50">{mapMode === 'cesium' ? 'CESIUM 3D' : mapMode === 'google3d' ? 'GOOGLE 3D' : mapMode === '3d' ? 'GLOBE.GL' : 'LEAFLET 2D'}</span>
          <span className="text-[7px] text-primary/20">│</span>
          <span className="text-[7px] font-data text-muted-foreground/50">WGS84</span>
        </div>
      </div>

      {/* Scan line */}
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-scan-line" />
    </div>
  );
});

const CornerBracket = ({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
  const isTop = position.includes('top');
  const isLeft = position.includes('left');
  return (
    <div className={`absolute ${isTop ? 'top-0.5' : 'bottom-0.5'} ${isLeft ? 'left-0.5' : 'right-0.5'}`}>
      <svg width="14" height="14" viewBox="0 0 16 16" className="text-primary/20">
        {isTop && isLeft && <path d="M0 10 L0 0 L10 0" fill="none" stroke="currentColor" strokeWidth="1" />}
        {isTop && !isLeft && <path d="M6 0 L16 0 L16 10" fill="none" stroke="currentColor" strokeWidth="1" />}
        {!isTop && isLeft && <path d="M0 6 L0 16 L10 16" fill="none" stroke="currentColor" strokeWidth="1" />}
        {!isTop && !isLeft && <path d="M6 16 L16 16 L16 6" fill="none" stroke="currentColor" strokeWidth="1" />}
      </svg>
    </div>
  );
};

const TelemetryItem = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div className="flex flex-col items-center min-w-[22px]">
    <span className="text-[5px] font-data text-muted-foreground/40 tracking-[0.15em]">{label}</span>
    <span className={`text-[8px] font-data font-bold tabular-nums ${color || 'text-foreground/60'}`}>{value}</span>
  </div>
);

HudOverlay.displayName = 'HudOverlay';
export default HudOverlay;
