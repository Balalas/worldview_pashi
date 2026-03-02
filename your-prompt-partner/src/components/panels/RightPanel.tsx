import { memo, useEffect, useState } from 'react';
import { useWorldViewStore } from '@/store/worldview';
import { getCountryByCode, CountryData, formatPopulation, formatArea } from '@/services/countryService';

const RightPanel = memo(() => {
  const { detailPanel, closeDetailPanel, bottomPanelCollapsed } = useWorldViewStore();
  if (detailPanel.type === 'none') return null;

  const typeLabels: Record<string, string> = {
    aircraft: detailPanel.data?.isMilitary ? 'MILITARY AIRCRAFT' : 'AIRCRAFT',
    satellite: 'SATELLITE', earthquake: 'EARTHQUAKE', volcano: 'VOLCANO', weather: 'WEATHER', cable: 'CABLE',
    vessel: detailPanel.data?.type === 'yacht' ? 'SUPERYACHT' : detailPanel.data?.type === 'military' ? 'MIL VESSEL' : 'VESSEL',
    protest: 'PROTEST', outage: 'CYBER/OUTAGE', camera: 'CCTV', country: 'COUNTRY', fire: 'FIRE',
    conflict: detailPanel.data?.type === 'war' ? 'ACTIVE WAR' : detailPanel.data?.type === 'civil_war' ? 'CIVIL WAR' : 'CONFLICT ZONE',
  };
  const typeIcons: Record<string, string> = {
    aircraft: '✈', satellite: '🛰', earthquake: '🌍', volcano: '🌋', weather: '🌤', cable: '🔌',
    vessel: '🚢', protest: '✊', outage: '🔒', camera: '📹', country: detailPanel.data?.flag || '🌍', fire: '🔥',
    conflict: '💥',
  };

  return (
    <div className={`absolute right-3 z-40 pointer-events-auto animate-fade-in transition-all duration-300 ${bottomPanelCollapsed ? 'bottom-[40px]' : 'bottom-[215px]'}`}>
      <div className="w-[280px] max-h-[320px] overflow-y-auto rounded-lg border border-border/40"
        style={{
          background: 'hsla(210, 60%, 4%, 0.9)',
          backdropFilter: 'blur(16px) saturate(1.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 1px hsla(150, 100%, 50%, 0.1)',
        }}
      >
        <div className="p-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{typeIcons[detailPanel.type] || '📍'}</span>
              <span className="text-[11px] font-display tracking-[0.15em] text-foreground">{typeLabels[detailPanel.type] || 'DETAIL'}</span>
              <span className="flex items-center gap-0.5 ml-1">
                <span className="w-1 h-1 rounded-full bg-alert-critical animate-pulse-dot" />
                <span className="text-[9px] font-data text-alert-critical">LIVE</span>
              </span>
            </div>
            <button onClick={closeDetailPanel} className="text-muted-foreground hover:text-foreground text-[10px] p-0.5">✕</button>
          </div>
          <div className="border-t border-border/50 mb-2" />
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
          {detailPanel.type === 'conflict' && <ConflictDetail data={detailPanel.data} />}
          {detailPanel.type === 'fire' && <FireDetail data={detailPanel.data} />}
        </div>
      </div>
    </div>
  );
});

const DataRow = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="flex items-center justify-between py-0.5">
    <span className="text-[9px] font-display tracking-wider text-muted-foreground">{label}</span>
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-data text-data-text">{value}</span>
      {sub && <span className="text-[9px] font-data text-text-secondary">{sub}</span>}
    </div>
  </div>
);

const ActionButton = ({ label, onClick }: { label: string; onClick?: () => void }) => (
  <button onClick={onClick} className="flex-1 text-[10px] font-display tracking-wider py-1 rounded border border-border bg-card-bg text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">{label}</button>
);

const getCardinal = (deg: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
};

