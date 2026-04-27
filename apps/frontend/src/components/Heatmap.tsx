"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from 'next-themes';

// Import leaflet.heat dynamically or via side-effect
if (typeof window !== 'undefined') {
  require('leaflet.heat');
}

interface Task {
  _id: string;
  category: string;
  urgencyScore: number;
  location: {
    coordinates: [number, number];
  };
}

interface HeatmapProps {
  tasks: Task[];
  centerLocation?: [number, number] | null;
}

const LeafletHeatmap: React.FC<HeatmapProps> = ({ tasks, centerLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const heatmapLayerRef = useRef<any>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || leafletMap.current) return;

    // Initialize the map without attribution control
    leafletMap.current = L.map(mapRef.current, { attributionControl: false }).setView([12.9716, 77.5946], 12);

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  useEffect(() => {
    if (!leafletMap.current) return;

    const themeTiles = resolvedTheme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    // Remove existing tile layers
    leafletMap.current.eachLayer((layer: any) => {
      if (layer._url) leafletMap.current?.removeLayer(layer);
    });

    L.tileLayer(themeTiles).addTo(leafletMap.current);

  }, [resolvedTheme]);

  useEffect(() => {
    if (leafletMap.current && centerLocation) {
      leafletMap.current.flyTo(centerLocation, 16, { duration: 1.5 });
    }
  }, [centerLocation]);

  useEffect(() => {
    if (!leafletMap.current || tasks.length === 0) return;

    // Remove only the previous heatmap layer
    if (heatmapLayerRef.current) {
      leafletMap.current.removeLayer(heatmapLayerRef.current);
    }

    const heatData = tasks.map(task => [
      task.location.coordinates[1],
      task.location.coordinates[0],
      task.urgencyScore / 5
    ]);

    // @ts-ignore
    heatmapLayerRef.current = L.heatLayer(heatData, {
      radius: 50,
      blur: 25,
      maxZoom: 17,
      max: 0.6,
      minOpacity: 0.4,
      gradient: {
        0.1: 'blue',
        0.3: 'cyan',
        0.5: 'lime',
        0.7: 'yellow',
        1.0: 'red'
      }
    }).addTo(leafletMap.current);

  }, [tasks]);

  useEffect(() => {
    if (!leafletMap.current) return;

    let hasCentered = false;

    // Google Maps Style CSS
    const gmapStyle = document.createElement('style');
    gmapStyle.innerHTML = `
      .gmap-blue-dot {
        width: 14px;
        height: 14px;
        background: #4285F4;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 5px rgba(0,0,0,0.3);
      }
      .gmap-pulse {
        width: 14px;
        height: 14px;
        background: #4285F4;
        border-radius: 50%;
        position: absolute;
        top: 0; left: 0;
        animation: gmap-ripple 2.5s infinite;
        opacity: 0.4;
      }
      @keyframes gmap-ripple {
        0% { transform: scale(1); opacity: 0.4; }
        100% { transform: scale(4); opacity: 0; }
      }
    `;
    document.head.appendChild(gmapStyle);

    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const latLng: L.LatLngExpression = [latitude, longitude];

        if (userLocationMarkerRef.current) {
          userLocationMarkerRef.current.setLatLng(latLng);
          accuracyCircleRef.current?.setLatLng(latLng).setRadius(accuracy);
        } else {
          // Accuracy halo
          accuracyCircleRef.current = L.circle(latLng, {
            radius: accuracy,
            weight: 1,
            color: '#4285F4',
            fillColor: '#4285F4',
            fillOpacity: 0.15
          }).addTo(leafletMap.current!);

          // Blue dot with ripple
          const userIcon = L.divIcon({
            className: 'relative',
            html: '<div class="gmap-pulse"></div><div class="gmap-blue-dot"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          userLocationMarkerRef.current = L.marker(latLng, { icon: userIcon, zIndexOffset: 1000 }).addTo(leafletMap.current!);
        }

        if (!hasCentered) {
          leafletMap.current?.flyTo(latLng, 15, { duration: 2 });
          hasCentered = true;
        }
      },
      (err) => console.warn("Geolocation error:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      userLocationMarkerRef.current?.remove();
      userLocationMarkerRef.current = null;
      accuracyCircleRef.current?.remove();
      accuracyCircleRef.current = null;
      gmapStyle.remove();
    };
  }, []);

  const centerOnUser = () => {
    if (userLocationMarkerRef.current) {
      const latLng = userLocationMarkerRef.current.getLatLng();
      leafletMap.current?.flyTo(latLng, 15, { duration: 1.5 });
    } else {
      // Fallback if marker isn't ready
      navigator.geolocation.getCurrentPosition((pos) => {
        leafletMap.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 15);
      });
    }
  };

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-border shadow-sm z-0">
      <div ref={mapRef} className="absolute inset-0 h-full w-full" />
      
      {/* Legend & Controls */}
      <div className="absolute top-4 right-4 bg-card p-4 rounded-lg shadow-xl border border-border z-[1000] min-w-[160px] flex flex-col gap-4 transition-colors duration-300">
        <div>
          <div className="flex justify-between mb-2 px-0.5">
            {[1, 2, 3, 4, 5].map(num => (
              <span key={num} className="text-[9px] font-black text-muted-foreground">{num}</span>
            ))}
          </div>
          <div className="flex gap-1">
            <div className="flex-1 h-2 rounded-[1px] bg-urgency-1" />
            <div className="flex-1 h-2 rounded-[1px] bg-urgency-2" />
            <div className="flex-1 h-2 rounded-[1px] bg-urgency-3" />
            <div className="flex-1 h-2 rounded-[1px] bg-urgency-4" />
            <div className="flex-1 h-2 rounded-[1px] bg-urgency-5" />
          </div>
        </div>

        <button 
          onClick={centerOnUser}
          className="w-full py-2 bg-muted hover:bg-muted/80 text-[8px] font-black uppercase tracking-widest text-foreground rounded transition-colors flex items-center justify-center gap-2 border border-border"
        >
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          Center on Me
        </button>
      </div>
    </div>
  );
};

export default LeafletHeatmap;
