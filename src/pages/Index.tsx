import { useEffect, lazy, Suspense } from 'react';
import TopBar from '@/components/panels/TopBar';
import LeftPanel from '@/components/panels/LeftPanel';
import RightPanel from '@/components/panels/RightPanel';
import BottomFeed from '@/components/panels/BottomFeed';
import MapContainer from '@/components/map/MapContainer';
import { useWorldViewStore, LAYER_SHORTCUTS } from '@/store/worldview';
import { fetchEarthquakes, fetchLiveNews, fetchLiveAircraft } from '@/services/dataServices';
import { generateRealisticSatellites, fetchISSPosition } from '@/services/satelliteService';
import { fetchGlobalWeather, ACTIVE_VOLCANOES } from '@/services/weatherService';
import { generateVessels, extractProtestsFromNews, extractOutagesFromNews, fetchCyberNews } from '@/services/vesselService';

const GlobeContainer = lazy(() => import('@/components/map/GlobeContainer'));

const Index = () => {
  const { setAircraft, setSatellites, setEarthquakes, setNews, setLastRefresh, setNewsLoading, setWeatherAlerts, setVolcanoes, setVessels, setProtests, setOutages, toggleLayer, closeDetailPanel, mapMode } = useWorldViewStore();

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

    return () => {
      clearInterval(aircraftInterval);
      clearInterval(satInterval);
      clearInterval(vesselInterval);
      clearInterval(eqInterval);
      clearInterval(newsInterval);
      clearInterval(weatherInterval);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'escape') { closeDetailPanel(); return; }
      const layer = LAYER_SHORTCUTS[key];
      if (layer) toggleLayer(layer);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleLayer, closeDetailPanel]);

  return (
    <div className="h-screen w-screen flex flex-col bg-void overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 relative">
            {mapMode === '2d' ? (
              <MapContainer />
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
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan-line" />
            </div>
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
