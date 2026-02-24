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
import WeatherRadarOverlay from '@/components/map/WeatherRadarOverlay';
import TacticalAlerts from '@/components/hud/TacticalAlerts';
import MinimapRadar from '@/components/hud/MinimapRadar';
import ThreatGauge from '@/components/hud/ThreatGauge';
import { useWorldViewStore, LAYER_SHORTCUTS, LANDMARK_PRESETS, VisualStyle } from '@/store/worldview';
import { fetchEarthquakes, fetchLiveNews, fetchLiveAircraft } from '@/services/dataServices';
import { generateRealisticSatellites, fetchISSPosition } from '@/services/satelliteService';
import { fetchGlobalWeather, ACTIVE_VOLCANOES } from '@/services/weatherService';
import { generateVessels, extractProtestsFromNews, extractOutagesFromNews, fetchCyberNews } from '@/services/vesselService';
import { fetchActiveFiresEONET } from '@/services/fireService';

const GlobeContainer = lazy(() => import('@/components/map/GlobeContainer'));
const Google3DGlobe = lazy(() => import('@/components/map/Google3DGlobe'));
const CesiumGlobe = lazy(() => import('@/components/map/CesiumGlobe'));

// Visual mode shortcuts: 1-7
const VISUAL_SHORTCUTS: Record<string, VisualStyle> = {
  '1': 'normal', '2': 'crt', '3': 'nvg', '4': 'flir', '5': 'anime', '6': 'noir', '7': 'snow',
};

// Landmark shortcuts: Q,W,E,R,T
const LANDMARK_KEYS = ['q', 'w', 'e', 'r', 't'];
const QUICK_LANDMARKS = [
  LANDMARK_PRESETS.find(l => l.label === 'NEW YORK')!,
  LANDMARK_PRESETS.find(l => l.label === 'LONDON')!,
  LANDMARK_PRESETS.find(l => l.label === 'TOKYO')!,
  LANDMARK_PRESETS.find(l => l.label === 'DUBAI')!,
  LANDMARK_PRESETS.find(l => l.label === 'SYDNEY')!,
].filter(Boolean);

