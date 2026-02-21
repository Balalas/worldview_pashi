import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useWorldViewStore } from '@/store/worldview';
import { CONFLICT_ZONES } from '@/components/map/GlobeContainer';

const MapContainer = memo(() => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Record<string, L.LayerGroup>>({});

  const { layers, aircraft, satellites, earthquakes, setDetailPanel, mapCenter } = useWorldViewStore();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 3,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    ['aircraft', 'satellites', 'earthquakes', 'conflicts'].forEach((key) => {
      layersRef.current[key] = L.layerGroup().addTo(map);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fly to region
  useEffect(() => {
    if (mapInstanceRef.current && mapCenter) {
      mapInstanceRef.current.flyTo([mapCenter.lat, mapCenter.lon], mapCenter.zoom, { duration: 1.5 });
    }
  }, [mapCenter]);

  // Render aircraft
  useEffect(() => {
    const group = layersRef.current['aircraft'];
    if (!group) return;
    group.clearLayers();
    if (!layers.aircraft || aircraft.length === 0) return;

    aircraft.forEach((ac) => {
      const isMil = ac.isMilitary;
      const color = isMil ? '#ff6b35' : '#00ff88';
      const size = isMil ? 10 : 7;

      const icon = L.divIcon({
        className: '',
        html: `<svg width="${size * 2}" height="${size * 2}" viewBox="0 0 24 24" style="transform: rotate(${ac.heading}deg); filter: drop-shadow(0 0 3px ${color}80);">
          <path d="M12 2L8 10H3L5 13H9L12 22L15 13H19L21 10H16L12 2Z" fill="${color}" fill-opacity="0.9" stroke="${color}" stroke-width="0.5"/>
        </svg>`,
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size],
      });

      const marker = L.marker([ac.lat, ac.lon], { icon })
        .on('click', () => setDetailPanel({ type: 'aircraft', data: ac }));
      group.addLayer(marker);
    });
  }, [aircraft, layers.aircraft, setDetailPanel]);

  // Render satellites
  useEffect(() => {
    const group = layersRef.current['satellites'];
    if (!group) return;
    group.clearLayers();
    if (!layers.satellites || satellites.length === 0) return;

    satellites.forEach((sat) => {
      const isISS = sat.name.includes('ISS');
      const isMil = sat.name.includes('COSMOS') || sat.name.includes('USA-');
      const color = isMil ? '#ff6b35' : isISS ? '#ff6600' : '#00d4ff';
      const size = isISS ? 8 : 5;

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:${size * 2}px;height:${size * 2}px;">
          <div style="position:absolute;inset:0;border:1px solid ${color};border-radius:50%;opacity:0.5;animation:ping-ring 3s ease-out infinite;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${size}px;height:${size}px;background:${color};border-radius:50%;box-shadow:0 0 6px ${color};"></div>
        </div>`,
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size],
      });

      const marker = L.marker([sat.lat, sat.lon], { icon })
        .on('click', () => setDetailPanel({ type: 'satellite', data: sat }));

      if (isISS) {
        marker.bindTooltip('ISS ●LIVE', {
          permanent: true,
          direction: 'right',
          offset: [10, 0],
          className: 'iss-label',
        });
      }

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

      const circle = L.circleMarker([eq.lat, eq.lon], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.3,
        weight: 1.5,
      }).on('click', () => setDetailPanel({ type: 'earthquake', data: eq }));

      if (eq.magnitude >= 4.0) {
        const pulseIcon = L.divIcon({
          className: '',
          html: `<div style="width:${radius * 4}px;height:${radius * 4}px;border:1.5px solid ${color};border-radius:50%;animation:ping-ring 2s ease-out infinite;opacity:0.5;"></div>`,
          iconSize: [radius * 4, radius * 4],
          iconAnchor: [radius * 2, radius * 2],
        });
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

      // Outer glow
      const outerCircle = L.circleMarker([cz.lat, cz.lon], {
        radius: radius * 2,
        color,
        fillColor: color,
        fillOpacity: 0.08,
        weight: 0.5,
        interactive: false,
      });

      // Inner marker
      const innerCircle = L.circleMarker([cz.lat, cz.lon], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.25,
        weight: 1.5,
      });

      innerCircle.bindTooltip(`⚔ ${cz.name} [${cz.intensity}/10]`, {
        direction: 'top',
        offset: [0, -10],
      });

      // Pulsing ring
      const pulseIcon = L.divIcon({
        className: '',
        html: `<div style="width:${radius * 4}px;height:${radius * 4}px;border:1.5px solid ${color};border-radius:50%;animation:ping-ring 3s ease-out infinite;opacity:0.4;"></div>`,
        iconSize: [radius * 4, radius * 4],
        iconAnchor: [radius * 2, radius * 2],
      });

      group.addLayer(outerCircle);
      group.addLayer(L.marker([cz.lat, cz.lon], { icon: pulseIcon, interactive: false }));
      group.addLayer(innerCircle);
    });
  }, [layers.conflicts]);

  return <div ref={mapRef} className="w-full h-full" />;
});

MapContainer.displayName = 'MapContainer';
export default MapContainer;
