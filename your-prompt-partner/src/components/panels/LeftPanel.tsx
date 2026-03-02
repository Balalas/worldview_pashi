import { memo, useState, useRef } from 'react';
import { useWorldViewStore, LayerType, INSTABILITY_DATA, REGION_PRESETS, LANDMARK_PRESETS, LayerSubFilters, TwitterOsintPost } from '@/store/worldview';
import { SUBMARINE_CABLES } from '@/data/submarineCables';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';

const LAYER_CONFIG: { key: LayerType; label: string; shortcut: string; colorClass: string }[] = [
  { key: 'aircraft', label: 'AIRCRAFT', shortcut: 'A', colorClass: 'bg-signal-aircraft' },
  { key: 'satellites', label: 'SATELLITES', shortcut: 'S', colorClass: 'bg-signal-satellite' },
  { key: 'vessels', label: 'VESSELS', shortcut: 'V', colorClass: 'bg-signal-vessel' },
  { key: 'militaryFlights', label: 'MILITARY', shortcut: 'M', colorClass: 'bg-signal-military' },
  { key: 'underseaCables', label: 'CABLES', shortcut: 'U', colorClass: 'bg-signal-cable' },
  { key: 'conflicts', label: 'CONFLICTS', shortcut: 'X', colorClass: 'bg-alert-critical' },
  { key: 'protests', label: 'PROTESTS', shortcut: 'P', colorClass: 'bg-signal-protest' },
  { key: 'outages', label: 'OUTAGES/CYBER', shortcut: 'O', colorClass: 'bg-signal-outage' },
  { key: 'volcanoes', label: 'VOLCANOES', shortcut: '', colorClass: 'bg-alert-high' },
  { key: 'weather', label: 'WEATHER', shortcut: 'W', colorClass: 'bg-signal-camera' },
  { key: 'earthquakes', label: 'QUAKES', shortcut: 'E', colorClass: 'bg-signal-earthquake' },
  { key: 'nuclearSites', label: 'NUCLEAR', shortcut: 'N', colorClass: 'bg-signal-nuclear' },
  { key: 'fires', label: 'FIRES', shortcut: 'F', colorClass: 'bg-signal-fire' },
  { key: 'cameras', label: 'CAMERAS', shortcut: 'C', colorClass: 'bg-signal-camera' },
  { key: 'militaryBases', label: 'BASES', shortcut: 'B', colorClass: 'bg-signal-military' },
  { key: 'spaceports', label: 'SPACEPORTS', shortcut: '', colorClass: 'bg-signal-satellite' },
  { key: 'chokepoints', label: 'CHOKEPOINTS', shortcut: '', colorClass: 'bg-alert-high' },
];

type SubToggle = { key: keyof LayerSubFilters; label: string };
type SubSlider = { key: keyof LayerSubFilters; label: string; min: number; max: number; step: number; suffix?: string };
type SubOption = SubToggle | SubSlider;
function isSlider(o: SubOption): o is SubSlider { return 'min' in o; }

const LAYER_SUB_OPTIONS: Partial<Record<LayerType, SubOption[]>> = {
  satellites: [
    { key: 'showStarlink', label: 'STARLINK' },
    { key: 'showMilitarySats', label: 'MILITARY' },
    { key: 'showDebris', label: 'DEBRIS' },
    { key: 'showCommSats', label: 'COMMS/SCI' },
  ],
  aircraft: [
    { key: 'showCivilian', label: 'CIVILIAN' },
    { key: 'showMilitaryAC', label: 'MILITARY' },
    { key: 'showHelicopters', label: 'HELICOPTERS' },
    { key: 'maxAircraft', label: 'DENSITY', min: 0, max: 100, step: 5, suffix: '%' },
  ],
  vessels: [
    { key: 'showYachts', label: 'YACHTS' },
    { key: 'showCargo', label: 'CARGO' },
    { key: 'showTankers', label: 'TANKERS' },
    { key: 'showMilVessels', label: 'MILITARY' },
    { key: 'showFishing', label: 'FISHING' },
    { key: 'showPassenger', label: 'PASSENGER' },
  ],
  underseaCables: [
    { key: 'showLandCables', label: 'LAND SEGMENTS' },
  ],
  earthquakes: [
    { key: 'minMagnitude', label: 'MIN MAG', min: 1, max: 8, step: 0.5, suffix: '' },
  ],
  weather: [
    { key: 'showExtremeOnly', label: 'EXTREME ONLY' },
    { key: 'showClouds', label: 'LIVE CLOUDS' },
    { key: 'showRadar', label: 'PRECIPITATION' },
    { key: 'cloudOpacity', label: 'CLOUD OPACITY', min: 0, max: 100, step: 5, suffix: '%' },
  ],
  fires: [
    { key: 'showWildfires', label: 'WILDFIRES' },
    { key: 'showStorms', label: 'STORMS/FLOODS' },
  ],
  nuclearSites: [
    { key: 'showWeapons', label: 'WEAPONS' },
    { key: 'showPower', label: 'POWER/ENRICH' },
  ],
};