const AircraftDetail = ({ data }: { data: any }) => {
  const adsbUrl = `https://globe.adsbexchange.com/?icao=${data.icao24}`;
  const fr24Url = `https://www.flightradar24.com/${data.callsign?.trim()}`;
  return (
    <div className="space-y-0.5">
      <DataRow label="CALLSIGN" value={data.callsign} />
      <DataRow label="ICAO" value={data.icao24.toUpperCase()} />
      <DataRow label="COUNTRY" value={data.country} />
      <DataRow label="ALT" value={`${data.altitudeFt.toLocaleString()} ft`} sub={`FL${Math.round(data.altitudeFt / 100)}`} />
      <DataRow label="SPEED" value={`${Math.round(data.speedKts)} kts`} />
      <DataRow label="HDG" value={`${Math.round(data.heading)}°`} sub={getCardinal(data.heading)} />
      <div className="flex gap-1.5 mt-2">
        <ActionButton label="📍 TRACK" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 8 })} />
        <ActionButton label="📋 COPY" onClick={() => navigator.clipboard.writeText(`${data.callsign} | ${data.lat.toFixed(4)},${data.lon.toFixed(4)}`)} />
      </div>
      <div className="flex gap-1.5 mt-1">
        <ActionButton label="🔗 ADSB-X" onClick={() => useWorldViewStore.getState().openInAppBrowser(adsbUrl)} />
        <ActionButton label="🔗 FR24" onClick={() => useWorldViewStore.getState().openInAppBrowser(fr24Url)} />
      </div>
    </div>
  );
};

const SatelliteDetail = ({ data }: { data: any }) => {
  const n2yoUrl = data.noradId ? `https://www.n2yo.com/satellite/?s=${data.noradId}` : `https://www.n2yo.com/?s=${encodeURIComponent(data.name)}`;
  const heavensUrl = data.noradId ? `https://heavens-above.com/satinfo.aspx?satid=${data.noradId}` : null;
  return (
    <div className="space-y-0.5">
      <DataRow label="NAME" value={data.name} />
      {data.noradId && <DataRow label="NORAD" value={data.noradId} />}
      <DataRow label="ALT" value={`${Math.round(data.alt)} km`} />
      <DataRow label="VEL" value={`${data.velocity.toFixed(2)} km/s`} />
      <div className="flex gap-1.5 mt-2">
        <ActionButton label="📡 TRACK" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 5 })} />
        <ActionButton label="📋 COPY" onClick={() => navigator.clipboard.writeText(`${data.name} | ${data.alt}km`)} />
      </div>
      <div className="flex gap-1.5 mt-1">
        <ActionButton label="🔗 N2YO" onClick={() => useWorldViewStore.getState().openInAppBrowser(n2yoUrl)} />
        {heavensUrl && <ActionButton label="🔗 HEAVENS" onClick={() => useWorldViewStore.getState().openInAppBrowser(heavensUrl)} />}
      </div>
    </div>
  );
};

const EarthquakeDetail = ({ data }: { data: any }) => {
  const depthLabel = data.depth < 70 ? 'SHALLOW' : data.depth < 300 ? 'INTERMEDIATE' : 'DEEP';
  const magColor = data.magnitude >= 7 ? 'text-destructive' : data.magnitude >= 5 ? 'text-amber-500' : 'text-amber-300';
  return (
    <div className="space-y-0.5">
      <DataRow label="MAG" value={`M${data.magnitude.toFixed(1)}`} />
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[9px] font-display tracking-wider text-muted-foreground">SEVERITY</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-[2px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`w-[3px] h-[8px] rounded-[1px] ${i < Math.round(data.magnitude) ? (data.magnitude >= 7 ? 'bg-destructive' : data.magnitude >= 5 ? 'bg-amber-500' : 'bg-amber-300') : 'bg-border/40'}`} />
            ))}
          </div>
          <span className={`text-[9px] font-data ${magColor}`}>{data.magnitude >= 7 ? 'MAJOR' : data.magnitude >= 5 ? 'MODERATE' : data.magnitude >= 3 ? 'MINOR' : 'MICRO'}</span>
        </div>
      </div>
      <DataRow label="DEPTH" value={`${data.depth.toFixed(1)} km`} sub={depthLabel} />
      <DataRow label="LOC" value={data.place} />
      <DataRow label="TIME" value={new Date(data.time).toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })} sub="UTC" />
      {data.felt && <DataRow label="FELT" value={`${data.felt} reports`} />}
      {data.tsunami === 1 && <DataRow label="⚠ TSUNAMI" value="WARNING ISSUED" />}
      {data.alert && <DataRow label="ALERT" value={data.alert.toUpperCase()} />}
      {data.significance && <DataRow label="SIG" value={String(data.significance)} />}
      {data.mmi && <DataRow label="MMI" value={`${data.mmi.toFixed(1)}`} />}
      <div className="flex gap-1.5 mt-2">
        <ActionButton label="📍 LOCATE" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 7 })} />
        <ActionButton label="🔗 USGS" onClick={() => useWorldViewStore.getState().openInAppBrowser(data.url)} />
      </div>
    </div>
  );
};

