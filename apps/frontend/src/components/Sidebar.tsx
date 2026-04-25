"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, PlusCircle, Users, CheckCircle, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const user = session?.user as any;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) return null;

  const isActive = (path: string) => {
    return pathname === path 
      ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold" 
      : "text-muted-foreground hover:bg-muted dark:hover:bg-zinc-900 hover:text-foreground";
  };

  return (
    <aside className="w-64 bg-card dark:bg-zinc-950 border-r border-border shadow-sm flex flex-col h-screen sticky top-0 transition-colors duration-300">
      <div className="flex h-20 items-center px-6 border-b border-border shrink-0">
        <span className="text-xl font-black text-blue-600 dark:text-blue-500 tracking-tighter">NEXUS<span className="text-foreground">IMPACT</span></span>
      </div>
      
      <nav className="mt-6 px-4 space-y-2 flex-1">
        <Link href="/dashboard" className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-300 ${isActive('/dashboard')}`}>
          <LayoutDashboard className="mr-3 h-5 w-5" />
          <span className="text-sm font-semibold">Dashboard</span>
        </Link>
        {(user.role === 'NGO_ADMIN' || user.role === 'FIELD_WORKER') && (
          <Link href="/surveys/new" className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-300 ${isActive('/surveys/new')}`}>
            <PlusCircle className="mr-3 h-5 w-5" />
            <span className="text-sm font-semibold">Add Data</span>
          </Link>
        )}
        {user.role === 'NGO_ADMIN' && (
          <>
            <Link href="/admin/verification" className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-300 ${isActive('/admin/verification')}`}>
              <CheckCircle className="mr-3 h-5 w-5" />
              <span className="text-sm font-semibold">Verification Queue</span>
            </Link>
            <Link href="/admin/volunteers" className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-300 ${isActive('/admin/volunteers')}`}>
              <Users className="mr-3 h-5 w-5" />
              <span className="text-sm font-semibold">Volunteer Requests</span>
            </Link>
            <Link href="/admin" className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-300 ${isActive('/admin')}`}>
              <Users className="mr-3 h-5 w-5" />
              <span className="text-sm font-semibold">Admin Panel</span>
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full flex items-center px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-muted dark:hover:bg-zinc-900 hover:text-foreground transition-all duration-300 group"
          >
            <div className="relative mr-3 h-5 w-5 flex items-center justify-center">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-yellow-500" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
            </div>
            <span className="text-sm font-semibold">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
