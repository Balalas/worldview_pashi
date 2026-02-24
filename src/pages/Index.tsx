import { useEffect, lazy, Suspense, memo } from 'react';
import TopBar from '@/components/panels/TopBar';
import LeftPanel from '@/components/panels/LeftPanel';
import RightPanel from '@/components/panels/RightPanel';
import BottomFeed from '@/components/panels/BottomFeed';
import MapContainer from '@/components/map/MapContainer';
import HudOverlay from '@/components/hud/HudOverlay';
import TrackingHud from '@/components/hud/TrackingHud';
import GlobeControls from '@/components/hud/GlobeControls';
import SearchBar from '@/components/hud/SearchBar';
import { useWorldViewStore, LAYER_SHORTCUTS } from '@/store/worldview';
import { fetchEarthquakes, fetchLiveNews, fetchLiveAircraft } from '@/services/dataServices';
import { generateRealisticSatellites, fetchISSPosition } from '@/services/satelliteService';
import { fetchGlobalWeather, ACTIVE_VOLCANOES } from '@/services/weatherService';
import { generateVessels, extractProtestsFromNews, extractOutagesFromNews, fetchCyberNews } from '@/services/vesselService';
import { fetchActiveFiresEONET } from '@/services/fireService';

const GlobeContainer = lazy(() => import('@/components/map/GlobeContainer'));
const Google3DGlobe = lazy(() => import('@/components/map/Google3DGlobe'));

// Holographic CCTV picture-in-picture overlay
const CctvPip = memo(() => {
  const { activeLivestream, setActiveLivestream, detailPanel } = useWorldViewStore();
  if (!activeLivestream || detailPanel.type !== 'camera') return null;
  const cam = detailPanel.data;
  
  return (
    <div className="absolute bottom-4 left-4 z-40 group">
      <div className="relative w-[280px] h-[160px] rounded-lg overflow-hidden border border-primary/40 shadow-[0_0_20px_rgba(0,255,136,0.15)]"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--background) / 0.3), hsl(var(--background) / 0.1))',
          backdropFilter: 'blur(8px)',
        }}
      >
        <iframe
          src={activeLivestream}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={cam?.name || 'CCTV'}
        />
        {/* Holographic scan lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary)) 2px, hsl(var(--primary)) 3px)' }}
        />
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-background/70">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            <span className="text-[8px] font-data text-destructive tracking-wider">● LIVE</span>
            <span className="text-[8px] font-data text-muted-foreground">{cam?.name || 'CCTV'}</span>
          </div>
          <button onClick={() => setActiveLivestream(null)} className="text-muted-foreground hover:text-foreground text-[10px] pointer-events-auto">✕</button>
        </div>
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
  const { setAircraft, setSatellites, setEarthquakes, setNews, setLastRefresh, setNewsLoading, setWeatherAlerts, setVolcanoes, setVessels, setProtests, setOutages, setFires, toggleLayer, closeDetailPanel, mapMode, setFollowTarget } = useWorldViewStore();

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
            {/* HUD Overlay */}
            <HudOverlay />
            {/* AC-130 Tracking HUD */}
            <TrackingHud />
            {/* Search Bar */}
            <SearchBar />
            {/* Globe Controls */}
            {mapMode === 'google3d' && <GlobeControls />}
            {/* Holographic CCTV PiP */}
            <CctvPip />
          </div>
          <div className="h-[220px]">
            <BottomFeed />
          </div>
        </div>
        <RightPanel />
      </div>
    </div>
  );
};

export default Index;
