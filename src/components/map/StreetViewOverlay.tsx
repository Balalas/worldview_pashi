import { memo } from 'react';
import { useWorldViewStore } from '@/store/worldview';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDrustkDU3XpRzb7bvKXaZ4NJE9e9TwE2o';

const StreetViewOverlay = memo(() => {
  const { detailPanel, setDetailPanel, setActiveLivestream } = useWorldViewStore();

  if (detailPanel.type !== 'camera' || !detailPanel.data) return null;

  const cam = detailPanel.data;
  const heading = cam.heading ?? 0;
  const streetViewUrl = `https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_MAPS_API_KEY}&location=${cam.lat},${cam.lon}&heading=${heading}&pitch=5&fov=90`;

  const handleClose = () => {
    setDetailPanel({ type: null, data: null });
    setActiveLivestream(null);
  };

  return (
    <div className="absolute inset-0 z-30">
      <iframe
        src={streetViewUrl}
        className="w-full h-full border-0"
        allowFullScreen
        loading="eager"
        title={`Street View — ${cam.name}`}
      />
      {/* HUD frame overlay */}
      <div className="absolute inset-0 pointer-events-none border border-primary/20" />
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-background/70 backdrop-blur-sm pointer-events-auto z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-data tracking-wider text-primary">STREET VIEW</span>
          <span className="text-[9px] font-data text-muted-foreground">•</span>
          <span className="text-[10px] font-data text-muted-foreground">{cam.name}</span>
          <span className="text-[9px] font-data text-muted-foreground/60">
            {cam.lat.toFixed(4)}°, {cam.lon.toFixed(4)}°
          </span>
          <span className="text-[9px] font-data text-muted-foreground/60">HDG {heading}°</span>
        </div>
        <button
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground text-xs px-2 py-0.5 rounded bg-background/50 hover:bg-background/80 transition-colors"
        >
          ✕ EXIT
        </button>
      </div>
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/40 pointer-events-none" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/40 pointer-events-none" />
    </div>
  );
});

StreetViewOverlay.displayName = 'StreetViewOverlay';
export default StreetViewOverlay;