const VolcanoDetail = ({ data }: { data: any }) => (
  <div className="space-y-0.5">
    <DataRow label="NAME" value={data.name} />
    <DataRow label="COUNTRY" value={data.country} />
    <DataRow label="ELEV" value={`${data.elevation} m`} />
    <DataRow label="STATUS" value={data.status.toUpperCase()} />
    <div className="flex gap-1.5 mt-2">
      <ActionButton label="📍 LOCATE" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 8 })} />
    </div>
  </div>
);

const WeatherDetail = ({ data }: { data: any }) => (
  <div className="space-y-0.5">
    <DataRow label="CITY" value={data.city} />
    <DataRow label="TEMP" value={`${Math.round(data.temp)}°C`} />
    <DataRow label="WIND" value={`${Math.round(data.windSpeed)} km/h`} />
    <DataRow label="COND" value={data.description} />
  </div>
);

const CableDetail = ({ data }: { data: any }) => (
  <div className="space-y-0.5">
    <DataRow label="NAME" value={data.name} />
    <DataRow label="CAP" value={data.capacity} />
    <DataRow label="LEN" value={data.length} />
    <DataRow label="YEAR" value={String(data.year)} />
    <div className="flex gap-1.5 mt-2">
      <ActionButton label="🔗 INFO" onClick={() => useWorldViewStore.getState().openInAppBrowser(`https://www.submarinecablemap.com/submarine-cable/${encodeURIComponent(data.name.toLowerCase().replace(/ /g, '-'))}`)} />
    </div>
  </div>
);

const VesselDetail = ({ data }: { data: any }) => (
  <div className="space-y-0.5">
    <DataRow label="NAME" value={data.name} />
    <DataRow label="TYPE" value={data.type.toUpperCase()} />
    <DataRow label="FLAG" value={data.flag} />
    <DataRow label="SPEED" value={`${data.speedKnots} kts`} />
    <DataRow label="HDG" value={`${Math.round(data.heading)}°`} sub={getCardinal(data.heading)} />
    {data.destination && <DataRow label="DEST" value={data.destination} />}
    <div className="flex gap-1.5 mt-2">
      <ActionButton label="📍 TRACK" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 8 })} />
      <ActionButton label="📋 COPY" onClick={() => navigator.clipboard.writeText(`${data.name} | ${data.flag}`)} />
    </div>
  </div>
);

const ProtestDetail = ({ data }: { data: any }) => (
  <div className="space-y-0.5">
    <DataRow label="COUNTRY" value={data.country} />
    <DataRow label="INTENS" value={data.intensity.toUpperCase()} />
    <DataRow label="SRC" value={data.source} />
    <p className="text-[9px] text-foreground leading-tight mt-1">{data.title}</p>
    <div className="flex gap-1.5 mt-2">
      <ActionButton label="📍 LOCATE" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 8 })} />
      {data.link && <ActionButton label="🔗 SRC" onClick={() => useWorldViewStore.getState().openInAppBrowser(data.link)} />}
    </div>
  </div>
);

const OutageDetail = ({ data }: { data: any }) => (
  <div className="space-y-0.5">
    <DataRow label="TYPE" value={data.type.toUpperCase()} />
    <DataRow label="SEV" value={data.severity.toUpperCase()} />
    <DataRow label="SRC" value={data.source} />
    <p className="text-[9px] text-foreground leading-tight mt-1">{data.title}</p>
    <div className="flex gap-1.5 mt-2">
      <ActionButton label="📍 LOCATE" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 6 })} />
      {data.link && <ActionButton label="🔗 SRC" onClick={() => useWorldViewStore.getState().openInAppBrowser(data.link)} />}
    </div>
  </div>
);

const CameraDetail = ({ data }: { data: any }) => {
  const { activeLivestream, setActiveLivestream } = useWorldViewStore();
  return (
    <div className="space-y-0.5">
      <DataRow label="NAME" value={data.name} />
      <DataRow label="CITY" value={data.city} />
      <DataRow label="SRC" value={data.source} />
      {activeLivestream && (
        <div className="relative w-full aspect-video rounded border border-primary/30 overflow-hidden my-1">
          <iframe src={activeLivestream} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={data.name} />
          <div className="absolute top-1 left-1 flex items-center gap-1 bg-background/80 px-1 py-0.5 rounded-sm">
            <span className="w-1 h-1 rounded-full bg-destructive animate-pulse" />
            <span className="text-[7px] font-data text-destructive">LIVE</span>
          </div>
        </div>
      )}
      <div className="flex gap-1.5 mt-2">
        {!activeLivestream && <ActionButton label="📺 LIVE" onClick={() => setActiveLivestream(data.embedUrl)} />}
        <ActionButton label="📋 COPY" onClick={() => navigator.clipboard.writeText(`${data.name} | ${data.city}`)} />
      </div>
    </div>
  );
};

