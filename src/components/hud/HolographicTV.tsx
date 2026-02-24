import { memo, useState, useEffect, useRef } from 'react';
import { useWorldViewStore } from '@/store/worldview';
import { LIVESTREAM_FEEDS, LivestreamFeed } from '@/services/dataServices';

// Country-based live TV channels for the hologram viewer
const COUNTRY_TV: { country: string; flag: string; lat: number; lon: number; feed: LivestreamFeed }[] = [
  { country: 'Qatar', flag: '🇶🇦', lat: 25.29, lon: 51.53, feed: LIVESTREAM_FEEDS.find(f => f.id === 'aje')! },
  { country: 'UK', flag: '🇬🇧', lat: 51.51, lon: -0.13, feed: LIVESTREAM_FEEDS.find(f => f.id === 'sky')! },
  { country: 'France', flag: '🇫🇷', lat: 48.86, lon: 2.35, feed: LIVESTREAM_FEEDS.find(f => f.id === 'france24')! },
  { country: 'Germany', flag: '🇩🇪', lat: 52.52, lon: 13.40, feed: LIVESTREAM_FEEDS.find(f => f.id === 'dw')! },
  { country: 'USA', flag: '🇺🇸', lat: 38.90, lon: -77.04, feed: LIVESTREAM_FEEDS.find(f => f.id === 'abc')! },
  { country: 'India', flag: '🇮🇳', lat: 28.61, lon: 77.21, feed: LIVESTREAM_FEEDS.find(f => f.id === 'ndtv')! },
  { country: 'Japan', flag: '🇯🇵', lat: 35.68, lon: 139.77, feed: LIVESTREAM_FEEDS.find(f => f.id === 'nhk')! },
  { country: 'Singapore', flag: '🇸🇬', lat: 1.35, lon: 103.82, feed: LIVESTREAM_FEEDS.find(f => f.id === 'cna')! },
  { country: 'Russia', flag: '🇷🇺', lat: 55.75, lon: 37.62, feed: LIVESTREAM_FEEDS.find(f => f.id === 'rt')! },
].filter(c => c.feed);

interface HolographicTVProps {
  onFlyTo?: (lat: number, lon: number) => void;
}

