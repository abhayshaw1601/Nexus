"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, MapPin, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface CrisisAlert {
  id: string;
  name: string;
  category: string;
  urgencyScore: number;
  coordinates: [number, number];
}

interface NotificationModalProps {
  socket: Socket | null;
  volunteerLocation: [number, number] | null;
}

export default function NotificationModal({ socket, volunteerLocation }: NotificationModalProps) {
  const [alert, setAlert] = useState<CrisisAlert | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    const handleNewCrisis = (data: CrisisAlert) => {
      setAlert(data);
      // Play a sound or trigger browser notification if desired
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🚨 Crisis Nearby!", {
          body: `${data.name} - Urgency: ${data.urgencyScore}/10`,
        });
      }
    };

    socket.on("NEW_CRISIS_NEARBY", handleNewCrisis);

    return () => {
      socket.off("NEW_CRISIS_NEARBY", handleNewCrisis);
    };
  }, [socket]);

  // Request notification permissions
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const calculateDistance = () => {
    if (!volunteerLocation || !alert) return null;
    
    // Haversine formula
    const [lat1, lon1] = volunteerLocation; // dashboard passes [lat, lng]
    const [lon2, lat2] = alert.coordinates; // backend sends [lng, lat] GeoJSON format
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1); // 1 decimal place
  };

  if (!alert) return null;

  const distance = calculateDistance();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-red-600 p-6 text-white text-center relative">
          <button 
            onClick={() => setAlert(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Crisis Alert</h2>
          <p className="text-red-100 font-medium mt-1">A new crisis requires your immediate attention!</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Issue</p>
            <p className="text-xl font-bold text-foreground">{alert.name}</p>
          </div>
          
          <div className="flex justify-between items-center bg-muted/50 p-4 rounded-xl border border-border">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Category</p>
              <p className="font-bold text-foreground">{alert.category}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Urgency</p>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                alert.urgencyScore >= 4 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {alert.urgencyScore} / 10
              </span>
            </div>
          </div>
          
          {distance && (
            <div className="flex items-center text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{distance} km away from your location</span>
            </div>
          )}
          
          <div className="pt-2 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAlert(null)}>
              Dismiss
            </Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => {
              setAlert(null);
              // In the future, this could automatically select the task or scroll to it
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}>
              View Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
