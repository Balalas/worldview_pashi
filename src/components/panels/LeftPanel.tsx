import { memo, useState } from 'react';
import { useWorldViewStore, LayerType, INSTABILITY_DATA, MARKET_DATA, REGION_PRESETS, NUCLEAR_SITES, LayerSubFilters } from '@/store/worldview';
import { PIZZA_INDEX_DATA } from '@/services/dataServices';
import { SUBMARINE_CABLES } from '@/data/submarineCables';
import { Slider } from '@/components/ui/slider';

const LAYER_CONFIG: { key: LayerType; label: string; shortcut: string; colorClass: string }[] = [
  { key: 'aircraft', label: 'AIRCRAFT', shortcut: 'A', colorClass: 'bg-signal-aircraft' },
  { key: 'satellites', label: 'SATELLITES', shortcut: 'S', colorClass: 'bg-signal-satellite' },
  { key: 'vessels', label: 'VESSELS', shortcut: 'V', colorClass: 'bg-signal-vessel' },
  { key: 'militaryFlights', label: 'MILITARY', shortcut: 'M', colorClass: 'bg-signal-military' },
  { key: 'underseaCables', label: 'CABLES', shortcut: 'U', colorClass: 'bg-signal-cable' },
  { key: 'conflicts', label: 'CONFLICTS', shortcut: 'X', colorClass: 'bg-alert-critical' },
  { key: 'protests', label: 'PROTESTS', shortcut: 'P', colorClass: 'bg-signal-protest' },
  { key: 'outages', label: 'OUTAGES/CYBER', shortcut: 'O', colorClass: 'bg-signal-outage' },
  { key: 'volcanoes', label: 'VOLCANOES', shortcut: '', colorClass: 'bg-alert-high' },
  { key: 'weather', label: 'WEATHER', shortcut: 'W', colorClass: 'bg-signal-camera' },
  { key: 'earthquakes', label: 'QUAKES', shortcut: 'E', colorClass: 'bg-signal-earthquake' },
  { key: 'nuclearSites', label: 'NUCLEAR', shortcut: 'N', colorClass: 'bg-signal-nuclear' },
  { key: 'fires', label: 'FIRES', shortcut: 'F', colorClass: 'bg-signal-fire' },
  { key: 'cameras', label: 'CAMERAS', shortcut: 'C', colorClass: 'bg-signal-camera' },
];

type SubToggle = { key: keyof LayerSubFilters; label: string };
type SubSlider = { key: keyof LayerSubFilters; label: string; min: number; max: number; step: number; suffix?: string };
type SubOption = SubToggle | SubSlider;
function isSlider(o: SubOption): o is SubSlider { return 'min' in o; }

const LAYER_SUB_OPTIONS: Partial<Record<LayerType, SubOption[]>> = {
  satellites: [
    { key: 'showStarlink', label: 'STARLINK' },
    { key: 'showMilitarySats', label: 'MILITARY' },
    { key: 'showDebris', label: 'DEBRIS' },
    { key: 'showCommSats', label: 'COMMS/SCI' },
  ],
  aircraft: [
    { key: 'showCivilian', label: 'CIVILIAN' },
    { key: 'showMilitaryAC', label: 'MILITARY' },
    { key: 'showHelicopters', label: 'HELICOPTERS' },
    { key: 'maxAircraft', label: 'DENSITY', min: 0, max: 100, step: 5, suffix: '%' },
  ],
  vessels: [
    { key: 'showYachts', label: 'YACHTS' },
    { key: 'showCargo', label: 'CARGO' },
    { key: 'showTankers', label: 'TANKERS' },
    { key: 'showMilVessels', label: 'MILITARY' },
    { key: 'showFishing', label: 'FISHING' },
    { key: 'showPassenger', label: 'PASSENGER' },
  ],
  earthquakes: [
    { key: 'minMagnitude', label: 'MIN MAG', min: 1, max: 8, step: 0.5, suffix: '' },
  ],
  weather: [
    { key: 'showExtremeOnly', label: 'EXTREME ONLY' },
  ],
  fires: [
    { key: 'showWildfires', label: 'WILDFIRES' },
    { key: 'showStorms', label: 'STORMS/FLOODS' },
  ],
  nuclearSites: [
    { key: 'showWeapons', label: 'WEAPONS' },
    { key: 'showPower', label: 'POWER/ENRICH' },
  ],
};

