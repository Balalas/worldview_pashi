import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useWorldViewStore, LayerType } from '@/store/worldview';
import { CONFLICT_ZONES } from '@/data/conflictZones';

// Map result types to the layer that must be enabled to see them
const TYPE_TO_LAYER: Record<string, LayerType | null> = {
  aircraft: 'aircraft',
  satellite: 'satellites',
  vessel: 'vessels',
  earthquake: 'earthquakes',
  volcano: 'volcanoes',
  fire: 'fires',
  protest: 'protests',
  outage: 'outages',
  conflict: 'conflicts',
  weather: 'weather',
  news: null,
  location: null,
};

const SearchBar = memo(() => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [geoResults, setGeoResults] = useState<SearchResult[]>([]);
  const geoTimer = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const { aircraft, satellites, vessels, earthquakes, volcanoes, fires, protests, outages, weatherAlerts, news, layers, toggleLayer, setMapCenter, setDetailPanel } = useWorldViewStore();

  // Debounced geocoding
  const geocode = useCallback((q: string) => {
    if (geoTimer.current) clearTimeout(geoTimer.current);
    if (q.length < 2) { setGeoResults([]); return; }
    geoTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`, {
          headers: { 'User-Agent': 'WorldView/1.0' },
        });
        const data = await res.json();
        const geo: SearchResult[] = data.map((d: any) => ({
          type: 'location',
          label: `📍 ${d.display_name.split(',').slice(0, 2).join(',')}`,
          sub: d.type?.replace(/_/g, ' ') || 'location',
          lat: parseFloat(d.lat),
          lon: parseFloat(d.lon),
          zoom: d.type === 'country' ? 4 : d.type === 'state' ? 6 : d.type === 'city' ? 10 : 12,
          data: null,
        }));
        setGeoResults(geo);
      } catch {
        setGeoResults([]);
      }
    }, 300);
  }, []);

  const search = useCallback((q: string) => {
    if (q.length < 2) { setResults([]); setGeoResults([]); return; }
    const term = q.toLowerCase();
    const found: SearchResult[] = [];

    // Aircraft — always search, regardless of layer
    aircraft.filter(a => a.callsign.toLowerCase().includes(term) || a.country.toLowerCase().includes(term))
      .slice(0, 5).forEach(a => found.push({ type: 'aircraft', label: `✈ ${a.callsign}`, sub: `${a.country} | FL${Math.round(a.altitudeFt / 100)}`, lat: a.lat, lon: a.lon, zoom: 8, data: a }));

    // Satellites
    satellites.filter(s => s.name.toLowerCase().includes(term))
      .slice(0, 5).forEach(s => found.push({ type: 'satellite', label: `🛰 ${s.name}`, sub: `${Math.round(s.alt)}km alt`, lat: s.lat, lon: s.lon, zoom: 6, data: s }));

    // Vessels
    vessels.filter(v => v.name.toLowerCase().includes(term) || v.flag.toLowerCase().includes(term))
      .slice(0, 5).forEach(v => found.push({ type: 'vessel', label: `${v.type === 'yacht' ? '🛥' : '🚢'} ${v.name}`, sub: `${v.flag} | ${v.speedKnots}kts`, lat: v.lat, lon: v.lon, zoom: 8, data: v }));

    // Earthquakes
    earthquakes.filter(e => e.place.toLowerCase().includes(term))
      .slice(0, 3).forEach(e => found.push({ type: 'earthquake', label: `🌍 M${e.magnitude}`, sub: e.place, lat: e.lat, lon: e.lon, zoom: 8, data: e }));

    // Volcanoes
    volcanoes.filter(v => v.name.toLowerCase().includes(term) || v.country.toLowerCase().includes(term))
      .slice(0, 3).forEach(v => found.push({ type: 'volcano', label: `🌋 ${v.name}`, sub: `${v.country} | ${v.status}`, lat: v.lat, lon: v.lon, zoom: 8, data: v }));

    // Fires
    fires.filter(f => f.title.toLowerCase().includes(term))
      .slice(0, 3).forEach(f => found.push({ type: 'fire', label: `🔥 ${f.title}`, sub: `${f.source} | ${f.category}`, lat: f.lat, lon: f.lon, zoom: 8, data: f }));

    // Protests
    protests.filter(p => p.title.toLowerCase().includes(term) || p.country.toLowerCase().includes(term))
      .slice(0, 3).forEach(p => found.push({ type: 'protest', label: `✊ ${p.title}`, sub: `${p.country} | ${p.intensity}`, lat: p.lat, lon: p.lon, zoom: 8, data: p }));

    // Outages
    outages.filter(o => o.title.toLowerCase().includes(term) || o.type.toLowerCase().includes(term))
      .slice(0, 3).forEach(o => found.push({ type: 'outage', label: `⚡ ${o.title}`, sub: `${o.type} | ${o.severity}`, lat: o.lat, lon: o.lon, zoom: 8, data: o }));

    // Conflict zones (static data)
    CONFLICT_ZONES.filter(c => c.name.toLowerCase().includes(term))
      .slice(0, 3).forEach(c => found.push({ type: 'conflict', label: `⚔ ${c.name}`, sub: `${c.type} | intensity ${c.intensity}/10`, lat: c.lat, lon: c.lon, zoom: 7, data: c }));

    // Weather alerts
    weatherAlerts.filter(w => w.city.toLowerCase().includes(term) || w.description.toLowerCase().includes(term))
      .slice(0, 3).forEach(w => found.push({ type: 'weather', label: `🌪 ${w.description}`, sub: w.city, lat: w.lat, lon: w.lon, zoom: 7, data: w }));

    // News (no coordinates — show if title matches, no fly-to)
    news.filter(n => n.title.toLowerCase().includes(term))
      .slice(0, 3).forEach(n => found.push({ type: 'news', label: `📰 ${n.title.slice(0, 60)}`, sub: `${n.source} | ${n.severity}`, lat: 0, lon: 0, zoom: 3, data: n }));

    setResults(found);
    geocode(q);
  }, [aircraft, satellites, vessels, earthquakes, volcanoes, fires, protests, outages, weatherAlerts, news, geocode]);

  const handleSelect = useCallback((result: SearchResult) => {
    // Auto-enable the layer if it's turned off
    const neededLayer = TYPE_TO_LAYER[result.type];
    if (neededLayer && !layers[neededLayer]) {
      toggleLayer(neededLayer);
    }

    // Fly to location (skip for news without coords)
    if (result.type !== 'news') {
      setMapCenter({ lat: result.lat, lon: result.lon, zoom: result.zoom });
    }

    if (result.data && result.type !== 'search' && result.type !== 'location' && result.type !== 'news') {
      setDetailPanel({ type: result.type as any, data: result.data });
    }
    setQuery('');
    setResults([]);
    setGeoResults([]);
    setIsOpen(false);
  }, [setMapCenter, setDetailPanel, layers, toggleLayer]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') { setIsOpen(false); setQuery(''); setResults([]); setGeoResults([]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const allResults = [...results, ...geoResults];

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[320px]">
      <div className="relative">
        <div className="flex items-center bg-background/80 backdrop-blur-sm border border-border rounded overflow-hidden">
          <span className="text-muted-foreground text-xs pl-2">🔍</span>
          <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); search(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search everything... (/)"
            className="flex-1 bg-transparent px-2 py-1.5 text-[11px] font-data text-foreground placeholder:text-muted-foreground outline-none" />
          {query && <button onClick={() => { setQuery(''); setResults([]); setGeoResults([]); }} className="text-muted-foreground hover:text-foreground px-2 text-xs">✕</button>}
        </div>

        {isOpen && allResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-sm border border-border rounded overflow-hidden shadow-lg max-h-[300px] overflow-y-auto">
            {results.length > 0 && (
              <div className="px-2 py-1 text-[8px] font-data text-primary/60 tracking-widest border-b border-border/30">INTEL MATCHES — {results.length}</div>
            )}
            {results.map((r, i) => {
              const neededLayer = TYPE_TO_LAYER[r.type];
              const layerOff = neededLayer ? !layers[neededLayer] : false;
              return (
                <button key={`r-${i}`} onClick={() => handleSelect(r)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-data text-foreground truncate">{r.label}</div>
                    <div className="text-[8px] font-data text-muted-foreground">{r.sub}</div>
                  </div>
                  {layerOff && (
                    <span className="text-[7px] font-data text-destructive/80 bg-destructive/10 px-1 rounded shrink-0">OFF</span>
                  )}
                </button>
              );
            })}
            {geoResults.length > 0 && (
              <div className="px-2 py-1 text-[8px] font-data text-primary/60 tracking-widest border-b border-border/30">LOCATIONS</div>
            )}
            {geoResults.map((r, i) => (
              <button key={`g-${i}`} onClick={() => handleSelect(r)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0">
                <div>
                  <div className="text-[10px] font-data text-foreground">{r.label}</div>
                  <div className="text-[8px] font-data text-muted-foreground">{r.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

interface SearchResult {
  type: string;
  label: string;
  sub: string;
  lat: number;
  lon: number;
  zoom: number;
  data: any;
}

SearchBar.displayName = 'SearchBar';
export default SearchBar;
