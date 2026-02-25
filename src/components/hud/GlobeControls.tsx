import { memo, useCallback, useState } from 'react';
import { useWorldViewStore, REGION_PRESETS, LANDMARK_PRESETS } from '@/store/worldview';

const CATEGORIES = [
  { key: 'regions', label: 'REGIONS' },
  { key: 'wonders', label: 'WONDERS' },
  { key: 'cities', label: 'CITIES' },
  { key: 'nature', label: 'NATURE' },
  { key: 'military', label: 'MILITARY' },
  { key: 'space', label: 'SPACE' },
  { key: 'history', label: 'HISTORY' },
] as const;

type CategoryKey = typeof CATEGORIES[number]['key'];

const LANDMARK_CATEGORIES: Record<Exclude<CategoryKey, 'regions'>, string[]> = {
  wonders: ['GREAT WALL', 'PYRAMIDS', 'MACHU PICCHU', 'TAJ MAHAL', 'COLOSSEUM', 'PETRA', 'CHRIST REDEEMER', 'CHICHEN ITZA'],
  cities: ['NEW YORK', 'LONDON', 'PARIS', 'TOKYO', 'DUBAI', 'SYDNEY', 'MOSCOW', 'HONG KONG', 'SINGAPORE', 'SAN FRANCISCO', 'ISTANBUL', 'ROME', 'BEIJING', 'CAIRO'],
  nature: ['GRAND CANYON', 'NIAGARA FALLS', 'MT EVEREST', 'MT FUJI', 'VICTORIA FALLS', 'ULURU', 'AURORA / TROMSØ', 'AMAZON RIVER', 'SAHARA DESERT', 'GREAT BARRIER REEF', 'YELLOWSTONE', 'DEAD SEA'],
  military: ['PENTAGON', 'AREA 51', 'KREMLIN', 'DMZ KOREA', 'DIEGO GARCIA', 'RAMSTEIN AFB', 'GUANTÁNAMO'],
  space: ['CAPE CANAVERAL', 'BAIKONUR', 'CERN', 'SILICON VALLEY'],
  history: ['ACROPOLIS', 'ANGKOR WAT', 'STONEHENGE', 'POMPEII', 'EASTER ISLAND', 'FORBIDDEN CITY', 'VERSAILLES', 'AUSCHWITZ', 'HIROSHIMA'],
};

const GlobeControls = memo(() => {
  const { setMapCenter, bottomPanelCollapsed } = useWorldViewStore();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('regions');
  const [expanded, setExpanded] = useState(false);

  const flyTo = useCallback((lat: number, lon: number, zoom: number) => {
    setMapCenter({ lat, lon, zoom });
  }, [setMapCenter]);

  const getItems = () => {
    if (activeCategory === 'regions') return REGION_PRESETS;
    const labels = LANDMARK_CATEGORIES[activeCategory];
    return LANDMARK_PRESETS.filter(l => labels.includes(l.label));
  };

  const items = getItems();

  return (
    <div className={`absolute left-1/2 -translate-x-1/2 z-30 pointer-events-auto transition-all duration-300 ${bottomPanelCollapsed ? 'bottom-[62px]' : 'bottom-[238px]'}`}>
      {/* Expanded landmark list */}
      {expanded && (
        <div className="mb-1 flex flex-wrap items-center justify-center gap-0.5 max-w-[420px] mx-auto animate-fade-in">
          {items.map((r) => (
            <button
              key={r.label}
              onClick={() => flyTo(r.lat, r.lon, r.zoom)}
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-[7px] font-data tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors whitespace-nowrap bg-background/20 backdrop-blur-sm border border-border/20"
            >
              <span>{r.emoji}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Category bar */}
      <div className="flex items-center justify-center gap-0.5 bg-background/20 backdrop-blur-sm border border-border/20 rounded-lg p-0.5 px-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[7px] font-data text-muted-foreground/60 hover:text-primary px-1 transition-colors"
          title="Toggle landmarks"
        >
          {expanded ? '▾' : '▸'}
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => { setActiveCategory(c.key); if (!expanded) setExpanded(true); }}
            className={`px-1.5 py-0.5 text-[7px] font-data tracking-wider rounded transition-colors whitespace-nowrap ${
              activeCategory === c.key && expanded
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground/60 hover:text-primary hover:bg-primary/10'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
});

GlobeControls.displayName = 'GlobeControls';
export default GlobeControls;
