import { memo, useState } from 'react';
import { useWorldViewStore, VisualStyle } from '@/store/worldview';

const PRESETS: { id: VisualStyle; label: string; icon: string }[] = [
  { id: 'normal', label: 'Normal', icon: '◯' },
  { id: 'crt', label: 'CRT', icon: '▣' },
  { id: 'nvg', label: 'NVG', icon: '🌙' },
  { id: 'flir', label: 'FLIR', icon: '🌡' },
  { id: 'anime', label: 'Anime', icon: '✦' },
  { id: 'noir', label: 'Noir', icon: '◐' },
  { id: 'snow', label: 'Snow', icon: '❄' },
];

/** CSS filter + overlay config per style */
export const STYLE_FILTERS: Record<VisualStyle, {
  filter: string;
  overlay?: string; // CSS background for overlay div
  mixBlend?: string;
  scanlines?: boolean;
  tint?: string; // color for a tint overlay
}> = {
  normal: { filter: 'none' },
  crt: {
    filter: 'contrast(1.15) saturate(0.85) brightness(0.9)',
    scanlines: true,
    tint: 'hsla(40, 100%, 50%, 0.04)',
  },
  nvg: {
    filter: 'brightness(1.4) contrast(1.3) saturate(0)',
    tint: 'hsla(120, 100%, 40%, 0.25)',
    scanlines: true,
  },
  flir: {
    filter: 'grayscale(1) contrast(1.6) brightness(1.1) invert(1)',
    tint: 'hsla(200, 20%, 50%, 0.05)',
  },
  anime: {
    filter: 'saturate(1.8) contrast(1.15) brightness(1.05)',
    tint: 'hsla(280, 100%, 60%, 0.03)',
  },
  noir: {
    filter: 'grayscale(0.9) contrast(1.4) brightness(0.85)',
    tint: 'hsla(0, 0%, 0%, 0.1)',
  },
  snow: {
    filter: 'brightness(1.3) contrast(0.9) saturate(0.3) hue-rotate(10deg)',
    tint: 'hsla(200, 60%, 90%, 0.08)',
  },
};

const StylePresetsBar = memo(() => {
  const { visualStyle, setVisualStyle } = useWorldViewStore();

  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 pointer-events-auto mb-1">
      <div className="flex items-center gap-0.5 bg-background/80 backdrop-blur-md border border-border rounded-lg p-1">
        <span className="text-[8px] font-display tracking-[0.15em] text-muted-foreground px-2 hidden md:block">STYLE PRESETS</span>
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => setVisualStyle(p.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-all min-w-[52px] ${
              visualStyle === p.id
                ? 'bg-primary/15 border border-primary/40 shadow-[0_0_8px_rgba(0,255,136,0.15)]'
                : 'hover:bg-muted/40 border border-transparent'
            }`}
          >
            <span className="text-sm leading-none">{p.icon}</span>
            <span className={`text-[8px] font-display tracking-wider ${
              visualStyle === p.id ? 'text-primary' : 'text-muted-foreground'
            }`}>{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

StylePresetsBar.displayName = 'StylePresetsBar';
export default StylePresetsBar;
