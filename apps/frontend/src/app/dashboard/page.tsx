"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { LayoutDashboard, LogOut, Map as MapIcon, PlusCircle, Users } from "lucide-react";
import dynamic from "next/dynamic";
import axios from "axios";
import { useState } from "react";
import Link from "next/link";

import Sidebar from "@/components/Sidebar";

const MapboxHeatmap = dynamic(() => import("@/components/Heatmap"), { ssr: false });

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [centerLocation, setCenterLocation] = useState<[number, number] | null>(null);
  const [searchCoords, setSearchCoords] = useState("");
  const router = useRouter();

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchTasks();
    }
  }, [status, router]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as any;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="flex h-20 items-center justify-between px-8 bg-white border-b shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user.name}</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">
              {user.role}
            </span>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-gray-900 text-sm font-bold uppercase tracking-tight">Pending Surveys</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{pendingSurveys}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-gray-900 text-sm font-bold uppercase tracking-tight">Active Tasks</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeTasks}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-gray-900 text-sm font-bold uppercase tracking-tight">Community Impact</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{impact}</p>
            </div>
          </div>

          <div className="h-[400px] mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Community Need Heatmap</h2>
              <div className="flex space-x-2">
                <input 
                  type="text"
                  placeholder="Lat, Lng (e.g. 12.97, 77.59)"
                  value={searchCoords}
                  onChange={(e) => setSearchCoords(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button size="sm" onClick={handleSearch}>Search</Button>
              </div>
            </div>
            <MapboxHeatmap tasks={tasks} centerLocation={centerLocation} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Community Reports</h2>
              <Button size="sm">View All</Button>
            </div>
            <div className="p-0">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-900 text-xs uppercase font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-3 font-bold">Issue</th>
                    <th className="px-6 py-3 font-bold">Category</th>
                    <th className="px-6 py-3 font-bold">Urgency</th>
                    <th className="px-6 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.slice(0, 5).map((task) => (
                    <tr 
                      key={task._id} 
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => setCenterLocation([task.location.coordinates[1], task.location.coordinates[0]])}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{task.description || "No description provided"}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{task.category}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          task.urgencyScore >= 4 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          Score: {task.urgencyScore}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-blue-600 text-xs font-bold uppercase">{task.status}</span>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 font-medium">
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
  );
}
