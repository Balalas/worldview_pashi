import { memo } from 'react';
import { useWorldViewStore, LayerType, INSTABILITY_DATA, MARKET_DATA, REGION_PRESETS } from '@/store/worldview';
import { PIZZA_INDEX_DATA } from '@/services/dataServices';

const LAYER_CONFIG: { key: LayerType; label: string; shortcut: string; colorClass: string }[] = [
  { key: 'aircraft', label: 'AIRCRAFT', shortcut: 'A', colorClass: 'bg-signal-aircraft' },
  { key: 'satellites', label: 'SATELLITES', shortcut: 'S', colorClass: 'bg-signal-satellite' },
  { key: 'cameras', label: 'CAMERAS', shortcut: 'C', colorClass: 'bg-signal-camera' },
  { key: 'militaryFlights', label: 'MILITARY', shortcut: 'M', colorClass: 'bg-signal-military' },
  { key: 'vessels', label: 'VESSELS', shortcut: 'V', colorClass: 'bg-signal-vessel' },
  { key: 'nuclearSites', label: 'NUCLEAR', shortcut: 'N', colorClass: 'bg-signal-nuclear' },
  { key: 'underseaCables', label: 'CABLES', shortcut: 'U', colorClass: 'bg-signal-cable' },
  { key: 'conflicts', label: 'CONFLICTS', shortcut: 'X', colorClass: 'bg-alert-critical' },
  { key: 'protests', label: 'PROTESTS', shortcut: 'P', colorClass: 'bg-signal-protest' },
  { key: 'earthquakes', label: 'QUAKES', shortcut: 'E', colorClass: 'bg-signal-earthquake' },
  { key: 'fires', label: 'FIRES', shortcut: 'F', colorClass: 'bg-signal-fire' },
  { key: 'outages', label: 'OUTAGES', shortcut: 'O', colorClass: 'bg-signal-outage' },
];

const LeftPanel = memo(() => {
  const { layers, toggleLayer, leftPanelOpen, activeRegion, setActiveRegion, setMapCenter } = useWorldViewStore();

  if (!leftPanelOpen) return null;

  const handleRegion = (preset: typeof REGION_PRESETS[0]) => {
    setActiveRegion(preset.label);
    setMapCenter({ lat: preset.lat, lon: preset.lon, zoom: preset.zoom });
  };

  return (
    <aside className="glass-panel w-[280px] overflow-y-auto border-r border-border flex flex-col z-40">
      {/* Layers */}
      <div className="p-3 border-b border-border">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">DATA LAYERS</h2>
        <div className="space-y-1">
          {LAYER_CONFIG.map(({ key, label, shortcut, colorClass }) => (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              className="w-full flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-card-hover transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${layers[key] ? colorClass : 'bg-text-muted-custom'} transition-colors`} />
                <span className={`font-display tracking-wider text-[11px] ${layers[key] ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-data ${layers[key] ? 'text-primary' : 'text-text-muted-custom'}`}>
                  {layers[key] ? 'ON' : 'OFF'}
                </span>
                <span className="text-[9px] font-data text-text-muted-custom opacity-0 group-hover:opacity-100 transition-opacity">
                  [{shortcut}]
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Regional Presets */}
      <div className="p-3 border-b border-border">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">REGION</h2>
        <div className="flex flex-wrap gap-1">
          {REGION_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleRegion(preset)}
              className={`px-2 py-0.5 text-[9px] font-display tracking-wider rounded border ${
                activeRegion === preset.label
                  ? 'border-primary/30 text-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/20'
              } transition-colors`}
            >
              {preset.emoji} {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Intelligence Overview */}
      <div className="p-3 border-b border-border">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">
          INSTABILITY INDEX
        </h2>
        <div className="space-y-1.5">
          {INSTABILITY_DATA.slice(0, 5).map((item, i) => (
            <div key={item.country} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-data text-text-muted-custom text-[10px] w-3">{i + 1}.</span>
                <span>{item.flag}</span>
                <span className="font-display tracking-wide text-[11px]">{item.country}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`font-data text-[11px] font-bold ${
                  item.level === 'critical' ? 'text-alert-critical' :
                  item.level === 'high' ? 'text-alert-high' :
                  'text-alert-medium'
                }`}>
                  {item.score}
                </span>
                <span className="text-[9px] text-muted-foreground">/100</span>
                <span className="text-[10px]">
                  {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '─'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Convergence Alert */}
      <div className="p-3 border-b border-border">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-alert-high mb-2">
          ⚡ CONVERGENCE DETECTED
        </h2>
        <div className="bg-alert-high/5 border border-alert-high/20 rounded p-2 space-y-1">
          <p className="text-[11px] font-display tracking-wide text-foreground">Eastern Mediterranean</p>
          <p className="text-[10px] text-muted-foreground">3 signal types in 1°×1° cell</p>
          <div className="flex gap-1 flex-wrap">
            {['Military', 'Protests', 'Outage'].map((t) => (
              <span key={t} className="text-[8px] font-data px-1.5 py-0.5 rounded bg-card-bg text-text-secondary border border-border">
                {t}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="font-data text-[11px] text-alert-high font-bold">Score: 87/100</span>
            <button className="text-[9px] font-display tracking-wider text-primary hover:underline">VIEW →</button>
          </div>
        </div>
      </div>

      {/* Markets */}
      <div className="p-3 border-b border-border">
        <h2 className="text-[10px] font-display tracking-[0.2em] text-muted-foreground mb-2">MARKETS</h2>
        <div className="space-y-1">
          {MARKET_DATA.slice(0, 6).map((m) => (
            <div key={m.symbol} className="flex items-center justify-between text-[11px]">
              <span className="font-display tracking-wide text-muted-foreground">{m.symbol}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-data text-foreground">{m.value}</span>
                <span className={`font-data text-[10px] ${m.up ? 'text-signal-aircraft' : 'text-alert-critical'}`}>
                  {m.up ? '▲' : '▼'} {m.change}
                </span>
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
                <span className={`font-data text-[10px] ${
                  entry.index > 105 ? 'text-alert-high' : entry.index >= 95 ? 'text-primary' : 'text-alert-info'
                }`}>
                  {entry.index}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
});

LeftPanel.displayName = 'LeftPanel';
export default LeftPanel;
