"use client";

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import leaflet.heat dynamically or via side-effect
// Note: leaflet.heat attaches itself to the L object
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

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || leafletMap.current) return;

    // Initialize the map
    leafletMap.current = L.map(mapRef.current).setView([12.9716, 77.5946], 12);

    // Add OpenStreetMap tiles (Free, no token needed) - Using light theme for brighter map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(leafletMap.current);

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []);

  useEffect(() => {
    if (leafletMap.current && centerLocation) {
      // Fly to the new location with a smooth animation and high zoom
      leafletMap.current.flyTo(centerLocation, 16, { duration: 1.5 });
    }
  }, [centerLocation]);

  useEffect(() => {
    if (!leafletMap.current || tasks.length === 0) return;

    // Remove existing heatmap layers if any
    leafletMap.current.eachLayer((layer: any) => {
      if (layer._latlngs && !layer._url) { // Simple way to detect heatmap layer
        leafletMap.current?.removeLayer(layer);
      }
    });

    console.log("Heatmap received tasks:", tasks);

    // Prepare data for leaflet.heat: [[lat, lng, intensity], ...]
    const heatData = tasks.map(task => [
      task.location.coordinates[1],
      task.location.coordinates[0],
      task.urgencyScore / 5 // intensity 0.2 to 1.0
    ]);

    console.log("Prepared Heat Data:", heatData);

    // @ts-ignore
    const heatLayer = L.heatLayer(heatData, {
      radius: 50, // Much larger radius
      blur: 25,   // Slightly more blur to spread the color
      maxZoom: 17,
      max: 0.6,   // Lower max so even single points can reach "red" hot
      minOpacity: 0.4, // Ensure the edges don't fade out too much
      gradient: {
        0.1: 'blue',
        0.3: 'cyan',
        0.5: 'lime',
        0.7: 'yellow',
        1.0: 'red'
      }
    }).addTo(leafletMap.current);

  }, [tasks]);

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0">
      <div ref={mapRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md text-xs font-medium space-y-2 z-[1000]">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-600 mr-2" />
          <span className='text-black'>High Urgency</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-600 mr-2" />
          <span className="text-black">Low Urgency</span>
        </div>
      </div>
    </div>
  );
};

export default LeafletHeatmap;
