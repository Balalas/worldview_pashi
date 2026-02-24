import { memo, useState } from 'react';
import { useWorldViewStore, LayerType, INSTABILITY_DATA, REGION_PRESETS, LANDMARK_PRESETS, LayerSubFilters } from '@/store/worldview';
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
    { key: 'showClouds', label: 'LIVE CLOUDS' },
    { key: 'showRadar', label: 'PRECIPITATION' },
    { key: 'cloudOpacity', label: 'CLOUD OPACITY', min: 0, max: 100, step: 5, suffix: '%' },
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
  const { layers, toggleLayer, leftPanelOpen, activeRegion, setActiveRegion, setMapCenter, satellites, aircraft, earthquakes, vessels, protests, outages, layerSubFilters, setSubFilter, toggleSubFilter } = useWorldViewStore();
  const [expandedLayer, setExpandedLayer] = useState<LayerType | null>(null);
  const [activeSection, setActiveSection] = useState<'layers' | 'intel'>('layers');

  if (!leftPanelOpen) return null;

  const handleRegion = (preset: typeof REGION_PRESETS[0]) => {
    setActiveRegion(preset.label);
    setMapCenter({ lat: preset.lat, lon: preset.lon, zoom: preset.zoom });
  };

  const milSats = satellites.filter(s => s.name.includes('COSMOS') || s.name.includes('USA-') || s.name.includes('MUOS') || s.name.includes('NROL')).length;

  return (
    <aside
      className="absolute top-10 left-2 z-40 animate-fade-in pointer-events-auto"
      style={{ maxHeight: 'calc(100vh - 60px)' }}
    >
      <div
        className="w-[240px] rounded-lg overflow-hidden flex flex-col"
        style={{
          background: 'hsla(210, 60%, 4%, 0.92)',
          backdropFilter: 'blur(20px) saturate(1.3)',
          border: '1px solid hsla(150, 100%, 50%, 0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 1px hsla(150, 100%, 50%, 0.1)',
          maxHeight: 'calc(100vh - 60px)',
        }}
      >
        {/* Section Tabs */}
        <div className="flex border-b border-border/50">
          <button onClick={() => setActiveSection('layers')}
            className={`flex-1 py-1.5 text-[8px] font-display tracking-[0.2em] transition-colors ${activeSection === 'layers' ? 'text-primary bg-primary/5 border-b border-primary/40' : 'text-muted-foreground hover:text-foreground'}`}
          >DATA LAYERS</button>
          <button onClick={() => setActiveSection('intel')}
            className={`flex-1 py-1.5 text-[8px] font-display tracking-[0.2em] transition-colors ${activeSection === 'intel' ? 'text-primary bg-primary/5 border-b border-primary/40' : 'text-muted-foreground hover:text-foreground'}`}
          >INTEL</button>
        </div>

        <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 110px)' }}>
          {activeSection === 'layers' ? (
            <>
              {/* Layers */}
              <div className="p-2">
                <div className="space-y-0.5">
                  {LAYER_CONFIG.map(({ key, label, shortcut, colorClass }) => {
                    const hasSubs = !!LAYER_SUB_OPTIONS[key];
                    const isExpanded = expandedLayer === key;
                    return (
                      <div key={key}>
                        <div className="flex items-center">
                          <button onClick={() => toggleLayer(key)} className="flex-1 flex items-center justify-between px-2 py-0.5 rounded text-xs hover:bg-primary/5 transition-colors group">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${layers[key] ? colorClass : 'bg-muted/30'} transition-colors`} />
                              <span className={`font-display tracking-wider text-[10px] ${layers[key] ? 'text-foreground' : 'text-muted-foreground/60'}`}>{label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[8px] font-data ${layers[key] ? 'text-primary' : 'text-muted/40'}`}>{layers[key] ? 'ON' : '—'}</span>
                              {shortcut && <span className="text-[7px] font-data text-muted/30 opacity-0 group-hover:opacity-100">[{shortcut}]</span>}
                            </div>
                          </button>
                          {hasSubs && layers[key] && (
                            <button onClick={() => setExpandedLayer(isExpanded ? null : key)} className="px-1 py-0.5 text-[8px] text-muted-foreground hover:text-primary transition-colors">
                              {isExpanded ? '▾' : '▸'}
                            </button>
                          )}
                        </div>
                        {hasSubs && isExpanded && layers[key] && (
                          <div className="ml-5 pl-2 border-l border-primary/10 py-1 space-y-0.5 mb-1">
                            {LAYER_SUB_OPTIONS[key]!.map((opt) => {
                              if (isSlider(opt)) {
                                const val = layerSubFilters[opt.key] as number;
                                return (
                                  <div key={opt.key} className="px-1">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="text-[8px] font-data text-muted-foreground/70">{opt.label}</span>
                                      <span className="text-[8px] font-data text-primary/80">{val}{opt.suffix}</span>
                                    </div>
                                    <Slider min={opt.min} max={opt.max} step={opt.step} value={[val]} onValueChange={([v]) => setSubFilter(opt.key, v)} className="h-3" />
                                  </div>
                                );
                              }
                              const checked = layerSubFilters[opt.key] as boolean;
                              return (
                                <button key={opt.key} onClick={() => toggleSubFilter(opt.key)}
                                  className="w-full flex items-center justify-between px-1 py-0.5 rounded text-[9px] hover:bg-primary/5 transition-colors">
                                  <span className={`font-data tracking-wider ${checked ? 'text-foreground/80' : 'text-muted-foreground/30'}`}>{opt.label}</span>
                                  <span className={`text-[7px] font-data ${checked ? 'text-primary' : 'text-muted/30'}`}>{checked ? '●' : '○'}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Traffic sub-option */}
                  <div>
                    <button onClick={() => toggleSubFilter('showTraffic')} className="w-full flex items-center justify-between px-2 py-0.5 rounded text-xs hover:bg-primary/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${layerSubFilters.showTraffic ? 'bg-primary' : 'bg-muted/30'} transition-colors`} />
                        <span className={`font-display tracking-wider text-[10px] ${layerSubFilters.showTraffic ? 'text-foreground' : 'text-muted-foreground/60'}`}>TRAFFIC</span>
                      </div>
                      <span className={`text-[8px] font-data ${layerSubFilters.showTraffic ? 'text-primary' : 'text-muted/40'}`}>{layerSubFilters.showTraffic ? 'ON' : '—'}</span>
                    </button>
                    {layerSubFilters.showTraffic && (
                      <div className="ml-5 pl-2 border-l border-primary/10 py-1 px-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[8px] font-data text-muted-foreground/70">DENSITY</span>
                          <span className="text-[8px] font-data text-primary/80">{layerSubFilters.trafficDensity}%</span>
                        </div>
                        <Slider min={0} max={100} step={5} value={[layerSubFilters.trafficDensity]} onValueChange={([v]) => setSubFilter('trafficDensity', v)} className="h-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Region Presets */}
              <div className="px-2 pb-2 border-t border-border/30 pt-2">
                <div className="text-[8px] font-display tracking-[0.2em] text-muted-foreground/60 mb-1.5">REGION</div>
                <div className="flex flex-wrap gap-0.5">
                  {REGION_PRESETS.map((preset) => (
                    <button key={preset.label} onClick={() => handleRegion(preset)}
                      className={`px-1.5 py-0.5 text-[8px] font-display tracking-wider rounded transition-colors ${activeRegion === preset.label ? 'text-primary bg-primary/10 border border-primary/20' : 'text-muted-foreground/50 hover:text-foreground border border-transparent'}`}>
                      {preset.emoji} {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Live Stats */}
              <div className="p-2">
                <div className="grid grid-cols-2 gap-1">
                  <StatBox label="AIRCRAFT" value={aircraft.length} color="text-signal-aircraft" />
                  <StatBox label="MIL FLIGHTS" value={aircraft.filter(a => a.isMilitary).length} color="text-signal-military" />
                  <StatBox label="SATELLITES" value={satellites.length} color="text-signal-satellite" />
                  <StatBox label="MIL SATS" value={milSats} color="text-signal-military" />
                  <StatBox label="VESSELS" value={vessels.length} color="text-signal-vessel" />
                  <StatBox label="QUAKES 24H" value={earthquakes.length} color="text-signal-earthquake" />
                  <StatBox label="PROTESTS" value={protests.length} color="text-signal-protest" />
                  <StatBox label="CYBER/OUT" value={outages.length} color="text-signal-outage" />
                  <StatBox label="CABLES" value={SUBMARINE_CABLES.length} color="text-signal-cable" />
                </div>
              </div>

              {/* Instability Index */}
              <div className="px-2 pb-2 border-t border-border/30 pt-2">
                <div className="text-[8px] font-display tracking-[0.2em] text-muted-foreground/60 mb-1.5">INSTABILITY INDEX</div>
                <div className="space-y-1">
                  {INSTABILITY_DATA.map((item, i) => (
                    <div key={item.country} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-data text-muted/40 text-[9px] w-3">{i + 1}.</span>
                        <span>{item.flag}</span>
                        <span className="font-display tracking-wide">{item.country}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`font-data text-[10px] font-bold ${item.level === 'critical' ? 'text-alert-critical' : item.level === 'high' ? 'text-alert-high' : 'text-alert-medium'}`}>{item.score}</span>
                        <span className="text-[8px]">{item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '─'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
});

const StatBox = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="rounded border border-border/30 p-1.5 text-center" style={{ background: 'hsla(210, 50%, 6%, 0.6)' }}>
    <div className={`font-data text-sm font-bold ${color}`}>{value.toLocaleString()}</div>
    <div className="text-[7px] font-display tracking-wider text-muted-foreground/50">{label}</div>
  </div>
);

LeftPanel.displayName = 'LeftPanel';
export default LeftPanel;
