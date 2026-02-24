import { useEffect, lazy, Suspense, memo, useState, useCallback } from 'react';
import TopBar from '@/components/panels/TopBar';
import LeftPanel from '@/components/panels/LeftPanel';
import RightPanel from '@/components/panels/RightPanel';
import BottomFeed from '@/components/panels/BottomFeed';
import MapContainer from '@/components/map/MapContainer';
import HudOverlay from '@/components/hud/HudOverlay';
import TrackingHud from '@/components/hud/TrackingHud';
import StreetViewOverlay from '@/components/map/StreetViewOverlay';
import GlobeControls from '@/components/hud/GlobeControls';
import SearchBar from '@/components/hud/SearchBar';
import StylePresetsBar, { computeStyleConfig } from '@/components/hud/StylePresetsBar';
import StyleParametersPanel from '@/components/hud/StyleParametersPanel';
import HolographicTV from '@/components/hud/HolographicTV';
import TacticalAlerts from '@/components/hud/TacticalAlerts';
import MinimapRadar from '@/components/hud/MinimapRadar';
import ThreatGauge from '@/components/hud/ThreatGauge';
import { useWorldViewStore, LAYER_SHORTCUTS } from '@/store/worldview';
import { fetchEarthquakes, fetchLiveNews, fetchLiveAircraft } from '@/services/dataServices';
import { generateRealisticSatellites, fetchISSPosition } from '@/services/satelliteService';
import { fetchGlobalWeather, ACTIVE_VOLCANOES } from '@/services/weatherService';
import { generateVessels, extractProtestsFromNews, extractOutagesFromNews, fetchCyberNews } from '@/services/vesselService';
import { fetchActiveFiresEONET } from '@/services/fireService';

const GlobeContainer = lazy(() => import('@/components/map/GlobeContainer'));
const Google3DGlobe = lazy(() => import('@/components/map/Google3DGlobe'));

