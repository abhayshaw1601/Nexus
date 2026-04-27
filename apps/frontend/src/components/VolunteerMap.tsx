"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Create a custom pulsing blue icon
const pulseIconHtml = `
  <div class="relative flex items-center justify-center w-8 h-8">
    <div class="absolute w-full h-full bg-blue-500 rounded-full opacity-50 animate-ping"></div>
    <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg z-10"></div>
  </div>
`;

const pulseIcon = L.divIcon({
  className: "custom-pulse-icon",
  html: pulseIconHtml,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Component to dynamically update map center
function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), {
        animate: true,
      });
    }
  }, [center, map]);
  return null;
}

export default function VolunteerMap({ isOnDuty }: { isOnDuty: boolean }) {
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    let watchId: number;

    if (isOnDuty && "geolocation" in navigator) {
      // Use watchPosition to get real-time continuous updates
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.error("Error watching position:", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else {
      setCurrentLocation(null);
    }

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnDuty]);

  // Default center if no location yet
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India approx

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-border shadow-sm relative z-0">
      <MapContainer 
        center={currentLocation || defaultCenter} 
        zoom={currentLocation ? 15 : 5} 
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        <MapController center={currentLocation} />

        {isOnDuty && currentLocation && (
          <Marker position={currentLocation} icon={pulseIcon}>
            <Popup className="font-sans font-bold text-sm">
              <div className="text-center">
                <p className="text-blue-600 mb-1">You are On-Duty!</p>
                <p className="text-muted-foreground text-xs font-normal">Waiting for crisis alerts...</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      
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