const HolographicTV = memo(({ onFlyTo }: HolographicTVProps) => {
  const { setMapCenter } = useWorldViewStore();
  const [activeChannel, setActiveChannel] = useState<typeof COUNTRY_TV[0] | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHologram, setShowHologram] = useState(false);
  const flickerRef = useRef<HTMLDivElement>(null);

  // Flicker effect
  useEffect(() => {
    if (!showHologram) return;
    const el = flickerRef.current;
    if (!el) return;
    const flicker = () => {
      const opacity = 0.85 + Math.random() * 0.15;
      const hueShift = Math.random() * 6 - 3;
      el.style.opacity = String(opacity);
      el.style.filter = `hue-rotate(${hueShift}deg)`;
      // Random glitch
      if (Math.random() < 0.05) {
        el.style.transform = `translate(${Math.random() * 3 - 1.5}px, ${Math.random() * 2 - 1}px) skewX(${Math.random() * 1.5 - 0.75}deg)`;
        setTimeout(() => { if (el) el.style.transform = 'none'; }, 80);
      }
    };
    const interval = setInterval(flicker, 120);
    return () => clearInterval(interval);
  }, [showHologram]);

  const handleSelectChannel = (channel: typeof COUNTRY_TV[0]) => {
    setIsAnimating(true);
    setShowHologram(false);
    setActiveChannel(channel);

    // Fly to country position — zoom out first, then zoom in
    setMapCenter({ lat: channel.lat, lon: channel.lon, zoom: 6 });

    // After fly-to animation, show hologram
    setTimeout(() => {
      setShowHologram(true);
      setIsAnimating(false);
    }, 2800);
  };

  const handleClose = () => {
    setShowHologram(false);
    setActiveChannel(null);
    setIsAnimating(false);
  };

  return (
    <>
      {/* Channel Selector */}
      <div className="absolute top-14 right-14 z-50 pointer-events-auto">
        <div className="bg-background/70 backdrop-blur-md border border-primary/20 rounded-lg p-2 max-w-[200px]">
          <div className="text-[8px] font-display tracking-[0.3em] text-primary/70 mb-1.5 px-1">HOLO-TV // LIVE BROADCAST</div>
          <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
            {COUNTRY_TV.map((ch) => (
              <button
                key={ch.country}
                onClick={() => handleSelectChannel(ch)}
                disabled={isAnimating}
                className={`w-full flex items-center gap-2 px-2 py-1 rounded text-[10px] transition-all ${
                  activeChannel?.country === ch.country 
                    ? 'bg-primary/15 border border-primary/30 text-primary' 
                    : 'hover:bg-card-hover text-muted-foreground hover:text-foreground border border-transparent'
                } ${isAnimating ? 'opacity-50 cursor-wait' : ''}`}
              >
                <span className="text-sm">{ch.flag}</span>
                <div className="flex-1 text-left">
                  <span className="font-display tracking-wider">{ch.country}</span>
                  <span className="text-[8px] font-data text-muted-foreground/60 ml-1">{ch.feed.source}</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Holographic Overlay */}
      {showHologram && activeChannel && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
          {/* Beam from ground */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] opacity-40"
            style={{
              height: '40%',
              background: 'linear-gradient(to top, transparent, hsl(var(--primary) / 0.6), transparent)',
              animation: 'hologram-beam 2s ease-out forwards',
            }}
          />

          {/* Hologram container */}
          <div 
            ref={flickerRef}
            className="relative pointer-events-auto"
            style={{
              animation: 'hologram-appear 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
            }}
          >
            {/* Outer glow */}
            <div className="absolute -inset-4 rounded-xl opacity-30"
              style={{
                background: 'radial-gradient(ellipse, hsl(var(--primary) / 0.3), transparent)',
                filter: 'blur(20px)',
              }}
            />
            
            {/* Main hologram frame */}
            <div className="relative w-[480px] h-[290px] rounded-lg overflow-hidden"
              style={{
                border: '1px solid hsl(var(--primary) / 0.4)',
                boxShadow: '0 0 30px hsl(var(--primary) / 0.15), inset 0 0 20px hsl(var(--primary) / 0.05)',
                background: 'linear-gradient(135deg, hsl(var(--background) / 0.15), hsl(var(--background) / 0.05))',
                backdropFilter: 'blur(4px)',
              }}
            >
              {/* Video */}
              <iframe
                src={activeChannel.feed.url}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={activeChannel.feed.title}
                style={{ opacity: 0.9 }}
              />

              {/* Holographic scanlines */}
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.03) 2px, hsl(var(--primary) / 0.03) 4px)',
                  animation: 'scanline-scroll 8s linear infinite',
                }}
              />

              {/* RGB split flicker line */}
              <div className="absolute left-0 right-0 h-[2px] pointer-events-none"
                style={{
                  top: `${30 + Math.random() * 40}%`,
                  background: 'linear-gradient(90deg, rgba(255,0,0,0.15), rgba(0,255,0,0.15), rgba(0,0,255,0.15))',
                  animation: 'glitch-line 3s linear infinite',
                }}
              />

              {/* Top info bar */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-background/60 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{activeChannel.flag}</span>
                  <div>
                    <div className="text-[10px] font-display tracking-[0.2em] text-primary">{activeChannel.country} // LIVE</div>
                    <div className="text-[8px] font-data text-muted-foreground">{activeChannel.feed.source} — {activeChannel.feed.title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                    <span className="text-[8px] font-data text-destructive tracking-wider">● LIVE</span>
                  </div>
                  <button onClick={handleClose} className="text-muted-foreground hover:text-foreground text-xs px-1">✕</button>
                </div>
              </div>

              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary/50 pointer-events-none" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-primary/50 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-primary/50 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary/50 pointer-events-none" />

              {/* Bottom metadata */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1 bg-background/50">
                <span className="text-[7px] font-data text-muted-foreground/70">HOLOGRAPHIC PROJECTION // {activeChannel.lat.toFixed(2)}°N {activeChannel.lon.toFixed(2)}°E</span>
                <span className="text-[7px] font-data text-primary/50">SIGNAL STRENGTH: ████████░░</span>
              </div>
            </div>

            {/* Reflection / ground glow */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[60%] h-6 rounded-full opacity-20"
              style={{
                background: 'radial-gradient(ellipse, hsl(var(--primary) / 0.5), transparent)',
                filter: 'blur(12px)',
              }}
            />
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes hologram-appear {
          0% { opacity: 0; transform: scaleY(0.02) scaleX(0.5); }
          30% { opacity: 0.5; transform: scaleY(0.1) scaleX(0.8); }
          60% { opacity: 0.8; transform: scaleY(0.6) scaleX(0.95); }
          100% { opacity: 1; transform: scaleY(1) scaleX(1); }
        }
        @keyframes hologram-beam {
          0% { opacity: 0; height: 0; }
          50% { opacity: 0.6; height: 30%; }
          100% { opacity: 0.2; height: 40%; }
        }
        @keyframes scanline-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }
        @keyframes glitch-line {
          0%, 100% { opacity: 0; top: 30%; }
          10% { opacity: 1; top: 25%; }
          20% { opacity: 0; top: 60%; }
          30% { opacity: 0.5; top: 45%; }
          50% { opacity: 0; top: 70%; }
          70% { opacity: 0.8; top: 35%; }
          80% { opacity: 0; top: 55%; }
        }
      `}</style>
    </>
  );
});

HolographicTV.displayName = 'HolographicTV';
export default HolographicTV;
