import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { useWorldViewStore } from '@/store/worldview';

/**
 * WeatherRadarOverlay — renders live cloud/radar tiles from RainViewer (free, no API key)
 * Uses canvas to composite tiles at the correct positions based on the 3D globe's viewport.
 * Renders as a transparent overlay with pointer-events: none.
 */

interface RainViewerFrame {
  time: number;
  path: string;
}

interface RainViewerData {
  radar: { past: RainViewerFrame[]; nowcast: RainViewerFrame[] };
  satellite: { infrared: RainViewerFrame[] };
}

const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';
const TILE_SIZE = 256;

const WeatherRadarOverlay = memo(() => {
  const { layerSubFilters, layers } = useWorldViewStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [weatherData, setWeatherData] = useState<RainViewerData | null>(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval>>(null);

  const showClouds = layers.weather && layerSubFilters.showClouds;
  const showRadar = layers.weather && layerSubFilters.showRadar;
  const opacity = layerSubFilters.cloudOpacity / 100;

  // Fetch RainViewer data
  useEffect(() => {
    if (!showClouds && !showRadar) return;
    
    const fetchData = async () => {
      try {
        const res = await fetch(RAINVIEWER_API);
        const data: RainViewerData = await res.json();
        setWeatherData(data);
      } catch (err) {
        console.warn('RainViewer fetch failed:', err);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 600000); // refresh every 10min
    return () => clearInterval(interval);
  }, [showClouds, showRadar]);

  // Get current frame
  const getFramePath = useCallback((): string | null => {
    if (!weatherData) return null;
    
    if (showClouds) {
      const frames = weatherData.satellite?.infrared || [];
      if (frames.length === 0) return null;
      return frames[Math.min(frameIdx, frames.length - 1)]?.path || null;
    }
    
    if (showRadar) {
      const frames = [...(weatherData.radar?.past || []), ...(weatherData.radar?.nowcast || [])];
      if (frames.length === 0) return null;
      return frames[Math.min(frameIdx, frames.length - 1)]?.path || null;
    }
    
    return null;
  }, [weatherData, frameIdx, showClouds, showRadar]);

  // Animate through frames
  useEffect(() => {
    if (!weatherData || (!showClouds && !showRadar)) return;
    
    const frames = showClouds
      ? (weatherData.satellite?.infrared || [])
      : [...(weatherData.radar?.past || []), ...(weatherData.radar?.nowcast || [])];
    
    if (frames.length <= 1) return;
    
    setFrameIdx(frames.length - 1); // start at latest
    
    animRef.current = setInterval(() => {
      setFrameIdx(prev => (prev + 1) % frames.length);
    }, 1500);
    
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [weatherData, showClouds, showRadar]);

  // Render tiles to canvas — global mercator composite at zoom 1 (4 tiles)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (!showClouds && !showRadar)) return;
    
    const framePath = getFramePath();
    if (!framePath) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const zoom = 1; // global view — 4 tiles (2x2)
    const tilesPerSide = Math.pow(2, zoom);
    canvas.width = TILE_SIZE * tilesPerSide;
    canvas.height = TILE_SIZE * tilesPerSide;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Color scheme: 2 = smooth dark, size 256
    const colorScheme = showRadar ? 4 : 0; // 4 = "The Weather Channel" for radar, 0 = original for satellite
    const smooth = 1;
    const snow = 1;
    
    let loadedCount = 0;
    const totalTiles = tilesPerSide * tilesPerSide;
    
    for (let x = 0; x < tilesPerSide; x++) {
      for (let y = 0; y < tilesPerSide; y++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        if (showClouds) {
          img.src = `https://tilecache.rainviewer.com${framePath}/${TILE_SIZE}/${zoom}/${x}/${y}/0/0_0.png`;
        } else {
          img.src = `https://tilecache.rainviewer.com${framePath}/${TILE_SIZE}/${zoom}/${x}/${y}/${colorScheme}/${smooth}_${snow}.png`;
        }
        
        const dx = x * TILE_SIZE;
        const dy = y * TILE_SIZE;
        
        img.onload = () => {
          ctx.drawImage(img, dx, dy, TILE_SIZE, TILE_SIZE);
          loadedCount++;
        };
        img.onerror = () => { loadedCount++; };
      }
    }
  }, [getFramePath, showClouds, showRadar]);

  if (!showClouds && !showRadar) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[5]"
      style={{ opacity, mixBlendMode: showClouds ? 'screen' : 'normal' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          objectFit: 'cover',
          imageRendering: 'auto',
          filter: showClouds ? 'brightness(1.3) contrast(1.1)' : 'saturate(1.5)',
        }}
      />
      {/* Info badge */}
      <div className="absolute bottom-12 right-2 bg-background/60 backdrop-blur-sm rounded px-2 py-0.5 border border-border/50">
        <div className="flex items-center gap-1.5">
          <span className="text-[7px] font-data text-primary/70">
            {showClouds ? '☁️ SATELLITE IR' : '🌧️ PRECIPITATION RADAR'}
          </span>
          <span className="text-[7px] font-data text-muted-foreground/50">RAINVIEWER</span>
        </div>
      </div>
    </div>
  );
});

WeatherRadarOverlay.displayName = 'WeatherRadarOverlay';
export default WeatherRadarOverlay;