// Auto-refreshing DOT snapshot image component
const DotSnapshotImage = memo(({ snapshotUrl, name }: { snapshotUrl: string; name: string }) => {
  const [imgSrc, setImgSrc] = useState('');
  const [error, setError] = useState(false);

  const refreshImage = useCallback(() => {
    const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dot-camera-proxy`;
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
    const interval = setInterval(refreshImage, 4000);
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
    <div className="absolute bottom-4 left-4 z-40 group pointer-events-auto">
      <div className="relative w-[280px] h-[160px] rounded-lg overflow-hidden border border-primary/40 shadow-[0_0_20px_rgba(0,255,136,0.15)]"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--background) / 0.3), hsl(var(--background) / 0.1))',
          backdropFilter: 'blur(8px)',
        }}
      >
        {isSnapshot ? (
          <DotSnapshotImage snapshotUrl={cam.snapshotUrl!} name={cam.name} />
        ) : (
          <iframe src={activeLivestream} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={cam?.name || 'CCTV'} />
        )}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)) 2px, hsl(var(--primary)) 3px)' }}
        />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-background/70">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            <span className="text-[8px] font-data text-destructive tracking-wider">● LIVE</span>
            {cam?.official && <span className="text-[7px] font-data text-amber-400 bg-amber-400/10 px-1 rounded">DOT</span>}
            <span className="text-[8px] font-data text-muted-foreground truncate max-w-[140px]">{cam?.name || 'CCTV'}</span>
          </div>
          <button onClick={() => setActiveLivestream(null)} className="text-muted-foreground hover:text-foreground text-[10px] pointer-events-auto">✕</button>
        </div>
        {cam?.source && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center px-2 py-0.5 bg-background/60">
            <span className="text-[7px] font-data text-muted-foreground">SRC: {cam.source}</span>
          </div>
        )}
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
  const { setAircraft, setSatellites, setEarthquakes, setNews, setLastRefresh, setNewsLoading, setWeatherAlerts, setVolcanoes, setVessels, setProtests, setOutages, setFires, toggleLayer, closeDetailPanel, mapMode, setFollowTarget, visualStyle, setVisualStyle, filterParams, bottomPanelCollapsed, setMapCenter } = useWorldViewStore();
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

  // Keyboard shortcuts — layers, visual modes (1-7), landmarks (Q,W,E,R,T)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'escape') { setFollowTarget(null); closeDetailPanel(); return; }

      // Number keys 1-7 for visual modes
      if (VISUAL_SHORTCUTS[key]) { setVisualStyle(VISUAL_SHORTCUTS[key]); return; }

      // Q,W,E,R,T for landmark fly-to
      const landmarkIdx = LANDMARK_KEYS.indexOf(key);
      if (landmarkIdx !== -1 && QUICK_LANDMARKS[landmarkIdx]) {
        const lm = QUICK_LANDMARKS[landmarkIdx];
        setMapCenter({ lat: lm.lat, lon: lm.lon, zoom: lm.zoom });
        return;
      }

      // D for detection mode toggle
      if (key === 'd') { useWorldViewStore.getState().toggleDetectionMode(); return; }

      const layer = LAYER_SHORTCUTS[key];
      if (layer) toggleLayer(layer);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleLayer, closeDetailPanel, setFollowTarget, setVisualStyle, setMapCenter]);

  return (
    <div className="h-screen w-screen bg-void overflow-hidden relative">
      {/* Full-screen map — no flex layout, map fills everything */}
      <div className="absolute inset-0">
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

        {/* CRT barrel distortion wrapper */}
        <div className="absolute inset-0"
          style={styleConfig.crt ? {
            borderRadius: '18px', overflow: 'hidden',
            boxShadow: 'inset 0 0 80px 30px rgba(0,0,0,0.7), 0 0 2px 1px rgba(80,80,80,0.3)',
          } : undefined}
        >
          <div className="absolute inset-0"
            style={{
              filter: styleConfig.crt ? `${styleConfig.filter} url(#crt-rgb-split)` : styleConfig.filter,
              ...(styleConfig.crt ? { transform: 'scale(1.04)', transformOrigin: 'center center' } : {}),
            }}
          >
            {mapMode === '2d' ? (
              <MapContainer />
            ) : mapMode === 'cesium' ? (
              <Suspense fallback={<MapLoader label="CESIUM" />}>
                <CesiumGlobe />
              </Suspense>
            ) : mapMode === 'google3d' ? (
              <Suspense fallback={<MapLoader label="GOOGLE 3D" />}>
                <Google3DGlobe />
              </Suspense>
            ) : (
              <Suspense fallback={<MapLoader label="GLOBE" />}>
                <GlobeContainer />
              </Suspense>
            )}
          </div>
        </div>

        {/* Weather Radar overlay */}
        <WeatherRadarOverlay />

        {/* Style tint overlay */}
        {styleConfig.tint && (
          <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundColor: styleConfig.tint, mixBlendMode: visualStyle === 'nvg' ? 'multiply' : 'normal', ...(styleConfig.crt ? { borderRadius: '18px' } : {}) }} />
        )}

        {/* CRT overlays */}
        {styleConfig.crt && (
          <>
            <div className="absolute inset-0 pointer-events-none z-10" style={{ opacity: styleConfig.scanlineOpacity ?? 0.12, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.6) 2px, rgba(0,0,0,0.6) 4px)', borderRadius: '18px' }} />
            <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,0,0,0.3) 0px, rgba(0,255,0,0.3) 1px, rgba(0,100,255,0.3) 2px, transparent 3px)', borderRadius: '18px' }} />
            <div className="absolute inset-0 pointer-events-none z-10" style={{ background: `radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,${(styleConfig.vignetteStrength ?? 0.5) * 0.8}) 65%, rgba(0,0,0,0.92) 100%)`, borderRadius: '18px' }} />
            <div className="absolute inset-0 pointer-events-none z-10" style={{ borderRadius: '18px', boxShadow: 'inset 0 0 60px 20px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.03)', border: '2px solid rgba(60,60,60,0.4)' }} />
            <div className="absolute inset-0 pointer-events-none z-10 animate-crt-flicker" style={{ borderRadius: '18px' }} />
          </>
        )}

        {/* Scanlines (non-CRT) */}
        {styleConfig.scanlines && !styleConfig.crt && (
          <div className="absolute inset-0 pointer-events-none z-10" style={{ opacity: styleConfig.scanlineOpacity ?? 0.08, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)' }} />
        )}

        {/* Vignette (non-CRT) */}
        {styleConfig.vignette && !styleConfig.crt && (
          <div className="absolute inset-0 pointer-events-none z-10" style={{ background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${styleConfig.vignetteStrength ?? 0.6}) 100%)` }} />
        )}

        {/* Street View Overlay */}
        <StreetViewOverlay />
      </div>

      {/* Floating UI layer — all panels overlay on top of full-screen map */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* HUD Overlay */}
        <HudOverlay />

        {/* Tracking HUD */}
        <TrackingHud />

        {/* Top Bar */}
        <TopBar />

        {/* Search Bar */}
        <div className="pointer-events-auto">
          <SearchBar />
        </div>

        {/* Left Panel — floating */}
        <LeftPanel />

        {/* Right Panel — floating */}
        <div className="absolute top-0 right-0 h-full pointer-events-auto">
          <RightPanel />
        </div>

        {/* Globe Controls */}
        {(mapMode === 'google3d' || mapMode === 'cesium') && (
          <div className="pointer-events-auto">
            <GlobeControls />
          </div>
        )}

        {/* Style Presets Bar */}
        <div className="pointer-events-auto">
          <StylePresetsBar />
        </div>

        {/* Style Parameters Panel */}
        <StyleParametersPanel />

        {/* CCTV PiP */}
        <CctvPip />

        {/* Holographic TV */}
        <div className="pointer-events-auto">
          <HolographicTV />
        </div>

        {/* Tactical Alerts */}
        <div className="pointer-events-auto">
          <TacticalAlerts />
        </div>

        {/* Minimap Radar */}
        <MinimapRadar />

        {/* Threat Gauge */}
        <ThreatGauge />

        {/* Bottom Feed — floating ticker */}
        <div className={`absolute bottom-0 left-0 right-0 pointer-events-auto ${bottomPanelCollapsed ? 'h-[26px]' : 'h-[200px]'}`}
          style={{ transition: 'height 0.3s cubic-bezier(0.16,1,0.3,1)' }}
        >
          <BottomFeed />
        </div>

        {/* Keyboard shortcut hints */}
        <KeyboardHints />
      </div>
    </div>
  );
};

const MapLoader = ({ label }: { label: string }) => (
  <div className="w-full h-full flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <span className="text-[11px] font-display tracking-wider text-muted-foreground">LOADING {label}...</span>
    </div>
  </div>
);

const KeyboardHints = memo(() => {
  const [show, setShow] = useState(false);

  return (
    <div className="absolute bottom-[210px] left-1/2 -translate-x-1/2 pointer-events-auto">
      <button
        onClick={() => setShow(!show)}
        className="text-[7px] font-data text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors tracking-wider"
      >
        {show ? '▼ HIDE KEYS' : '▲ KEYS'}
      </button>
      {show && (
        <div className="mt-1 bg-background/80 backdrop-blur-sm border border-border/30 rounded p-2 text-[7px] font-data text-muted-foreground/50 space-y-0.5 animate-fade-in">
          <div><span className="text-primary/60">1-7</span> Visual modes (Normal/CRT/NVG/FLIR/Anime/Noir/Snow)</div>
          <div><span className="text-primary/60">Q,W,E,R,T</span> Fly to NYC / London / Tokyo / Dubai / Sydney</div>
          <div><span className="text-primary/60">D</span> Toggle sparse/full detection</div>
          <div><span className="text-primary/60">/</span> Search</div>
          <div><span className="text-primary/60">ESC</span> Clear tracking</div>
        </div>
      )}
    </div>
  );
});
KeyboardHints.displayName = 'KeyboardHints';

export default Index;
