import { memo } from 'react';
import { useWorldViewStore, VisualStyle } from '@/store/worldview';

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

const GLOBAL_PARAMS = [
  { label: '✨ BLOOM', key: 'bloom', default: 100 },
  { label: '◎ SHARPEN', key: 'sharpen', default: 56 },
];

const StyleParametersPanel = memo(() => {
  const { visualStyle, filterParams, setFilterParam } = useWorldViewStore();
  const params = STYLE_PARAMS[visualStyle];

  if (visualStyle === 'normal') return null;

  const getValue = (key: string, def: number) => filterParams[key] ?? def;

  const styleLabel = visualStyle.toUpperCase();
  const styleColors: Record<string, string> = {
    nvg: 'text-green-400', flir: 'text-cyan-300', crt: 'text-amber-400',
    noir: 'text-foreground', anime: 'text-pink-400', snow: 'text-blue-300',
    ai: 'text-cyan-400',
  };
  const styleColor = styleColors[visualStyle] || 'text-primary';

  return (
    <div className="absolute top-1/3 right-3 z-30 pointer-events-auto w-[180px]">
      {/* Active style label */}
      <div className="text-right mb-2">
        <span className="text-[9px] font-data text-muted-foreground tracking-wider">ACTIVE STYLE</span>
        <div className={`text-lg font-display tracking-[0.2em] font-bold ${styleColor}`}>{styleLabel}</div>
      </div>

      {/* Global sliders */}
      {GLOBAL_PARAMS.map(gp => (
        <SliderBox
          key={gp.key}
          label={gp.label}
          value={getValue(gp.key, gp.default)}
          onChange={v => setFilterParam(gp.key, v)}
        />
      ))}

      {/* Per-style parameters */}
      {params.length > 0 && (
        <div className="mt-2 border border-border/50 rounded bg-background/70 backdrop-blur-sm p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-display tracking-[0.15em] text-muted-foreground">PARAMETERS</span>
          </div>
          <div className="space-y-2">
            {params.map(p => (
              <ParamSlider
                key={p.key}
                label={p.label}
                value={getValue(p.key, p.default)}
                onChange={v => setFilterParam(p.key, v)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const SliderBox = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="border border-border/50 rounded bg-background/70 backdrop-blur-sm p-2 mb-1">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[9px] font-display tracking-[0.1em] text-primary">{label}</span>
      <span className="text-[9px] font-data text-muted-foreground">{value}%</span>
    </div>
    <input
      type="range" min="0" max="100" value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1 appearance-none bg-muted rounded cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,255,136,0.4)]"
    />
  </div>
);

const ParamSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-2">
    <span className="text-[9px] font-data text-muted-foreground w-[72px] truncate">{label}</span>
    <input
      type="range" min="0" max="100" value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="flex-1 h-0.5 appearance-none bg-muted rounded cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_0_4px_rgba(0,212,255,0.4)]"
    />
  </div>
);

StyleParametersPanel.displayName = 'StyleParametersPanel';
export default StyleParametersPanel;
