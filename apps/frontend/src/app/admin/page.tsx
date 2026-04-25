"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Trash2, Users, LayoutDashboard, CheckCircle2 } from "lucide-react";
import axios from "axios";
import Link from "next/link";

import Sidebar from "@/components/Sidebar";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'users'>('tasks');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'NGO_ADMIN') {
      fetchData();
    } else if (session?.user) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const fetchData = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      };
      const [tasksRes, usersRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tasks/all`, config),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users`, config)
      ]);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    }
  };

  const handleVerify = async (taskId: string) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/verify`, {}, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      fetchData();
    } catch (error) {
      alert("Failed to verify task");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      fetchData();
    } catch (error) {
      alert("Failed to delete task");
    }
  };

  if (status === "loading" || !session) return null;

  return (
    <div className="flex h-screen bg-background transition-colors duration-300">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-foreground">
            {activeTab === 'tasks' ? 'Task Review Dashboard' : 'User Management'}
          </h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'tasks' ? 'bg-blue-600 text-white font-bold' : 'bg-muted text-foreground hover:bg-accent'}`}
            >
              Task Review
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white font-bold' : 'bg-muted text-foreground hover:bg-accent'}`}
            >
              User Management
            </button>
          </div>
        </div>

        {activeTab === 'tasks' && (
          <div className="bg-card dark:bg-zinc-900/50 dark:backdrop-blur-md rounded-xl shadow-sm border border-border overflow-hidden transition-all duration-300">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-widest border-b border-border">
                <tr>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-medium">{task.description || "No description"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{task.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        task.status === 'VERIFIED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                        task.status === 'COMPLETED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {task.status !== 'VERIFIED' && (
                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 dark:border-green-900/50 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={() => handleVerify(task._id)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Verify
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(task._id)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-900 text-xs uppercase font-bold tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