// Auto-refreshing DOT snapshot image component
const DotSnapshotImage = memo(({ snapshotUrl, name }: { snapshotUrl: string; name: string }) => {
  const [imgSrc, setImgSrc] = useState('');
  const [error, setError] = useState(false);

  const refreshImage = useCallback(() => {
    // Proxy through edge function to bypass mixed-content
    const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dot-camera-proxy`;
    const url = `${proxyUrl}`;
    // Use fetch to get blob URL
    fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: snapshotUrl }),
    })
      .then(r => {
        if (!r.ok) throw new Error('Failed');
        return r.blob();
      })
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        setImgSrc(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return objectUrl;
        });
        setError(false);
      })
      .catch(() => setError(true));
  }, [snapshotUrl]);

  useEffect(() => {
    refreshImage();
    const interval = setInterval(refreshImage, 4000); // refresh every 4s
    return () => {
      clearInterval(interval);
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, [refreshImage]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background/80">
        <div className="text-center">
          <span className="text-[10px] font-data text-muted-foreground">FEED OFFLINE</span>
          <div className="text-[8px] text-muted-foreground/60 mt-1">{name}</div>
        </div>
      </div>
    );
  }

  return imgSrc ? (
    <img src={imgSrc} alt={name} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-background/80">
      <div className="w-4 h-4 border border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
});
DotSnapshotImage.displayName = 'DotSnapshotImage';

// Holographic CCTV picture-in-picture overlay
const CctvPip = memo(() => {
  const { activeLivestream, setActiveLivestream, detailPanel } = useWorldViewStore();
  if (!activeLivestream || detailPanel.type !== 'camera') return null;
  const cam = detailPanel.data;
  const isSnapshot = cam?.feedType === 'snapshot' && cam?.snapshotUrl;
  
  return (
    <div className="absolute bottom-4 left-4 z-40 group">
      <div className="relative w-[280px] h-[160px] rounded-lg overflow-hidden border border-primary/40 shadow-[0_0_20px_rgba(0,255,136,0.15)]"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--background) / 0.3), hsl(var(--background) / 0.1))',
          backdropFilter: 'blur(8px)',
        }}
      >
        {isSnapshot ? (
          <DotSnapshotImage snapshotUrl={cam.snapshotUrl!} name={cam.name} />
        ) : (
          <iframe
            src={activeLivestream}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={cam?.name || 'CCTV'}
          />
        )}
        {/* Holographic scan lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)) 2px, hsl(var(--primary)) 3px)' }}
        />
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-background/70">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            <span className="text-[8px] font-data text-destructive tracking-wider">● LIVE</span>
            {cam?.official && <span className="text-[7px] font-data text-amber-400 bg-amber-400/10 px-1 rounded">DOT</span>}
            <span className="text-[8px] font-data text-muted-foreground truncate max-w-[140px]">{cam?.name || 'CCTV'}</span>
          </div>
          <button onClick={() => setActiveLivestream(null)} className="text-muted-foreground hover:text-foreground text-[10px] pointer-events-auto">✕</button>
        </div>
        {/* Source badge */}
        {cam?.source && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center px-2 py-0.5 bg-background/60">
            <span className="text-[7px] font-data text-muted-foreground">SRC: {cam.source}</span>
          </div>
        )}
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary/60 pointer-events-none" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-primary/60 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-primary/60 pointer-events-none" />
      </div>
    </div>
  );
});
CctvPip.displayName = 'CctvPip';

const Index = () => {
  const { setAircraft, setSatellites, setEarthquakes, setNews, setLastRefresh, setNewsLoading, setWeatherAlerts, setVolcanoes, setVessels, setProtests, setOutages, setFires, toggleLayer, closeDetailPanel, mapMode, setFollowTarget, visualStyle, filterParams, bottomPanelCollapsed } = useWorldViewStore();
  const styleConfig = computeStyleConfig(visualStyle, filterParams);

  useEffect(() => {
    // Initialize satellites
    const initSatellites = async () => {
      const issPos = await fetchISSPosition();
      setSatellites(generateRealisticSatellites(issPos));
    };
    initSatellites();

    // Initialize vessels
    setVessels(generateVessels());

    // Fetch live aircraft
    fetchLiveAircraft().then(a => { if (a.length > 0) setAircraft(a); });

    // Fetch news + derive protests/outages
    setNewsLoading(true);
    Promise.all([fetchLiveNews(), fetchCyberNews()]).then(([mainNews, cyberNews]) => {
      const allNews = [...mainNews, ...cyberNews].sort((a, b) => b.time.getTime() - a.time.getTime());
      setNews(allNews);
      setProtests(extractProtestsFromNews(allNews));
      setOutages(extractOutagesFromNews(allNews));
      setNewsLoading(false);
    });

    // Fetch earthquakes
    fetchEarthquakes().then(setEarthquakes);

    // Fetch weather
    fetchGlobalWeather().then(setWeatherAlerts);

    // Set volcanoes
    setVolcanoes(ACTIVE_VOLCANOES);

    // Fetch active fires from NASA EONET
    fetchActiveFiresEONET().then(setFires);

    // Refresh intervals
    const aircraftInterval = setInterval(() => {
      fetchLiveAircraft().then((a) => {
        if (a.length > 0) { setAircraft(a); setLastRefresh(new Date()); }
      });
    }, 15000);

    const satInterval = setInterval(async () => {
      const issPos = await fetchISSPosition();
      setSatellites(generateRealisticSatellites(issPos));
    }, 10000);

    const vesselInterval = setInterval(() => setVessels(generateVessels()), 30000);

    const eqInterval = setInterval(() => fetchEarthquakes().then(setEarthquakes), 300000);

    const newsInterval = setInterval(() => {
      Promise.all([fetchLiveNews(), fetchCyberNews()]).then(([mainNews, cyberNews]) => {
        const allNews = [...mainNews, ...cyberNews].sort((a, b) => b.time.getTime() - a.time.getTime());
        setNews(allNews);
        setProtests(extractProtestsFromNews(allNews));
        setOutages(extractOutagesFromNews(allNews));
      });
    }, 180000);

    const weatherInterval = setInterval(() => fetchGlobalWeather().then(setWeatherAlerts), 600000);

    const fireInterval = setInterval(() => fetchActiveFiresEONET().then(setFires), 600000);

    return () => {
      clearInterval(aircraftInterval);
      clearInterval(satInterval);
      clearInterval(vesselInterval);
      clearInterval(eqInterval);
      clearInterval(newsInterval);
      clearInterval(weatherInterval);
      clearInterval(fireInterval);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'escape') { setFollowTarget(null); closeDetailPanel(); return; }
      const layer = LAYER_SHORTCUTS[key];
      if (layer) toggleLayer(layer);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleLayer, closeDetailPanel, setFollowTarget]);

  return (
    <div className="h-screen w-screen flex flex-col bg-void overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 relative">
            {/* SVG filters for CRT effects */}
            <svg className="absolute w-0 h-0">
              <defs>
                <filter id="crt-rgb-split">
                  <feOffset in="SourceGraphic" dx="2" dy="0" result="red" />
                  <feOffset in="SourceGraphic" dx="-2" dy="0" result="blue" />
                  <feOffset in="SourceGraphic" dx="0" dy="1" result="green" />
                  <feColorMatrix in="red" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="redOnly" />
                  <feColorMatrix in="green" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="greenOnly" />
                  <feColorMatrix in="blue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blueOnly" />
                  <feBlend in="redOnly" in2="greenOnly" mode="screen" result="rg" />
                  <feBlend in="rg" in2="blueOnly" mode="screen" />
                </filter>
              </defs>
            </svg>
            {/* CRT barrel distortion wrapper — only when CRT active */}
            <div
              className="absolute inset-0"
              style={styleConfig.crt ? {
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 80px 30px rgba(0,0,0,0.7), 0 0 2px 1px rgba(80,80,80,0.3)',
              } : undefined}
            >
              {/* Map with visual style filter applied */}
              <div
                className="absolute inset-0"
                style={{
                  filter: styleConfig.crt
                    ? `${styleConfig.filter} url(#crt-rgb-split)`
                    : styleConfig.filter,
                  ...(styleConfig.crt ? {
                    // Barrel distortion via scale + perspective to simulate CRT curvature
                    transform: 'scale(1.04)',
                    transformOrigin: 'center center',
                  } : {}),
                }}
              >
                {mapMode === '2d' ? (
                  <MapContainer />
                ) : mapMode === 'google3d' ? (
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center bg-background">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span className="text-[11px] font-display tracking-wider text-muted-foreground">LOADING GOOGLE 3D...</span>
                      </div>
                    </div>
                  }>
                    <Google3DGlobe />
                  </Suspense>
                ) : (
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center bg-background">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span className="text-[11px] font-display tracking-wider text-muted-foreground">LOADING GLOBE...</span>
                      </div>
                    </div>
                  }>
                    <GlobeContainer />
                  </Suspense>
                )}
              </div>
            </div>
            {/* Tint overlay */}
            {styleConfig.tint && (
              <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundColor: styleConfig.tint, mixBlendMode: visualStyle === 'nvg' ? 'multiply' : 'normal', ...(styleConfig.crt ? { borderRadius: '18px' } : {}) }} />
            )}
            {/* CRT-specific overlays */}
            {styleConfig.crt && (
              <>
                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none z-10"
                  style={{ opacity: styleConfig.scanlineOpacity ?? 0.12, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.6) 2px, rgba(0,0,0,0.6) 4px)', borderRadius: '18px' }}
                />
                {/* RGB sub-pixel columns */}
                <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]"
                  style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,0,0,0.3) 0px, rgba(0,255,0,0.3) 1px, rgba(0,100,255,0.3) 2px, transparent 3px)', borderRadius: '18px' }}
                />
                {/* Heavy vignette for CRT tube edges */}
                <div className="absolute inset-0 pointer-events-none z-10"
                  style={{ background: `radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,${(styleConfig.vignetteStrength ?? 0.5) * 0.8}) 65%, rgba(0,0,0,0.92) 100%)`, borderRadius: '18px' }}
                />
                {/* CRT bezel highlight — subtle edge reflection */}
                <div className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    borderRadius: '18px',
                    boxShadow: 'inset 0 0 60px 20px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.03)',
                    border: '2px solid rgba(60,60,60,0.4)',
                  }}
                />
                {/* Flicker */}
                <div className="absolute inset-0 pointer-events-none z-10 animate-crt-flicker" style={{ borderRadius: '18px' }} />
              </>
            )}
            {/* Scanlines (non-CRT) */}
            {styleConfig.scanlines && !styleConfig.crt && (
              <div className="absolute inset-0 pointer-events-none z-10"
                style={{ opacity: styleConfig.scanlineOpacity ?? 0.08, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)' }}
              />
            )}
            {/* Vignette (non-CRT) */}
            {styleConfig.vignette && !styleConfig.crt && (
              <div className="absolute inset-0 pointer-events-none z-10"
                style={{ background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${styleConfig.vignetteStrength ?? 0.6}) 100%)` }}
              />
            )}
            {/* Street View Overlay — fills main map when camera selected */}
            <StreetViewOverlay />
            {/* HUD Overlay */}
            <HudOverlay />
            {/* AC-130 Tracking HUD */}
            <TrackingHud />
            {/* Search Bar */}
            <SearchBar />
            {/* Globe Controls */}
            {mapMode === 'google3d' && <GlobeControls />}
            {/* Style Presets Bar */}
            <StylePresetsBar />
            {/* Style Parameters Panel */}
            <StyleParametersPanel />
            {/* Holographic CCTV PiP */}
            <CctvPip />
            {/* Holographic TV */}
            <HolographicTV />
            {/* Tactical Alerts */}
            <TacticalAlerts />
            {/* Minimap Radar */}
            <MinimapRadar />
            {/* Threat Gauge */}
            <ThreatGauge />
          </div>
          <div className={bottomPanelCollapsed ? 'h-[26px]' : 'h-[220px]'} style={{ transition: 'height 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
            <BottomFeed />
          </div>
        </div>
        <RightPanel />
      </div>
    </div>
  );
};

export default Index;
