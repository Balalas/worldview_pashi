import { memo, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useWorldViewStore, NewsItem, TwitterOsintPost } from '@/store/worldview';
import { CountryData } from '@/services/countryService';
import { PUBLIC_CAMERAS } from '@/data/publicCameras';
import { CONFLICT_ZONES } from '@/data/conflictZones';
import { LIVESTREAM_FEEDS, LivestreamFeed } from '@/services/dataServices';
import { fetchAINewsEnrichment, AINewsEnrichment } from '@/services/aiEnrichService';
import { fetchPerplexityCountryIntel, PerplexityIntel } from '@/services/perplexityIntelService';


type DossierTab = 'war' | 'intelligence' | 'cyber' | 'crime' | 'xosint' | 'perplexity' | 'cameras' | 'tv' | 'all';

const TAB_CONFIG: { key: DossierTab; label: string; icon: string; keywords: RegExp }[] = [
  { key: 'all', label: 'ALL INTEL', icon: '📡', keywords: /./i },
  { key: 'war', label: 'WAR & CONFLICT', icon: '⚔️', keywords: /\b(war|airstrike|missile|bombing|shelling|casualties|killed|troops|invasion|offensive|ceasefire|artillery|mortar|combat|frontline|siege|drone strike|battle)\b/i },
  { key: 'intelligence', label: 'INTELLIGENCE', icon: '🕵️', keywords: /\b(intelligen|espionage|spy|surveillance|covert|classified|cia|mossad|fbi|mi6|fsb|sigint|operation|agent|defect|leak|whistleblow|intercept)\b/i },
  { key: 'cyber', label: 'CYBER', icon: '🔒', keywords: /\b(cyber|hack|breach|ransomware|ddos|malware|phishing|data leak|exploit|vulnerability|zero.day|apt|botnet|encryption)\b/i },
  { key: 'crime', label: 'CRIME', icon: '🚨', keywords: /\b(crime|murder|arrest|drug|cartel|gang|trafficking|smuggling|corruption|fraud|launder|theft|robbery|terrorist|extremist|organized crime)\b/i },
  { key: 'xosint', label: '𝕏 OSINT', icon: '𝕏', keywords: /./i },
  { key: 'perplexity', label: 'AI INTEL', icon: '🔍', keywords: /./i },
  { key: 'tv', label: 'LIVE TV', icon: '📺', keywords: /./i },
  { key: 'cameras', label: 'CCTV', icon: '📹', keywords: /./i },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-alert-critical border-alert-critical/30 bg-alert-critical/5',
  high: 'text-alert-high border-alert-high/30 bg-alert-high/5',
  medium: 'text-alert-medium border-alert-medium/30 bg-alert-medium/5',
  low: 'text-primary border-primary/30 bg-primary/5',
  info: 'text-muted-foreground border-border bg-muted/5',
};

