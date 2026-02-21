import { memo } from 'react';
import { useWorldViewStore } from '@/store/worldview';

const RightPanel = memo(() => {
  const { detailPanel, closeDetailPanel } = useWorldViewStore();

  if (detailPanel.type === 'none') return null;

  return (
    <aside className="glass-panel w-[340px] border-l border-border overflow-y-auto animate-slide-in-right z-40">
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {detailPanel.type === 'aircraft' ? '✈' : detailPanel.type === 'satellite' ? '🛰' : '🌍'}
            </span>
            <h2 className="text-xs font-display tracking-[0.15em] text-foreground">
              {detailPanel.type === 'aircraft' ? (detailPanel.data?.isMilitary ? 'MILITARY AIRCRAFT' : 'COMMERCIAL AIRCRAFT') :
               detailPanel.type === 'satellite' ? 'SATELLITE' : 'EARTHQUAKE'}
            </h2>
            <span className="flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse-dot" />
              <span className="text-[9px] font-data text-alert-critical">LIVE</span>
            </span>
          </div>
          <button
            onClick={closeDetailPanel}
            className="text-muted-foreground hover:text-foreground text-xs p-1"
          >
            ✕
          </button>
        </div>

        <div className="border-t border-border" />

        {detailPanel.type === 'aircraft' && <AircraftDetail data={detailPanel.data} />}
        {detailPanel.type === 'satellite' && <SatelliteDetail data={detailPanel.data} />}
        {detailPanel.type === 'earthquake' && <EarthquakeDetail data={detailPanel.data} />}
      </div>
    </aside>
  );
});

const DataRow = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-[10px] font-display tracking-wider text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-data text-data-text">{value}</span>
      {sub && <span className="text-[10px] font-data text-text-secondary">{sub}</span>}
    </div>
  </div>
);

const AircraftDetail = ({ data }: { data: any }) => (
  <div className="mt-3 space-y-0.5">
    <DataRow label="CALLSIGN" value={data.callsign} />
    <DataRow label="ICAO" value={data.icao24.toUpperCase()} />
    <DataRow label="COUNTRY" value={data.country} />
    <div className="border-t border-border my-2" />
    <DataRow label="ALT" value={`${data.altitudeFt.toLocaleString()} ft`} sub={`FL${Math.round(data.altitudeFt / 100)}`} />
    <DataRow label="SPEED" value={`${Math.round(data.speedKts)} kts`} sub={`${Math.round(data.speedKts * 1.852)} km/h`} />
    <DataRow label="HEADING" value={`${Math.round(data.heading)}°`} sub={getCardinal(data.heading)} />
    <DataRow label="V/RATE" value={`${data.verticalRate > 0 ? '+' : ''}${Math.round(data.verticalRate * 196.85)} fpm`}
      sub={data.verticalRate > 0.5 ? 'CLIMBING' : data.verticalRate < -0.5 ? 'DESCENDING' : 'LEVEL'} />
    <div className="border-t border-border my-2" />
    <div className="flex gap-2 mt-3">
      <ActionButton label="📍 TRACK" />
      <ActionButton label="🔗 DETAILS" />
      <ActionButton label="📋 COPY" />
    </div>
  </div>
);

const SatelliteDetail = ({ data }: { data: any }) => (
  <div className="mt-3 space-y-0.5">
    <DataRow label="NAME" value={data.name} />
    <div className="border-t border-border my-2" />
    <DataRow label="ALTITUDE" value={`${Math.round(data.alt)} km`} sub={`${Math.round(data.alt * 0.621)} mi`} />
    <DataRow label="VELOCITY" value={`${data.velocity.toFixed(2)} km/s`} sub={`${Math.round(data.velocity * 3600)} km/h`} />
    <DataRow label="LAT" value={`${data.lat.toFixed(4)}°`} />
    <DataRow label="LON" value={`${data.lon.toFixed(4)}°`} />
    <div className="border-t border-border my-2" />
    <div className="flex gap-2 mt-3">
      <ActionButton label="📡 TRACK" />
      <ActionButton label="🔗 N2YO" />
      <ActionButton label="📋 COPY" />
    </div>
  </div>
);

const EarthquakeDetail = ({ data }: { data: any }) => (
  <div className="mt-3 space-y-0.5">
    <DataRow label="MAGNITUDE" value={`M${data.magnitude.toFixed(1)}`} />
    <DataRow label="DEPTH" value={`${data.depth.toFixed(1)} km`} />
    <DataRow label="LOCATION" value={data.place} />
    <DataRow label="TIME" value={new Date(data.time).toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })} sub="UTC" />
    <DataRow label="LAT" value={`${data.lat.toFixed(4)}°`} />
    <DataRow label="LON" value={`${data.lon.toFixed(4)}°`} />
    <div className="border-t border-border my-2" />
    <div className="flex gap-2 mt-3">
      <ActionButton label="📍 LOCATE" />
      <ActionButton label="🔗 USGS" onClick={() => window.open(data.url, '_blank')} />
      <ActionButton label="📋 COPY" />
    </div>
  </div>
);

const ActionButton = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="flex-1 text-[9px] font-display tracking-wider py-1.5 rounded border border-border bg-card-bg text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
  >
    {label}
  </button>
);

const getCardinal = (deg: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
};

RightPanel.displayName = 'RightPanel';
export default RightPanel;
