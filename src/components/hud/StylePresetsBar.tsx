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
  overlay?: string;
  mixBlend?: string;
  scanlines?: boolean;
  tint?: string;
  vignette?: boolean;
}> = {
  normal: { filter: 'none' },
  crt: {
    filter: 'contrast(1.3) saturate(0.7) brightness(0.8) sepia(0.15)',
    scanlines: true,
    tint: 'hsla(40, 100%, 40%, 0.08)',
    vignette: true,
  },
  nvg: {
    filter: 'brightness(1.6) contrast(1.5) saturate(0)',
    tint: 'hsla(120, 100%, 30%, 0.35)',
    scanlines: true,
    vignette: true,
  },
  flir: {
    filter: 'grayscale(1) contrast(2.0) brightness(1.2) invert(1)',
    tint: 'hsla(200, 30%, 40%, 0.06)',
    vignette: true,
  },
  anime: {
    filter: 'saturate(2.2) contrast(1.2) brightness(1.1) hue-rotate(-5deg)',
    tint: 'hsla(280, 100%, 60%, 0.04)',
  },
  noir: {
    filter: 'grayscale(1) contrast(1.6) brightness(0.75)',
    tint: 'hsla(0, 0%, 0%, 0.15)',
    vignette: true,
  },
  snow: {
    filter: 'brightness(1.4) contrast(0.85) saturate(0.2) hue-rotate(15deg)',
    tint: 'hsla(200, 80%, 95%, 0.12)',
    vignette: true,
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
