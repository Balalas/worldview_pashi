import { memo, useEffect, useState, useCallback } from 'react';

interface ApiStatus {
  name: string;
  endpoint: string;
  status: 'online' | 'offline' | 'checking';
  latency?: number;
}

const APIS: { name: string; endpoint: string; check: () => Promise<{ ok: boolean; latency: number }> }[] = [
  {
    name: 'OpenSky (Aircraft)',
    endpoint: 'opensky-proxy',
    check: async () => {
      const start = performance.now();
      try {
        const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/opensky-proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(8000),
        });
        return { ok: r.ok, latency: Math.round(performance.now() - start) };
      } catch { return { ok: false, latency: Math.round(performance.now() - start) }; }
    },
  },
  {
    name: 'GDELT (News)',
    endpoint: 'gdelt-proxy',
    check: async () => {
      const start = performance.now();
      try {
        const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gdelt-proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(8000),
        });
        return { ok: r.ok, latency: Math.round(performance.now() - start) };
      } catch { return { ok: false, latency: Math.round(performance.now() - start) }; }
    },
  },
  {
    name: 'NASA FIRMS (Fires)',
    endpoint: 'firms-proxy',
    check: async () => {
      const start = performance.now();
      try {
        const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/firms-proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ sensor: 'VIIRS_SNPP_NRT', days: 1 }),
          signal: AbortSignal.timeout(8000),
        });
        return { ok: r.ok, latency: Math.round(performance.now() - start) };
      } catch { return { ok: false, latency: Math.round(performance.now() - start) }; }
    },
  },
  {
    name: 'X / Twitter OSINT',
    endpoint: 'twitter-osint',
    check: async () => {
      const start = performance.now();
      try {
        const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twitter-osint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(8000),
        });
        return { ok: r.ok, latency: Math.round(performance.now() - start) };
      } catch { return { ok: false, latency: Math.round(performance.now() - start) }; }
    },
  },
  {
    name: 'USGS (Earthquakes)',
    endpoint: 'earthquake.usgs.gov',
    check: async () => {
      const start = performance.now();
      try {
        const r = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', {
          signal: AbortSignal.timeout(8000),
        });
        return { ok: r.ok, latency: Math.round(performance.now() - start) };
      } catch { return { ok: false, latency: Math.round(performance.now() - start) }; }
    },
  },
  {
    name: 'Perplexity Intel',
    endpoint: 'perplexity-country-intel',
    check: async () => {
      const start = performance.now();
      try {
        // Just check if the function exists (HEAD-like)
        const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/perplexity-country-intel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ country: 'test', headlines: [] }),
          signal: AbortSignal.timeout(10000),
        });
        return { ok: r.ok, latency: Math.round(performance.now() - start) };
      } catch { return { ok: false, latency: Math.round(performance.now() - start) }; }
    },
  },
];

