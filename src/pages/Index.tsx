import { useEffect, lazy, Suspense, memo, useState, useCallback, useRef } from 'react';
import TopBar from '@/components/panels/TopBar';
import LeftPanel from '@/components/panels/LeftPanel';
import RightPanel from '@/components/panels/RightPanel';
import BottomFeed from '@/components/panels/BottomFeed';
import MapContainer from '@/components/map/MapContainer';
import HudOverlay from '@/components/hud/HudOverlay';
import TrackingHud from '@/components/hud/TrackingHud';
import StreetViewOverlay from '@/components/map/StreetViewOverlay';
import GlobeControls from '@/components/hud/GlobeControls';
import PanopticOverlay from '@/components/hud/PanopticOverlay';
import SearchBar from '@/components/hud/SearchBar';
import { computeStyleConfig } from '@/components/hud/StylePresetsBar';
import WeatherRadarOverlay from '@/components/map/WeatherRadarOverlay';
import TacticalAlerts from '@/components/hud/TacticalAlerts';
import CountryDossier from '@/components/panels/CountryDossier';
import MinimapRadar from '@/components/hud/MinimapRadar';
import BootScreen from '@/components/hud/BootScreen';

import { useWorldViewStore, LAYER_SHORTCUTS, LANDMARK_PRESETS, VisualStyle } from '@/store/worldview';
import { fetchEarthquakes, fetchLiveNews, fetchLiveAircraft } from '@/services/dataServices';
import { generateRealisticSatellites, fetchISSPosition } from '@/services/satelliteService';
import { fetchGlobalWeather, ACTIVE_VOLCANOES } from '@/services/weatherService';
import { generateVessels, extractProtestsFromNews, extractOutagesFromNews, fetchCyberNews } from '@/services/vesselService';
import { fetchFires } from '@/services/fireService';
import { fetchGdeltData } from '@/services/gdeltService';
import { fetchUserLocation } from '@/services/geolocateService';
import { fetchAllCountries } from '@/services/countryService';
import { fetchAllCameras } from '@/services/cameraService';
import { fetchConflictIntel } from '@/services/conflictIntelService';
import { fetchOsintData } from '@/services/osintService';
import { fetchTwitterOsint } from '@/services/twitterOsintService';
import { CONFLICT_ZONES } from '@/data/conflictZones';

const Google3DGlobe = lazy(() => import('@/components/map/Google3DGlobe'));