const CountryDossier = memo(() => {
  const { countryDossier, closeCountryDossier, news, earthquakes, fires, protests, outages, setActiveLivestream, setDetailPanel, setMapCenter, twitterPosts } = useWorldViewStore();
  const [activeTab, setActiveTab] = useState<DossierTab>('all');

  const country = countryDossier;
  const countryName = country?.name.toLowerCase() ?? '';
  const countryCode = country?.code ?? '';

  // Match news to this country
  const countryNews = useMemo(() => {
    if (!country) return [];
    return news.filter(n => {
      const titleLower = n.title.toLowerCase();
      const srcCountry = n.country?.toLowerCase();
      return (
        srcCountry === countryName ||
        titleLower.includes(countryName) ||
        (country.capital && titleLower.includes(country.capital.toLowerCase()))
      );
    });
  }, [news, countryName, country]);

  // Filter by active tab
  const filteredNews = useMemo(() => {
    if (activeTab === 'cameras' || activeTab === 'xosint' || activeTab === 'perplexity') return [];
    const tabCfg = TAB_CONFIG.find(t => t.key === activeTab);
    if (!tabCfg || activeTab === 'all') return countryNews;
    return countryNews.filter(n => tabCfg.keywords.test(n.title));
  }, [countryNews, activeTab]);

  // X/Twitter OSINT posts matching this country
  const countryXPosts = useMemo(() => {
    if (!country) return [];
    const searchTerms = [countryName, country.capital?.toLowerCase(), countryCode.toLowerCase()].filter(Boolean);
    return twitterPosts.filter(p => {
      const textLower = p.text.toLowerCase();
      return searchTerms.some(term => term && textLower.includes(term));
    });
  }, [twitterPosts, countryName, country, countryCode]);

  // Live cameras in this country
  const countryCameras = useMemo(() => {
    if (!country) return [];
    return PUBLIC_CAMERAS.filter(c =>
      c.country === countryCode &&
      (c.embedUrl || c.snapshotUrl)
    );
  }, [countryCode, country]);

  // TV channels matching this country/region
  const countryTVChannels = useMemo(() => {
    if (!country) return [];
    const REGION_MAP: Record<string, string[]> = {
      'US': ['US', 'Americas'],
      'GB': ['UK', 'Europe'],
      'FR': ['Europe'],
      'DE': ['Germany', 'Europe'],
      'RU': ['Russia', 'Europe'],
      'CN': ['China', 'Asia'],
      'JP': ['Japan', 'Asia'],
      'IN': ['India', 'Asia'],
      'KR': ['South Korea', 'Asia'],
      'TR': ['Turkey', 'Europe'],
      'IL': ['Middle East'],
      'PS': ['Middle East'],
      'SA': ['Middle East'],
      'QA': ['Middle East', 'Global'],
      'AE': ['Middle East'],
      'SG': ['Asia', 'Singapore'],
      'UA': ['Europe', 'Kyiv'],
      'IR': ['Middle East'],
      'IQ': ['Middle East'],
      'SY': ['Middle East'],
      'LB': ['Middle East'],
      'YE': ['Middle East'],
      'EG': ['Middle East', 'Africa'],
      'NG': ['Africa'],
      'AU': ['Asia'],
      'BR': ['Americas'],
    };
    const regions = REGION_MAP[countryCode] || [country.region, country.subregion];
    // Match by region or 'Global' channels
    return LIVESTREAM_FEEDS.filter(f =>
      f.category === 'news' && (
        regions.some(r => f.region?.toLowerCase().includes(r.toLowerCase())) ||
        f.region === 'Global'
      )
    );
  }, [countryCode, country]);

  // Conflict zones in this country
  const countryConflicts = useMemo(() => {
    if (!country) return [];
    return CONFLICT_ZONES.filter(z =>
      z.name.toLowerCase().includes(countryName) ||
      countryName.includes(z.name.split('–')[0].trim().toLowerCase())
    );
  }, [countryName, country]);

  // Country earthquakes
  const countryQuakes = useMemo(() => {
    if (!country) return [];
    return earthquakes.filter(eq => {
      const dist = Math.sqrt(
        Math.pow(eq.lat - country.lat, 2) +
        Math.pow(eq.lon - country.lon, 2)
      );
      return dist < 10;
    }).slice(0, 5);
  }, [earthquakes, country]);

  // Country fires
  const countryFires = useMemo(() => {
    if (!country) return 0;
    return fires.filter(f => {
      const dist = Math.sqrt(
        Math.pow(f.lat - country.lat, 2) +
        Math.pow(f.lon - country.lon, 2)
      );
      return dist < 10;
    }).length;
  }, [fires, country]);

  if (!country) return null;

  const handleNewsClick = (item: NewsItem) => {
    if (item.link) window.open(item.link, '_blank', 'noopener');
  };

  const handleCameraClick = (cam: typeof PUBLIC_CAMERAS[0]) => {
    setActiveLivestream(cam.embedUrl || null);
    setDetailPanel({ type: 'camera', data: cam });
    setMapCenter({ lat: cam.lat, lon: cam.lon, zoom: 14 });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={closeCountryDossier}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void/80 backdrop-blur-md" />

      {/* Holographic Dossier Card */}
      <div
        className="relative w-[90vw] max-w-[1100px] h-[85vh] max-h-[800px] animate-fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, hsl(var(--background) / 0.95), hsl(var(--background) / 0.85))',
          border: '1px solid hsl(var(--primary) / 0.3)',
          borderRadius: '8px',
          boxShadow: '0 0 60px hsl(var(--primary) / 0.1), 0 0 120px hsl(var(--primary) / 0.05), inset 0 1px 0 hsl(var(--primary) / 0.1)',
        }}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.02) 2px, hsl(var(--primary) / 0.02) 4px)',
          }}
        />

        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/50 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/50 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/50 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/50 rounded-br-lg" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{country.flag}</span>
            <div>
              <h1 className="text-xl font-display tracking-[0.15em] text-foreground font-bold">
                {country.name.toUpperCase()}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[9px] font-data text-muted-foreground tracking-wider">
                  {country.officialName}
                </span>
                <span className="text-[8px] font-data text-primary/60">ISO: {countryCode}</span>
                <span className="text-[8px] font-data text-primary/60">CAPITAL: {country.capital}</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-4">
            {countryConflicts.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-alert-critical/10 border border-alert-critical/30">
                <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse" />
                <span className="text-[9px] font-data text-alert-critical tracking-wider">
                  {countryConflicts.length} ACTIVE CONFLICT{countryConflicts.length > 1 ? 'S' : ''}
                </span>
              </div>
            )}
            <div className="text-right">
              <div className="text-[8px] font-data text-muted-foreground">INTEL ITEMS</div>
              <div className="text-sm font-display text-primary">{countryNews.length}</div>
            </div>
            <button
              onClick={closeCountryDossier}
              className="w-8 h-8 flex items-center justify-center rounded border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 px-4 py-2 border-b border-border/30 overflow-x-auto">
          {TAB_CONFIG.map(tab => {
            const count = tab.key === 'cameras' ? countryCameras.length :
              tab.key === 'tv' ? countryTVChannels.length :
              tab.key === 'xosint' ? countryXPosts.length :
              tab.key === 'perplexity' ? -1 :
              tab.key === 'all' ? countryNews.length :
                countryNews.filter(n => tab.keywords.test(n.title)).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] font-data tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`ml-1 px-1 rounded text-[8px] ${
                  activeTab === tab.key ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'
                }`}>{count === -1 ? '🔍' : count}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100% - 140px)' }}>
          <div className="h-full flex gap-0">
            {/* Left sidebar — country stats */}
            <div className="w-[240px] border-r border-border/30 p-4 overflow-y-auto flex-shrink-0 space-y-4">
              {/* Country vitals */}
              <div className="space-y-2">
                <h3 className="text-[9px] font-data text-primary/70 tracking-[0.2em] border-b border-primary/10 pb-1">VITALS</h3>
                <StatRow label="POPULATION" value={formatPop(country.population)} />
                <StatRow label="AREA" value={`${country.area.toLocaleString()} km²`} />
                <StatRow label="REGION" value={country.region} />
                <StatRow label="SUBREGION" value={country.subregion} />
                <StatRow label="LANGUAGES" value={country.languages.slice(0, 3).join(', ')} />
                <StatRow label="CURRENCIES" value={country.currencies.slice(0, 2).join(', ')} />
                <StatRow label="TIMEZONE" value={country.timezones[0] || 'N/A'} />
                <StatRow label="BORDERS" value={country.borders.length > 0 ? country.borders.join(', ') : 'Island/None'} />
                <StatRow label="UN MEMBER" value={country.unMember ? '✓ YES' : '✗ NO'} />
                {country.gini && <StatRow label="GINI INDEX" value={String(country.gini)} />}
              </div>

              {/* Active conflicts */}
              {countryConflicts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[9px] font-data text-alert-critical/80 tracking-[0.2em] border-b border-alert-critical/10 pb-1">⚔️ ACTIVE CONFLICTS</h3>
                  {countryConflicts.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse flex-shrink-0" />
                      <span className="font-data text-foreground/80">{c.name}</span>
                      <span className="text-muted-foreground ml-auto">{c.intensity}/10</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Situational counts */}
              <div className="space-y-2">
                <h3 className="text-[9px] font-data text-primary/70 tracking-[0.2em] border-b border-primary/10 pb-1">SITUATION</h3>
                <StatRow label="EARTHQUAKES" value={String(countryQuakes.length)} />
                <StatRow label="ACTIVE FIRES" value={String(countryFires)} />
                <StatRow label="LIVE CAMERAS" value={String(countryCameras.length)} />
                <StatRow label="NEWS ITEMS" value={String(countryNews.length)} />
                <StatRow label="𝕏 OSINT" value={String(countryXPosts.length)} />
              </div>
            </div>

            {/* Main content — news feed, cameras, or TV */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'cameras' ? (
                <CameraGrid cameras={countryCameras} onCameraClick={handleCameraClick} />
              ) : activeTab === 'tv' ? (
                <CountryTVPanel channels={countryTVChannels} />
              ) : activeTab === 'xosint' ? (
                <XOsintFeed posts={countryXPosts} countryName={country.name} />
              ) : activeTab === 'perplexity' ? (
                <PerplexityIntelPanel countryName={country.name} />
              ) : (
                <>
                  <CheckNewsButton countryName={country.name} />
                  <CountryAIBanner news={filteredNews} countryName={country.name} />
                  {countryXPosts.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px]">𝕏</span>
                        <span className="text-[8px] font-display tracking-[0.15em] text-primary/70">LATEST X/OSINT</span>
                        <span className="text-[7px] font-data text-muted-foreground">{countryXPosts.length} posts</span>
                      </div>
                      {countryXPosts.slice(0, 3).map(post => (
                        <div key={post.id} className="rounded border border-border/20 bg-card-bg/20 px-2.5 py-1.5 mb-1 cursor-pointer hover:border-primary/30 transition-colors"
                          onClick={() => window.open(post.url, '_blank', 'noopener')}>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-data text-primary/70">@{post.account}</span>
                            <span className="text-[7px] font-data text-muted-foreground/40 ml-auto">{new Date(post.createdAt).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[9px] font-data text-foreground/70 leading-relaxed mt-0.5 line-clamp-2">{post.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <NewsFeed news={filteredNews} onNewsClick={handleNewsClick} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Country AI Banner
const CountryAIBanner = memo(({ news, countryName }: { news: NewsItem[]; countryName: string }) => {
  const [enrichment, setEnrichment] = useState<AINewsEnrichment | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEnrichment = useCallback(async () => {
    if (news.length === 0) return;
    setLoading(true);
    const headlines = news.slice(0, 20).map(n => `[${n.severity.toUpperCase()}] ${n.source}: ${n.title}`);
    const result = await fetchAINewsEnrichment(headlines, 'country', countryName);
    if (result) setEnrichment(result);
    setLoading(false);
  }, [news.length, countryName]);

  useEffect(() => {
    if (news.length > 0) fetchEnrichment();
  }, [news.length, countryName]);

  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(fetchEnrichment, 60_000);
    return () => clearInterval(interval);
  }, [fetchEnrichment, news.length]);

  const threatColor = enrichment?.threatLevel === 'CRITICAL' ? 'text-alert-critical border-alert-critical/30 bg-alert-critical/5' :
    enrichment?.threatLevel === 'HIGH' ? 'text-alert-high border-alert-high/30 bg-alert-high/5' :
    enrichment?.threatLevel === 'MEDIUM' ? 'text-alert-medium border-alert-medium/30 bg-alert-medium/5' :
    'text-signal-aircraft border-primary/20 bg-primary/5';

  if (!enrichment && !loading) return null;

  return (
    <div className={`rounded border px-3 py-2 mb-3 ${enrichment ? threatColor : 'border-border bg-card-bg/40'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px]">🧠</span>
        <span className="text-[9px] font-display tracking-[0.15em] text-primary">AI COUNTRY ANALYSIS</span>
        {loading && <span className="text-[8px] font-data text-primary animate-pulse">ANALYZING...</span>}
        {enrichment?.threatLevel && (
          <span className={`text-[8px] font-data font-bold tracking-wider ${threatColor.split(' ')[0]}`}>
            ● {enrichment.threatLevel}
          </span>
        )}
        <button onClick={fetchEnrichment} disabled={loading}
          className="text-[7px] font-data text-primary/60 hover:text-primary ml-auto disabled:opacity-50">🔄</button>
      </div>
      {enrichment && (
        <>
          <p className="text-[10px] font-data text-foreground leading-relaxed mb-1.5">{enrichment.summary}</p>
          {enrichment.outlook && (
            <p className="text-[8px] font-data text-muted-foreground italic mb-1">📊 {enrichment.outlook}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {enrichment.keyDevelopments?.slice(0, 3).map((d, i) => (
              <span key={i} className="text-[8px] font-data text-foreground/80 bg-card-bg/60 px-1.5 py-0.5 rounded">↗ {d}</span>
            ))}
          </div>
          {enrichment.hotTopics && enrichment.hotTopics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {enrichment.hotTopics.map((t, i) => (
                <span key={i} className="text-[7px] font-data text-primary/70 bg-primary/5 px-1 py-0.5 rounded border border-primary/10">#{t}</span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});
CountryAIBanner.displayName = 'CountryAIBanner';

// Sub-components

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-[9px]">
    <span className="font-data text-muted-foreground tracking-wider">{label}</span>
    <span className="font-data text-foreground/80 text-right max-w-[120px] truncate">{value}</span>
  </div>
);

// Check News Now button — uses Perplexity to fetch fresh news
const CheckNewsButton = memo(({ countryName }: { countryName: string }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PerplexityIntel | null>(null);

  const handleCheck = useCallback(async () => {
    setLoading(true);
    const intel = await fetchPerplexityCountryIntel(countryName);
    if (intel) setResult(intel);
    setLoading(false);
  }, [countryName]);

  const threatColor = result?.threatLevel === 'CRITICAL' ? 'text-alert-critical' :
    result?.threatLevel === 'HIGH' ? 'text-alert-high' :
    result?.threatLevel === 'MEDIUM' ? 'text-alert-medium' : 'text-primary';

  return (
    <div className="mb-3">
      <button
        onClick={handleCheck}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-primary disabled:opacity-50 w-full"
      >
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-sm">🔍</span>
        )}
        <span className="text-[10px] font-display tracking-[0.12em]">
          {loading ? 'FETCHING LIVE INTEL...' : 'CHECK NEWS NOW'}
        </span>
        <span className="text-[7px] font-data text-primary/50 ml-auto">PERPLEXITY AI</span>
      </button>
      {result && (
        <div className={`mt-2 rounded border border-border/30 bg-card-bg/30 px-3 py-2`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[8px] font-data font-bold tracking-wider ${threatColor}`}>● {result.threatLevel}</span>
            <span className="text-[7px] font-data text-muted-foreground/50">{result.fetchedAt ? new Date(result.fetchedAt).toLocaleTimeString('en-US', { hour12: false }) : ''}</span>
          </div>
          <p className="text-[10px] font-data text-foreground/80 leading-relaxed mb-1.5">{result.briefing}</p>
          {result.developments?.slice(0, 3).map((d, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[9px] mb-0.5">
              <span className="text-primary/60 flex-shrink-0 mt-0.5">▸</span>
              <span className="font-data text-foreground/70">{d}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
CheckNewsButton.displayName = 'CheckNewsButton';

const XOsintFeed = memo(({ posts, countryName }: { posts: TwitterOsintPost[]; countryName?: string }) => {
  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-30">𝕏</div>
          <div className="text-[10px] font-data text-muted-foreground tracking-wider">NO X/OSINT POSTS FOR THIS COUNTRY</div>
          <div className="text-[8px] font-data text-muted-foreground/50 mt-1">Auto-refreshes every 60 seconds</div>
        </div>
      </div>
    );
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'NOW';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">𝕏</span>
        <span className="text-[9px] font-display tracking-[0.15em] text-primary">LIVE OSINT FEED</span>
        <span className="flex items-center gap-0.5">
          <span className="w-1 h-1 rounded-full bg-alert-critical animate-pulse" />
          <span className="text-[7px] font-data text-alert-critical">LIVE</span>
        </span>
        <span className="text-[8px] font-data text-muted-foreground ml-auto">{posts.length} posts</span>
      </div>
      {posts.map(post => (
        <div
          key={post.id}
          className="rounded border border-border/30 bg-card-bg/30 p-3 hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => window.open(post.url, '_blank', 'noopener')}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-data text-primary/80">@{post.account}</span>
            <div className="flex items-center gap-1.5">
              {post.geo && (
                <span className="text-[7px] font-data text-primary/60 bg-primary/10 px-1 rounded">📍 {post.geo.place}</span>
              )}
              <span className="text-[7px] font-data text-muted-foreground/50">{timeAgo(post.createdAt)}</span>
            </div>
          </div>
          <p className="text-[10px] font-data text-foreground/80 leading-relaxed">{post.text}</p>
          {post.metrics && (
            <div className="flex items-center gap-3 mt-1.5">
              {post.metrics.retweet_count !== undefined && post.metrics.retweet_count > 0 && (
                <span className="text-[7px] font-data text-muted-foreground/40">🔁 {post.metrics.retweet_count}</span>
              )}
              {post.metrics.like_count !== undefined && post.metrics.like_count > 0 && (
                <span className="text-[7px] font-data text-muted-foreground/40">♥ {post.metrics.like_count}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
XOsintFeed.displayName = 'XOsintFeed';

const PerplexityIntelPanel = memo(({ countryName }: { countryName: string }) => {
  const [intel, setIntel] = useState<PerplexityIntel | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchIntel = useCallback(async () => {
    setLoading(true);
    const result = await fetchPerplexityCountryIntel(countryName);
    if (result) setIntel(result);
    setLoading(false);
  }, [countryName]);

  useEffect(() => {
    fetchIntel();
    const interval = setInterval(fetchIntel, 60_000);
    return () => clearInterval(interval);
  }, [fetchIntel]);

  const threatColor = intel?.threatLevel === 'CRITICAL' ? 'text-alert-critical border-alert-critical/30 bg-alert-critical/5' :
    intel?.threatLevel === 'HIGH' ? 'text-alert-high border-alert-high/30 bg-alert-high/5' :
    intel?.threatLevel === 'MEDIUM' ? 'text-alert-medium border-alert-medium/30 bg-alert-medium/5' :
    'text-primary border-primary/30 bg-primary/5';

  if (loading && !intel) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <div className="text-[10px] font-data text-muted-foreground tracking-wider">QUERYING PERPLEXITY AI...</div>
          <div className="text-[8px] font-data text-muted-foreground/50 mt-1">Real-time web search for {countryName}</div>
        </div>
      </div>
    );
  }

  if (!intel) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-30">🔍</div>
          <div className="text-[10px] font-data text-muted-foreground tracking-wider">NO AI INTEL AVAILABLE</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">🔍</span>
          <span className="text-[9px] font-display tracking-[0.15em] text-primary">PERPLEXITY AI INTELLIGENCE</span>
          <span className="flex items-center gap-0.5">
            <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <span className="text-[7px] font-data text-primary">LIVE</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[8px] font-data font-bold tracking-wider ${threatColor.split(' ')[0]}`}>
            ● {intel.threatLevel}
          </span>
          <button onClick={fetchIntel} disabled={loading}
            className="text-[7px] font-data text-primary/60 hover:text-primary disabled:opacity-50">🔄</button>
        </div>
      </div>

      {/* Briefing */}
      <div className={`rounded border px-3 py-2.5 ${threatColor}`}>
        <div className="text-[8px] font-display tracking-[0.15em] text-primary/70 mb-1">SITUATION BRIEFING</div>
        <p className="text-[10px] font-data text-foreground leading-relaxed">{intel.briefing}</p>
      </div>

      {/* Key Developments */}
      {intel.developments && intel.developments.length > 0 && (
        <div>
          <div className="text-[8px] font-display tracking-[0.15em] text-primary/70 mb-1.5">KEY DEVELOPMENTS</div>
          <div className="space-y-1.5">
            {intel.developments.map((dev, i) => (
              <div key={i} className="flex items-start gap-2 rounded border border-border/30 bg-card-bg/30 px-3 py-2">
                <span className="text-[8px] font-data text-primary/60 mt-0.5 flex-shrink-0">▸</span>
                <p className="text-[9px] font-data text-foreground/80 leading-relaxed">{dev}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risks */}
      {intel.risks && intel.risks.length > 0 && (
        <div>
          <div className="text-[8px] font-display tracking-[0.15em] text-alert-high/70 mb-1.5">⚠ RISK ASSESSMENT</div>
          <div className="space-y-1">
            {intel.risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-2 text-[9px]">
                <span className="text-alert-high/60 flex-shrink-0">●</span>
                <span className="font-data text-foreground/70">{risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords */}
      {intel.keywords && intel.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {intel.keywords.map((kw, i) => (
            <span key={i} className="text-[7px] font-data text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
              #{kw}
            </span>
          ))}
        </div>
      )}

      {/* Citations */}
      {intel.citations && intel.citations.length > 0 && (
        <div className="border-t border-border/30 pt-2">
          <div className="text-[7px] font-data text-muted-foreground/50 tracking-wider mb-1">SOURCES</div>
          <div className="space-y-0.5">
            {intel.citations.slice(0, 5).map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="block text-[7px] font-data text-primary/50 hover:text-primary truncate transition-colors">
                🔗 {url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/20 pt-1.5">
        <span className="text-[7px] font-data text-muted-foreground/40">AUTO-REFRESH 60s</span>
        <span className="text-[7px] font-data text-muted-foreground/30">
          Updated {intel.fetchedAt ? new Date(intel.fetchedAt).toLocaleTimeString('en-US', { hour12: false }) : '—'} UTC
        </span>
      </div>
    </div>
  );
});
PerplexityIntelPanel.displayName = 'PerplexityIntelPanel';

const NewsFeed = memo(({ news, onNewsClick }: { news: NewsItem[]; onNewsClick: (n: NewsItem) => void }) => {
  if (news.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-30">📡</div>
          <div className="text-[10px] font-data text-muted-foreground tracking-wider">NO INTELLIGENCE ITEMS FOR THIS CATEGORY</div>
          <div className="text-[8px] font-data text-muted-foreground/50 mt-1">Data refreshes every 60 seconds</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {news.map((item, i) => {
        const severityClass = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.info;
        return (
          <div
            key={item.id || i}
            className={`group border rounded px-3 py-2.5 cursor-pointer hover:brightness-110 transition-all ${severityClass}`}
            onClick={() => onNewsClick(item)}
          >
            <div className="flex items-start gap-3">
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  className="w-16 h-12 object-cover rounded flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[8px] font-data tracking-wider px-1.5 py-0.5 rounded ${
                    item.severity === 'critical' ? 'bg-alert-critical/20 text-alert-critical' :
                    item.severity === 'high' ? 'bg-alert-high/20 text-alert-high' :
                    'bg-muted/30 text-muted-foreground'
                  }`}>
                    {item.severity?.toUpperCase() || 'INFO'}
                  </span>
                  <span className="text-[8px] font-data text-primary/60 tracking-wider">{item.source}</span>
                  {item.isStateMedia && (
                    <span className="text-[7px] font-data text-amber-400 bg-amber-400/10 px-1 rounded">STATE MEDIA</span>
                  )}
                  <span className="text-[7px] font-data text-muted-foreground/50 ml-auto">
                    {item.time instanceof Date ? item.time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-[11px] font-display tracking-wide text-foreground leading-tight group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                {item.category && (
                  <span className="text-[7px] font-data text-primary/40 tracking-wider mt-1 inline-block">
                    {item.category.toUpperCase()}
                  </span>
                )}
                {item.link && (
                  <div className="text-[7px] font-data text-primary/50 tracking-wider mt-0.5 group-hover:text-primary/80">
                    🔗 CLICK TO OPEN SOURCE
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
NewsFeed.displayName = 'NewsFeed';

const CameraGrid = memo(({ cameras, onCameraClick }: {
  cameras: typeof PUBLIC_CAMERAS;
  onCameraClick: (cam: typeof PUBLIC_CAMERAS[0]) => void;
}) => {
  if (cameras.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-30">📹</div>
          <div className="text-[10px] font-data text-muted-foreground tracking-wider">NO LIVE CAMERAS IN THIS COUNTRY</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {cameras.map(cam => (
        <div
          key={cam.id}
          className="group border border-border/40 rounded overflow-hidden cursor-pointer hover:border-primary/50 transition-all bg-background/50"
          onClick={() => onCameraClick(cam)}
        >
          <div className="relative w-full h-28 bg-muted/20 flex items-center justify-center">
            <span className="text-3xl opacity-20">📹</span>
            <div className="absolute top-1 left-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-[7px] font-data text-destructive tracking-wider">LIVE</span>
            </div>
            {cam.official && (
              <span className="absolute top-1 right-1 text-[6px] font-data text-amber-400 bg-amber-400/10 px-1 rounded">DOT</span>
            )}
          </div>
          <div className="px-2 py-1.5">
            <div className="text-[9px] font-data text-foreground tracking-wider truncate group-hover:text-primary transition-colors">
              {cam.name}
            </div>
            <div className="text-[7px] font-data text-muted-foreground tracking-wider">
              {cam.city} • {cam.category.toUpperCase()} • {cam.source}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
CameraGrid.displayName = 'CameraGrid';

const CountryTVPanel = memo(({ channels }: { channels: LivestreamFeed[] }) => {
  const [activeChannel, setActiveChannel] = useState<LivestreamFeed | null>(null);
  const [volume, setVolume] = useState(30);

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2 opacity-30">📺</div>
          <div className="text-[10px] font-data text-muted-foreground tracking-wider">NO TV CHANNELS FOR THIS REGION</div>
          <div className="text-[8px] font-data text-muted-foreground/50 mt-1">Try checking global news channels</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 h-full" style={{ minHeight: 320 }}>
      {/* Channel list */}
      <div className="w-[180px] space-y-1 overflow-y-auto flex-shrink-0">
        <div className="text-[8px] font-data text-muted-foreground tracking-[0.15em] mb-2">{channels.length} CHANNELS</div>
        {channels.map(ch => (
          <button key={ch.id} onClick={() => setActiveChannel(ch)}
            className={`w-full text-left px-2 py-1.5 rounded text-[9px] transition-colors flex items-center gap-1.5 ${
              activeChannel?.id === ch.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-card-hover border border-transparent'
            }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-alert-critical animate-pulse-dot flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-foreground font-display tracking-wide truncate">{ch.title.replace(' – LIVE', '')}</div>
              <div className="text-[7px] font-data text-muted-foreground">{ch.source} • {ch.region}</div>
            </div>
          </button>
        ))}
      </div>

      {/* TV player */}
      <div className="flex-1 flex flex-col rounded overflow-hidden border border-border/30">
        {activeChannel ? (
          <>
            <div className="flex-1 relative min-h-0">
              <iframe
                src={activeChannel.url.replace('mute=1', 'mute=0')}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={activeChannel.title}
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-void/80 backdrop-blur-sm rounded px-2 py-1">
                <span className="w-2 h-2 rounded-full bg-alert-critical animate-pulse" />
                <span className="text-[9px] font-data text-alert-critical font-bold">LIVE</span>
                <span className="text-[9px] font-display tracking-wider text-foreground">{activeChannel.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5 border-t border-border bg-card-bg/60 flex-shrink-0">
              <span className="text-[10px]">🔊</span>
              <input type="range" min="0" max="100" value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="flex-1 h-1 accent-primary cursor-pointer" style={{ maxWidth: 120 }} />
              <span className="text-[8px] font-data text-muted-foreground w-8">{volume}%</span>
              <span className="text-[8px] font-data text-primary/50 ml-auto">{activeChannel.source}</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="text-3xl mb-2 block opacity-30">📺</span>
              <p className="text-[10px] font-display tracking-[0.15em] text-muted-foreground">SELECT A CHANNEL</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
CountryTVPanel.displayName = 'CountryTVPanel';

function formatPop(pop: number): string {
  if (pop >= 1e9) return `${(pop / 1e9).toFixed(2)}B`;
  if (pop >= 1e6) return `${(pop / 1e6).toFixed(1)}M`;
  if (pop >= 1e3) return `${(pop / 1e3).toFixed(1)}K`;
  return String(pop);
}

CountryDossier.displayName = 'CountryDossier';
export default CountryDossier;
