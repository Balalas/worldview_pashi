import { memo, useCallback } from 'react';
import { useWorldViewStore, REGION_PRESETS } from '@/store/worldview';

declare const google: any;

const GlobeControls = memo(() => {
  const { setMapCenter } = useWorldViewStore();

  const flyTo = useCallback((lat: number, lon: number, zoom: number) => {
    setMapCenter({ lat, lon, zoom });
  }, [setMapCenter]);

  return (
    <div className="absolute bottom-16 right-3 flex flex-col gap-1 pointer-events-auto z-30">
      {/* Camera Controls */}
      <div className="flex flex-col gap-0.5 bg-background/80 backdrop-blur-sm border border-border rounded p-1">
        <ControlBtn icon="+" title="Zoom In" onClick={() => {/* handled by Google Maps native controls */}} />
        <ControlBtn icon="−" title="Zoom Out" onClick={() => {}} />
        <div className="w-full h-px bg-border" />
        <ControlBtn icon="⟳" title="Reset View" onClick={() => flyTo(20, 0, 3)} />
        <ControlBtn icon="◎" title="Nadir View" onClick={() => {}} />
      </div>

      {/* Region Presets */}
      <div className="flex flex-col gap-0.5 bg-background/80 backdrop-blur-sm border border-border rounded p-1 mt-1">
        {REGION_PRESETS.slice(0, 6).map((r) => (
          <button key={r.label} onClick={() => flyTo(r.lat, r.lon, r.zoom)}
            className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-data tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors whitespace-nowrap">
            <span>{r.emoji}</span>
            <span>{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

const ControlBtn = ({ icon, title, onClick }: { icon: string; title: string; onClick: () => void }) => (
  <button onClick={onClick} title={title}
    className="w-7 h-7 flex items-center justify-center text-sm font-data text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
    {icon}
  </button>
);

GlobeControls.displayName = 'GlobeControls';
export default GlobeControls;
