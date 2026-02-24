import { memo, useState, useEffect, useRef } from 'react';
import { useWorldViewStore } from '@/store/worldview';

const HudOverlay = memo(() => {
  const { aircraft, satellites, earthquakes, vessels, protests, outages, volcanoes, weatherAlerts } = useWorldViewStore();
  const [time, setTime] = useState(new Date());
  const [mousePos, setMousePos] = useState({ lat: 0, lon: 0 });
  const frameRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulated telemetry
  const utcStr = time.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
  const dayOfYear = Math.floor((time.getTime() - new Date(time.getFullYear(), 0, 0).getTime()) / 86400000);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Corner Brackets */}
      <CornerBracket position="top-left" />
      <CornerBracket position="top-right" />
      <CornerBracket position="bottom-left" />
      <CornerBracket position="bottom-right" />

      {/* Classification Banner */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2">
        <div className="px-6 py-0.5 bg-alert-critical/10 border border-alert-critical/30 text-[9px] font-data tracking-[0.3em] text-alert-critical">
          UNCLASSIFIED // FOUO
        </div>
      </div>

      {/* Recording Timestamp - Top Right */}
      <div className="absolute top-2 right-16 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse-dot" />
          <span className="text-[9px] font-data text-alert-critical tracking-wider">REC</span>
        </div>
        <span className="text-[9px] font-data text-muted-foreground">{utcStr}</span>
      </div>

      {/* Telemetry Strip - Left */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        <TelemetryItem label="ALT" value="ORBIT" unit="" />
        <TelemetryItem label="HDG" value="---" unit="°" />
        <TelemetryItem label="SPD" value="---" unit="kts" />
        <TelemetryItem label="FOV" value="60" unit="°" />
        <div className="w-px h-4 bg-border mx-auto" />
        <TelemetryItem label="ACT" value={String(aircraft.length)} unit="" color="text-signal-aircraft" />
        <TelemetryItem label="SAT" value={String(satellites.length)} unit="" color="text-signal-satellite" />
        <TelemetryItem label="EQ" value={String(earthquakes.length)} unit="" color="text-signal-earthquake" />
        <TelemetryItem label="VSL" value={String(vessels.length)} unit="" color="text-signal-vessel" />
      </div>

      {/* Bottom Center - Viewport Metadata */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <div className="flex items-center gap-3 bg-background/60 backdrop-blur-sm border border-border rounded px-3 py-1">
          <span className="text-[8px] font-data text-muted-foreground">JD {dayOfYear}</span>
          <span className="text-[8px] font-data text-muted-foreground">|</span>
          <span className="text-[8px] font-data text-primary">GOOGLE 3D TILES</span>
          <span className="text-[8px] font-data text-muted-foreground">|</span>
          <span className="text-[8px] font-data text-muted-foreground">WGS84</span>
          <span className="text-[8px] font-data text-muted-foreground">|</span>
          <span className="text-[8px] font-data text-signal-aircraft">{aircraft.length} ACF</span>
          <span className="text-[8px] font-data text-signal-satellite">{satellites.length} SAT</span>
          <span className="text-[8px] font-data text-signal-vessel">{vessels.length} VSL</span>
        </div>
      </div>

      {/* Right Side - Mini Stats */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        <TelemetryItem label="THR" value={String(protests.length + outages.length)} unit="" color="text-alert-high" />
        <TelemetryItem label="VOL" value={String(volcanoes.filter(v => v.status === 'erupting').length)} unit="" color="text-alert-critical" />
        <TelemetryItem label="WX" value={String(weatherAlerts.filter(w => w.isExtreme).length)} unit="" color="text-alert-medium" />
      </div>

      {/* Scan line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan-line" />
    </div>
  );
});

const CornerBracket = ({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
  const size = 20;
  const isTop = position.includes('top');
  const isLeft = position.includes('left');

  return (
    <div className={`absolute ${isTop ? 'top-1' : 'bottom-1'} ${isLeft ? 'left-1' : 'right-1'}`}>
      <svg width={size} height={size} viewBox="0 0 20 20" className="text-primary/40">
        {isTop && isLeft && <path d="M0 12 L0 0 L12 0" fill="none" stroke="currentColor" strokeWidth="1.5" />}
        {isTop && !isLeft && <path d="M8 0 L20 0 L20 12" fill="none" stroke="currentColor" strokeWidth="1.5" />}
        {!isTop && isLeft && <path d="M0 8 L0 20 L12 20" fill="none" stroke="currentColor" strokeWidth="1.5" />}
        {!isTop && !isLeft && <path d="M8 20 L20 20 L20 8" fill="none" stroke="currentColor" strokeWidth="1.5" />}
      </svg>
    </div>
  );
};

const TelemetryItem = ({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) => (
  <div className="flex flex-col items-center min-w-[28px]">
    <span className="text-[7px] font-data text-muted-foreground tracking-wider">{label}</span>
    <span className={`text-[10px] font-data font-bold ${color || 'text-foreground'}`}>{value}<span className="text-[7px] text-muted-foreground">{unit}</span></span>
  </div>
);

HudOverlay.displayName = 'HudOverlay';
export default HudOverlay;
