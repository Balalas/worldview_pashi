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
  const { setMapCenter } = useWorldViewStore();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('regions');

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
    <div className="absolute bottom-16 right-3 flex flex-col gap-1 pointer-events-auto z-30" style={{ maxHeight: 'calc(100vh - 200px)' }}>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-0.5 bg-background/80 backdrop-blur-sm border border-border rounded p-1 max-w-[140px]">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            className={`px-1 py-0.5 text-[7px] font-data tracking-wider rounded transition-colors whitespace-nowrap ${
              activeCategory === c.key
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Landmark List */}
      <div className="flex flex-col gap-0.5 bg-background/80 backdrop-blur-sm border border-border rounded p-1 mt-0.5 overflow-y-auto scrollbar-thin max-h-[280px]">
        {items.map((r) => (
          <button
            key={r.label}
            onClick={() => flyTo(r.lat, r.lon, r.zoom)}
            className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-data tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors whitespace-nowrap"
          >
            <span>{r.emoji}</span>
            <span>{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

const ControlBtn = ({ icon, title, onClick }: { icon: string; title: string; onClick: () => void }) => (
  <button onClick={onClick} title={title}
    className="w-7 h-7 flex items-center justify-center text-sm font-data text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors">
    {icon}
  </button>
);

GlobeControls.displayName = 'GlobeControls';
export default GlobeControls;
