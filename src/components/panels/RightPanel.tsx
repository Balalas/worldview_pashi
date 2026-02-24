import { memo } from 'react';
import { useWorldViewStore } from '@/store/worldview';
import { PUBLIC_CAMERAS } from '@/data/publicCameras';

const RightPanel = memo(() => {
  const { detailPanel, closeDetailPanel } = useWorldViewStore();
  if (detailPanel.type === 'none') return null;

  const typeLabels: Record<string, string> = {
    aircraft: detailPanel.data?.isMilitary ? 'MILITARY AIRCRAFT' : 'COMMERCIAL AIRCRAFT',
    satellite: 'SATELLITE', earthquake: 'EARTHQUAKE', volcano: 'VOLCANO', weather: 'WEATHER', cable: 'SUBMARINE CABLE',
    vessel: detailPanel.data?.type === 'yacht' ? 'SUPERYACHT' : detailPanel.data?.type === 'military' ? 'MILITARY VESSEL' : 'VESSEL',
    protest: 'PROTEST EVENT', outage: 'CYBER / OUTAGE', camera: 'CCTV / WEBCAM', country: 'COUNTRY INTEL',
  };
  const typeIcons: Record<string, string> = {
    aircraft: '✈', satellite: '🛰', earthquake: '🌍', volcano: '🌋', weather: '🌤', cable: '🔌',
    vessel: detailPanel.data?.type === 'yacht' ? '🛥' : '🚢', protest: '✊', outage: '🔒', camera: '📹', country: detailPanel.data?.flag || '🌍',
  };

  return (
    <aside className="glass-panel w-[340px] border-l border-border overflow-y-auto animate-slide-in-right z-40">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">{typeIcons[detailPanel.type] || '📍'}</span>
            <h2 className="text-xs font-display tracking-[0.15em] text-foreground">{typeLabels[detailPanel.type] || 'DETAIL'}</h2>
            <span className="flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse-dot" />
              <span className="text-[9px] font-data text-alert-critical">LIVE</span>
            </span>
          </div>
          <button onClick={closeDetailPanel} className="text-muted-foreground hover:text-foreground text-xs p-1">✕</button>
        </div>
        <div className="border-t border-border" />
        {detailPanel.type === 'aircraft' && <AircraftDetail data={detailPanel.data} />}
        {detailPanel.type === 'satellite' && <SatelliteDetail data={detailPanel.data} />}
        {detailPanel.type === 'earthquake' && <EarthquakeDetail data={detailPanel.data} />}
        {detailPanel.type === 'volcano' && <VolcanoDetail data={detailPanel.data} />}
        {detailPanel.type === 'weather' && <WeatherDetail data={detailPanel.data} />}
        {detailPanel.type === 'cable' && <CableDetail data={detailPanel.data} />}
        {detailPanel.type === 'vessel' && <VesselDetail data={detailPanel.data} />}
        {detailPanel.type === 'protest' && <ProtestDetail data={detailPanel.data} />}
        {detailPanel.type === 'outage' && <OutageDetail data={detailPanel.data} />}
        {detailPanel.type === 'camera' && <CameraDetail data={detailPanel.data} />}
        {detailPanel.type === 'country' && <CountryDetail data={detailPanel.data} />}
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

const ActionButton = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <button onClick={onClick} className="flex-1 text-[9px] font-display tracking-wider py-1.5 rounded border border-border bg-card-bg text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">{label}</button>
);

const getCardinal = (deg: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
};

const AircraftDetail = ({ data }: { data: any }) => (
  <div className="mt-3 space-y-0.5">
    <DataRow label="CALLSIGN" value={data.callsign} />
    <DataRow label="ICAO" value={data.icao24.toUpperCase()} />
    <DataRow label="COUNTRY" value={data.country} />
    <div className="border-t border-border my-2" />
    <DataRow label="ALT" value={`${data.altitudeFt.toLocaleString()} ft`} sub={`FL${Math.round(data.altitudeFt / 100)}`} />
    <DataRow label="SPEED" value={`${Math.round(data.speedKts)} kts`} sub={`${Math.round(data.speedKts * 1.852)} km/h`} />
    <DataRow label="HEADING" value={`${Math.round(data.heading)}°`} sub={getCardinal(data.heading)} />
    <DataRow label="V/RATE" value={`${data.verticalRate > 0 ? '+' : ''}${Math.round(data.verticalRate * 196.85)} fpm`} sub={data.verticalRate > 0.5 ? 'CLIMBING' : data.verticalRate < -0.5 ? 'DESCENDING' : 'LEVEL'} />
    <div className="border-t border-border my-2" />
    <div className="flex gap-2 mt-3">
      <ActionButton label="📍 TRACK" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 8 })} />
      <ActionButton label="📋 COPY" onClick={() => navigator.clipboard.writeText(`${data.callsign} | ${data.lat.toFixed(4)},${data.lon.toFixed(4)} | FL${Math.round(data.altitudeFt / 100)}`)} />
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
      <ActionButton label="📡 TRACK" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 5 })} />
      <ActionButton label="🔗 N2YO" onClick={() => window.open(`https://www.n2yo.com/?s=${encodeURIComponent(data.name)}`, '_blank')} />
      <ActionButton label="📋 COPY" onClick={() => navigator.clipboard.writeText(`${data.name} | ${data.lat.toFixed(4)},${data.lon.toFixed(4)} | ${data.alt}km`)} />
    </div>
  </div>
);

