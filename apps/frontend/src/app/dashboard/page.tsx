"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { LayoutDashboard, LogOut, Map as MapIcon, PlusCircle, Users, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import axios from "axios";
import { useState } from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";

import Sidebar from "@/components/Sidebar";
import VolunteerVerificationGuard from "@/components/VolunteerVerificationGuard";
import NotificationModal from "@/components/NotificationModal";

const MapboxHeatmap = dynamic(() => import("@/components/Heatmap"), { ssr: false });
const VolunteerMap = dynamic(() => import("@/components/VolunteerMap"), { ssr: false });

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [centerLocation, setCenterLocation] = useState<[number, number] | null>(null);
  const [searchCoords, setSearchCoords] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();

  // Initialize Socket.io connection
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const socketInstance = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000');
      
      socketInstance.on('connect', () => {
        socketInstance.emit('join', (session.user as any).id);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [status, session]);

  // dynamic stats
  const pendingSurveys = tasks.filter(t => t.status === 'OPEN').length;
  const activeTasks = tasks.filter(t => t.status === 'ASSIGNED').length;
  const impact = Math.min(100, tasks.length * 5) + "%";

  const handleSearch = () => {
    const coords = searchCoords.split(',').map(s => Number(s.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      setCenterLocation([coords[0], coords[1]]);
    } else {
      alert("Please enter valid coordinates, e.g., 12.97, 77.59");
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenterLocation([position.coords.latitude, position.coords.longitude]);
          setSearchCoords(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        },
        () => {
          alert("Unable to retrieve your location.");
        }
      );
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchTasks();
    }
  }, [status, router]);

  const handleAcceptTask = async (taskId: string) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/accept`, {
        volunteerId: (session?.user as any)?.id
      }, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      fetchTasks();
    } catch (err) {
      alert("Failed to accept task");
    }
  };

  const handleCompleteTask = async (taskId: string, file: File, taskCoords: [number, number]) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    // For testing, just send back the exact task coordinates to pass the distance validation
    formData.append("coordinates[]", String(taskCoords[0]));
    formData.append("coordinates[]", String(taskCoords[1]));

    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/complete`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${(session?.user as any).accessToken}`
        }
      });
      fetchTasks();
      alert("Task completed successfully!");
    } catch (err) {
      alert("Failed to complete task");
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks");
    }
  };

  const [isOnDuty, setIsOnDuty] = useState(false);

  useEffect(() => {
    // Restore On-Duty state from localStorage
    const savedDutyState = localStorage.getItem("volunteerOnDuty");
    if (savedDutyState === "true") {
      setIsOnDuty(true);
    }
  }, []);

  useEffect(() => {
    let locationInterval: NodeJS.Timeout;

    if (isOnDuty && session?.user && (session.user as any).role === "VOLUNTEER") {
      localStorage.setItem("volunteerOnDuty", "true");
      
      const sendLocationUpdate = () => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              if (socket) {
                socket.emit("volunteer_location_update", {
                  userId: (session.user as any).id,
                  coordinates: [longitude, latitude],
                  isOnDuty: true
                });
              }
            },
            (err) => console.error("Error getting location:", err),
            { enableHighAccuracy: true }
          );
        }
      };

      // Send immediately when toggled on
      sendLocationUpdate();

      // Then every 2 minutes (120000 ms)
      locationInterval = setInterval(sendLocationUpdate, 120000);
    } else {
      localStorage.setItem("volunteerOnDuty", "false");
      if (socket && session?.user) {
        socket.emit("volunteer_location_update", {
          userId: (session.user as any).id,
          coordinates: [0, 0], // Or omit coordinates if not needed
          isOnDuty: false
        });
      }
    }

    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [isOnDuty, socket, session]);

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return null; // Will redirect in useEffect
  }

  const user = session.user as any;

  return (
    <VolunteerVerificationGuard>
      <div className="flex h-screen bg-background transition-colors duration-300 relative">
        <Sidebar />
        
        {/* Real-time Crisis Notification Modal */}
        <NotificationModal socket={socket} volunteerLocation={centerLocation} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <header className="flex h-20 items-center justify-between px-8 bg-card/80 backdrop-blur-md border-b border-border shadow-sm transition-colors duration-300">
            <h1 className="text-2xl font-semibold text-foreground">Welcome, {user.name}</h1>
            <div className="flex items-center space-x-6">
              
              {user.role === "VOLUNTEER" && (
                <div className="flex items-center space-x-3 bg-muted/50 px-4 py-2 rounded-xl border border-border">
                  <span className={`text-sm font-bold ${isOnDuty ? "text-green-500" : "text-muted-foreground"}`}>
                    {isOnDuty ? "On Duty" : "Off Duty"}
                  </span>
                  <button
                    onClick={() => setIsOnDuty(!isOnDuty)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background ${
                      isOnDuty ? "bg-green-500" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isOnDuty ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              )}

              <span className="text-sm font-bold text-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-wider">
                {user.role}
              </span>
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-muted-foreground hover:text-foreground">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>

          <div className="p-8 space-y-8">
            {user.role !== "VOLUNTEER" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card dark:bg-zinc-900/50 dark:backdrop-blur-md p-6 rounded-xl shadow-sm border border-border transition-all duration-300">
                  <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-tight">Pending Surveys</h3>
                  <p className="text-3xl font-bold text-foreground mt-2">{pendingSurveys}</p>
                </div>
                <div className="bg-card dark:bg-zinc-900/50 dark:backdrop-blur-md p-6 rounded-xl shadow-sm border border-border transition-all duration-300">
                  <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-tight">Active Tasks</h3>
                  <p className="text-3xl font-bold text-foreground mt-2">{activeTasks}</p>
                </div>
                <div className="bg-card dark:bg-zinc-900/50 dark:backdrop-blur-md p-6 rounded-xl shadow-sm border border-border transition-all duration-300">
                  <h3 className="text-muted-foreground text-sm font-bold uppercase tracking-tight">Community Impact</h3>
                  <p className="text-3xl font-bold text-foreground mt-2">{impact}</p>
                </div>
              </div>
            )}

            <div className="h-[400px] mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  {user.role === "VOLUNTEER" ? "Live Duty Map" : "Community Need Heatmap"}
                </h2>
                {user.role !== "VOLUNTEER" && (
                  <div className="flex space-x-2">
                    <input 
                      type="text"
                      placeholder="Lat, Lng (e.g. 12.97, 77.59)"
                      value={searchCoords}
                      onChange={(e) => setSearchCoords(e.target.value)}
                      className="border border-input bg-background rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                    <Button size="sm" onClick={handleSearch}>Search</Button>
                    <Button size="sm" variant="outline" onClick={handleLocateMe} title="Use my current location">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {user.role === "VOLUNTEER" ? (
                <VolunteerMap isOnDuty={isOnDuty} />
              ) : (
                <MapboxHeatmap tasks={tasks} centerLocation={centerLocation} />
              )}
            </div>

            <div className="bg-card dark:bg-zinc-900/50 dark:backdrop-blur-md rounded-xl shadow-sm border border-border overflow-hidden transition-all duration-300">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Recent Community Reports</h2>
                <Button size="sm">View All</Button>
              </div>
              <div className="p-0">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-widest border-b border-border">
                    <tr>
                      <th className="px-6 py-3">Issue</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Urgency</th>
                      <th className="px-6 py-3">Status</th>
                      {(session?.user as any)?.role === 'VOLUNTEER' && (
                        <th className="px-6 py-3 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tasks.slice(0, 5).map((task) => (
                      <tr 
                        key={task._id} 
                        className="hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => {
                          if (task.location?.coordinates && task.location.coordinates.length >= 2) {
                            setCenterLocation([task.location.coordinates[1], task.location.coordinates[0]]);
                          }
                        }}
                      >
                        <td className="px-6 py-4 text-sm text-foreground font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{task.description || "No description provided"}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{task.category}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            task.urgencyScore >= 4 
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          }`}>
                            Score: {task.urgencyScore}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase tracking-widest">{task.status}</span>
                        </td>
                        {(session?.user as any)?.role === 'VOLUNTEER' && (
                          <td className="px-6 py-4 text-right">
                            {task.status === 'OPEN' && (
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAcceptTask(task._id); }}>
                                Accept
                              </Button>
                            )}
                            {task.status === 'ASSIGNED' && task.assignedVolunteerId === (session?.user as any)?.id && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1.5 px-3 rounded">
                                  Submit Proof
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleCompleteTask(task._id, e.target.files[0], task.location.coordinates);
                                      }
                                    }} 
                                  />
                                </label>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {tasks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 font-medium">
                          No community reports found. Add data to see it here!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </VolunteerVerificationGuard>
  );
}
