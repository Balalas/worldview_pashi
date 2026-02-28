import { memo, useCallback, useState } from 'react';
import { useWorldViewStore, REGION_PRESETS, LANDMARK_PRESETS, VisualStyle } from '@/store/worldview';

const STYLE_PRESETS: { id: VisualStyle; label: string; icon: string }[] = [
  { id: 'normal', label: 'Normal', icon: '◯' },
  { id: 'crt', label: 'CRT', icon: '▣' },
  { id: 'nvg', label: 'NVG', icon: '🌙' },
  { id: 'flir', label: 'FLIR', icon: '🌡' },
  { id: 'anime', label: 'Anime', icon: '✦' },
  { id: 'noir', label: 'Noir', icon: '◐' },
  { id: 'snow', label: 'Snow', icon: '❄' },
  { id: 'ai', label: 'AI', icon: '⬡' },
];

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

const CATEGORIES = [
  { key: 'regions', label: 'REGIONS' },
  { key: 'wonders', label: 'WONDERS' },
  { key: 'cities', label: 'CITIES' },
  { key: 'nature', label: 'NATURE' },
  { key: 'military', label: 'MILITARY' },
  { key: 'space', label: 'SPACE' },
  { key: 'history', label: 'HISTORY' },
] as const;

type CategoryKey = typeof CATEGORIES[number]['key'];

const LANDMARK_CATEGORIES: Record<Exclude<CategoryKey, 'regions'>, string[]> = {
  wonders: ['GREAT WALL', 'PYRAMIDS', 'MACHU PICCHU', 'TAJ MAHAL', 'COLOSSEUM', 'PETRA', 'CHRIST REDEEMER', 'CHICHEN ITZA'],
  cities: ['NEW YORK', 'LONDON', 'PARIS', 'TOKYO', 'DUBAI', 'SYDNEY', 'MOSCOW', 'HONG KONG', 'SINGAPORE', 'SAN FRANCISCO', 'ISTANBUL', 'ROME', 'BEIJING', 'CAIRO'],
  nature: ['GRAND CANYON', 'NIAGARA FALLS', 'MT EVEREST', 'MT FUJI', 'VICTORIA FALLS', 'ULURU', 'AURORA / TROMSØ', 'AMAZON RIVER', 'SAHARA DESERT', 'GREAT BARRIER REEF', 'YELLOWSTONE', 'DEAD SEA'],
  military: ['PENTAGON', 'AREA 51', 'KREMLIN', 'DMZ KOREA', 'DIEGO GARCIA', 'RAMSTEIN AFB', 'GUANTÁNAMO'],
  space: ['CAPE CANAVERAL', 'BAIKONUR', 'CERN', 'SILICON VALLEY'],
  history: ['ACROPOLIS', 'ANGKOR WAT', 'STONEHENGE', 'POMPEII', 'EASTER ISLAND', 'FORBIDDEN CITY', 'VERSAILLES', 'AUSCHWITZ', 'HIROSHIMA'],
};

const GlobeControls = memo(() => {
  const { setMapCenter, bottomPanelCollapsed, visualStyle, setVisualStyle, filterParams, setFilterParam } = useWorldViewStore();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('regions');
  const [expanded, setExpanded] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [styleSettingsOpen, setStyleSettingsOpen] = useState<VisualStyle | null>(null);

  const flyTo = useCallback((lat: number, lon: number, zoom: number) => {
    setMapCenter({ lat, lon, zoom });
  }, [setMapCenter]);

  const getItems = () => {
    if (activeCategory === 'regions') return REGION_PRESETS;
    const labels = LANDMARK_CATEGORIES[activeCategory];
    return LANDMARK_PRESETS.filter(l => labels.includes(l.label));
  };

  const items = getItems();

  const handlePresetClick = (id: VisualStyle) => {
    setVisualStyle(id);
    const params = STYLE_PARAMS[id];
    setStyleSettingsOpen(params.length > 0 ? id : null);
  };

  const activeParams = styleSettingsOpen ? STYLE_PARAMS[styleSettingsOpen] : [];
  const getValue = (key: string, def: number) => filterParams[key] ?? def;

  return (
    <div className={`absolute left-1/2 -translate-x-1/2 z-30 pointer-events-auto transition-all duration-300 bottom-[28px]`}>
      {/* Style parameter sliders */}
      {styleSettingsOpen && activeParams.length > 0 && (
        <div className="mb-1 bg-background/40 backdrop-blur-sm border border-border/30 rounded-lg p-2 w-[180px] mx-auto animate-fade-in">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] font-display tracking-[0.15em] text-primary">{styleSettingsOpen.toUpperCase()}</span>
            <button onClick={() => setStyleSettingsOpen(null)} className="text-muted-foreground hover:text-foreground text-[10px] leading-none">✕</button>
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

      {/* Collapsible style presets row */}
      {styleOpen && (
        <div className="mb-1 flex items-center justify-center gap-0.5 bg-background/30 backdrop-blur-sm border border-border/30 rounded-lg p-1 animate-fade-in">
          {STYLE_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => handlePresetClick(p.id)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md transition-all min-w-[40px] ${
                visualStyle === p.id
                  ? 'bg-primary/15 border border-primary/40 shadow-[0_0_8px_rgba(0,255,136,0.15)]'
                  : 'hover:bg-muted/40 border border-transparent'
              }`}
              title={p.label}
            >
              <span className="text-sm leading-none">{p.icon}</span>
            </button>
          ))}
        </div>
      )}

      {/* Expanded landmark list */}
      {expanded && (
        <div className="mb-1 flex flex-wrap items-center justify-center gap-0.5 max-w-[420px] mx-auto animate-fade-in">
          {items.map((r) => (
            <button
              key={r.label}
              onClick={() => flyTo(r.lat, r.lon, r.zoom)}
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-[7px] font-data tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors whitespace-nowrap bg-background/20 backdrop-blur-sm border border-border/20"
            >
              <span>{r.emoji}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Category bar with style toggle */}
      <div className="flex items-center justify-center gap-0.5 bg-background/20 backdrop-blur-sm border border-border/20 rounded-lg p-0.5 px-1">
        <button
          onClick={() => { setStyleOpen(!styleOpen); if (styleOpen) setStyleSettingsOpen(null); }}
          className={`px-1.5 py-0.5 text-[7px] font-data tracking-wider rounded transition-colors whitespace-nowrap ${
            styleOpen ? 'bg-primary/15 text-primary' : 'text-muted-foreground/60 hover:text-primary hover:bg-primary/10'
          }`}
          title="Visual filters"
        >
          🎨 STYLE
        </button>
        <div className="w-px h-3 bg-border/30 mx-0.5" />
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[7px] font-data text-muted-foreground/60 hover:text-primary px-1 transition-colors"
          title="Toggle landmarks"
        >
          {expanded ? '▾' : '▸'}
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => { setActiveCategory(c.key); if (!expanded) setExpanded(true); }}
            className={`px-1.5 py-0.5 text-[7px] font-data tracking-wider rounded transition-colors whitespace-nowrap ${
              activeCategory === c.key && expanded
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground/60 hover:text-primary hover:bg-primary/10'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
});

GlobeControls.displayName = 'GlobeControls';
export default GlobeControls;
