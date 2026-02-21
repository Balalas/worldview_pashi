import { useEffect } from 'react';
import TopBar from '@/components/panels/TopBar';
import LeftPanel from '@/components/panels/LeftPanel';
import RightPanel from '@/components/panels/RightPanel';
import BottomFeed from '@/components/panels/BottomFeed';
import MapContainer from '@/components/map/MapContainer';
import { useWorldViewStore, LAYER_SHORTCUTS, MOCK_NEWS } from '@/store/worldview';
import { fetchEarthquakes, generateMockAircraft, generateMockSatellites } from '@/services/dataServices';

const Index = () => {
  const { setAircraft, setSatellites, setEarthquakes, setNews, setLastRefresh, toggleLayer, closeDetailPanel } = useWorldViewStore();

  // Load data on mount
  useEffect(() => {
    // Mock aircraft & satellites
    setAircraft(generateMockAircraft());
    setSatellites(generateMockSatellites());
    setNews(MOCK_NEWS);

    // Real earthquake data
    fetchEarthquakes().then(setEarthquakes);

    // Simulate aircraft movement
    const moveInterval = setInterval(() => {
      setAircraft(generateMockAircraft());
      setLastRefresh(new Date());
    }, 15000);

    // Re-fetch earthquakes every 5 min
    const eqInterval = setInterval(() => {
      fetchEarthquakes().then(setEarthquakes);
    }, 300000);

    return () => {
      clearInterval(moveInterval);
      clearInterval(eqInterval);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 'escape') {
        closeDetailPanel();
        return;
      }
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
            <MapContainer />
            {/* Scan line overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan-line" />
            </div>
          </div>
          <div className="h-[180px]">
            <BottomFeed />
          </div>
        </div>
        <RightPanel />
      </div>
    </div>
  );
};

export default Index;
