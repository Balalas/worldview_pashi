import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWorldViewStore, NUCLEAR_SITES } from '@/store/worldview';
import { CONFLICT_ZONES } from '@/data/conflictZones';
import { SUBMARINE_CABLES } from '@/data/submarineCables';
import { PUBLIC_CAMERAS } from '@/data/publicCameras';
import { COUNTRY_META } from '@/data/countryMeta';
import * as topojson from 'topojson-client';

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

const MapContainer = memo(() => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Record<string, L.LayerGroup>>({});
  const geoLayerRef = useRef<L.GeoJSON | null>(null);

  const { layers, aircraft, satellites, earthquakes, weatherAlerts, volcanoes, vessels, protests, outages, fires, setDetailPanel, setActiveLivestream, mapCenter } = useWorldViewStore();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [20, 0], zoom: 3, zoomControl: false, attributionControl: true, preferCanvas: true,
      doubleClickZoom: false,
      maxBoundsViscosity: 1.0,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    ['aircraft', 'satellites', 'earthquakes', 'conflicts', 'cables', 'weather', 'volcanoes', 'nuclear', 'vessels', 'protests', 'outages', 'cameras', 'fires'].forEach((key) => {
      layersRef.current[key] = L.layerGroup().addTo(map);
    });

    // Load country boundaries
    fetch(WORLD_TOPO_URL)
      .then(r => r.json())
      .then(topo => {
        const geojson = topojson.feature(topo, topo.objects.countries) as any;
        const geoLayer = L.geoJSON(geojson, {
          style: () => ({
            fillColor: 'transparent',
            fillOpacity: 0,
            color: 'hsl(var(--primary))',
            weight: 0.4,
            opacity: 0.3,
          }),
          onEachFeature: (feature, layer) => {
            const numericId = String(feature.id || feature.properties?.id);
            const meta = COUNTRY_META[numericId];
            const countryName = meta?.name || feature.properties?.name || 'Unknown';
            const flag = meta?.flag || '🏳';
            const code = meta?.code || 'XX';

            layer.on({
              mouseover: (e) => {
                const l = e.target;
                l.setStyle({
                  fillColor: 'hsl(var(--primary))',
                  fillOpacity: 0.15,
                  weight: 1.5,
                  opacity: 0.7,
                });
                l.bringToFront();
              },
              mouseout: (e) => {
                geoLayer.resetStyle(e.target);
              },
              click: () => {
                // Gather news for this country
                const state = useWorldViewStore.getState();
                const countryNews = state.news.filter(n => {
                  const t = n.title.toLowerCase();
                  return t.includes(countryName.toLowerCase()) || t.includes(code.toLowerCase());
                });

                // Gather cameras for this country
                const countryCameras = PUBLIC_CAMERAS.filter(c => c.country === code);

                // Gather earthquakes
                const countryQuakes = state.earthquakes.filter(eq => {
                  const place = (eq.place || '').toLowerCase();
                  return place.includes(countryName.toLowerCase());
                });

                // Gather protests
                const countryProtests = state.protests.filter(p =>
                  p.country.toLowerCase().includes(countryName.toLowerCase()) ||
                  p.country === code
                );

                setDetailPanel({
                  type: 'country',
                  data: {
                    name: countryName,
                    flag,
                    code,
                    news: countryNews.slice(0, 20),
                    cameras: countryCameras.slice(0, 10),
                    earthquakes: countryQuakes.slice(0, 5),
                    protests: countryProtests.slice(0, 5),
                    newsCount: countryNews.length,
                    cameraCount: countryCameras.length,
                  },
                });
              },
            });

            layer.bindTooltip(`${flag} ${countryName}`, {
              sticky: true,
              className: 'country-tooltip',
              direction: 'top',
              offset: [0, -10],
            });
          },
        }).addTo(map);
        geoLayerRef.current = geoLayer;
      })
      .catch(err => console.warn('Failed to load country boundaries:', err));

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [setDetailPanel]);

  useEffect(() => {
    if (mapInstanceRef.current && mapCenter) {
      mapInstanceRef.current.flyTo([mapCenter.lat, mapCenter.lon], mapCenter.zoom, { duration: 1.5 });
    }
  }, [mapCenter]);

  // Render cameras
  useEffect(() => {
    const group = layersRef.current['cameras'];
    if (!group) return;
    group.clearLayers();
    if (!layers.cameras) return;

    PUBLIC_CAMERAS.forEach(cam => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:16px;height:16px;">
          <div style="position:absolute;inset:0;border:1.5px solid #fbbf24;border-radius:50%;background:#fbbf2420;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;">📹</div>
          ${cam.official ? '<div style="position:absolute;top:-6px;right:-8px;font-size:5px;background:#fbbf24;color:#000;padding:0 2px;border-radius:2px;font-weight:bold;">DOT</div>' : ''}
        </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([cam.lat, cam.lon], { icon })
        .on('click', () => {
          setDetailPanel({ type: 'camera', data: cam });
          setActiveLivestream(cam.feedType === 'snapshot' ? (cam.snapshotUrl || 'snapshot') : cam.embedUrl);
        });
      marker.bindTooltip(`📹 ${cam.name} | ${cam.city}`, { direction: 'top', offset: [0, -10] });
      group.addLayer(marker);
    });
  }, [layers.cameras, setDetailPanel, setActiveLivestream]);

  // Render fires
  useEffect(() => {
    const group = layersRef.current['fires'];
    if (!group) return;
    group.clearLayers();
    if (!layers.fires || fires.length === 0) return;

    fires.forEach(f => {
      const icons: Record<string, string> = { wildfire: '🔥', volcano: '🌋', storm: '🌀', flood: '🌊', earthquake: '💥', drought: '☀️', landslide: '⛰️', other: '⚠️' };
      const colors: Record<string, string> = { wildfire: '#ff4400', volcano: '#ff0044', storm: '#00d4ff', flood: '#4488ff', earthquake: '#ff6600', drought: '#ffb000', landslide: '#aa6633', other: '#ff6b35' };
      const color = colors[f.category] || '#ff4400';
      const emoji = icons[f.category] || '🔥';

      const icon = L.divIcon({
        className: '',
        html: `<div style="font-size:12px;filter:drop-shadow(0 0 4px ${color});">${emoji}</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const marker = L.marker([f.lat, f.lon], { icon })
        .on('click', () => setDetailPanel({ type: 'fire', data: f }));
      marker.bindTooltip(`${emoji} ${f.title.substring(0, 40)}`, { direction: 'top' });
      group.addLayer(marker);
    });
  }, [fires, layers.fires, setDetailPanel]);

  // Render submarine cables
  useEffect(() => {
    const group = layersRef.current['cables'];
    if (!group) return;
    group.clearLayers();
    if (!layers.underseaCables) return;
    SUBMARINE_CABLES.forEach((cable) => {
      const latlngs = cable.coordinates.map(([lat, lon]) => [lat, lon] as [number, number]);
      const polyline = L.polyline(latlngs, { color: cable.color, weight: 1.5, opacity: 0.6, dashArray: '6,4' });
      polyline.bindTooltip(`🔌 ${cable.name} | ${cable.capacity} | ${cable.length}`, { sticky: true });
      polyline.on('click', () => setDetailPanel({ type: 'cable', data: cable }));
      group.addLayer(polyline);
    });
  }, [layers.underseaCables, setDetailPanel]);

  // Render vessels
  useEffect(() => {
    const group = layersRef.current['vessels'];
    if (!group) return;
    group.clearLayers();
    if (!layers.vessels || vessels.length === 0) return;

    vessels.forEach((v) => {
      const colors: Record<string, string> = { yacht: '#FFD700', cargo: '#4488ff', tanker: '#ff8800', military: '#ff0044', fishing: '#44ff88', passenger: '#ff44ff', container: '#00aaff' };
      const color = colors[v.type] || '#4488ff';
      const isYacht = v.type === 'yacht';
      const isMil = v.type === 'military';
      const size = isYacht ? 8 : isMil ? 9 : 6;

      const icon = L.divIcon({
        className: '',
        html: `<svg width="${size * 2}" height="${size * 2}" viewBox="0 0 24 24" style="transform: rotate(${v.heading}deg); filter: drop-shadow(0 0 3px ${color}80);">
          <path d="M12 2L6 18H18L12 2Z" fill="${color}" fill-opacity="0.85" stroke="${color}" stroke-width="0.5"/>
          <path d="M6 18Q12 22 18 18Z" fill="${color}" fill-opacity="0.5"/>
        </svg>`,
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size],
      });

      const marker = L.marker([v.lat, v.lon], { icon })
        .on('click', () => setDetailPanel({ type: 'vessel', data: v }));
      marker.bindTooltip(`${isYacht ? '🛥' : isMil ? '⚓' : '🚢'} ${v.name} | ${v.flag} | ${v.speedKnots}kts${v.destination ? ' → ' + v.destination : ''}`, { direction: 'top', offset: [0, -10] });
      group.addLayer(marker);
    });
  }, [vessels, layers.vessels, setDetailPanel]);

  // Render protests
  useEffect(() => {
    const group = layersRef.current['protests'];
    if (!group) return;
    group.clearLayers();
    if (!layers.protests || protests.length === 0) return;

    protests.forEach((p) => {
      const color = p.intensity === 'large' ? '#ff0088' : p.intensity === 'medium' ? '#ff44aa' : '#ff88cc';
      const size = p.intensity === 'large' ? 20 : p.intensity === 'medium' ? 14 : 10;

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:${size}px;height:${size}px;">
          <div style="position:absolute;inset:0;border:1.5px solid ${color};border-radius:50%;animation:ping-ring 2s ease-out infinite;opacity:0.5;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:${size * 0.7}px;">✊</div>
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([p.lat, p.lon], { icon })
        .on('click', () => setDetailPanel({ type: 'protest', data: p }));
      marker.bindTooltip(`✊ ${p.country} | ${p.intensity.toUpperCase()} | ${p.title.slice(0, 60)}...`, { direction: 'top', offset: [0, -10] });
      group.addLayer(marker);
    });
  }, [protests, layers.protests, setDetailPanel]);

  // Render outages
  useEffect(() => {
    const group = layersRef.current['outages'];
    if (!group) return;
    group.clearLayers();
    if (!layers.outages || outages.length === 0) return;

    outages.forEach((o) => {
      const typeIcons: Record<string, string> = { internet: '🌐', power: '⚡', cyber: '🔒', telecom: '📡', ddos: '💀', ransomware: '🔐' };
      const color = o.severity === 'critical' ? '#ff0044' : o.severity === 'major' ? '#ff6b35' : '#ffb000';

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:18px;height:18px;">
          <div style="position:absolute;inset:0;background:${color}20;border:1px solid ${color}60;border-radius:4px;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:11px;">${typeIcons[o.type] || '⚠'}</div>
        </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([o.lat, o.lon], { icon })
        .on('click', () => setDetailPanel({ type: 'outage', data: o }));
      marker.bindTooltip(`${typeIcons[o.type] || '⚠'} ${o.type.toUpperCase()} | ${o.severity} | ${o.title.slice(0, 60)}...`, { direction: 'top' });
      group.addLayer(marker);
    });
  }, [outages, layers.outages, setDetailPanel]);

  // Render aircraft
  useEffect(() => {
    const group = layersRef.current['aircraft'];
    if (!group) return;
    group.clearLayers();
    if (!layers.aircraft || aircraft.length === 0) return;
    aircraft.forEach((ac) => {
      if (!layers.militaryFlights && ac.isMilitary) return;
      const color = ac.isMilitary ? '#ff6b35' : '#00ff88';
      const size = ac.isMilitary ? 10 : 7;
      const icon = L.divIcon({
        className: '',
        html: `<svg width="${size * 2}" height="${size * 2}" viewBox="0 0 24 24" style="transform: rotate(${ac.heading}deg); filter: drop-shadow(0 0 3px ${color}80);"><path d="M12 2L8 10H3L5 13H9L12 22L15 13H19L21 10H16L12 2Z" fill="${color}" fill-opacity="0.9" stroke="${color}" stroke-width="0.5"/></svg>`,
        iconSize: [size * 2, size * 2], iconAnchor: [size, size],
      });
      const marker = L.marker([ac.lat, ac.lon], { icon }).on('click', () => setDetailPanel({ type: 'aircraft', data: ac }));
      marker.bindTooltip(`${ac.callsign} | FL${Math.round(ac.altitudeFt / 100)} | ${ac.speedKts}kts`, { direction: 'top', offset: [0, -10] });
      group.addLayer(marker);
    });
  }, [aircraft, layers.aircraft, layers.militaryFlights, setDetailPanel]);

  // Render satellites
  useEffect(() => {
    const group = layersRef.current['satellites'];
    if (!group) return;
    group.clearLayers();
    if (!layers.satellites || satellites.length === 0) return;
    satellites.forEach((sat) => {
      const isISS = sat.name.includes('ISS');
      const isMil = sat.name.includes('COSMOS') || sat.name.includes('USA-') || sat.name.includes('MUOS') || sat.name.includes('NROL');
      const isGPS = sat.name.includes('GPS');
      const color = isMil ? '#ff6b35' : isISS ? '#ff6600' : isGPS ? '#ffdd00' : '#00d4ff';
      const size = isISS ? 8 : 5;
      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:${size * 2}px;height:${size * 2}px;"><div style="position:absolute;inset:0;border:1px solid ${color};border-radius:50%;opacity:0.5;animation:ping-ring 3s ease-out infinite;"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size}px;height:${size}px;background:${color};border-radius:50%;box-shadow:0 0 6px ${color};"></div></div>`,
        iconSize: [size * 2, size * 2], iconAnchor: [size, size],
      });
      const marker = L.marker([sat.lat, sat.lon], { icon }).on('click', () => setDetailPanel({ type: 'satellite', data: sat }));
      if (isISS) marker.bindTooltip('ISS ●LIVE', { permanent: true, direction: 'right', offset: [10, 0], className: 'iss-label' });
      group.addLayer(marker);
    });
  }, [satellites, layers.satellites, setDetailPanel]);

  // Render earthquakes
  useEffect(() => {
    const group = layersRef.current['earthquakes'];
    if (!group) return;
    group.clearLayers();
    if (!layers.earthquakes || earthquakes.length === 0) return;
    earthquakes.forEach((eq) => {
      const radius = Math.pow(eq.magnitude, 1.5) * 3;
      const color = eq.magnitude >= 6 ? '#ff0044' : eq.magnitude >= 4.5 ? '#ff6600' : '#aa44ff';
      const circle = L.circleMarker([eq.lat, eq.lon], { radius, color, fillColor: color, fillOpacity: 0.3, weight: 1.5 }).on('click', () => setDetailPanel({ type: 'earthquake', data: eq }));
      if (eq.magnitude >= 4.0) {
        const pulseIcon = L.divIcon({ className: '', html: `<div style="width:${radius * 4}px;height:${radius * 4}px;border:1.5px solid ${color};border-radius:50%;animation:ping-ring 2s ease-out infinite;opacity:0.5;"></div>`, iconSize: [radius * 4, radius * 4], iconAnchor: [radius * 2, radius * 2] });
        group.addLayer(L.marker([eq.lat, eq.lon], { icon: pulseIcon, interactive: false }));
      }
      group.addLayer(circle);
    });
  }, [earthquakes, layers.earthquakes, setDetailPanel]);

  // Render conflict zones
  useEffect(() => {
    const group = layersRef.current['conflicts'];
    if (!group) return;
    group.clearLayers();
    if (!layers.conflicts) return;
    CONFLICT_ZONES.forEach((cz) => {
      const color = cz.intensity >= 8 ? '#ff0044' : cz.intensity >= 6 ? '#ff6b35' : '#ffb000';
      const radius = cz.intensity * 3;
      group.addLayer(L.circleMarker([cz.lat, cz.lon], { radius: radius * 2, color, fillColor: color, fillOpacity: 0.08, weight: 0.5, interactive: false }));
      const inner = L.circleMarker([cz.lat, cz.lon], { radius, color, fillColor: color, fillOpacity: 0.25, weight: 1.5 });
      inner.bindTooltip(`⚔ ${cz.name} [${cz.intensity}/10]`, { direction: 'top', offset: [0, -10] });
      const pulseIcon = L.divIcon({ className: '', html: `<div style="width:${radius * 4}px;height:${radius * 4}px;border:1.5px solid ${color};border-radius:50%;animation:ping-ring 3s ease-out infinite;opacity:0.4;"></div>`, iconSize: [radius * 4, radius * 4], iconAnchor: [radius * 2, radius * 2] });
      group.addLayer(L.marker([cz.lat, cz.lon], { icon: pulseIcon, interactive: false }));
      group.addLayer(inner);
    });
  }, [layers.conflicts]);

  // Render weather
  useEffect(() => {
    const group = layersRef.current['weather'];
    if (!group) return;
    group.clearLayers();
    if (!layers.weather || weatherAlerts.length === 0) return;
    weatherAlerts.forEach((w) => {
      const color = w.isExtreme ? '#ff0044' : w.temp > 35 ? '#ff6b35' : w.temp < 0 ? '#00d4ff' : '#ffb000';
      const icon = L.divIcon({ className: '', html: `<div style="background:${color}20;border:1px solid ${color}60;border-radius:4px;padding:2px 4px;font-size:9px;font-family:monospace;color:${color};white-space:nowrap;">${Math.round(w.temp)}°C</div>`, iconSize: [40, 16], iconAnchor: [20, 8] });
      const marker = L.marker([w.lat, w.lon], { icon });
      marker.bindTooltip(`🌤 ${w.city}: ${w.description} | ${w.temp}°C | Wind: ${w.windSpeed}km/h`, { direction: 'top' });
      marker.on('click', () => setDetailPanel({ type: 'weather', data: w }));
      group.addLayer(marker);
    });
  }, [weatherAlerts, layers.weather, setDetailPanel]);

  // Render volcanoes
  useEffect(() => {
    const group = layersRef.current['volcanoes'];
    if (!group) return;
    group.clearLayers();
    if (!layers.volcanoes || volcanoes.length === 0) return;
    volcanoes.forEach((v) => {
      const color = v.status === 'erupting' ? '#ff0044' : v.status === 'warning' ? '#ff6b35' : '#ffb000';
      const icon = L.divIcon({ className: '', html: `<div style="font-size:14px;filter:drop-shadow(0 0 4px ${color});">🌋</div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
      const marker = L.marker([v.lat, v.lon], { icon });
      marker.bindTooltip(`🌋 ${v.name} | ${v.status.toUpperCase()} | ${v.elevation}m | ${v.country}`, { direction: 'top' });
      marker.on('click', () => setDetailPanel({ type: 'volcano', data: v }));
      group.addLayer(marker);
    });
  }, [volcanoes, layers.volcanoes, setDetailPanel]);

  // Render nuclear sites
  useEffect(() => {
    const group = layersRef.current['nuclear'];
    if (!group) return;
    group.clearLayers();
    if (!layers.nuclearSites) return;
    NUCLEAR_SITES.forEach((site) => {
      const icon = L.divIcon({ className: '', html: `<div style="font-size:12px;filter:drop-shadow(0 0 4px #bbff00);">☢️</div>`, iconSize: [16, 16], iconAnchor: [8, 8] });
      const marker = L.marker([site.lat, site.lon], { icon });
      marker.bindTooltip(`☢️ ${site.name} | ${site.type.toUpperCase()} | ${site.country}`, { direction: 'top' });
      group.addLayer(marker);
    });
  }, [layers.nuclearSites]);

  return <div ref={mapRef} className="w-full h-full" />;
});

MapContainer.displayName = 'MapContainer';
export default MapContainer;
