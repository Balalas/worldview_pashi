import { memo, useMemo } from 'react';
import { useWorldViewStore, INSTABILITY_DATA } from '@/store/worldview';

const DEFCON_LEVELS = [
  { level: 1, label: 'COCKED PISTOL', color: 'hsl(345, 100%, 50%)', min: 80 },
  { level: 2, label: 'FAST PACE', color: 'hsl(24, 100%, 50%)', min: 60 },
  { level: 3, label: 'ROUND HOUSE', color: 'hsl(40, 100%, 50%)', min: 40 },
  { level: 4, label: 'DOUBLE TAKE', color: 'hsl(150, 100%, 50%)', min: 20 },
  { level: 5, label: 'FADE OUT', color: 'hsl(210, 100%, 50%)', min: 0 },
];

const ThreatGauge = memo(() => {
  const { earthquakes, protests, outages, fires, aircraft } = useWorldViewStore();

  const threatScore = useMemo(() => {
    let score = 0;
    // High-magnitude earthquakes
    score += earthquakes.filter(e => e.magnitude >= 5).length * 8;
    score += earthquakes.filter(e => e.magnitude >= 4 && e.magnitude < 5).length * 3;
    // Protests
    score += protests.length * 2;
    // Cyber/outages
    score += outages.length * 4;
    // Active fires
    score += Math.min(fires.length, 10) * 1.5;
    // Military aircraft
    score += aircraft.filter(a => a.isMilitary).length * 0.5;
    // Instability index contribution
    score += INSTABILITY_DATA.filter(i => i.level === 'critical').length * 5;
    score += INSTABILITY_DATA.filter(i => i.level === 'high').length * 3;
    return Math.min(Math.round(score), 100);
  }, [earthquakes, protests, outages, fires, aircraft]);

  const defcon = DEFCON_LEVELS.find(d => threatScore >= d.min) || DEFCON_LEVELS[4];
  const sweepAngle = (threatScore / 100) * 180; // 0-180 degrees arc

  // SVG arc path
  const arcRadius = 38;
  const cx = 50, cy = 48;
  const startAngle = -180;
  const endAngle = startAngle + sweepAngle;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = cx + arcRadius * Math.cos(startRad);
  const y1 = cy + arcRadius * Math.sin(startRad);
  const x2 = cx + arcRadius * Math.cos(endRad);
  const y2 = cy + arcRadius * Math.sin(endRad);
  const largeArc = sweepAngle > 180 ? 1 : 0;
  const arcPath = `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${x2} ${y2}`;

  // Background arc
  const bgEndRad = (0 * Math.PI) / 180;
  const bx2 = cx + arcRadius * Math.cos(bgEndRad);
  const by2 = cy + arcRadius * Math.sin(bgEndRad);
  const bgArcPath = `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 0 1 ${bx2} ${by2}`;

  return (
    <div className="absolute bottom-56 left-3 z-30 pointer-events-none">
      <div className="relative w-[110px] h-[72px]">
        <svg viewBox="0 0 100 55" className="w-full h-full">
          {/* Background arc */}
          <path d={bgArcPath} fill="none" stroke="hsla(150, 100%, 50%, 0.08)" strokeWidth="5" strokeLinecap="round" />
          {/* Threat arc */}
          <path
            d={arcPath}
            fill="none"
            stroke={defcon.color}
            strokeWidth="5"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${defcon.color}40)`, transition: 'all 1s ease-out' }}
          />
          {/* Tick marks */}
          {[0, 45, 90, 135, 180].map((deg) => {
            const rad = ((deg - 180) * Math.PI) / 180;
            const ix = cx + (arcRadius - 6) * Math.cos(rad);
            const iy = cy + (arcRadius - 6) * Math.sin(rad);
            const ox = cx + (arcRadius + 3) * Math.cos(rad);
            const oy = cy + (arcRadius + 3) * Math.sin(rad);
            return <line key={deg} x1={ix} y1={iy} x2={ox} y2={oy} stroke="hsla(150, 100%, 50%, 0.15)" strokeWidth="0.5" />;
          })}
          {/* Score */}
          <text x={cx} y={cy - 2} textAnchor="middle" fill={defcon.color} fontSize="14" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
            {threatScore}
          </text>
          <text x={cx} y={cy + 7} textAnchor="middle" fill="hsla(200, 30%, 45%, 1)" fontSize="4" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.5">
            /100
          </text>
        </svg>
        {/* DEFCON label */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
          <div className="text-[7px] font-data tracking-[0.15em]" style={{ color: defcon.color }}>
            DEFCON {defcon.level}
          </div>
          <div className="text-[6px] font-data text-muted-foreground/50 tracking-wider">{defcon.label}</div>
        </div>
      </div>
    </div>
  );
});

ThreatGauge.displayName = 'ThreatGauge';
export default ThreatGauge;
