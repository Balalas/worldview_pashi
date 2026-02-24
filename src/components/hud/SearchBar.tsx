import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useWorldViewStore } from '@/store/worldview';

const SearchBar = memo(() => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { aircraft, satellites, vessels, earthquakes, volcanoes, setMapCenter, setDetailPanel } = useWorldViewStore();

  const search = useCallback((q: string) => {
    if (q.length < 2) { setResults([]); return; }
    const term = q.toLowerCase();
    const found: SearchResult[] = [];

    // Search aircraft
    aircraft.filter(a => a.callsign.toLowerCase().includes(term) || a.country.toLowerCase().includes(term))
      .slice(0, 5).forEach(a => found.push({ type: 'aircraft', label: `✈ ${a.callsign}`, sub: `${a.country} | FL${Math.round(a.altitudeFt / 100)}`, lat: a.lat, lon: a.lon, zoom: 8, data: a }));

    // Search satellites
    satellites.filter(s => s.name.toLowerCase().includes(term))
      .slice(0, 5).forEach(s => found.push({ type: 'satellite', label: `🛰 ${s.name}`, sub: `${Math.round(s.alt)}km alt`, lat: s.lat, lon: s.lon, zoom: 6, data: s }));

    // Search vessels
    vessels.filter(v => v.name.toLowerCase().includes(term) || v.flag.toLowerCase().includes(term))
      .slice(0, 5).forEach(v => found.push({ type: 'vessel', label: `${v.type === 'yacht' ? '🛥' : '🚢'} ${v.name}`, sub: `${v.flag} | ${v.speedKnots}kts`, lat: v.lat, lon: v.lon, zoom: 8, data: v }));

    // Search earthquakes
    earthquakes.filter(e => e.place.toLowerCase().includes(term))
      .slice(0, 3).forEach(e => found.push({ type: 'earthquake', label: `🌍 M${e.magnitude}`, sub: e.place, lat: e.lat, lon: e.lon, zoom: 8, data: e }));

    // Search volcanoes
    volcanoes.filter(v => v.name.toLowerCase().includes(term) || v.country.toLowerCase().includes(term))
      .slice(0, 3).forEach(v => found.push({ type: 'volcano', label: `🌋 ${v.name}`, sub: `${v.country} | ${v.status}`, lat: v.lat, lon: v.lon, zoom: 8, data: v }));

    // Location geocoding fallback
    if (found.length === 0) {
      found.push({ type: 'search', label: `🔍 Search "${q}" on map`, sub: 'Geocode location', lat: 0, lon: 0, zoom: 5, data: null, geocode: q });
    }

    setResults(found);
  }, [aircraft, satellites, vessels, earthquakes, volcanoes]);

  const handleSelect = useCallback(async (result: SearchResult) => {
    if (result.geocode) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(result.geocode)}&format=json&limit=1`);
        const data = await res.json();
        if (data.length > 0) {
          setMapCenter({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), zoom: 10 });
        }
      } catch {}
    } else {
      setMapCenter({ lat: result.lat, lon: result.lon, zoom: result.zoom });
      if (result.data && result.type !== 'search') {
        setDetailPanel({ type: result.type as any, data: result.data });
      }
    }
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }, [setMapCenter, setDetailPanel]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') { setIsOpen(false); setQuery(''); setResults([]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[320px]">
      <div className="relative">
        <div className="flex items-center bg-background/80 backdrop-blur-sm border border-border rounded overflow-hidden">
          <span className="text-muted-foreground text-xs pl-2">🔍</span>
          <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); search(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search aircraft, satellites, locations... (/)"
            className="flex-1 bg-transparent px-2 py-1.5 text-[11px] font-data text-foreground placeholder:text-muted-foreground outline-none" />
          {query && <button onClick={() => { setQuery(''); setResults([]); }} className="text-muted-foreground hover:text-foreground px-2 text-xs">✕</button>}
        </div>

        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-sm border border-border rounded overflow-hidden shadow-lg max-h-[200px] overflow-y-auto">
            {results.map((r, i) => (
              <button key={i} onClick={() => handleSelect(r)}
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
  geocode?: string;
}

SearchBar.displayName = 'SearchBar';
export default SearchBar;
