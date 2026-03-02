import { memo, useEffect, useRef } from 'react';
import { useWorldViewStore } from '@/store/worldview';

const RADAR_SIZE = 120;
const CENTER = RADAR_SIZE / 2;
const RADIUS = RADAR_SIZE / 2 - 8;

const MinimapRadar = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepAngleRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const { aircraft, satellites, vessels, earthquakes, mapCenter, bottomPanelCollapsed } = useWorldViewStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const viewLat = mapCenter?.lat ?? 20;
    const viewLon = mapCenter?.lon ?? 0;
    const viewRange = mapCenter?.zoom ? Math.max(180 / Math.pow(2, mapCenter.zoom - 1), 5) : 60;

    const toRadarXY = (lat: number, lon: number): { x: number; y: number } | null => {
      const dx = (lon - viewLon) / viewRange;
      const dy = (lat - viewLat) / viewRange;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) return null;
      return { x: CENTER + dx * RADIUS, y: CENTER - dy * RADIUS };
    };

    const draw = () => {
      ctx.clearRect(0, 0, RADAR_SIZE, RADAR_SIZE);

      // Background
      ctx.fillStyle = 'hsla(210, 60%, 6%, 0.85)';
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, RADIUS + 4, 0, Math.PI * 2);
      ctx.fill();

      // Grid rings
      ctx.strokeStyle = 'hsla(150, 100%, 50%, 0.08)';
      ctx.lineWidth = 0.5;
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.arc(CENTER, CENTER, (RADIUS * r) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshairs
      ctx.strokeStyle = 'hsla(150, 100%, 50%, 0.1)';
      ctx.beginPath();
      ctx.moveTo(CENTER - RADIUS, CENTER);
      ctx.lineTo(CENTER + RADIUS, CENTER);
      ctx.moveTo(CENTER, CENTER - RADIUS);
      ctx.lineTo(CENTER, CENTER + RADIUS);
      ctx.stroke();

      // Sweep line
      sweepAngleRef.current += 0.02;
      const sweepAngle = sweepAngleRef.current;
      ctx.save();
      ctx.translate(CENTER, CENTER);
      ctx.rotate(sweepAngle);

      const sweepGrad = ctx.createLinearGradient(0, 0, RADIUS, 0);
      sweepGrad.addColorStop(0, 'hsla(150, 100%, 50%, 0.02)');
      sweepGrad.addColorStop(1, 'hsla(150, 100%, 50%, 0.15)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, RADIUS, -0.5, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'hsla(150, 100%, 50%, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(RADIUS, 0);
      ctx.stroke();
      ctx.restore();

      // Plot entities
      const plotDot = (lat: number, lon: number, color: string, size: number) => {
        const pos = toRadarXY(lat, lon);
        if (!pos) return;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fill();
      };

      aircraft.slice(0, 50).forEach(a => plotDot(a.lat, a.lon, a.isMilitary ? 'hsl(20, 100%, 54%)' : 'hsl(150, 100%, 50%)', 1.5));
      satellites.slice(0, 30).forEach(s => plotDot(s.lat, s.lon, 'hsl(195, 100%, 50%)', 1));
      vessels.slice(0, 30).forEach(v => plotDot(v.lat, v.lon, 'hsl(220, 100%, 64%)', 1.2));
      earthquakes.slice(0, 10).forEach(e => plotDot(e.lat, e.lon, 'hsl(270, 100%, 64%)', 2));

      // Center dot
      ctx.fillStyle = 'hsl(150, 100%, 50%)';
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, 2, 0, Math.PI * 2);
      ctx.fill();

      // Border ring
      ctx.strokeStyle = 'hsla(150, 100%, 50%, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, RADIUS + 1, 0, Math.PI * 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [aircraft, satellites, vessels, earthquakes, mapCenter]);

  return (
    <div className="absolute left-1 bottom-1 z-30 pointer-events-none">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={RADAR_SIZE}
          height={RADAR_SIZE}
          className="rounded-full"
          style={{ filter: 'drop-shadow(0 0 6px hsla(150, 100%, 50%, 0.15))' }}
        />
        {/* Cardinal labels */}
        <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[6px] font-data text-primary/40">N</span>
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[6px] font-data text-primary/40">S</span>
        <span className="absolute top-1/2 -translate-y-1/2 left-1 text-[6px] font-data text-primary/40">W</span>
        <span className="absolute top-1/2 -translate-y-1/2 right-1 text-[6px] font-data text-primary/40">E</span>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] font-data text-primary/50 tracking-[0.2em] whitespace-nowrap">
          RADAR
        </div>
      </div>
    </div>
  );
});

MinimapRadar.displayName = 'MinimapRadar';
export default MinimapRadar;