const LeftPanel = memo(() => {
  const { layers, toggleLayer, leftPanelOpen, activeRegion, setActiveRegion, setMapCenter, satellites, aircraft, earthquakes, volcanoes, vessels, protests, outages, layerSubFilters, setSubFilter, toggleSubFilter } = useWorldViewStore();
  const [expandedLayer, setExpandedLayer] = useState<LayerType | null>(null);

  if (!leftPanelOpen) return null;

  const handleRegion = (preset: typeof REGION_PRESETS[0]) => {
    setActiveRegion(preset.label);
    setMapCenter({ lat: preset.lat, lon: preset.lon, zoom: preset.zoom });
  };

  const milSats = satellites.filter(s => s.name.includes('COSMOS') || s.name.includes('USA-') || s.name.includes('MUOS') || s.name.includes('NROL')).length;
  const yachts = vessels.filter(v => v.type === 'yacht').length;
  const milVessels = vessels.filter(v => v.type === 'military').length;

  return (
    <aside className="glass-panel w-[260px] overflow-y-auto border-r border-border flex flex-col z-40 animate-fade-in">
      {/* Layers */}
      <div className="p-3 border-b border-border">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">DATA LAYERS</h2>
        <div className="space-y-0.5">
          {LAYER_CONFIG.map(({ key, label, shortcut, colorClass }) => {
            const hasSubs = !!LAYER_SUB_OPTIONS[key];
            const isExpanded = expandedLayer === key;
            return (
              <div key={key}>
                <div className="flex items-center">
                  <button onClick={() => toggleLayer(key)} className="flex-1 flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-card-hover transition-colors group">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${layers[key] ? colorClass : 'bg-text-muted-custom'} transition-colors`} />
                      <span className={`font-display tracking-wider text-[11px] ${layers[key] ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-data ${layers[key] ? 'text-primary' : 'text-text-muted-custom'}`}>{layers[key] ? 'ON' : 'OFF'}</span>
                      {shortcut && <span className="text-[9px] font-data text-text-muted-custom opacity-0 group-hover:opacity-100 transition-opacity">[{shortcut}]</span>}
                    </div>
                  </button>
                  {hasSubs && layers[key] && (
                    <button onClick={() => setExpandedLayer(isExpanded ? null : key)} className="px-1.5 py-1 text-[9px] text-muted-foreground hover:text-primary transition-colors">
                      {isExpanded ? '▾' : '▸'}
                    </button>
                  )}
                </div>
                {/* Sub-options */}
                {hasSubs && isExpanded && layers[key] && (
                  <div className="ml-5 pl-2 border-l border-border/50 py-1 space-y-1 mb-1">
                    {LAYER_SUB_OPTIONS[key]!.map((opt) => {
                      if (isSlider(opt)) {
                        const val = layerSubFilters[opt.key] as number;
                        return (
                          <div key={opt.key} className="px-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[9px] font-data text-muted-foreground">{opt.label}</span>
                              <span className="text-[9px] font-data text-primary">{val}{opt.suffix}</span>
                            </div>
                            <Slider
                              min={opt.min} max={opt.max} step={opt.step}
                              value={[val]}
                              onValueChange={([v]) => setSubFilter(opt.key, v)}
                              className="h-3"
                            />
                          </div>
                        );
                      }
                      const checked = layerSubFilters[opt.key] as boolean;
                      return (
                        <button key={opt.key} onClick={() => toggleSubFilter(opt.key)}
                          className="w-full flex items-center justify-between px-1 py-0.5 rounded text-[10px] hover:bg-card-hover transition-colors">
                          <span className={`font-data tracking-wider ${checked ? 'text-foreground' : 'text-muted-foreground/50'}`}>{opt.label}</span>
                          <span className={`text-[8px] font-data ${checked ? 'text-primary' : 'text-text-muted-custom'}`}>{checked ? '●' : '○'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {/* Traffic sub-option (standalone) */}
          <div>
            <button onClick={() => toggleSubFilter('showTraffic')} className="w-full flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-card-hover transition-colors">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${layerSubFilters.showTraffic ? 'bg-primary' : 'bg-text-muted-custom'} transition-colors`} />
                <span className={`font-display tracking-wider text-[11px] ${layerSubFilters.showTraffic ? 'text-foreground' : 'text-muted-foreground'}`}>TRAFFIC</span>
              </div>
              <span className={`text-[9px] font-data ${layerSubFilters.showTraffic ? 'text-primary' : 'text-text-muted-custom'}`}>{layerSubFilters.showTraffic ? 'ON' : 'OFF'}</span>
            </button>
            {layerSubFilters.showTraffic && (
              <div className="ml-5 pl-2 border-l border-border/50 py-1 px-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-data text-muted-foreground">DENSITY</span>
                  <span className="text-[9px] font-data text-primary">{layerSubFilters.trafficDensity}%</span>
                </div>
                <Slider min={0} max={100} step={5} value={[layerSubFilters.trafficDensity]} onValueChange={([v]) => setSubFilter('trafficDensity', v)} className="h-3" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regional Presets */}
      <div className="p-3 border-b border-border">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">REGION</h2>
        <div className="flex flex-wrap gap-1">
          {REGION_PRESETS.map((preset) => (
            <button key={preset.label} onClick={() => handleRegion(preset)}
              className={`px-2 py-0.5 text-[9px] font-display tracking-wider rounded border ${activeRegion === preset.label ? 'border-primary/30 text-primary bg-primary/10' : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/20'} transition-colors`}>
              {preset.emoji} {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Stats */}
      <div className="p-3 border-b border-border">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">LIVE STATS</h2>
        <div className="grid grid-cols-2 gap-1.5">
          <StatBox label="AIRCRAFT" value={aircraft.length} color="text-signal-aircraft" />
          <StatBox label="MIL FLIGHTS" value={aircraft.filter(a => a.isMilitary).length} color="text-signal-military" />
          <StatBox label="SATELLITES" value={satellites.length} color="text-signal-satellite" />
          <StatBox label="MIL SATS" value={milSats} color="text-signal-military" />
          <StatBox label="VESSELS" value={vessels.length} color="text-signal-vessel" />
          <StatBox label="YACHTS" value={yachts} color="text-alert-medium" />
          <StatBox label="MIL SHIPS" value={milVessels} color="text-alert-critical" />
          <StatBox label="QUAKES 24H" value={earthquakes.length} color="text-signal-earthquake" />
          <StatBox label="PROTESTS" value={protests.length} color="text-signal-protest" />
          <StatBox label="CYBER/OUT" value={outages.length} color="text-signal-outage" />
          <StatBox label="CABLES" value={SUBMARINE_CABLES.length} color="text-signal-cable" />
          <StatBox label="VOLCANOES" value={volcanoes.filter(v => v.status === 'erupting').length} color="text-alert-high" />
        </div>
      </div>

      {/* Intelligence Overview */}
      <div className="p-3 border-b border-border">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">INSTABILITY INDEX</h2>
        <div className="space-y-1.5">
          {INSTABILITY_DATA.map((item, i) => (
            <div key={item.country} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-data text-text-muted-custom text-[10px] w-3">{i + 1}.</span>
                <span>{item.flag}</span>
                <span className="font-display tracking-wide text-[11px]">{item.country}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`font-data text-[11px] font-bold ${item.level === 'critical' ? 'text-alert-critical' : item.level === 'high' ? 'text-alert-high' : 'text-alert-medium'}`}>{item.score}</span>
                <span className="text-[9px] text-muted-foreground">/100</span>
                <span className="text-[10px]">{item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '─'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Markets */}
      <div className="p-3 border-b border-border">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">MARKETS</h2>
        <div className="space-y-1">
          {MARKET_DATA.map((m) => (
            <div key={m.symbol} className="flex items-center justify-between text-[11px]">
              <span className="font-display tracking-wide text-muted-foreground">{m.symbol}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-data text-foreground">{m.value}</span>
                <span className={`font-data text-[10px] ${m.up ? 'text-signal-aircraft' : 'text-alert-critical'}`}>{m.up ? '▲' : '▼'} {m.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pizza Index Mini */}
      <div className="p-3 flex-1">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">🍕 PIZZA INDEX</h2>
        <div className="space-y-1">
          {PIZZA_INDEX_DATA.slice(0, 5).map((entry) => (
            <div key={entry.country} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{entry.flag}</span>
                <span className="font-display tracking-wide text-muted-foreground">{entry.country}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-data text-foreground">${entry.usdPrice.toFixed(2)}</span>
                <span className={`font-data text-[10px] ${entry.index > 105 ? 'text-alert-high' : entry.index >= 95 ? 'text-primary' : 'text-alert-info'}`}>{entry.index}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
});

const StatBox = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="bg-card-bg/60 rounded border border-border p-1.5 text-center">
    <div className={`font-data text-sm font-bold ${color}`}>{value.toLocaleString()}</div>
    <div className="text-[8px] font-display tracking-wider text-muted-foreground">{label}</div>
  </div>
);

LeftPanel.displayName = 'LeftPanel';
export default LeftPanel;
