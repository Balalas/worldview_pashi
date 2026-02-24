import { useEffect, useRef, memo, useCallback } from 'react';
import GlobeGL from 'react-globe.gl';
import { useWorldViewStore } from '@/store/worldview';
import { SUBMARINE_CABLES } from '@/data/submarineCables';

const GlobeContainer = memo(() => {
  const globeRef = useRef<any>(null);
  const { layers, aircraft, satellites, earthquakes, volcanoes, setDetailPanel, mapCenter } = useWorldViewStore();

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) { controls.autoRotate = true; controls.autoRotateSpeed = 0.3; controls.enableDamping = true; }
    }
  }, []);

  useEffect(() => {
    if (globeRef.current && mapCenter) {
      globeRef.current.pointOfView({
        lat: mapCenter.lat, lng: mapCenter.lon,
        altitude: mapCenter.zoom ? Math.max(0.5, 4 - mapCenter.zoom * 0.3) : 2,
      }, 1000);
    }
  }, [mapCenter]);

  // Build points data
  const pointsData: any[] = [];

  if (layers.aircraft) {
    aircraft.forEach((ac) => {
      if (!layers.militaryFlights && ac.isMilitary) return;
      pointsData.push({ lat: ac.lat, lng: ac.lon, size: ac.isMilitary ? 0.4 : 0.2,
        color: ac.isMilitary ? '#ff6b35' : '#00ff88',
        label: `${ac.callsign} | ${ac.country} | FL${Math.round(ac.altitudeFt / 100)}`,
        type: 'aircraft', data: ac });
    });
  }

  if (layers.satellites) {
    satellites.forEach((sat) => {
      const isMil = sat.name.includes('COSMOS') || sat.name.includes('USA-') || sat.name.includes('MUOS');
      const isISS = sat.name.includes('ISS');
      pointsData.push({ lat: sat.lat, lng: sat.lon, size: isISS ? 0.6 : 0.3,
        color: isMil ? '#ff6b35' : isISS ? '#ff6600' : '#00d4ff',
        label: `${sat.name} | ${Math.round(sat.alt)}km | ${sat.velocity.toFixed(2)}km/s`,
        type: 'satellite', data: sat });
    });
  }

  if (layers.earthquakes) {
    earthquakes.forEach((eq) => {
      pointsData.push({ lat: eq.lat, lng: eq.lon, size: Math.pow(eq.magnitude, 1.2) * 0.15,
        color: eq.magnitude >= 6 ? '#ff0044' : eq.magnitude >= 4.5 ? '#ff6600' : '#aa44ff',
        label: `M${eq.magnitude} | ${eq.place}`, type: 'earthquake', data: eq });
    });
  }

  if (layers.volcanoes) {
    volcanoes.forEach((v) => {
      pointsData.push({ lat: v.lat, lng: v.lon, size: 0.4,
        color: v.status === 'erupting' ? '#ff0044' : v.status === 'warning' ? '#ff6b35' : '#ffb000',
        label: `🌋 ${v.name} | ${v.status} | ${v.country}`, type: 'volcano', data: v });
    });
  }

  // Conflict + cable rings/arcs
  const ringsData = layers.conflicts ? CONFLICT_ZONES.map((cz) => ({
    lat: cz.lat, lng: cz.lon, maxR: cz.intensity * 2, propagationSpeed: 1,
    repeatPeriod: 800 + Math.random() * 400,
    color: () => cz.intensity > 7 ? 'rgba(255,0,68,0.6)' : 'rgba(255,107,53,0.4)',
    label: cz.name,
  })) : [];

  // Submarine cables as arcs
  const arcsData = layers.underseaCables ? SUBMARINE_CABLES.flatMap((cable) => {
    const arcs = [];
    for (let i = 0; i < cable.coordinates.length - 1; i++) {
      arcs.push({
        startLat: cable.coordinates[i][0], startLng: cable.coordinates[i][1],
        endLat: cable.coordinates[i + 1][0], endLng: cable.coordinates[i + 1][1],
        color: cable.color, label: cable.name,
      });
    }
    return arcs;
  }) : [];

  const handlePointClick = useCallback((point: any) => {
    if (point.type) setDetailPanel({ type: point.type, data: point.data });
  }, [setDetailPanel]);

  return (
    <div className="w-full h-full bg-background">
      <GlobeGL
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#00ff88"
        atmosphereAltitude={0.15}
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={(d: any) => d.type === 'satellite' ? 0.02 : 0.005}
        pointRadius="size"
        pointColor="color"
        pointLabel="label"
        onPointClick={handlePointClick}
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        ringColor="color"
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcLabel="label"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2000}
        arcStroke={0.5}
        animateIn={true}
        width={typeof window !== 'undefined' ? window.innerWidth * 0.6 : 800}
        height={typeof window !== 'undefined' ? window.innerHeight * 0.6 : 600}
      />
    </div>
  );
});

// Conflict zone data
export const CONFLICT_ZONES = [
  { name: 'Ukraine – Eastern Front', lat: 48.5, lon: 37.5, intensity: 9, type: 'war' },
  { name: 'Gaza Strip', lat: 31.35, lon: 34.31, intensity: 10, type: 'war' },
  { name: 'West Bank', lat: 31.95, lon: 35.20, intensity: 7, type: 'conflict' },
  { name: 'Sudan – Khartoum', lat: 15.50, lon: 32.56, intensity: 8, type: 'war' },
  { name: 'Sudan – Darfur', lat: 13.0, lon: 25.0, intensity: 8, type: 'war' },
  { name: 'Yemen – Houthi', lat: 15.35, lon: 44.20, intensity: 7, type: 'conflict' },
  { name: 'Myanmar – Shan State', lat: 21.0, lon: 97.0, intensity: 7, type: 'civil_war' },
  { name: 'Myanmar – Rakhine', lat: 20.1, lon: 93.2, intensity: 6, type: 'civil_war' },
  { name: 'Somalia – Al-Shabaab', lat: 2.0, lon: 45.3, intensity: 6, type: 'insurgency' },
  { name: 'Syria – Idlib', lat: 35.9, lon: 36.6, intensity: 5, type: 'conflict' },
  { name: 'DR Congo – M23', lat: -1.5, lon: 29.0, intensity: 7, type: 'conflict' },
  { name: 'Haiti – Port-au-Prince', lat: 18.54, lon: -72.34, intensity: 5, type: 'gang_violence' },
  { name: 'Sahel – Burkina Faso', lat: 12.3, lon: -1.5, intensity: 6, type: 'insurgency' },
  { name: 'Ethiopia – Amhara', lat: 11.5, lon: 38.5, intensity: 5, type: 'conflict' },
  { name: 'Taiwan Strait', lat: 24.5, lon: 119.5, intensity: 3, type: 'tension' },
  { name: 'South China Sea', lat: 15.0, lon: 115.0, intensity: 3, type: 'tension' },
  { name: 'Lebanon – South', lat: 33.3, lon: 35.5, intensity: 6, type: 'conflict' },
  { name: 'Libya – Tripoli', lat: 32.9, lon: 13.1, intensity: 4, type: 'instability' },
  { name: 'Mali – North', lat: 17.0, lon: -2.0, intensity: 5, type: 'insurgency' },
  { name: 'Pakistan – Balochistan', lat: 28.5, lon: 65.0, intensity: 4, type: 'insurgency' },
];

GlobeContainer.displayName = 'GlobeContainer';
export default GlobeContainer;
