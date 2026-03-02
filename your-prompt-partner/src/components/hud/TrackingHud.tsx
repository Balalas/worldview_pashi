import { memo, useState, useEffect } from 'react';
import { useWorldViewStore, FollowTarget } from '@/store/worldview';

/**
 * AC-130 / RC-130 style tracking HUD overlay.
 * Renders crosshairs, compass ring, telemetry readouts, and target info
 * when a followTarget is active.
 */
const TrackingHud = memo(() => {
  const { followTarget, setFollowTarget } = useWorldViewStore();
  const [elapsed, setElapsed] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!followTarget) { setElapsed(0); return; }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [followTarget?.id]);

  if (!followTarget) return null;

  const utc = time.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
  const elMin = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const elSec = String(elapsed % 60).padStart(2, '0');
  const hdg = Math.round(followTarget.heading) % 360;
  const altFt = Math.round(followTarget.altitude * 3.281);
  const speedKts = Math.round(followTarget.speed / 1.852);
  const latStr = followTarget.lat.toFixed(4);
  const lonStr = followTarget.lon.toFixed(4);

  const typeLabel = followTarget.type === 'aircraft' ? 'ACF' : followTarget.type === 'satellite' ? 'SAT' : 'VSL';
  const typeColor = followTarget.type === 'aircraft' ? 'text-signal-aircraft' : followTarget.type === 'satellite' ? 'text-signal-satellite' : 'text-signal-vessel';

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none">
      {/* ── Crosshair Center ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg width="200" height="200" viewBox="0 0 200 200" className="opacity-60">
          {/* Outer ring */}
          <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.3" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.2" />
          {/* Crosshair lines */}
          <line x1="100" y1="10" x2="100" y2="40" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.7" />
          <line x1="100" y1="160" x2="100" y2="190" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.7" />
          <line x1="10" y1="100" x2="40" y2="100" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.7" />
          <line x1="160" y1="100" x2="190" y2="100" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.7" />
          {/* Inner crosshair */}
          <line x1="100" y1="80" x2="100" y2="95" stroke="hsl(var(--primary))" strokeWidth="1.5" />
          <line x1="100" y1="105" x2="100" y2="120" stroke="hsl(var(--primary))" strokeWidth="1.5" />
          <line x1="80" y1="100" x2="95" y2="100" stroke="hsl(var(--primary))" strokeWidth="1.5" />
          <line x1="105" y1="100" x2="120" y2="100" stroke="hsl(var(--primary))" strokeWidth="1.5" />
          {/* Center dot */}
          <circle cx="100" cy="100" r="2" fill="hsl(var(--primary))" opacity="0.9" />
          {/* Corner ticks on outer ring */}
          {[0, 90, 180, 270].map(deg => (
            <line
              key={deg}
              x1="100" y1="5" x2="100" y2="15"
              stroke="hsl(var(--primary))" strokeWidth="1.5"
              transform={`rotate(${deg} 100 100)`}
              opacity="0.8"
            />
          ))}
          {/* 45° ticks */}
          {[45, 135, 225, 315].map(deg => (
            <line
              key={deg}
              x1="100" y1="8" x2="100" y2="13"
              stroke="hsl(var(--primary))" strokeWidth="0.8"
              transform={`rotate(${deg} 100 100)`}
              opacity="0.5"
            />
          ))}
          {/* Heading indicator arrow at top */}
          <polygon
            points="100,2 96,10 104,10"
            fill="hsl(var(--primary))"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* ── Top Banner ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-1 bg-background/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-[9px] font-data text-destructive tracking-[0.2em]">● TRACKING</span>
          </div>
          <span className="text-[9px] font-data text-muted-foreground">{utc}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-data text-muted-foreground">ELAPSED {elMin}:{elSec}</span>
          <span className="text-[9px] font-data text-muted-foreground">|</span>
          <span className="text-[9px] font-data text-alert-critical tracking-[0.2em]">SECRET // NOFORN</span>
        </div>
      </div>

      {/* ── Target ID Block - Top Center ── */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <div className="border border-primary/30 bg-background/60 backdrop-blur-sm px-6 py-1.5 flex flex-col items-center">
          <span className={`text-[11px] font-display tracking-[0.3em] font-bold ${typeColor}`}>
            TGT: {followTarget.id}
          </span>
          <span className="text-[8px] font-data text-muted-foreground tracking-wider">
            {typeLabel} • LOCK • IR/EO
          </span>
        </div>
      </div>

      {/* ── Left Telemetry Strip ── */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 border-l border-primary/20 pl-2">
        <HudReadout label="ALT" value={altFt > 999999 ? `${(altFt/1000).toFixed(0)}K` : String(altFt)} unit="FT" />
        <HudReadout label="SPD" value={String(speedKts)} unit="KTS" />
        <HudReadout label="HDG" value={String(hdg).padStart(3, '0')} unit="°" />
        <div className="w-full h-px bg-primary/10 my-1" />
        <HudReadout label="LAT" value={latStr} unit="°" />
        <HudReadout label="LON" value={lonStr} unit="°" />
        <div className="w-full h-px bg-primary/10 my-1" />
        <HudReadout label="RNG" value="LOCK" unit="" highlight />
        <HudReadout label="TRK" value="AUTO" unit="" />
      </div>

      {/* ── Right Telemetry Strip ── */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 border-r border-primary/20 pr-2 items-end">
        <HudReadout label="SLANT" value={followTarget.type === 'satellite' ? `${(followTarget.altitude/1000).toFixed(0)}KM` : `${(followTarget.altitude/1000).toFixed(1)}KM`} unit="" right />
        <HudReadout label="GS" value={String(Math.round(followTarget.speed))} unit="KMH" right />
        <HudReadout label="MACH" value={followTarget.speed > 100 ? (followTarget.speed / 1234.8).toFixed(2) : '---'} unit="" right />
        <div className="w-full h-px bg-primary/10 my-1" />
        <HudReadout label="MODE" value="FLIR" unit="" right />
        <HudReadout label="ZOOM" value="4X" unit="" right />
        <HudReadout label="FOV" value="NARROW" unit="" right />
      </div>

      {/* ── Compass Strip - Bottom ── */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="flex items-end gap-0 bg-background/40 border border-primary/10 rounded-sm overflow-hidden">
          {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map(offset => {
            const deg = ((hdg + offset) % 360 + 360) % 360;
            const cardinal = deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : '';
            const isMajor = deg % 30 === 0;
            return (
              <div key={offset} className="flex flex-col items-center w-8">
                <div className={`w-px ${isMajor ? 'h-3 bg-primary/60' : 'h-1.5 bg-primary/20'}`} />
                {isMajor && (
                  <span className={`text-[7px] font-data ${cardinal ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {cardinal || String(deg).padStart(3, '0')}
                  </span>
                )}
              </div>
            );
          })}
          {/* Center indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-primary" />
        </div>
      </div>

      {/* ── Bottom Left - Coordinates ── */}
      <div className="absolute bottom-2 left-3">
        <div className="text-[8px] font-data text-muted-foreground leading-tight">
          <div>MGRS: {latStr.replace('.','')}{lonStr.replace('.','').slice(0,6)}</div>
          <div>WGS84 {latStr}°N {lonStr}°E</div>
        </div>
      </div>

      {/* ── Bottom Right - System Info ── */}
      <div className="absolute bottom-2 right-3 text-right">
        <div className="text-[8px] font-data text-muted-foreground leading-tight">
          <div>SENSOR: IR/EO • TV</div>
          <div>ORBIT: {followTarget.type === 'satellite' ? 'LEO/GEO' : 'LOITER'}</div>
        </div>
      </div>

      {/* ── Stop Tracking Button (pointer-events enabled) ── */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-auto">
        <button
          onClick={() => setFollowTarget(null)}
          className="bg-background/70 border border-destructive/40 text-destructive px-3 py-1 rounded-sm font-data text-[9px] tracking-[0.15em] hover:bg-destructive/20 transition-colors flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
          ESC TO DISENGAGE
        </button>
      </div>

      {/* ── Scan lines effect ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)) 2px, hsl(var(--primary)) 3px)',
        }}
      />

      {/* ── Vignette ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, hsl(var(--background) / 0.4) 100%)',
        }}
      />
    </div>
  );
});

const HudReadout = ({ label, value, unit, right, highlight }: {
  label: string; value: string; unit: string; right?: boolean; highlight?: boolean;
}) => (
  <div className={`flex ${right ? 'flex-row-reverse' : 'flex-row'} items-baseline gap-1.5`}>
    <span className="text-[7px] font-data text-muted-foreground tracking-wider">{label}</span>
    <span className={`text-[11px] font-data font-bold tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}>
      {value}
      {unit && <span className="text-[7px] text-muted-foreground ml-0.5">{unit}</span>}
    </span>
  </div>
);

TrackingHud.displayName = 'TrackingHud';
export default TrackingHud;
