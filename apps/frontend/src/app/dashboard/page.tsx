"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { LogOut, MapPin, ChevronDown, Filter } from "lucide-react";
import dynamic from "next/dynamic";
import axios from "axios";
import { useState } from "react";
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
  const [showAll, setShowAll] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [isOnDuty, setIsOnDuty] = useState(false);
  const router = useRouter();

  // Initialize Socket.io connection
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const socketInstance = io(
        process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000"
      );
      socketInstance.on("connect", () => {
        socketInstance.emit("join", (session.user as any).id);
      });
      setSocket(socketInstance);
      return () => {
        socketInstance.disconnect();
      };
    }
  }, [status, session]);

  // Restore duty state from localStorage
  useEffect(() => {
    const savedDutyState = localStorage.getItem("volunteerOnDuty");
    if (savedDutyState === "true") {
      setIsOnDuty(true);
    }
  }, []);

  // Location broadcasting while on duty
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
                  isOnDuty: true,
                });
              }
            },
            (err) => console.error("Error getting location:", err),
            { enableHighAccuracy: true }
          );
        }
      };

      sendLocationUpdate();
      locationInterval = setInterval(sendLocationUpdate, 120000);
    } else {
      localStorage.setItem("volunteerOnDuty", "false");
      if (socket && session?.user) {
        socket.emit("volunteer_location_update", {
          userId: (session.user as any).id,
          coordinates: [0, 0],
          isOnDuty: false,
        });
      }
    }

    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [isOnDuty, socket, session]);

  // Redirect if unauthenticated, fetch tasks if authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated") {
      fetchTasks();
    }
  }, [status, router]);

  // Dynamic stats
  const pendingSurveys = tasks.filter((t) => t.status === "OPEN").length;
  const activeTasks = tasks.filter((t) => t.status === "ASSIGNED").length;
  const impact = Math.min(100, tasks.length * 5) + "%";

  const handleSearch = () => {
    const coords = searchCoords.split(",").map((s) => Number(s.trim()));
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
          setSearchCoords(
            `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          );
        },
        () => {
          alert("Unable to retrieve your location.");
        }
      );
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/accept`,
        { volunteerId: (session?.user as any)?.id },
        { headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` } }
      );
      fetchTasks();
    } catch {
      alert("Failed to accept task");
    }
  };

  const handleCompleteTask = async (
    taskId: string,
    file: File,
    taskCoords: [number, number]
  ) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("coordinates[]", String(taskCoords[0]));
    formData.append("coordinates[]", String(taskCoords[1]));
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/complete`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${(session?.user as any).accessToken}`,
          },
        }
      );
      fetchTasks();
      alert("Task completed successfully!");
    } catch {
      alert("Failed to complete task");
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` },
      });
      setTasks(res.data);
    } catch {
      console.error("Failed to fetch tasks");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const user = session!.user as any;
  const categories = ["ALL", ...Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)))];
  const filtered = filterCategory === "ALL" ? tasks : tasks.filter((t) => t.category === filterCategory);
  const displayed = showAll ? filtered : filtered.slice(0, 5);

  return (
    <VolunteerVerificationGuard>
      <div className="flex h-screen bg-background transition-colors duration-300 relative">
        <Sidebar />

        {/* Real-time Crisis Notification Modal */}
        <NotificationModal socket={socket} volunteerLocation={centerLocation} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <header className="flex h-20 items-center justify-between px-8 bg-background border-b-2 border-border transition-colors duration-300">
            <h1 className="text-xl font-black uppercase tracking-[0.2em] text-foreground">
              Overview [ {user.name} ]
            </h1>
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
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-4 py-2 rounded-[4px]">
                {user.role}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="mr-2 h-4 w-4 stroke-[1.5pt]" />
                Logout
              </Button>
            </div>
          </header>

          <div className="p-8 space-y-12 max-w-[1440px] mx-auto">

            {/* Stats — hidden for volunteers */}
            {user.role !== "VOLUNTEER" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="neo-border p-8 bg-card rounded-[4px] space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                    Pending Surveys
                  </h3>
                  <p className="text-5xl font-black text-foreground">{pendingSurveys}</p>
                </div>
                <div className="neo-border p-8 bg-card rounded-[4px] space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                    Active Tasks
                  </h3>
                  <p className="text-5xl font-black text-foreground">{activeTasks}</p>
                </div>
                <div className="neo-border p-8 bg-card rounded-[4px] space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                    Community Impact
                  </h3>
                  <p className="text-5xl font-black text-foreground">{impact}</p>
                </div>
              </div>
            )}

            {/* Map Section */}
            <div className="flex flex-col h-[500px] mb-12">
              <div className="flex justify-between items-end mb-4 border-b-2 border-border pb-4 shrink-0">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                  {user.role === "VOLUNTEER" ? "LIVE [ DUTY_MAP ]" : "GEOSPATIAL [ NEED_HEATMAP ]"}
                </h2>
                {user.role !== "VOLUNTEER" && (
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Lat, Lng (e.g. 12.97, 77.59)"
                      value={searchCoords}
                      onChange={(e) => setSearchCoords(e.target.value)}
                      className="neo-border bg-background rounded-[4px] px-4 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <Button size="sm" onClick={handleSearch}>Search</Button>
                    <Button size="sm" variant="outline" onClick={handleLocateMe} title="Use my current location">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-0">
                {user.role === "VOLUNTEER" ? (
                  <VolunteerMap isOnDuty={isOnDuty} />
                ) : (
                  <MapboxHeatmap tasks={tasks} centerLocation={centerLocation} />
                )}
              </div>
            </div>

            {/* Community Reports Table */}
            <div className="bg-card dark:bg-zinc-900/50 dark:backdrop-blur-md rounded-xl shadow-sm border border-border overflow-hidden transition-all duration-300">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-foreground">Community Reports</h2>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {filtered.length} {filtered.length === 1 ? "report" : "reports"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                    <select
                      value={filterCategory}
                      onChange={(e) => { setFilterCategory(e.target.value); setShowAll(false); }}
                      className="appearance-none bg-background border border-border rounded-lg pl-8 pr-8 py-2 text-xs font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      {(categories as string[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === "ALL" ? "All Categories" : cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                  </div>
                  {filtered.length > 5 && (
                    <Button
                      size="sm"
                      variant={showAll ? "outline" : "primary"}
                      onClick={() => setShowAll(!showAll)}
                    >
                      {showAll ? "Show Less" : `View All (${filtered.length})`}
                    </Button>
                  )}
                </div>
              </div>

              <div className={`overflow-auto transition-all duration-500 ease-in-out ${showAll ? "max-h-[600px]" : "max-h-[400px]"}`}>
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-widest border-b border-border sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3">Issue</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Urgency</th>
                      <th className="px-6 py-3">Status</th>
                      {user.role === "VOLUNTEER" && (
                        <th className="px-6 py-3 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayed.map((task) => (
                      <tr
                        key={task._id}
                        className="hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => {
                          if (task.location?.coordinates && task.location.coordinates.length >= 2) {
                            setCenterLocation([
                              task.location.coordinates[1],
                              task.location.coordinates[0],
                            ]);
                          }
                        }}
                      >
                        <td className="px-6 py-4 text-sm text-foreground font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {task.description || "No description provided"}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{task.category}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              task.urgencyScore >= 4
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                            }`}
                          >
                            Score: {task.urgencyScore}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-widest ${
                              task.status === "OPEN"
                                ? "text-blue-600 dark:text-blue-400"
                                : task.status === "ASSIGNED"
                                ? "text-amber-600 dark:text-amber-400"
                                : task.status === "COMPLETED"
                                ? "text-green-600 dark:text-green-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>
                        {user.role === "VOLUNTEER" && (
                          <td className="px-6 py-4 text-right">
                            {task.status === "OPEN" && (
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleAcceptTask(task._id); }}
                              >
                                Accept
                              </Button>
                            )}
                            {task.status === "ASSIGNED" &&
                              task.assignedVolunteerId === (session?.user as any)?.id && (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1.5 px-3 rounded">
                                    Submit Proof
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleCompleteTask(
                                            task._id,
                                            e.target.files[0],
                                            task.location.coordinates
                                          );
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
                    {displayed.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-sm text-muted-foreground font-medium"
                        >
                          {tasks.length === 0
                            ? "No community reports found. Add data to see it here!"
                            : `No reports found for category "${filterCategory}".`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!showAll && filtered.length > 5 && (
                <div className="px-6 py-3 border-t border-border bg-muted/30 text-center">
                  <button
                    onClick={() => setShowAll(true)}
                    className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wider transition-colors"
                  >
                    Showing {displayed.length} of {filtered.length} — Click to expand
                  </button>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </VolunteerVerificationGuard>
  );
}