// Visual mode shortcuts: 1-7
const VISUAL_SHORTCUTS: Record<string, VisualStyle> = {
  '1': 'normal', '2': 'crt', '3': 'nvg', '4': 'flir', '5': 'anime', '6': 'noir', '7': 'snow', '8': 'ai',
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
  const { setAircraft, setSatellites, setEarthquakes, setNews, setLastRefresh, setNewsLoading, setWeatherAlerts, setVolcanoes, setVessels, setProtests, setOutages, setFires, setLiveCameras, toggleLayer, closeDetailPanel, mapMode, setFollowTarget, visualStyle, setVisualStyle, filterParams, bottomPanelCollapsed, bottomPanelExpanded, setMapCenter, isScreensaver, setScreensaver, immersiveMode, circularViewport, hudLayout, warMode, setGeoEvents, layerSubFilters, setConflictIntel, setMissileArcs, manualRefresh, setTwitterGeoMarkers, setTwitterPosts, setTwitterLastFetch } = useWorldViewStore();
  const earthquakeTimeWindow = layerSubFilters.earthquakeTimeWindow || '24H';
  const styleConfig = computeStyleConfig(visualStyle, filterParams);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const IDLE_TIMEOUT = 120000;
  const [booting, setBooting] = useState(true);

  // Idle / Screensaver detection — disabled

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

    // Fetch news from GDELT + RSS
    setNewsLoading(true);
    const fetchAllNews = async () => {
      try {
        const [gdeltResult, mainNews, cyberNews] = await Promise.all([
          fetchGdeltData(),
          fetchLiveNews(),
          fetchCyberNews(),
        ]);
        // Merge GDELT articles with RSS, deduplicate by title similarity
        const rssNews = [...mainNews, ...cyberNews];
        const seenTitles = new Set(gdeltResult.articles.map(a => a.title.toLowerCase().substring(0, 40)));
        const uniqueRss = rssNews.filter(n => !seenTitles.has(n.title.toLowerCase().substring(0, 40)));
        const allNews = [...gdeltResult.articles, ...uniqueRss].sort((a, b) => b.time.getTime() - a.time.getTime());
        setNews(allNews);
        setGeoEvents(gdeltResult.events);
        setProtests(extractProtestsFromNews(allNews));
        setOutages(extractOutagesFromNews(allNews));
        setNewsLoading(false);
      } catch (e) {
        console.warn('News fetch error:', e);
        // Fallback to RSS only
        const [mainNews, cyberNews] = await Promise.all([fetchLiveNews(), fetchCyberNews()]);
        const allNews = [...mainNews, ...cyberNews].sort((a, b) => b.time.getTime() - a.time.getTime());
        setNews(allNews);
        setProtests(extractProtestsFromNews(allNews));
        setOutages(extractOutagesFromNews(allNews));
        setNewsLoading(false);
      }
    };
    fetchAllNews();

    // Fetch earthquakes with current time window
    const eqTimeWindow = useWorldViewStore.getState().layerSubFilters.earthquakeTimeWindow || '24H';
    fetchEarthquakes(eqTimeWindow).then(setEarthquakes);

    // Fetch weather
    fetchGlobalWeather().then(setWeatherAlerts);

    // Set volcanoes
    setVolcanoes(ACTIVE_VOLCANOES);

    // Fetch active fires from NASA FIRMS + EONET
    fetchFires('24H').then(setFires);

    // Pre-load country enrichment data
    fetchAllCountries();

    // Fetch live cameras from multi-source aggregator
    fetchAllCameras().then(setLiveCameras);

    // Auto-center map on user location via IP geolocation
    fetchUserLocation().then((loc) => {
      if (loc) {
        setMapCenter({ lat: loc.lat, lon: loc.lon, zoom: 6 });
        console.log(`Auto-centered on ${loc.city}, ${loc.country}`);
      }
    });

    // ── Refresh intervals — ALL intelligence feeds every 60s ──
    const INTEL_REFRESH_MS = 60_000; // 1 minute

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

    const eqInterval = setInterval(() => {
      const tw = useWorldViewStore.getState().layerSubFilters.earthquakeTimeWindow || '24H';
      fetchEarthquakes(tw).then(setEarthquakes);
    }, INTEL_REFRESH_MS);

    const newsInterval = setInterval(async () => {
      try {
        const [gdeltResult, mainNews, cyberNews] = await Promise.all([
          fetchGdeltData(),
          fetchLiveNews(),
          fetchCyberNews(),
        ]);
        const rssNews = [...mainNews, ...cyberNews];
        const seenTitles = new Set(gdeltResult.articles.map(a => a.title.toLowerCase().substring(0, 40)));
        const uniqueRss = rssNews.filter(n => !seenTitles.has(n.title.toLowerCase().substring(0, 40)));
        const allNews = [...gdeltResult.articles, ...uniqueRss].sort((a, b) => b.time.getTime() - a.time.getTime());
        setNews(allNews);
        setGeoEvents(gdeltResult.events);
        setProtests(extractProtestsFromNews(allNews));
        setOutages(extractOutagesFromNews(allNews));
      } catch (e) {
        console.warn('News refresh error:', e);
      }
    }, INTEL_REFRESH_MS);

    const weatherInterval = setInterval(() => fetchGlobalWeather().then(setWeatherAlerts), INTEL_REFRESH_MS * 3); // 3 min
    const fireInterval = setInterval(() => fetchFires('24H').then(setFires), INTEL_REFRESH_MS);
    const cameraInterval = setInterval(() => fetchAllCameras().then(setLiveCameras), INTEL_REFRESH_MS * 2);

    return () => {
      clearInterval(aircraftInterval);
      clearInterval(satInterval);
      clearInterval(vesselInterval);
      clearInterval(eqInterval);
      clearInterval(newsInterval);
      clearInterval(weatherInterval);
      clearInterval(fireInterval);
      clearInterval(cameraInterval);
    };
  }, []);

  // WAR MODE — 60s rapid news refresh when active
  useEffect(() => {
    if (!warMode) return;
    const warRefresh = async () => {
      try {
        const [gdeltResult, mainNews, cyberNews] = await Promise.all([
          fetchGdeltData({ warMode: true }),
          fetchLiveNews(),
          fetchCyberNews(),
        ]);
        const rssNews = [...mainNews, ...cyberNews];
        const seenTitles = new Set(gdeltResult.articles.map(a => a.title.toLowerCase().substring(0, 40)));
        const uniqueRss = rssNews.filter(n => !seenTitles.has(n.title.toLowerCase().substring(0, 40)));
        const allNews = [...gdeltResult.articles, ...uniqueRss].sort((a, b) => b.time.getTime() - a.time.getTime());
        setNews(allNews);
        setGeoEvents(gdeltResult.events);
      } catch (e) {
        console.warn('War mode refresh error:', e);
      }
    };
    const warNewsInterval = setInterval(warRefresh, 60000);
    warRefresh(); // immediate
    return () => clearInterval(warNewsInterval);
  }, [warMode, setNews]);

  // AI Conflict Intel — fetch OSINT from X accounts + missile data + escalation predictions
  useEffect(() => {
    const fetchIntel = async () => {
      const state = useWorldViewStore.getState();
      const headlines = state.news.map(n => n.title);
      const zones = CONFLICT_ZONES.map(z => z.name);

      // Fetch live OSINT from X accounts via Firecrawl
      const osintData = await fetchOsintData();
      const osintHeadlines = osintData?.headlines || [];

      if (osintHeadlines.length > 0) {
        console.log(`[OSINT] Fetched ${osintHeadlines.length} live posts from X accounts`);
      }

      const intel = await fetchConflictIntel(headlines, zones, osintHeadlines);
      if (intel) {
        setConflictIntel(intel);
        if (intel.missileActivity?.length > 0) {
          setMissileArcs(intel.missileActivity);
        }
      }
    };
    // Fetch after news loads (delayed)
    const timer = setTimeout(fetchIntel, 5000);
    const interval = setInterval(fetchIntel, 120_000); // every 2 min
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [setConflictIntel, setMissileArcs]);

  // ── Twitter/X OSINT → geo markers on map + full posts for card ──
  useEffect(() => {
    const fetchTwitter = async () => {
      try {
        const data = await fetchTwitterOsint();
        if (data) {
          // Store full posts for X OSINT card
          if (data.posts.length > 0) {
            setTwitterPosts(data.posts);
            setTwitterLastFetch(data.fetchedAt);
          }
          // Geolocated markers on map
          if (data.geolocated && data.geolocated.length > 0) {
            const markers = data.geolocated.map(p => ({
              id: p.id,
              lat: p.geo!.lat,
              lon: p.geo!.lon,
              place: p.geo!.place,
              text: p.text,
              account: p.account,
              url: p.url,
              createdAt: p.createdAt,
            }));
            setTwitterGeoMarkers(markers);
            console.log(`[X/OSINT] ${markers.length} geolocated + ${data.posts.length} total posts`);
          }
        }
      } catch (e) {
        console.warn('Twitter OSINT fetch error:', e);
      }
    };
    const timer = setTimeout(fetchTwitter, 4000); // fast initial
    const interval = setInterval(fetchTwitter, 60_000); // every 60s
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [setTwitterGeoMarkers, setTwitterPosts, setTwitterLastFetch]);

  // Manual refresh trigger
  useEffect(() => {
    if (manualRefresh === 0) return;
    setNewsLoading(true);
    const doRefresh = async () => {
      try {
        const [gdeltResult, mainNews, cyberNews] = await Promise.all([
          fetchGdeltData(),
          fetchLiveNews(),
          fetchCyberNews(),
        ]);
        const rssNews = [...mainNews, ...cyberNews];
        const seenTitles = new Set(gdeltResult.articles.map(a => a.title.toLowerCase().substring(0, 40)));
        const uniqueRss = rssNews.filter(n => !seenTitles.has(n.title.toLowerCase().substring(0, 40)));
        const allNews = [...gdeltResult.articles, ...uniqueRss].sort((a, b) => b.time.getTime() - a.time.getTime());
        setNews(allNews);
        setGeoEvents(gdeltResult.events);
        setProtests(extractProtestsFromNews(allNews));
        setOutages(extractOutagesFromNews(allNews));
        setLastRefresh(new Date());

        // Also refresh OSINT + conflict intel
        const osintData = await fetchOsintData();
        const osintHeadlines = osintData?.headlines || [];
        const headlines = allNews.map(n => n.title);
        const zones = CONFLICT_ZONES.map(z => z.name);
        const intel = await fetchConflictIntel(headlines, zones, osintHeadlines);
        if (intel) {
          setConflictIntel(intel);
          if (intel.missileActivity?.length > 0) setMissileArcs(intel.missileActivity);
        }
      } catch (e) {
        console.warn('Manual refresh error:', e);
      } finally {
        setNewsLoading(false);
      }
    };
    doRefresh();
  }, [manualRefresh]);

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

      // I for immersive mode
      if (key === 'i') { useWorldViewStore.getState().toggleImmersiveMode(); return; }

      // H for HUD layout cycle
      if (key === 'h') { useWorldViewStore.getState().cycleHudLayout(); return; }

      const layer = LAYER_SHORTCUTS[key];
      if (layer) toggleLayer(layer);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleLayer, closeDetailPanel, setFollowTarget, setVisualStyle, setMapCenter]);

  // Re-fetch earthquakes when time window changes
  useEffect(() => {
    fetchEarthquakes(earthquakeTimeWindow).then(setEarthquakes);
  }, [earthquakeTimeWindow]);

  if (booting) {
    return <BootScreen onComplete={() => setBooting(false)} />;
  }

  return (
    <div className="min-h-screen w-screen bg-void overflow-y-auto relative">
      {/* Map section — fullscreen in screensaver, 60vh normally */}
      <div className={`relative w-full z-0 transition-all duration-700 ${isScreensaver ? 'h-screen' : 'h-[60vh]'}`} style={{ isolation: 'isolate', ...(circularViewport ? { clipPath: 'circle(50% at 50% 50%)' } : {}) }}>
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
            <filter id="crt-fisheye" x="-10%" y="-10%" width="120%" height="120%">
              <feImage xlinkHref="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3CradialGradient id='g'%3E%3Cstop offset='0%25' stop-color='rgb(128,128,128)'/%3E%3Cstop offset='55%25' stop-color='rgb(140,140,140)'/%3E%3Cstop offset='80%25' stop-color='rgb(160,160,160)'/%3E%3Cstop offset='100%25' stop-color='rgb(190,190,190)'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23g)'/%3E%3C/svg%3E" result="map" preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%" />
              <feDisplacementMap in="SourceGraphic" in2="map" scale="35" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>

        <div className="absolute inset-0"
          style={styleConfig.crt ? {
            borderRadius: '18px', overflow: 'hidden',
            boxShadow: 'inset 0 0 80px 30px rgba(0,0,0,0.7), 0 0 2px 1px rgba(80,80,80,0.3)',
          } : undefined}
        >
          <div className="absolute inset-0"
            style={{
              filter: styleConfig.crt ? `${styleConfig.filter} url(#crt-rgb-split) url(#crt-fisheye)` : styleConfig.filter,
              ...(styleConfig.crt ? { transform: 'scale(1.08)', transformOrigin: 'center center' } : {}),
            }}
          >
            {mapMode === '2d' ? (
              <MapContainer />
            ) : mapMode === 'google3d' ? (
              <Suspense fallback={<MapLoader label="GOOGLE 3D" />}>
                <Google3DGlobe />
              </Suspense>
            ) : null}
          </div>
        </div>

        <WeatherRadarOverlay />

        {styleConfig.tint && (
          <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundColor: styleConfig.tint, mixBlendMode: visualStyle === 'nvg' ? 'multiply' : 'normal', ...(styleConfig.crt ? { borderRadius: '18px' } : {}) }} />
        )}

        {styleConfig.crt && (
          <>
            <div className="absolute inset-0 pointer-events-none z-10" style={{ opacity: styleConfig.scanlineOpacity ?? 0.12, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.6) 2px, rgba(0,0,0,0.6) 4px)', borderRadius: '18px' }} />
            <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,0,0,0.3) 0px, rgba(0,255,0,0.3) 1px, rgba(0,100,255,0.3) 2px, transparent 3px)', borderRadius: '18px' }} />
            <div className="absolute inset-0 pointer-events-none z-10" style={{ background: `radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,${(styleConfig.vignetteStrength ?? 0.5) * 0.8}) 65%, rgba(0,0,0,0.92) 100%)`, borderRadius: '18px' }} />
            <div className="absolute inset-0 pointer-events-none z-10" style={{ borderRadius: '18px', boxShadow: 'inset 0 0 60px 20px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.03)', border: '2px solid rgba(60,60,60,0.4)' }} />
            <div className="absolute inset-0 pointer-events-none z-10 animate-crt-flicker" style={{ borderRadius: '18px' }} />
          </>
        )}

        {styleConfig.scanlines && !styleConfig.crt && (
          <div className="absolute inset-0 pointer-events-none z-10" style={{ opacity: styleConfig.scanlineOpacity ?? 0.08, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)' }} />
        )}

        {styleConfig.vignette && !styleConfig.crt && (
          <div className="absolute inset-0 pointer-events-none z-10" style={{ background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${styleConfig.vignetteStrength ?? 0.6}) 100%)` }} />
        )}

        {visualStyle === 'ai' && (
          <>
            <div className="absolute inset-0 pointer-events-none z-10"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,255,255,${(filterParams.gridOpacity ?? 40) / 1000}) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,255,255,${(filterParams.gridOpacity ?? 40) / 1000}) 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
              }}
            />
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <div className="absolute left-0 right-0 h-[2px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.4), transparent)',
                  boxShadow: '0 0 20px rgba(0,255,255,0.3)',
                  animation: `scan-line ${6 - (filterParams.scanSpeed ?? 50) / 20}s linear infinite`,
                }}
              />
            </div>
            <div className="absolute inset-0 pointer-events-none z-10"
              style={{ boxShadow: 'inset 0 0 60px rgba(0,255,255,0.05), inset 0 0 120px rgba(255,0,255,0.03)' }}
            />
          </>
        )}

        <StreetViewOverlay />
      </div>

      {warMode && (
        <div className="absolute inset-0 pointer-events-none z-15"
          style={{
            boxShadow: 'inset 0 0 120px 40px rgba(255,30,30,0.12), inset 0 0 300px 80px rgba(255,0,0,0.05)',
            border: '1px solid rgba(255,50,50,0.15)',
          }}
        />
      )}

      {/* Floating UI layer — positioned over the map section */}
      <div className={`absolute inset-0 pointer-events-none z-20 ${isScreensaver ? 'h-screen' : 'h-[60vh]'}`}>
        {!isScreensaver && (
          <>
            <HudOverlay />
            <TrackingHud />
            <PanopticOverlay />
            {!immersiveMode && <TopBar />}
            {!immersiveMode && (
              <div className="pointer-events-auto">
                <SearchBar />
              </div>
            )}
            {!immersiveMode && <LeftPanel />}
          </>
        )}

        {!isScreensaver && <RightPanel />}
        

        {!isScreensaver && (
          <div className="pointer-events-auto">
            <GlobeControls />
          </div>
        )}




        <CctvPip />

        {!isScreensaver && (
          <div className="pointer-events-auto">
            <TacticalAlerts />
          </div>
        )}

        {!isScreensaver && <MinimapRadar />}

        {!isScreensaver && <KeyboardHints />}

        {isScreensaver && <ScreensaverOverlay />}
      </div>

      {/* Bottom Feed — flows naturally below the map */}
      {!isScreensaver && !immersiveMode && (
        <div className="relative z-10">
          <BottomFeed />
        </div>
      )}

      {/* Country Dossier overlay */}
      <CountryDossier />
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
          <div><span className="text-primary/60">1-8</span> Visual modes (Normal/CRT/NVG/FLIR/Anime/Noir/Snow/AI)</div>
          <div><span className="text-primary/60">Q,W,E,R,T</span> Fly to NYC / London / Tokyo / Dubai / Sydney</div>
          <div><span className="text-primary/60">D</span> Toggle sparse/full detection</div>
          <div><span className="text-primary/60">I</span> Immersive mode (hide panels)</div>
          <div><span className="text-primary/60">H</span> Cycle HUD layout (Full/Tactical/Clean)</div>
          <div><span className="text-primary/60">/</span> Search</div>
          <div><span className="text-primary/60">ESC</span> Clear tracking</div>
        </div>
      )}
    </div>
  );
});
KeyboardHints.displayName = 'KeyboardHints';

const ScreensaverOverlay = memo(() => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-fade-in">
      {/* Dark overlay to dim everything except the map */}
      <div className="absolute inset-0 bg-background/40" />
      {/* Holographic logo */}
      <div className="relative">
        <div className="absolute -inset-12 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse, hsl(var(--primary) / 0.4), transparent)',
            filter: 'blur(30px)',
            animation: 'pulse 4s ease-in-out infinite',
          }}
        />
        <div className="relative text-center" style={{ animation: 'float-logo 6s ease-in-out infinite' }}>
          <div className="text-3xl font-display tracking-[0.5em] text-primary/80 font-bold"
            style={{
              textShadow: '0 0 20px hsl(var(--primary) / 0.4), 0 0 60px hsl(var(--primary) / 0.15)',
            }}
          >
            WORLDVIEW
          </div>
          <div className="text-[9px] font-data tracking-[0.4em] text-primary/40 mt-2">
            GLOBAL INTELLIGENCE PLATFORM
          </div>
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.03) 2px, hsl(var(--primary) / 0.03) 4px)',
              animation: 'scanline-scroll 8s linear infinite',
            }}
          />
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[60%] h-4 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(ellipse, hsl(var(--primary) / 0.5), transparent)',
            filter: 'blur(8px)',
          }}
        />
      </div>

      <style>{`
        @keyframes float-logo {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes scanline-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }
      `}</style>
    </div>
  );
});
ScreensaverOverlay.displayName = 'ScreensaverOverlay';

export default Index;
