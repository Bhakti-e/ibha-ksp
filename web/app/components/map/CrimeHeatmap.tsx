'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface CrimePoint {
  lat: number;
  lon: number;
  crime_type?: string;
  crimeno?: string;
  count?: number;
}

interface Props {
  points?: CrimePoint[];
  center?: [number, number];
  zoom?: number;
  height?: number;
}

function ResizeFix() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

export default function CrimeHeatmap({ points = [], center = [12.9716, 77.5946], zoom = 9, height = 420 }: Props) {
  const demoPoints: CrimePoint[] = points.length ? points : [
    { lat: 12.9695, lon: 77.7495, crime_type: 'Drug Case 31', crimeno: '104430002202600011', count: 3 },
    { lat: 12.9716, lon: 77.5946, crime_type: 'Theft cluster', count: 12 },
    { lat: 13.0827, lon: 77.6094, crime_type: 'Burglary', count: 5 },
    { lat: 12.9172, lon: 77.6101, crime_type: 'Robbery', count: 4 },
    { lat: 12.81, lon: 77.64, crime_type: 'Chain snatch', count: 3 },
  ];

  return (
    <div className="w-full rounded-xl overflow-hidden bg-[#0E0809] border border-navy-border/20" style={{ height }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }} 
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {demoPoints.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.lat, p.lon]}
            radius={Math.min(18, 6 + (p.count || 1) * 1.8)}
            pathOptions={{
              color: '#FEB226',
              fillColor: '#AD222F',
              fillOpacity: 0.7,
              weight: 1.5,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', lineHeight: '1.4' }}>
                <strong>{p.crimeno || p.crime_type}</strong><br />
                {p.crime_type}<br />
                Count: {p.count || 1}
              </div>
            </Popup>
          </CircleMarker>
        ))}
        <ResizeFix />
      </MapContainer>
    </div>
  );
}