const EarthquakeDetail = ({ data }: { data: any }) => (
  <div className="mt-3 space-y-0.5">
    <DataRow label="MAGNITUDE" value={`M${data.magnitude.toFixed(1)}`} />
    <DataRow label="DEPTH" value={`${data.depth.toFixed(1)} km`} />
    <DataRow label="LOCATION" value={data.place} />
    <DataRow label="TIME" value={new Date(data.time).toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })} sub="UTC" />
    <div className="border-t border-border my-2" />
    <div className="flex gap-2 mt-3">
      <ActionButton label="📍 LOCATE" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 7 })} />
      <ActionButton label="🔗 USGS" onClick={() => window.open(data.url, '_blank')} />
    </div>
  </div>
);

const VolcanoDetail = ({ data }: { data: any }) => (
  <div className="mt-3 space-y-0.5">
    <DataRow label="NAME" value={data.name} />
    <DataRow label="COUNTRY" value={data.country} />
    <DataRow label="ELEVATION" value={`${data.elevation} m`} />
    <DataRow label="STATUS" value={data.status.toUpperCase()} />
    <DataRow label="LAST ERUPTION" value={data.lastEruption} />
    <div className="border-t border-border my-2" />
    <div className="flex gap-2 mt-3">
      <ActionButton label="📍 LOCATE" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 8 })} />
    </div>
  </div>
);

const WeatherDetail = ({ data }: { data: any }) => (
  <div className="mt-3 space-y-0.5">
    <DataRow label="CITY" value={data.city} />
    <DataRow label="TEMP" value={`${Math.round(data.temp)}°C`} sub={`${Math.round(data.temp * 9/5 + 32)}°F`} />
    <DataRow label="WIND" value={`${Math.round(data.windSpeed)} km/h`} />
    <DataRow label="CONDITION" value={data.description} />
    <DataRow label="EXTREME" value={data.isExtreme ? 'YES ⚠️' : 'NO'} />
  </div>
);

const CableDetail = ({ data }: { data: any }) => (
  <div className="mt-3 space-y-0.5">
    <DataRow label="NAME" value={data.name} />
    <DataRow label="CAPACITY" value={data.capacity} />
    <DataRow label="LENGTH" value={data.length} />
    <DataRow label="YEAR" value={String(data.year)} />
    <div className="border-t border-border my-2" />
    <div className="flex gap-2 mt-3">
      <ActionButton label="🔗 INFO" onClick={() => window.open(`https://www.submarinecablemap.com/submarine-cable/${encodeURIComponent(data.name.toLowerCase().replace(/ /g, '-'))}`, '_blank')} />
      <ActionButton label="📋 COPY" onClick={() => navigator.clipboard.writeText(`${data.name} | ${data.capacity} | ${data.length}`)} />
    </div>
  </div>
);

