// Intelligence Brief Export — generates a downloadable PNG summary

import { CONFLICT_ZONES } from '@/data/conflictZones';

interface BriefData {
  timestamp: Date;
  aircraftCount: number;
  militaryCount: number;
  satelliteCount: number;
  vesselCount: number;
  earthquakeCount: number;
  protestCount: number;
  outageCount: number;
  fireCount: number;
  topInstability: { country: string; score: number; flag: string }[];
  activeConflicts: { name: string; intensity: number }[];
  compositeRisk: number;
  riskLevel: string;
}

export function generateIntelBrief(data: BriefData): void {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1100;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#020810';
  ctx.fillRect(0, 0, 800, 1100);

  // Border
  ctx.strokeStyle = 'rgba(0,255,136,0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 780, 1080);

  // Header
  ctx.fillStyle = 'rgba(0,255,136,0.08)';
  ctx.fillRect(10, 10, 780, 70);
  
  ctx.font = '700 22px Rajdhani, sans-serif';
  ctx.fillStyle = '#00ff88';
  ctx.textAlign = 'center';
  ctx.fillText('WARMONITOR INTELLIGENCE BRIEF', 400, 40);

  ctx.font = '400 10px JetBrains Mono, monospace';
  ctx.fillStyle = '#cc2244';
  ctx.fillText('UNCLASSIFIED // FOUO', 400, 58);

  ctx.font = '400 10px JetBrains Mono, monospace';
  ctx.fillStyle = '#7eaac8';
  ctx.textAlign = 'right';
  ctx.fillText(data.timestamp.toISOString(), 780, 58);

  let y = 110;
  ctx.textAlign = 'left';

  // Section helper
  const section = (title: string) => {
    ctx.fillStyle = 'rgba(0,255,136,0.1)';
    ctx.fillRect(20, y - 14, 760, 20);
    ctx.font = '600 12px Rajdhani, sans-serif';
    ctx.fillStyle = '#00ff88';
    ctx.fillText(title, 30, y);
    y += 24;
  };

  const line = (label: string, value: string, color = '#d4e4f0') => {
    ctx.font = '400 10px JetBrains Mono, monospace';
    ctx.fillStyle = '#7eaac8';
    ctx.fillText(label, 40, y);
    ctx.fillStyle = color;
    ctx.fillText(value, 250, y);
    y += 16;
  };

  // 1. Situation Overview
  section('1. SITUATION OVERVIEW');
  line('Aircraft Tracked', `${data.aircraftCount} (${data.militaryCount} military)`);
  line('Satellites', `${data.satelliteCount}`);
  line('Maritime Vessels', `${data.vesselCount}`);
  line('Earthquakes (24h)', `${data.earthquakeCount}`);
  line('Active Protests', `${data.protestCount}`);
  line('Cyber/Outages', `${data.outageCount}`);
  line('Fire Events', `${data.fireCount}`);
  y += 8;

  // 2. Composite Risk
  section('2. STRATEGIC RISK ASSESSMENT');
  const riskColor = data.compositeRisk >= 70 ? '#cc2244' : data.compositeRisk >= 50 ? '#cc6633' : '#ccaa33';
  line('Composite Score', `${data.compositeRisk}/100 — ${data.riskLevel}`, riskColor);
  y += 8;

  // 3. CII Rankings
  section('3. COUNTRY INSTABILITY INDEX — TOP 10');
  data.topInstability.slice(0, 10).forEach((c, i) => {
    const levelColor = c.score >= 70 ? '#cc2244' : c.score >= 50 ? '#cc6633' : '#ccaa33';
    line(`#${i + 1} ${c.flag} ${c.country}`, `Score: ${c.score}`, levelColor);
  });
  y += 8;

  // 4. Active Conflicts
  section('4. ACTIVE CONFLICTS');
  data.activeConflicts.slice(0, 8).forEach(c => {
    const ic = c.intensity >= 8 ? '#cc2244' : c.intensity >= 6 ? '#cc6633' : '#ccaa33';
    line(c.name, `Intensity: ${c.intensity}/10`, ic);
  });
  y += 8;

  // Footer
  y = 1050;
  ctx.fillStyle = 'rgba(0,255,136,0.05)';
  ctx.fillRect(10, y - 10, 780, 40);
  ctx.font = '400 8px JetBrains Mono, monospace';
  ctx.fillStyle = '#3f5f78';
  ctx.textAlign = 'center';
  ctx.fillText('Sources: OpenSky, USGS, NASA EONET, CoinGecko, RSS Aggregators, OSINT', 400, y + 4);
  ctx.fillText(`Generated: ${data.timestamp.toISOString()} | WORLDVIEW v0.1`, 400, y + 16);

  // Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worldview-brief-${data.timestamp.toISOString().slice(0, 10)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
