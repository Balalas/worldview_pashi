import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { useWorldViewStore } from '@/store/worldview';
import { CONFLICT_ZONES } from '@/data/conflictZones';

interface TacticalAlert {
  id: string;
  type: 'earthquake' | 'military' | 'protest' | 'cyber' | 'fire' | 'weather' | 'conflict' | 'war';
  title: string;
  severity: 'critical' | 'high' | 'medium';
  timestamp: Date;
  lat?: number;
  lon?: number;
  persistent?: boolean;
}

const SEVERITY_CONFIG = {
  critical: { border: 'border-alert-critical', dot: 'bg-alert-critical', text: 'text-alert-critical', bg: 'bg-alert-critical/5' },
  high: { border: 'border-alert-high', dot: 'bg-alert-high', text: 'text-alert-high', bg: 'bg-alert-high/5' },
  medium: { border: 'border-alert-medium', dot: 'bg-alert-medium', text: 'text-alert-medium', bg: 'bg-alert-medium/5' },
};

const TYPE_ICONS: Record<string, string> = {
  earthquake: '◈', military: '▲', protest: '◉', cyber: '⬡', fire: '△', weather: '◇', conflict: '✦', war: '☢',
};

const WAR_KEYWORDS = /\b(war|airstrike|airstrikes|strike|strikes|shelling|shelled|bombed|bombing|bombardment|missile|missiles|rocket|rockets|killed|casualties|troops|offensive|invasion|siege|ceasefire|frontline|battle|combat|ambush|drone strike|artillery|mortar|gunfire|sniper|incursion|occupation|annex)\b/i;
const CONFLICT_REGIONS = CONFLICT_ZONES.map(z => z.name.toLowerCase());

// Max visible alerts at once - rest are stacked
const MAX_VISIBLE = 3;