const VesselDetail = ({ data }: { data: any }) => (
  <div className="mt-3 space-y-0.5">
    <DataRow label="NAME" value={data.name} />
    <DataRow label="TYPE" value={data.type.toUpperCase()} />
    <DataRow label="FLAG" value={`${data.flag}`} />
    <DataRow label="LENGTH" value={`${data.length} m`} />
    <div className="border-t border-border my-2" />
    <DataRow label="SPEED" value={`${data.speedKnots} kts`} sub={`${Math.round(data.speedKnots * 1.852)} km/h`} />
    <DataRow label="HEADING" value={`${Math.round(data.heading)}°`} sub={getCardinal(data.heading)} />
    {data.destination && <DataRow label="DEST" value={data.destination} />}
    {data.mmsi && <DataRow label="MMSI" value={data.mmsi} />}
    <DataRow label="LAT" value={`${data.lat.toFixed(4)}°`} />
    <DataRow label="LON" value={`${data.lon.toFixed(4)}°`} />
    <div className="border-t border-border my-2" />
    <div className="flex gap-2 mt-3">
      <ActionButton label="📍 TRACK" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 8 })} />
      <ActionButton label="🔗 MarineTraffic" onClick={() => window.open(`https://www.marinetraffic.com/en/ais/details/ships/mmsi:${data.mmsi || ''}`, '_blank')} />
      <ActionButton label="📋 COPY" onClick={() => navigator.clipboard.writeText(`${data.name} | ${data.flag} | ${data.lat.toFixed(4)},${data.lon.toFixed(4)}`)} />
    </div>
  </div>
);

const ProtestDetail = ({ data }: { data: any }) => (
  <div className="mt-3 space-y-0.5">
    <DataRow label="COUNTRY" value={data.country} />
    <DataRow label="INTENSITY" value={data.intensity.toUpperCase()} />
    <DataRow label="SOURCE" value={data.source} />
    <DataRow label="TIME" value={new Date(data.time).toLocaleTimeString('en-US', { hour12: false })} />
    <div className="border-t border-border my-2" />
    <p className="text-[10px] text-foreground leading-tight mt-2">{data.title}</p>
    <div className="flex gap-2 mt-3">
      <ActionButton label="📍 LOCATE" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 8 })} />
      {data.link && <ActionButton label="🔗 SOURCE" onClick={() => window.open(data.link, '_blank')} />}
    </div>
  </div>
);

const OutageDetail = ({ data }: { data: any }) => (
  <div className="mt-3 space-y-0.5">
    <DataRow label="TYPE" value={data.type.toUpperCase()} />
    <DataRow label="SEVERITY" value={data.severity.toUpperCase()} />
    <DataRow label="SOURCE" value={data.source} />
    {data.affected && <DataRow label="AFFECTED" value={data.affected} />}
    <DataRow label="TIME" value={new Date(data.time).toLocaleTimeString('en-US', { hour12: false })} />
    <div className="border-t border-border my-2" />
    <p className="text-[10px] text-foreground leading-tight mt-2">{data.title}</p>
    <div className="flex gap-2 mt-3">
      <ActionButton label="📍 LOCATE" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 6 })} />
      {data.link && <ActionButton label="🔗 SOURCE" onClick={() => window.open(data.link, '_blank')} />}
    </div>
  </div>
);

const CameraDetail = ({ data }: { data: any }) => {
  const { activeLivestream, setActiveLivestream } = useWorldViewStore();
  
  return (
    <div className="mt-3 space-y-0.5">
      <DataRow label="NAME" value={data.name} />
      <DataRow label="CITY" value={data.city} />
      <DataRow label="COUNTRY" value={data.country} />
      <DataRow label="CATEGORY" value={data.category?.toUpperCase()} />
      <DataRow label="SOURCE" value={data.source} />
      <div className="border-t border-border my-2" />
      {/* Embedded livestream */}
      {activeLivestream && (
        <div className="relative w-full aspect-video rounded border border-primary/30 overflow-hidden mb-2">
          <iframe
            src={activeLivestream}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={data.name}
          />
          <div className="absolute top-1 left-1 flex items-center gap-1 bg-background/80 px-1.5 py-0.5 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            <span className="text-[8px] font-data text-destructive">LIVE</span>
          </div>
        </div>
      )}
      <div className="flex gap-2 mt-2">
        {!activeLivestream && (
          <ActionButton label="📺 LIVESTREAM" onClick={() => setActiveLivestream(data.embedUrl)} />
        )}
        <ActionButton label="🗺 STREET VIEW" onClick={() => {
          // Load street view in the app
          const sv = `https://www.google.com/maps/embed/v1/streetview?key=AIzaSyDrustkDU3XpRzb7bvKXaZ4NJE9e9TwE2o&location=${data.lat},${data.lon}&heading=${data.heading || 0}&fov=90&pitch=0`;
          setActiveLivestream(sv);
        }} />
        <ActionButton label="📋 COPY" onClick={() => navigator.clipboard.writeText(`${data.name} | ${data.city}, ${data.country} | ${data.lat.toFixed(4)},${data.lon.toFixed(4)}`)} />
      </div>
    </div>
  );
};

