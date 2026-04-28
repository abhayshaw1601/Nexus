"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import leaflet.heat dynamically
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
  status: string;
}

interface VolunteerMapProps {
  isOnDuty: boolean;
  tasks?: Task[];
  centerLocation?: [number, number] | null;
}

export default function VolunteerMap({ isOnDuty, tasks = [], centerLocation }: VolunteerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const heatmapLayerRef = useRef<any>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current, { attributionControl: false }).setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(leafletMap.current);

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  // Handle center location changes (from "Locate" button clicks)
  useEffect(() => {
    if (leafletMap.current && centerLocation) {
      leafletMap.current.flyTo(centerLocation, 16, { duration: 1.5 });
    }
  }, [centerLocation]);

  // Update heatmap when tasks change
  useEffect(() => {
    if (!leafletMap.current || tasks.length === 0) {
      // Remove heatmap if no tasks
      if (heatmapLayerRef.current) {
        leafletMap.current?.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
      return;
    }

    // Remove previous heatmap layer
    if (heatmapLayerRef.current) {
      leafletMap.current.removeLayer(heatmapLayerRef.current);
    }

    // Create heatmap data from tasks
    const heatData = tasks.map(task => [
      task.location.coordinates[1], // latitude
      task.location.coordinates[0], // longitude
      task.urgencyScore / 5 // intensity (normalized to 0-1)
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

  // Track volunteer location when on-duty
  useEffect(() => {
    if (!leafletMap.current) return;

    let hasCentered = false;

    // Google Maps Style CSS for blue dot
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

    if (!isOnDuty || typeof navigator === 'undefined' || !navigator.geolocation) {
      // Remove markers if off-duty
      userLocationMarkerRef.current?.remove();
      userLocationMarkerRef.current = null;
      accuracyCircleRef.current?.remove();
      accuracyCircleRef.current = null;
      return;
    }

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
  }, [isOnDuty]);

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
      {isOnDuty && (
        <div className="absolute top-4 right-4 bg-card p-4 rounded-lg shadow-xl border border-border z-[1000] min-w-[160px] flex flex-col gap-4 transition-colors duration-300">
          {/* Urgency Legend - only show if there are tasks */}
          {tasks.length > 0 && (
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
          )}

          {/* Center on Me Button */}
          <button 
            onClick={centerOnUser}
            className="w-full py-2 bg-muted hover:bg-muted/80 text-[8px] font-black uppercase tracking-widest text-foreground rounded transition-colors flex items-center justify-center gap-2 border border-border"
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Center on Me
          </button>
        </div>
      )}
      
      {/* Off-Duty Overlay */}
      {!isOnDuty && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-[1000] flex items-center justify-center">
          <div className="bg-card px-6 py-4 rounded-xl border border-border shadow-xl text-center">
            <h3 className="font-bold text-foreground">You are currently Off-Duty</h3>
            <p className="text-sm text-muted-foreground mt-1">Toggle the switch above to go on-duty and receive nearby alerts.</p>
          </div>
        </div>
      )}
    </div>
  );
}
