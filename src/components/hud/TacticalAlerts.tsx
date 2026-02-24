import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { useWorldViewStore } from '@/store/worldview';

interface TacticalAlert {
  id: string;
  type: 'earthquake' | 'military' | 'protest' | 'cyber' | 'fire' | 'weather';
  title: string;
  severity: 'critical' | 'high' | 'medium';
  timestamp: Date;
}

const SEVERITY_CONFIG = {
  critical: { border: 'border-alert-critical', dot: 'bg-alert-critical', text: 'text-alert-critical', bg: 'bg-alert-critical/5' },
  high: { border: 'border-alert-high', dot: 'bg-alert-high', text: 'text-alert-high', bg: 'bg-alert-high/5' },
  medium: { border: 'border-alert-medium', dot: 'bg-alert-medium', text: 'text-alert-medium', bg: 'bg-alert-medium/5' },
};

const TYPE_ICONS: Record<string, string> = {
  earthquake: '🌍', military: '⚔', protest: '✊', cyber: '🔒', fire: '🔥', weather: '⚠',
};

const TacticalAlerts = memo(() => {
  const { earthquakes, aircraft, protests, outages, fires } = useWorldViewStore();
  const [alerts, setAlerts] = useState<TacticalAlert[]>([]);
  const prevCountsRef = useRef({ eq: 0, mil: 0, protest: 0, cyber: 0, fire: 0 });
  const mountedRef = useRef(false);

  const addAlert = useCallback((alert: Omit<TacticalAlert, 'id' | 'timestamp'>) => {
    const newAlert: TacticalAlert = { ...alert, id: crypto.randomUUID(), timestamp: new Date() };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
    }, 8000);
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      // Skip first render — don't alert on initial data load
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

    // Check for new significant earthquakes
    if (earthquakes.length > prev.eq) {
      const newQuakes = earthquakes.slice(0, earthquakes.length - prev.eq);
      const bigQuake = newQuakes.find(q => q.magnitude >= 4.5);
      if (bigQuake) {
        addAlert({ type: 'earthquake', title: `M${bigQuake.magnitude.toFixed(1)} — ${bigQuake.place}`, severity: bigQuake.magnitude >= 6 ? 'critical' : 'high' });
      }
    }

    // New military aircraft detected
    if (milCount > prev.mil + 2) {
      addAlert({ type: 'military', title: `${milCount - prev.mil} NEW MIL AIRCRAFT DETECTED`, severity: 'high' });
    }

    // New protests
    if (protests.length > prev.protest) {
      addAlert({ type: 'protest', title: `NEW PROTEST ACTIVITY DETECTED`, severity: 'medium' });
    }

    // New cyber/outage events
    if (outages.length > prev.cyber) {
      const newOutage = outages[0];
      addAlert({ type: 'cyber', title: `CYBER: ${newOutage?.title?.substring(0, 50) || 'NEW EVENT'}`, severity: newOutage?.severity === 'critical' ? 'critical' : 'high' });
    }

    // New fires
    if (fires.length > prev.fire + 1) {
      addAlert({ type: 'fire', title: `${fires.length - prev.fire} NEW FIRE EVENTS`, severity: 'high' });
    }

    prevCountsRef.current = { eq: earthquakes.length, mil: milCount, protest: protests.length, cyber: outages.length, fire: fires.length };
  }, [earthquakes.length, aircraft.length, protests.length, outages.length, fires.length, addAlert]);

  if (alerts.length === 0) return null;

  return (
    <div className="absolute top-12 right-4 z-50 flex flex-col gap-1.5 pointer-events-auto" style={{ maxWidth: 320 }}>
      {alerts.map((alert) => {
        const cfg = SEVERITY_CONFIG[alert.severity];
        return (
          <div
            key={alert.id}
            className={`animate-slide-in-right glass-panel border-l-2 ${cfg.border} ${cfg.bg} px-3 py-2 rounded-r cursor-pointer hover:brightness-110 transition-all`}
            onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse-dot flex-shrink-0`} />
              <span className={`text-[9px] font-data tracking-[0.15em] ${cfg.text} font-bold`}>
                {TYPE_ICONS[alert.type]} {alert.severity.toUpperCase()}
              </span>
              <span className="text-[8px] font-data text-muted-foreground ml-auto">
                {alert.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <p className="text-[10px] font-display tracking-wider text-foreground mt-1 leading-tight">{alert.title}</p>
          </div>
        );
      })}
    </div>
  );
});

TacticalAlerts.displayName = 'TacticalAlerts';
export default TacticalAlerts;
