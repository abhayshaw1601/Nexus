"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  status: string;
  assignedVolunteerId?: {
    _id: string;
    name: string;
    email: string;
  };
  description?: string;
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
  const taskMarkersRef = useRef<L.Marker[]>([]);

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

    const themeTiles = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    // Remove existing tile layers
    leafletMap.current.eachLayer((layer: any) => {
      if (layer._url) leafletMap.current?.removeLayer(layer);
    });

    L.tileLayer(themeTiles).addTo(leafletMap.current);

  }, []);

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

  // Add markers for ASSIGNED tasks showing volunteer info
  useEffect(() => {
    if (!leafletMap.current) return;

    // Remove previous task markers
    taskMarkersRef.current.forEach(marker => marker.remove());
    taskMarkersRef.current = [];

    // Filter for assigned tasks
    const assignedTasks = tasks.filter(task => 
      task.status === 'ASSIGNED' && task.assignedVolunteerId
    );

    // Create custom icon for assigned tasks
    const assignedIcon = L.divIcon({
      className: 'custom-assigned-marker',
      html: `
        <div style="position: relative;">
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
            border: 3px solid #000;
            border-radius: 50%;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3), 0 0 0 4px rgba(139, 92, 246, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse-assigned 2s infinite;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
        <style>
          @keyframes pulse-assigned {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        </style>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });

    // Add markers for each assigned task
    assignedTasks.forEach(task => {
      const [lng, lat] = task.location.coordinates;
      const marker = L.marker([lat, lng], { 
        icon: assignedIcon,
        zIndexOffset: 2000 // Ensure markers appear above heatmap
      });

      // Create popup content
      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 200px;">
          <div style="
            background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
            color: white;
            padding: 8px 12px;
            margin: -10px -10px 10px -10px;
            border-bottom: 2px solid #000;
          ">
            <p style="
              margin: 0;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              opacity: 0.9;
            ">Task Assigned</p>
          </div>
          
          <div style="padding: 4px 0;">
            <p style="
              margin: 0 0 8px 0;
              font-size: 11px;
              font-weight: 700;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            ">Volunteer</p>
            <p style="
              margin: 0 0 12px 0;
              font-size: 14px;
              font-weight: 900;
              color: #000;
            ">${task.assignedVolunteerId?.name || 'Unknown'}</p>
            
            <p style="
              margin: 0 0 4px 0;
              font-size: 11px;
              font-weight: 700;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            ">Category</p>
            <p style="
              margin: 0 0 12px 0;
              font-size: 13px;
              font-weight: 700;
              color: #8B5CF6;
            ">${task.category}</p>
            
            ${task.description ? `
              <p style="
                margin: 0 0 4px 0;
                font-size: 11px;
                font-weight: 700;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              ">Description</p>
              <p style="
                margin: 0;
                font-size: 12px;
                font-weight: 500;
                color: #333;
                line-height: 1.4;
              ">${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}</p>
            ` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      marker.addTo(leafletMap.current!);
      taskMarkersRef.current.push(marker);
    });

    // Add custom popup styles
    const style = document.createElement('style');
    style.innerHTML = `
      .custom-popup .leaflet-popup-content-wrapper {
        border: 3px solid #000;
        border-radius: 8px;
        box-shadow: 6px 6px 0px rgba(0,0,0,0.3);
        padding: 10px;
      }
      .custom-popup .leaflet-popup-tip {
        border: 2px solid #000;
      }
    `;
    if (!document.getElementById('custom-popup-styles')) {
      style.id = 'custom-popup-styles';
      document.head.appendChild(style);
    }

    return () => {
      taskMarkersRef.current.forEach(marker => marker.remove());
      taskMarkersRef.current = [];
    };
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

        {/* Legend for assigned tasks */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <div style={{
              width: 16,
              height: 16,
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              border: '2px solid #000',
              borderRadius: '50%',
              flexShrink: 0
            }} />
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
              Assigned
            </span>
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
