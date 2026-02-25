import { memo } from 'react';
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

export interface StyleConfig {
  filter: string;
  scanlines?: boolean;
  tint?: string;
  vignette?: boolean;
  crt?: boolean;
  vignetteStrength?: number;
  scanlineOpacity?: number;
}

/**
 * Computes the live CSS filter string + overlay config from store params.
 * Each style maps its sliders into real CSS filter values.
 */
export function computeStyleConfig(style: VisualStyle, params: Record<string, number>): StyleConfig {
  const p = (key: string, def: number) => params[key] ?? def;

  switch (style) {
    case 'crt': {
      const bloom = p('bloom', 100) / 100;       // 0-1 maps to brightness boost
      const sharpen = p('sharpen', 56) / 100;     // contrast boost
      const pixelation = p('pixelation', 30) / 100;
      const distortion = p('distortion', 20) / 100;
      const instability = p('instability', 50) / 100;
      return {
        filter: `contrast(${1 + sharpen * 0.5}) saturate(${0.4 + (1 - pixelation) * 0.4}) brightness(${0.6 + bloom * 0.3}) sepia(${0.1 + distortion * 0.2})`,
        scanlines: true,
        tint: `hsla(40, 100%, 35%, ${0.03 + instability * 0.06})`,
        vignette: true,
        crt: true,
        vignetteStrength: 0.6 + distortion * 0.3,
        scanlineOpacity: 0.08 + pixelation * 0.1,
      };
    }
    case 'nvg': {
      const gain = p('gain', 60) / 100;
      const bloom = p('bloom', 70) / 100;
      const scanlines = p('scanlines', 100) / 100;
      const pixelation = p('pixelation', 20) / 100;
      return {
        filter: `brightness(${1 + gain * 0.8}) contrast(${1 + bloom * 0.6}) saturate(0)`,
        scanlines: scanlines > 0.1,
        tint: `hsla(120, 100%, 30%, ${0.2 + gain * 0.2})`,
        vignette: true,
        vignetteStrength: 0.5 + pixelation * 0.3,
        scanlineOpacity: 0.04 + scanlines * 0.06,
      };
    }
    case 'flir': {
      const sensitivity = p('sensitivity', 80) / 100;
      const bloom = p('bloom', 70) / 100;
      const whot = p('whot', 60) / 100;
      const pixelation = p('pixelation', 10) / 100;
      return {
        filter: `grayscale(1) contrast(${1.2 + sensitivity * 1.0}) brightness(${0.9 + bloom * 0.4}) ${whot > 0.5 ? 'invert(1)' : 'invert(0)'}`,
        tint: `hsla(200, 30%, 40%, ${0.03 + pixelation * 0.05})`,
        vignette: true,
        vignetteStrength: 0.4 + pixelation * 0.3,
      };
    }
    case 'anime': {
      const saturation = p('saturation', 80) / 100;
      const bloom = p('bloom', 50) / 100;
      const edge = p('edge', 30) / 100;
      return {
        filter: `saturate(${1 + saturation * 1.5}) contrast(${1 + edge * 0.3}) brightness(${0.95 + bloom * 0.2}) hue-rotate(${-5 + edge * 5}deg)`,
        tint: `hsla(280, 100%, 60%, ${0.02 + bloom * 0.03})`,
      };
    }
    case 'noir': {
      const contrast = p('contrast', 70) / 100;
      const grain = p('grain', 40) / 100;
      const vignette = p('vignette', 60) / 100;
      return {
        filter: `grayscale(${0.7 + grain * 0.3}) contrast(${1.2 + contrast * 0.6}) brightness(${0.65 + (1 - contrast) * 0.25})`,
        tint: `hsla(0, 0%, 0%, ${0.05 + grain * 0.12})`,
        vignette: vignette > 0.1,
        vignetteStrength: 0.3 + vignette * 0.5,
      };
    }
    case 'snow': {
      const intensity = p('intensity', 50) / 100;
      const bloom = p('bloom', 40) / 100;
      const frost = p('frost', 30) / 100;
      return {
        filter: `brightness(${1.1 + bloom * 0.4}) contrast(${0.8 + (1 - frost) * 0.15}) saturate(${0.1 + (1 - intensity) * 0.3}) hue-rotate(${10 + frost * 10}deg)`,
        tint: `hsla(200, 80%, 95%, ${0.05 + intensity * 0.1})`,
        vignette: true,
        vignetteStrength: 0.3 + frost * 0.3,
      };
    }
    default:
      return { filter: 'none' };
  }
}

const StylePresetsBar = memo(() => {
  const { visualStyle, setVisualStyle, bottomPanelCollapsed } = useWorldViewStore();

  return (
    <div className={`absolute left-1/2 -translate-x-1/2 z-30 pointer-events-auto transition-all duration-300 ${bottomPanelCollapsed ? 'bottom-[34px]' : 'bottom-[210px]'}`}>
      <div className="flex items-center gap-0.5 bg-background/30 backdrop-blur-sm border border-border/30 rounded-lg p-1">
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