const TacticalAlerts = memo(() => {
  const { earthquakes, aircraft, protests, outages, fires, news, setMapCenter } = useWorldViewStore();
  const [alerts, setAlerts] = useState<TacticalAlert[]>([]);
  const [expanded, setExpanded] = useState(false);
  const prevCountsRef = useRef({ eq: 0, mil: 0, protest: 0, cyber: 0, fire: 0 });
  const prevNewsIdsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(false);

  const addAlert = useCallback((alert: Omit<TacticalAlert, 'id' | 'timestamp'>) => {
    const newAlert: TacticalAlert = { ...alert, id: crypto.randomUUID(), timestamp: new Date() };
    setAlerts(prev => [newAlert, ...prev].slice(0, 15));
    const duration = alert.persistent ? 20000 : 12000;
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
    }, duration);
  }, []);

  // Monitor data changes
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevCountsRef.current = {
        eq: earthquakes.length,
        mil: aircraft.filter(a => a.isMilitary).length,
        protest: protests.length,
        cyber: outages.length,
        fire: fires.length,
      };
      return;
    }

    const prev = prevCountsRef.current;
    const milCount = aircraft.filter(a => a.isMilitary).length;

    if (earthquakes.length > prev.eq) {
      const newQuakes = earthquakes.slice(0, earthquakes.length - prev.eq);
      const bigQuake = newQuakes.find(q => q.magnitude >= 4.5);
      if (bigQuake) {
        addAlert({ type: 'earthquake', title: `M${bigQuake.magnitude.toFixed(1)} — ${bigQuake.place}`, severity: bigQuake.magnitude >= 6 ? 'critical' : 'high', lat: bigQuake.lat, lon: bigQuake.lon });
      }
    }

    if (milCount > prev.mil + 2) {
      addAlert({ type: 'military', title: `${milCount - prev.mil} NEW MIL AIRCRAFT DETECTED`, severity: 'high' });
    }

    if (protests.length > prev.protest) {
      addAlert({ type: 'protest', title: `NEW PROTEST ACTIVITY DETECTED`, severity: 'medium' });
    }

    if (outages.length > prev.cyber) {
      const newOutage = outages[0];
      addAlert({ type: 'cyber', title: `CYBER: ${newOutage?.title?.substring(0, 50) || 'NEW EVENT'}`, severity: newOutage?.severity === 'critical' ? 'critical' : 'high' });
    }

    if (fires.length > prev.fire + 1) {
      addAlert({ type: 'fire', title: `${fires.length - prev.fire} NEW FIRE EVENTS`, severity: 'high' });
    }

    prevCountsRef.current = { eq: earthquakes.length, mil: milCount, protest: protests.length, cyber: outages.length, fire: fires.length };
  }, [earthquakes.length, aircraft.length, protests.length, outages.length, fires.length, addAlert]);

  // Monitor news for war/conflict updates — batch them
  useEffect(() => {
    if (news.length === 0) return;

    const currentIds = new Set(news.map(n => n.id));
    if (prevNewsIdsRef.current.size === 0) {
      prevNewsIdsRef.current = currentIds;
      return;
    }

    const newItems = news.filter(n => !prevNewsIdsRef.current.has(n.id));
    prevNewsIdsRef.current = currentIds;
    if (newItems.length === 0) return;

    const conflictNews = newItems.filter(item => {
      if (item.category === 'conflict' || item.category === 'military') return true;
      if (WAR_KEYWORDS.test(item.title)) return true;
      const lower = item.title.toLowerCase();
      return CONFLICT_REGIONS.some(region => {
        const parts = region.split('–').map(p => p.trim());
        return parts.some(p => lower.includes(p));
      });
    });

    // Only add max 2 conflict alerts per batch to prevent flooding
    const seen = new Set<string>();
    let addedCount = 0;
    for (const item of conflictNews) {
      if (addedCount >= 2) break;
      const key = item.title.substring(0, 30).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const severity: TacticalAlert['severity'] = 
        item.severity === 'critical' ? 'critical' :
        item.severity === 'high' ? 'high' : 'medium';

      const isWar = /\b(war|killed|dead|casualties|airstrike|bombing|missile)\b/i.test(item.title);

      const matchedZone = CONFLICT_ZONES.find(z => {
        const parts = z.name.toLowerCase().split('–').map(p => p.trim());
        return parts.some(p => item.title.toLowerCase().includes(p));
      });

      addAlert({
        type: isWar ? 'war' : 'conflict',
        title: `${item.source}: ${item.title.substring(0, 70)}`,
        severity,
        persistent: severity === 'critical',
        lat: matchedZone?.lat,
        lon: matchedZone?.lon,
      });
      addedCount++;
    }

    // If there were more, add a summary alert
    if (conflictNews.length > 2) {
      addAlert({
        type: 'conflict',
        title: `+${conflictNews.length - 2} MORE CONFLICT UPDATES`,
        severity: 'medium',
      });
    }
  }, [news, addAlert]);

  const handleClick = (alert: TacticalAlert) => {
    if (alert.lat && alert.lon) {
      setMapCenter({ lat: alert.lat, lon: alert.lon, zoom: 8 });
    }
    setAlerts(prev => prev.filter(a => a.id !== alert.id));
  };

  const dismissAll = () => setAlerts([]);

  if (alerts.length === 0) return null;

  const visibleAlerts = expanded ? alerts : alerts.slice(0, MAX_VISIBLE);
  const hiddenCount = alerts.length - MAX_VISIBLE;
  const critCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;

  return (
    <div className="absolute top-12 right-4 z-50 flex flex-col gap-1 pointer-events-auto" style={{ maxWidth: 320 }}>
      {/* Stacked alerts */}
      {visibleAlerts.map((alert) => {
        const cfg = SEVERITY_CONFIG[alert.severity];
        const isClickable = !!(alert.lat && alert.lon);
        return (
          <div
            key={alert.id}
            className={`animate-slide-in-right glass-panel border-l-2 ${cfg.border} ${cfg.bg} px-2.5 py-1.5 rounded-r cursor-pointer hover:brightness-110 transition-all`}
            onClick={() => handleClick(alert)}
            title={isClickable ? 'Click to fly to location' : 'Click to dismiss'}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${alert.persistent ? 'animate-ping' : 'animate-pulse-dot'} flex-shrink-0`} />
              <span className={`text-[8px] font-data tracking-[0.12em] ${cfg.text} font-bold truncate`}>
                {TYPE_ICONS[alert.type]} {alert.type === 'war' ? 'WAR' : alert.type === 'conflict' ? 'CONFLICT' : alert.severity.toUpperCase()}
              </span>
              <span className="text-[7px] font-data text-muted-foreground ml-auto flex-shrink-0">
                {alert.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-[9px] font-display tracking-wider text-foreground mt-0.5 leading-tight truncate">{alert.title}</p>
          </div>
        );
      })}

      {/* Stack summary / expand button */}
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="glass-panel border border-border px-2.5 py-1.5 rounded text-left hover:bg-card-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-data text-primary">+{hiddenCount} MORE ALERTS</span>
            {critCount > 0 && <span className="text-[7px] font-data text-alert-critical">●{critCount} CRIT</span>}
            {highCount > 0 && <span className="text-[7px] font-data text-alert-high">●{highCount} HIGH</span>}
            <span className="text-[7px] font-data text-muted-foreground ml-auto">TAP TO EXPAND</span>
          </div>
        </button>
      )}

      {/* Collapse + dismiss controls when expanded */}
      {expanded && alerts.length > MAX_VISIBLE && (
        <div className="flex items-center gap-2 px-1">
          <button onClick={() => setExpanded(false)} className="text-[7px] font-data text-primary/60 hover:text-primary">▲ COLLAPSE</button>
          <button onClick={dismissAll} className="text-[7px] font-data text-alert-medium/60 hover:text-alert-medium ml-auto">✕ DISMISS ALL</button>
        </div>
      )}
    </div>
  );
});

TacticalAlerts.displayName = 'TacticalAlerts';
export default TacticalAlerts;