const CountryDetail = ({ data }: { data: any }) => {
  const { setActiveLivestream, setDetailPanel, setMapCenter } = useWorldViewStore();
  const [enriched, setEnriched] = useState<CountryData | null>(null);

  useEffect(() => {
    if (data.code) {
      const cd = getCountryByCode(data.code);
      if (cd) setEnriched(cd);
    }
  }, [data.code]);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{data.flag}</span>
        <div>
          <div className="text-[11px] font-display tracking-wider text-foreground">{data.name}</div>
          <div className="text-[8px] font-data text-muted-foreground">{data.code} • {data.newsCount} NEWS</div>
        </div>
      </div>

      {/* Enriched country data from RestCountries */}
      {enriched && (
        <div className="border-t border-border/50 pt-1">
          <div className="text-[8px] font-display tracking-[0.15em] text-primary mb-1">📊 COUNTRY DATA</div>
          <DataRow label="POPULATION" value={formatPopulation(enriched.population)} />
          <DataRow label="AREA" value={formatArea(enriched.area)} />
          <DataRow label="CAPITAL" value={enriched.capital} />
          <DataRow label="REGION" value={`${enriched.subregion || enriched.region}`} />
          {enriched.languages.length > 0 && (
            <DataRow label="LANGUAGES" value={enriched.languages.slice(0, 3).join(', ')} />
          )}
          {enriched.currencies.length > 0 && (
            <DataRow label="CURRENCY" value={enriched.currencies[0].split('(')[0].trim()} />
          )}
          {enriched.gini !== undefined && (
            <DataRow label="GINI INDEX" value={String(enriched.gini)} sub={enriched.gini > 40 ? 'HIGH INEQUALITY' : 'MODERATE'} />
          )}
          <DataRow label="UN MEMBER" value={enriched.unMember ? 'YES' : 'NO'} />
          {enriched.borders.length > 0 && (
            <DataRow label="BORDERS" value={`${enriched.borders.length} countries`} />
          )}
        </div>
      )}

      {data.news.length > 0 && (
        <div className="border-t border-border/50 pt-1">
          <div className="text-[8px] font-display tracking-[0.15em] text-primary mb-1">📰 NEWS</div>
          <div className="space-y-1 max-h-[120px] overflow-y-auto">
            {data.news.slice(0, 5).map((n: any, i: number) => (
              <div key={i} className="text-[9px] text-foreground leading-tight cursor-pointer hover:text-primary transition-colors"
                onClick={() => n.link && useWorldViewStore.getState().openInAppBrowser(n.link)}>
                {n.title}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.cameras.length > 0 && (
        <div className="border-t border-border/50 pt-1">
          <div className="text-[8px] font-display tracking-[0.15em] text-amber-400 mb-1">📹 CAMERAS ({data.cameraCount})</div>
          <div className="space-y-0.5 max-h-[80px] overflow-y-auto">
            {data.cameras.slice(0, 4).map((cam: any, i: number) => (
              <button key={i} onClick={() => {
                setDetailPanel({ type: 'camera', data: cam });
                setActiveLivestream(cam.feedType === 'snapshot' ? (cam.snapshotUrl || 'snapshot') : cam.embedUrl);
                setMapCenter({ lat: cam.lat, lon: cam.lon, zoom: 14 });
              }} className="w-full text-left text-[9px] text-foreground hover:text-amber-400 transition-colors truncate">
                📹 {cam.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ConflictDetail = ({ data }: { data: any }) => {
  const intensityLabel = data.intensity >= 8 ? 'CRITICAL' : data.intensity >= 6 ? 'HIGH' : data.intensity >= 4 ? 'MEDIUM' : 'LOW';
  const intensityColor = data.intensity >= 8 ? 'text-destructive' : data.intensity >= 6 ? 'text-amber-500' : 'text-amber-300';
  const typeLabels: Record<string, string> = {
    war: 'ACTIVE WAR', civil_war: 'CIVIL WAR', conflict: 'ARMED CONFLICT',
    insurgency: 'INSURGENCY', tension: 'GEOPOLITICAL TENSION', gang_violence: 'GANG VIOLENCE', instability: 'INSTABILITY',
  };
  return (
    <div className="space-y-1">
      <DataRow label="ZONE" value={data.name} />
      <DataRow label="TYPE" value={typeLabels[data.type] || data.type?.toUpperCase()} />
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[9px] font-display tracking-wider text-muted-foreground">INTENSITY</span>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-[2px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`w-[4px] h-[10px] rounded-[1px] ${i < data.intensity ? (data.intensity >= 8 ? 'bg-destructive' : data.intensity >= 6 ? 'bg-amber-500' : 'bg-amber-300') : 'bg-border/40'}`} />
            ))}
          </div>
          <span className={`text-[10px] font-data ${intensityColor}`}>{data.intensity}/10</span>
        </div>
      </div>
      <DataRow label="LEVEL" value={intensityLabel} />
      <DataRow label="POS" value={`${data.lat.toFixed(2)}°, ${data.lon.toFixed(2)}°`} />
      {data.relatedNews && data.relatedNews.length > 0 && (
        <div className="border-t border-border/50 pt-1 mt-1">
          <div className="text-[8px] font-display tracking-[0.15em] text-primary mb-1">📰 RELATED INTEL ({data.relatedNews.length})</div>
          <div className="space-y-1 max-h-[100px] overflow-y-auto">
            {data.relatedNews.map((n: any, i: number) => (
              <div key={i} className="text-[9px] text-foreground leading-tight cursor-pointer hover:text-primary transition-colors"
                onClick={() => n.link && useWorldViewStore.getState().openInAppBrowser(n.link)}>
                {n.title}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-1.5 mt-2">
        <ActionButton label="📍 LOCATE" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 7 })} />
        <ActionButton label="📋 COPY" onClick={() => navigator.clipboard.writeText(`${data.name} | ${data.lat.toFixed(4)},${data.lon.toFixed(4)}`)} />
      </div>
    </div>
  );
};

const FireDetail = ({ data }: { data: any }) => {
  const frpLevel = data.frp >= 100 ? 'EXTREME' : data.frp >= 50 ? 'HIGH' : data.frp >= 20 ? 'MODERATE' : 'LOW';
  const frpColor = data.frp >= 100 ? 'text-destructive' : data.frp >= 50 ? 'text-amber-500' : 'text-amber-300';
  return (
    <div className="space-y-0.5">
      <DataRow label="EVENT" value={data.title?.substring(0, 30) || 'Fire'} />
      {data.frp > 0 && (
        <>
          <DataRow label="FRP" value={`${data.frp.toFixed(1)} MW`} />
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[9px] font-display tracking-wider text-muted-foreground">INTENSITY</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-[2px]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`w-[3px] h-[8px] rounded-[1px] ${i < Math.min(10, Math.round(data.frp / 15)) ? (data.frp >= 100 ? 'bg-destructive' : data.frp >= 50 ? 'bg-amber-500' : 'bg-amber-300') : 'bg-border/40'}`} />
                ))}
              </div>
              <span className={`text-[9px] font-data ${frpColor}`}>{frpLevel}</span>
            </div>
          </div>
        </>
      )}
      {data.brightness > 0 && <DataRow label="TEMP" value={`${data.brightness.toFixed(0)} K`} />}
      {data.confidence && <DataRow label="CONF" value={data.confidence.toUpperCase()} />}
      <DataRow label="SRC" value={data.source} />
      {data.acq_date && <DataRow label="DATE" value={data.acq_date} />}
      {data.acq_time && <DataRow label="TIME" value={`${String(data.acq_time).padStart(4, '0').slice(0,2)}:${String(data.acq_time).padStart(4, '0').slice(2)} UTC`} />}
      <DataRow label="POS" value={`${data.lat.toFixed(4)}°, ${data.lon.toFixed(4)}°`} />
      <div className="flex gap-1.5 mt-2">
        <ActionButton label="📍 LOCATE" onClick={() => useWorldViewStore.getState().setMapCenter({ lat: data.lat, lon: data.lon, zoom: 8 })} />
        {data.link && <ActionButton label="🔗 SRC" onClick={() => useWorldViewStore.getState().openInAppBrowser(data.link)} />}
        <ActionButton label="📋 COPY" onClick={() => navigator.clipboard.writeText(`${data.lat.toFixed(4)},${data.lon.toFixed(4)} FRP:${data.frp}`)} />
      </div>
    </div>
  );
};

RightPanel.displayName = 'RightPanel';
export default RightPanel;
