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
  { id: 'ai', label: 'AI', icon: '⬡' },
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

const STYLE_PARAMS: Record<VisualStyle, { label: string; key: string; default: number }[]> = {
  normal: [],
  crt: [
    { label: 'Pixelation', key: 'pixelation', default: 30 },
    { label: 'Distortion', key: 'distortion', default: 20 },
    { label: 'Instability', key: 'instability', default: 50 },
  ],
  nvg: [
    { label: 'Gain', key: 'gain', default: 60 },
    { label: 'Bloom', key: 'bloom', default: 70 },
    { label: 'Scanlines', key: 'scanlines', default: 100 },
    { label: 'Pixelation', key: 'pixelation', default: 20 },
  ],
  flir: [
    { label: 'Sensitivity', key: 'sensitivity', default: 80 },
    { label: 'Bloom', key: 'bloom', default: 70 },
    { label: 'WHOT/BHOT', key: 'whot', default: 60 },
    { label: 'Pixelation', key: 'pixelation', default: 10 },
  ],
  anime: [
    { label: 'Saturation', key: 'saturation', default: 80 },
    { label: 'Bloom', key: 'bloom', default: 50 },
    { label: 'Edge Detect', key: 'edge', default: 30 },
  ],
  noir: [
    { label: 'Contrast', key: 'contrast', default: 70 },
    { label: 'Grain', key: 'grain', default: 40 },
    { label: 'Vignette', key: 'vignette', default: 60 },
  ],
  snow: [
    { label: 'Intensity', key: 'intensity', default: 50 },
    { label: 'Bloom', key: 'bloom', default: 40 },
    { label: 'Frost', key: 'frost', default: 30 },
  ],
  ai: [
    { label: 'Edge Strength', key: 'edge', default: 60 },
    { label: 'Scan Speed', key: 'scanSpeed', default: 50 },
    { label: 'Grid Opacity', key: 'gridOpacity', default: 40 },
  ],
};

export function computeStyleConfig(style: VisualStyle, params: Record<string, number>): StyleConfig {
  const p = (key: string, def: number) => params[key] ?? def;

  switch (style) {
    case 'crt': {
      const bloom = p('bloom', 100) / 100;
      const sharpen = p('sharpen', 56) / 100;
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
    case 'ai': {
      const edge = p('edge', 60) / 100;
      const scanSpeed = p('scanSpeed', 50) / 100;
      const gridOpacity = p('gridOpacity', 40) / 100;
      return {
        filter: `saturate(${0.3 + (1 - edge) * 0.3}) contrast(${1.1 + edge * 0.4}) brightness(${0.85 + scanSpeed * 0.2})`,
        tint: `hsla(180, 100%, 50%, ${0.02 + gridOpacity * 0.04})`,
        scanlines: true,
        scanlineOpacity: 0.03 + gridOpacity * 0.04,
        vignette: true,
        vignetteStrength: 0.3 + edge * 0.3,
      };
    }
    default:
      return { filter: 'none' };
  }
}

const StylePresetsBar = memo(() => {
  const { visualStyle, setVisualStyle, bottomPanelCollapsed, filterParams, setFilterParam } = useWorldViewStore();
  const [openSettings, setOpenSettings] = useState<VisualStyle | null>(null);

  const handlePresetClick = (id: VisualStyle) => {
    setVisualStyle(id);
    const params = STYLE_PARAMS[id];
    if (params.length > 0) {
      setOpenSettings(id);
    } else {
      setOpenSettings(null);
    }
  };

  const activeParams = openSettings ? STYLE_PARAMS[openSettings] : [];
  const getValue = (key: string, def: number) => filterParams[key] ?? def;

  return (
    <div className={`absolute left-1/2 -translate-x-1/2 z-30 pointer-events-auto transition-all duration-300 ${bottomPanelCollapsed ? 'bottom-[34px]' : 'bottom-[210px]'}`}>
      {/* Inline settings popup above the active preset */}
      {openSettings && activeParams.length > 0 && (
        <div className="mb-1 bg-background/40 backdrop-blur-sm border border-border/30 rounded-lg p-2 w-[180px] mx-auto animate-fade-in">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] font-display tracking-[0.15em] text-primary">{openSettings.toUpperCase()}</span>
            <button onClick={() => setOpenSettings(null)} className="text-muted-foreground hover:text-foreground text-[10px] leading-none">✕</button>
          </div>
          <div className="space-y-1.5">
            {activeParams.map(p => (
              <div key={p.key}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[8px] font-data text-muted-foreground">{p.label}</span>
                  <span className="text-[8px] font-data text-primary/80">{getValue(p.key, p.default)}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={getValue(p.key, p.default)}
                  onChange={e => setFilterParam(p.key, Number(e.target.value))}
                  className="w-full h-0.5 appearance-none bg-muted rounded cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_4px_rgba(0,255,136,0.4)]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset buttons */}
      <div className="flex items-center gap-0.5 bg-background/30 backdrop-blur-sm border border-border/30 rounded-lg p-1">
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => handlePresetClick(p.id)}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md transition-all min-w-[40px] ${
              visualStyle === p.id
                ? 'bg-primary/15 border border-primary/40 shadow-[0_0_8px_rgba(0,255,136,0.15)]'
                : 'hover:bg-muted/40 border border-transparent'
            }`}
          >
            <span className="text-sm leading-none">{p.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

StylePresetsBar.displayName = 'StylePresetsBar';
export default StylePresetsBar;