const LandmarksDropdown = memo(() => {
  const [open, setOpen] = useState(false);
  const { setMapCenter } = useWorldViewStore();
  const categories = [
    { label: 'CITIES', items: LANDMARK_PRESETS.filter(l => ['NEW YORK','LONDON','PARIS','TOKYO','DUBAI','SYDNEY','MOSCOW','HONG KONG','SINGAPORE','SAN FRANCISCO','ISTANBUL','ROME','BEIJING','CAIRO'].includes(l.label)) },
    { label: 'WONDERS', items: LANDMARK_PRESETS.filter(l => ['GREAT WALL','PYRAMIDS','MACHU PICCHU','TAJ MAHAL','COLOSSEUM','PETRA','CHRIST REDEEMER','CHICHEN ITZA'].includes(l.label)) },
    { label: 'NATURE', items: LANDMARK_PRESETS.filter(l => ['GRAND CANYON','NIAGARA FALLS','MT EVEREST','MT FUJI','VICTORIA FALLS','ULURU','AMAZON RIVER','SAHARA DESERT','GREAT BARRIER REEF','YELLOWSTONE'].includes(l.label)) },
    { label: 'MILITARY', items: LANDMARK_PRESETS.filter(l => ['PENTAGON','AREA 51','KREMLIN','DMZ KOREA','DIEGO GARCIA','RAMSTEIN AFB','GUANTÁNAMO'].includes(l.label)) },
    { label: 'SPACE', items: LANDMARK_PRESETS.filter(l => ['CAPE CANAVERAL','BAIKONUR','CERN','SILICON VALLEY'].includes(l.label)) },
  ];

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-[8px] font-display tracking-[0.2em] text-muted-foreground/60 hover:text-foreground transition-colors">
        <span>✈ FLY TO</span>
        <span className="text-[7px]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="mt-1.5 max-h-[200px] overflow-y-auto space-y-1.5 animate-fade-in">
          {categories.map(cat => (
            <div key={cat.label}>
              <div className="text-[9px] font-data text-muted-foreground/40 tracking-wider mb-0.5">{cat.label}</div>
              <div className="flex flex-wrap gap-0.5">
                {cat.items.map(lm => (
                  <button key={lm.label} onClick={() => { setMapCenter({ lat: lm.lat, lon: lm.lon, zoom: lm.zoom }); }}
                    className="px-1.5 py-0.5 text-[9px] font-data text-muted-foreground/60 hover:text-primary hover:bg-primary/5 rounded transition-colors truncate">
                    {lm.emoji} {lm.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
LandmarksDropdown.displayName = 'LandmarksDropdown';

// ── OSINT AI Chat Box ──
const OsintChatBox = memo(({ twitterPosts }: { twitterPosts: TwitterOsintPost[] }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const askPerplexity = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setAnswer('');
    setCitations([]);
    setShowAnswer(true);

    try {
      // Build context from recent OSINT posts
      const context = twitterPosts.slice(0, 15).map(p =>
        `@${p.account} (${new Date(p.createdAt).toLocaleTimeString()}): ${p.text.substring(0, 200)}`
      ).join('\n');

      const { data, error } = await supabase.functions.invoke('osint-chat', {
        body: { question: query, context },
      });

      if (error) throw error;
      setAnswer(data.answer || 'No response.');
      setCitations(data.citations || []);
    } catch (e: any) {
      setAnswer(`⚠ Error: ${e.message || 'Failed to reach AI'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-2">
      <div className="flex gap-1 mb-1">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && askPerplexity()}
          placeholder="Ask AI about live intel..."
          className="flex-1 text-[10px] font-data rounded px-2 py-1 outline-none transition-colors"
          style={{
            background: 'hsla(210, 50%, 8%, 0.8)',
            border: '1px solid hsla(150, 100%, 50%, 0.15)',
            color: 'hsla(200, 50%, 88%, 0.9)',
          }}
        />
        <button
          onClick={askPerplexity}
          disabled={loading || !query.trim()}
          className="px-2 py-1 text-[9px] font-display tracking-wider rounded transition-all"
          style={{
            background: loading ? 'hsla(150, 100%, 50%, 0.1)' : 'hsla(150, 100%, 50%, 0.15)',
            border: '1px solid hsla(150, 100%, 50%, 0.25)',
            color: loading ? 'hsla(150, 100%, 50%, 0.4)' : 'hsla(150, 100%, 50%, 0.8)',
          }}
        >
          {loading ? '...' : 'ASK'}
        </button>
      </div>

      {showAnswer && (
        <div
          className="rounded p-2 mb-2 animate-fade-in"
          style={{
            background: 'hsla(210, 60%, 4%, 0.95)',
            border: '1px solid hsla(150, 100%, 50%, 0.12)',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-display tracking-[0.15em] text-primary/70">🤖 PERPLEXITY AI</span>
            <button onClick={() => setShowAnswer(false)} className="text-[8px] text-muted-foreground/40 hover:text-foreground">✕</button>
          </div>
          {loading ? (
            <div className="flex items-center gap-1.5 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-data text-muted-foreground/50">Analyzing OSINT data...</span>
            </div>
          ) : (
            <>
              <div className="text-[10px] font-data text-foreground/80 leading-relaxed whitespace-pre-wrap">{answer}</div>
              {citations.length > 0 && (
                <div className="mt-1.5 pt-1 border-t border-border/20">
                  <span className="text-[7px] font-display tracking-wider text-muted-foreground/40">SOURCES</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {citations.slice(0, 5).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="text-[8px] font-data text-primary/60 hover:text-primary underline truncate max-w-[120px]">
                        [{i + 1}] {new URL(url).hostname.replace('www.', '')}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});
OsintChatBox.displayName = 'OsintChatBox';

const LeftPanel = memo(() => {
  const { layers, toggleLayer, leftPanelOpen, activeRegion, setActiveRegion, setMapCenter, satellites, aircraft, earthquakes, vessels, protests, outages, layerSubFilters, setSubFilter, toggleSubFilter, twitterPosts, animationsEnabled, toggleAnimations } = useWorldViewStore();
  const [expandedLayer, setExpandedLayer] = useState<LayerType | null>(null);
  const [activeSection, setActiveSection] = useState<'layers' | 'xosint'>('layers');

  if (!leftPanelOpen) return null;

  const handleRegion = (preset: typeof REGION_PRESETS[0]) => {
    setActiveRegion(preset.label);
    setMapCenter({ lat: preset.lat, lon: preset.lon, zoom: preset.zoom });
  };

  const milSats = satellites.filter(s => s.name.includes('COSMOS') || s.name.includes('USA-') || s.name.includes('MUOS') || s.name.includes('NROL')).length;

  return (
    <aside
      className="absolute top-10 left-2 z-40 animate-fade-in pointer-events-auto"
      style={{ maxHeight: 'calc(100vh - 60px)' }}
    >
      <div
        className="w-[240px] rounded-lg overflow-hidden flex flex-col"
        style={{
          background: 'hsla(210, 60%, 4%, 0.92)',
          backdropFilter: 'blur(20px) saturate(1.3)',
          border: '1px solid hsla(150, 100%, 50%, 0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 1px hsla(150, 100%, 50%, 0.1)',
          maxHeight: 'calc(100vh - 60px)',
        }}
      >
        {/* Section Tabs */}
        <div className="flex border-b border-border/50">
          <button onClick={() => setActiveSection('layers')}
            className={`flex-1 py-1.5 text-[10px] font-display tracking-[0.2em] transition-colors ${activeSection === 'layers' ? 'text-primary bg-primary/5 border-b border-primary/40' : 'text-muted-foreground hover:text-foreground'}`}
          >DATA LAYERS</button>
          <button onClick={() => setActiveSection('xosint')}
            className={`flex-1 py-1.5 text-[10px] font-display tracking-[0.2em] transition-colors flex items-center justify-center gap-1.5 ${activeSection === 'xosint' ? 'text-primary bg-primary/5 border-b border-primary/40' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <span>𝕏 OSINT</span>
            {twitterPosts.length > 0 && <span className="w-1 h-1 rounded-full bg-alert-critical animate-pulse" />}
          </button>
        </div>

        <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 110px)' }}>
          {activeSection === 'layers' ? (
            <>
              {/* Layers */}
              <div className="p-2">
                <div className="space-y-0.5">
                  {LAYER_CONFIG.map(({ key, label, shortcut, colorClass }) => {
                    const hasSubs = !!LAYER_SUB_OPTIONS[key];
                    const isExpanded = expandedLayer === key;
                    return (
                      <div key={key}>
                        <div className="flex items-center">
                          <button onClick={() => toggleLayer(key)} className="flex-1 flex items-center justify-between px-2 py-0.5 rounded text-xs hover:bg-primary/5 transition-colors group">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${layers[key] ? colorClass : 'bg-muted/30'} transition-colors`} />
                              <span className={`font-display tracking-wider text-[12px] ${layers[key] ? 'text-foreground' : 'text-muted-foreground/60'}`}>{label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-data ${layers[key] ? 'text-primary' : 'text-muted/40'}`}>{layers[key] ? 'ON' : '—'}</span>
                              {shortcut && <span className="text-[9px] font-data text-muted/30 opacity-0 group-hover:opacity-100">[{shortcut}]</span>}
                            </div>
                          </button>
                          {hasSubs && layers[key] && (
                            <button onClick={() => setExpandedLayer(isExpanded ? null : key)} className="px-1 py-0.5 text-[8px] text-muted-foreground hover:text-primary transition-colors">
                              {isExpanded ? '▾' : '▸'}
                            </button>
                          )}
                        </div>
                        {hasSubs && isExpanded && layers[key] && (
                          <div className="ml-5 pl-2 border-l border-primary/10 py-1 space-y-0.5 mb-1">
                            {/* Earthquake time window selector */}
                            {key === 'earthquakes' && (
                              <div className="px-1 mb-1">
                                <span className="text-[8px] font-data text-muted-foreground/70 mb-0.5 block">TIME WINDOW</span>
                                <div className="flex gap-0.5">
                                  {(['1H', '6H', '24H', '48H', '7D'] as const).map(tw => (
                                    <button key={tw} onClick={() => setSubFilter('earthquakeTimeWindow', tw)}
                                      className={`flex-1 text-[7px] font-data py-0.5 rounded transition-colors ${
                                        layerSubFilters.earthquakeTimeWindow === tw
                                          ? 'bg-primary/20 text-primary border border-primary/30'
                                          : 'text-muted-foreground/50 hover:text-primary hover:bg-primary/10 border border-transparent'
                                      }`}
                                    >{tw}</button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {LAYER_SUB_OPTIONS[key]!.map((opt) => {
                              if (isSlider(opt)) {
                                const val = layerSubFilters[opt.key] as number;
                                return (
                                  <div key={opt.key} className="px-1">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="text-[8px] font-data text-muted-foreground/70">{opt.label}</span>
                                      <span className="text-[8px] font-data text-primary/80">{val}{opt.suffix}</span>
                                    </div>
                                    <Slider min={opt.min} max={opt.max} step={opt.step} value={[val]} onValueChange={([v]) => setSubFilter(opt.key, v)} className="h-3" />
                                  </div>
                                );
                              }
                              const checked = layerSubFilters[opt.key] as boolean;
                              return (
                                <button key={opt.key} onClick={() => toggleSubFilter(opt.key)}
                                  className="w-full flex items-center justify-between px-1 py-0.5 rounded text-[9px] hover:bg-primary/5 transition-colors">
                                  <span className={`font-data tracking-wider ${checked ? 'text-foreground/80' : 'text-muted-foreground/30'}`}>{opt.label}</span>
                                  <span className={`text-[7px] font-data ${checked ? 'text-primary' : 'text-muted/30'}`}>{checked ? '●' : '○'}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Traffic sub-option */}
                  <div>
                    <button onClick={() => toggleSubFilter('showTraffic')} className="w-full flex items-center justify-between px-2 py-0.5 rounded text-xs hover:bg-primary/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${layerSubFilters.showTraffic ? 'bg-primary' : 'bg-muted/30'} transition-colors`} />
                        <span className={`font-display tracking-wider text-[10px] ${layerSubFilters.showTraffic ? 'text-foreground' : 'text-muted-foreground/60'}`}>TRAFFIC</span>
                      </div>
                      <span className={`text-[8px] font-data ${layerSubFilters.showTraffic ? 'text-primary' : 'text-muted/40'}`}>{layerSubFilters.showTraffic ? 'ON' : '—'}</span>
                    </button>
                    {layerSubFilters.showTraffic && (
                      <div className="ml-5 pl-2 border-l border-primary/10 py-1 px-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[8px] font-data text-muted-foreground/70">DENSITY</span>
                          <span className="text-[8px] font-data text-primary/80">{layerSubFilters.trafficDensity}%</span>
                        </div>
                        <Slider min={0} max={100} step={5} value={[layerSubFilters.trafficDensity]} onValueChange={([v]) => setSubFilter('trafficDensity', v)} className="h-3" />
                      </div>
                    )}
                  </div>
                  {/* Animations toggle */}
                  <div className="mt-1 pt-1 border-t border-border/20">
                    <button onClick={toggleAnimations} className="w-full flex items-center justify-between px-2 py-0.5 rounded text-xs hover:bg-primary/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${animationsEnabled ? 'bg-primary' : 'bg-muted/30'} transition-colors`} />
                        <span className={`font-display tracking-wider text-[10px] ${animationsEnabled ? 'text-foreground' : 'text-muted-foreground/60'}`}>ANIMATIONS</span>
                      </div>
                      <span className={`text-[8px] font-data ${animationsEnabled ? 'text-primary' : 'text-muted/40'}`}>{animationsEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Region Presets */}
              <div className="px-2 pb-2 border-t border-border/30 pt-2">
                <div className="text-[10px] font-display tracking-[0.2em] text-muted-foreground/60 mb-1.5">REGION</div>
                <div className="flex flex-wrap gap-0.5">
                  {REGION_PRESETS.map((preset) => (
                    <button key={preset.label} onClick={() => handleRegion(preset)}
                      className={`px-1.5 py-0.5 text-[10px] font-display tracking-wider rounded transition-colors ${activeRegion === preset.label ? 'text-primary bg-primary/10 border border-primary/20' : 'text-muted-foreground/50 hover:text-foreground border border-transparent'}`}>
                      {preset.emoji} {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Landmarks / Fly-To Dropdown */}
              <div className="px-2 pb-2 border-t border-border/30 pt-2">
                <LandmarksDropdown />
              </div>
            </>
          ) : (
            <>
              {/* X OSINT Live Feed + AI Chat */}
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">𝕏</span>
                  <span className="text-[11px] font-display tracking-[0.12em] text-primary">LIVE OSINT FEED</span>
                  <span className="flex items-center gap-0.5 ml-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse" />
                    <span className="text-[9px] font-data text-alert-critical">LIVE</span>
                  </span>
                </div>

                {/* AI Chat Input */}
                <OsintChatBox twitterPosts={twitterPosts} />

                <div className="text-[9px] font-data text-muted-foreground/50 mb-2">{twitterPosts.length} posts from OSINT accounts</div>
                {twitterPosts.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-xl mb-1 opacity-20">𝕏</div>
                    <div className="text-[11px] font-data text-muted-foreground/40">Loading OSINT feed...</div>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto">
                    {twitterPosts.slice(0, 30).map(post => (
                      <XPostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
});

const StatBox = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="rounded border border-border/30 p-1.5 text-center" style={{ background: 'hsla(210, 50%, 6%, 0.6)' }}>
    <div className={`font-data text-sm font-bold ${color}`}>{value.toLocaleString()}</div>
    <div className="text-[7px] font-display tracking-wider text-muted-foreground/50">{label}</div>
  </div>
);

const XPostCard = memo(({ post }: { post: TwitterOsintPost }) => {
  const isConflict = /\b(strike|missile|attack|killed|bomb|explosion|war|troops|drone)\b/i.test(post.text);
  const setMapCenter = useWorldViewStore(s => s.setMapCenter);
  const timeAgo = () => {
    const diff = Date.now() - new Date(post.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'NOW';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h`;
  };

  const handleClick = () => {
    if (post.geo) {
      setMapCenter({ lat: post.geo.lat, lon: post.geo.lon, zoom: 8 });
    } else {
      useWorldViewStore.getState().openInAppBrowser(post.url);
    }
  };

  return (
    <div
      className={`relative rounded-lg overflow-hidden cursor-pointer transition-all hover:brightness-110 ${
        isConflict ? 'border border-alert-critical/30' : 'border border-primary/15'
      }`}
      onClick={handleClick}
      title={post.geo ? 'Click to fly to location' : 'Click to open on 𝕏'}
      style={{
        background: isConflict
          ? 'linear-gradient(135deg, hsla(345,80%,8%,0.9), hsla(210,60%,6%,0.85))'
          : 'linear-gradient(135deg, hsla(210,60%,6%,0.9), hsla(210,50%,8%,0.85))',
        backdropFilter: 'blur(12px)',
        boxShadow: isConflict
          ? '0 0 12px hsla(345,100%,50%,0.08), inset 0 1px 0 hsla(345,100%,50%,0.05)'
          : '0 0 8px hsla(150,100%,50%,0.05), inset 0 1px 0 hsla(150,100%,50%,0.03)',
      }}
    >
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none rounded-lg" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsla(150,100%,50%,0.01) 2px, hsla(150,100%,50%,0.01) 4px)' }} />
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5" style={{ borderTop: `1.5px solid ${isConflict ? 'hsla(345,100%,50%,0.4)' : 'hsla(150,100%,50%,0.3)'}`, borderLeft: `1.5px solid ${isConflict ? 'hsla(345,100%,50%,0.4)' : 'hsla(150,100%,50%,0.3)'}`, borderRadius: '2px 0 0 0' }} />
      <div className="absolute top-0 right-0 w-1.5 h-1.5" style={{ borderTop: `1.5px solid ${isConflict ? 'hsla(345,100%,50%,0.4)' : 'hsla(150,100%,50%,0.3)'}`, borderRight: `1.5px solid ${isConflict ? 'hsla(345,100%,50%,0.4)' : 'hsla(150,100%,50%,0.3)'}`, borderRadius: '0 2px 0 0' }} />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5" style={{ borderBottom: `1.5px solid ${isConflict ? 'hsla(345,100%,50%,0.4)' : 'hsla(150,100%,50%,0.3)'}`, borderLeft: `1.5px solid ${isConflict ? 'hsla(345,100%,50%,0.4)' : 'hsla(150,100%,50%,0.3)'}`, borderRadius: '0 0 0 2px' }} />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5" style={{ borderBottom: `1.5px solid ${isConflict ? 'hsla(345,100%,50%,0.4)' : 'hsla(150,100%,50%,0.3)'}`, borderRight: `1.5px solid ${isConflict ? 'hsla(345,100%,50%,0.4)' : 'hsla(150,100%,50%,0.3)'}`, borderRadius: '0 0 2px 0' }} />
      
      <div className="relative px-2.5 py-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">𝕏</span>
            <span className={`text-[10px] font-data ${isConflict ? 'text-alert-critical' : 'text-primary'} tracking-wide`}>@{post.account}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {post.geo && (
              <span className="text-[8px] font-data text-primary/50 bg-primary/10 px-1 rounded">📍 GEO</span>
            )}
            <div className={`w-1 h-1 rounded-full ${isConflict ? 'bg-alert-critical' : 'bg-primary'} animate-pulse-dot`} />
            <span className={`text-[9px] font-data ${isConflict ? 'text-alert-critical/60' : 'text-primary/40'}`}>{timeAgo()}</span>
          </div>
        </div>
        {/* Divider */}
        <div className="h-px mb-1.5" style={{ background: `linear-gradient(90deg, transparent, ${isConflict ? 'hsla(345,100%,50%,0.2)' : 'hsla(150,100%,50%,0.15)'}, transparent)` }} />
        {/* Body */}
        <p className="text-[11px] font-data text-foreground/80 leading-relaxed line-clamp-3">{post.text}</p>
        {/* Metrics */}
        {post.metrics && ((post.metrics.retweet_count || 0) > 0 || (post.metrics.like_count || 0) > 0) && (
          <div className="flex items-center gap-3 mt-1.5 pt-1" style={{ borderTop: '1px solid hsla(150,100%,50%,0.06)' }}>
            {(post.metrics.retweet_count || 0) > 0 && <span className="text-[9px] font-data text-muted-foreground/40">🔁 {post.metrics.retweet_count}</span>}
            {(post.metrics.like_count || 0) > 0 && <span className="text-[9px] font-data text-muted-foreground/40">♥ {post.metrics.like_count}</span>}
            <span className="text-[8px] font-data text-primary/30 ml-auto">API</span>
          </div>
        )}
      </div>
    </div>
  );
});
XPostCard.displayName = 'XPostCard';

LeftPanel.displayName = 'LeftPanel';
export default LeftPanel;