const NetworkStatusPanel = memo(({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [speed, setSpeed] = useState<{ down: number; latency: number } | null>(null);
  const [testing, setTesting] = useState(false);
  const [apis, setApis] = useState<ApiStatus[]>(APIS.map(a => ({ name: a.name, endpoint: a.endpoint, status: 'checking' })));
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runSpeedTest = useCallback(async () => {
    setTesting(true);
    try {
      // Measure latency via small fetch
      const latStart = performance.now();
      await fetch('https://www.google.com/generate_204', { mode: 'no-cors', signal: AbortSignal.timeout(5000) });
      const latency = Math.round(performance.now() - latStart);

      // Estimate download speed via a known-size resource
      const dlStart = performance.now();
      const r = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson', {
        signal: AbortSignal.timeout(10000),
        cache: 'no-store',
      });
      const blob = await r.blob();
      const dlTime = (performance.now() - dlStart) / 1000; // seconds
      const sizeMb = blob.size / (1024 * 1024);
      const mbps = Math.round((sizeMb / dlTime) * 8 * 100) / 100; // Mbps

      setSpeed({ down: mbps, latency });
    } catch {
      setSpeed({ down: 0, latency: 999 });
    }
    setTesting(false);
  }, []);

  const checkApis = useCallback(async () => {
    setApis(prev => prev.map(a => ({ ...a, status: 'checking' as const })));
    const results = await Promise.allSettled(
      APIS.map(async (api) => {
        const result = await api.check();
        return { name: api.name, endpoint: api.endpoint, status: result.ok ? 'online' as const : 'offline' as const, latency: result.latency };
      })
    );
    setApis(results.map(r => r.status === 'fulfilled' ? r.value : { name: '', endpoint: '', status: 'offline' as const }));
    setLastCheck(new Date());
  }, []);

  useEffect(() => {
    if (open) {
      runSpeedTest();
      checkApis();
    }
  }, [open]);

  if (!open) return null;

  const onlineCount = apis.filter(a => a.status === 'online').length;
  const totalCount = apis.length;

  return (
    <div className="absolute top-9 right-2 z-[60] pointer-events-auto" style={{ width: 320 }}>
      <div className="rounded-lg border border-primary/20 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, hsla(213, 80%, 4%, 0.97) 0%, hsla(213, 60%, 3%, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 1px rgba(0,255,136,0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px]">📡</span>
            <span className="text-[10px] font-display tracking-[0.2em] text-primary font-bold">NETWORK STATUS</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
        </div>

        {/* Internet Speed */}
        <div className="px-3 py-2 border-b border-primary/8">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-data text-muted-foreground tracking-wider">INTERNET SPEED</span>
            <button onClick={runSpeedTest} disabled={testing}
              className="text-[8px] font-data text-primary/70 hover:text-primary disabled:opacity-40">
              {testing ? '⏳ TESTING...' : '🔄 RETEST'}
            </button>
          </div>
          {speed ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-data text-muted-foreground/60">DOWNLOAD</span>
                <span className={`text-sm font-bold font-data tabular-nums ${speed.down > 5 ? 'text-primary' : speed.down > 1 ? 'text-amber-400' : 'text-destructive'}`}>
                  {speed.down > 0 ? `${speed.down} Mbps` : 'FAILED'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-data text-muted-foreground/60">LATENCY</span>
                <span className={`text-sm font-bold font-data tabular-nums ${speed.latency < 100 ? 'text-primary' : speed.latency < 300 ? 'text-amber-400' : 'text-destructive'}`}>
                  {speed.latency}ms
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-data text-muted-foreground/60">QUALITY</span>
                <span className={`text-[10px] font-bold font-data ${speed.down > 10 ? 'text-primary' : speed.down > 3 ? 'text-amber-400' : 'text-destructive'}`}>
                  {speed.down > 10 ? '● EXCELLENT' : speed.down > 3 ? '● GOOD' : speed.down > 0 ? '● POOR' : '● OFFLINE'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-[9px] font-data text-muted-foreground">Running speed test...</span>
            </div>
          )}
        </div>

        {/* API Status */}
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-data text-muted-foreground tracking-wider">
              API CONNECTIONS ({onlineCount}/{totalCount})
            </span>
            <button onClick={checkApis}
              className="text-[8px] font-data text-primary/70 hover:text-primary">🔄 RECHECK</button>
          </div>
          <div className="flex flex-col gap-1">
            {apis.map((api) => (
              <div key={api.endpoint} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    api.status === 'online' ? 'bg-primary' :
                    api.status === 'offline' ? 'bg-destructive' :
                    'bg-amber-400 animate-pulse'
                  }`} />
                  <span className="text-[9px] font-data text-foreground/80">{api.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {api.latency !== undefined && (
                    <span className={`text-[8px] font-data tabular-nums ${
                      api.latency < 500 ? 'text-primary/60' : api.latency < 2000 ? 'text-amber-400/60' : 'text-destructive/60'
                    }`}>{api.latency}ms</span>
                  )}
                  <span className={`text-[8px] font-data tracking-wider ${
                    api.status === 'online' ? 'text-primary' :
                    api.status === 'offline' ? 'text-destructive' :
                    'text-amber-400'
                  }`}>
                    {api.status === 'online' ? '● ONLINE' : api.status === 'offline' ? '● OFFLINE' : '◌ CHECK'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 border-t border-primary/8 flex items-center justify-between">
          <span className="text-[7px] font-data text-muted-foreground/50">
            {lastCheck ? `Last checked: ${lastCheck.toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' })} UTC` : 'Checking...'}
          </span>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${onlineCount === totalCount ? 'bg-primary' : onlineCount > totalCount / 2 ? 'bg-amber-400' : 'bg-destructive'} animate-pulse`} />
            <span className={`text-[8px] font-data tracking-wider ${onlineCount === totalCount ? 'text-primary' : onlineCount > totalCount / 2 ? 'text-amber-400' : 'text-destructive'}`}>
              {onlineCount === totalCount ? 'ALL SYSTEMS NOMINAL' : `${totalCount - onlineCount} DEGRADED`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

NetworkStatusPanel.displayName = 'NetworkStatusPanel';
export default NetworkStatusPanel;