const CountryDetail = ({ data }: { data: any }) => {
  const { setActiveLivestream, setDetailPanel, setMapCenter } = useWorldViewStore();

  return (
    <div className="mt-3 space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{data.flag}</span>
        <div>
          <div className="text-sm font-display tracking-wider text-foreground">{data.name}</div>
          <div className="text-[9px] font-data text-muted-foreground">{data.code} • {data.newsCount} NEWS • {data.cameraCount} CAMERAS</div>
        </div>
      </div>

      {/* News section */}
      <div className="border-t border-border pt-2">
        <div className="text-[10px] font-display tracking-[0.15em] text-primary mb-1.5">📰 LATEST NEWS</div>
        {data.news.length === 0 ? (
          <div className="text-[10px] text-muted-foreground italic py-2">No recent news for this region</div>
        ) : (
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
            {data.news.map((n: any, i: number) => {
              const sevColors: Record<string, string> = { critical: 'text-destructive', high: 'text-amber-400', medium: 'text-primary', low: 'text-muted-foreground', info: 'text-muted-foreground' };
              return (
                <div key={i} className="bg-card-bg/50 rounded p-1.5 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => n.link && window.open(n.link, '_blank')}>
                  <div className="flex items-start gap-1.5">
                    <span className={`text-[8px] font-data ${sevColors[n.severity] || 'text-muted-foreground'} mt-0.5`}>●</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-foreground leading-tight line-clamp-2">{n.title}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[8px] font-data text-muted-foreground">{n.source}</span>
                        <span className="text-[8px] text-muted-foreground/50">•</span>
                        <span className="text-[8px] font-data text-muted-foreground">{new Date(n.time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cameras section */}
      {data.cameras.length > 0 && (
        <div className="border-t border-border pt-2">
          <div className="text-[10px] font-display tracking-[0.15em] text-amber-400 mb-1.5">📹 LIVE CAMERAS ({data.cameraCount})</div>
          <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
            {data.cameras.map((cam: any, i: number) => (
              <button
                key={i}
                onClick={() => {
                  setDetailPanel({ type: 'camera', data: cam });
                  setActiveLivestream(cam.feedType === 'snapshot' ? (cam.snapshotUrl || 'snapshot') : cam.embedUrl);
                  setMapCenter({ lat: cam.lat, lon: cam.lon, zoom: 14 });
                }}
                className="w-full text-left bg-card-bg/50 rounded p-1.5 border border-border/50 hover:border-amber-400/40 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">📹</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-foreground truncate">{cam.name}</div>
                    <div className="text-[8px] font-data text-muted-foreground">{cam.city} • {cam.source}{cam.official ? ' • DOT' : ''}</div>
                  </div>
                  <span className="text-[8px] font-data text-amber-400">VIEW →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Earthquakes */}
      {data.earthquakes.length > 0 && (
        <div className="border-t border-border pt-2">
          <div className="text-[10px] font-display tracking-[0.15em] text-destructive mb-1.5">🌍 SEISMIC ACTIVITY</div>
          <div className="space-y-1">
            {data.earthquakes.map((eq: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-0.5">
                <span className="text-[10px] text-foreground">M{eq.magnitude.toFixed(1)} — {eq.place?.substring(0, 30)}</span>
                <span className="text-[9px] font-data text-muted-foreground">{eq.depth.toFixed(0)}km</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protests */}
      {data.protests.length > 0 && (
        <div className="border-t border-border pt-2">
          <div className="text-[10px] font-display tracking-[0.15em] text-pink-400 mb-1.5">✊ UNREST</div>
          <div className="space-y-1">
            {data.protests.map((p: any, i: number) => (
              <div key={i} className="text-[10px] text-foreground leading-tight py-0.5">{p.title?.substring(0, 60)}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

RightPanel.displayName = 'RightPanel';
export default RightPanel;
