"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, PlusCircle, Users, CheckCircle, Sun, Moon, Heart } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const { data: session } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const user = session?.user as any;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) return null;

  const isActive = (path: string) => {
    return pathname === path 
      ? "bg-primary text-primary-foreground font-black" 
      : "text-muted-foreground hover:bg-muted hover:text-foreground";
  };

  return (
    <aside className="w-64 bg-background border-r-2 border-border flex flex-col h-screen sticky top-0 transition-colors duration-300">
      <div className="flex h-20 items-center px-6 border-b-2 border-border shrink-0">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary stroke-[1.5pt]" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">NexusImpact</span>
        </div>
      </div>
      
      <nav className="mt-8 px-4 space-y-2 flex-1">
        <Link href="/dashboard" className={`flex items-center px-4 py-3 rounded-[4px] border-2 border-transparent transition-all duration-300 ${isActive('/dashboard')}`}>
          <LayoutDashboard className="mr-3 h-4 w-4 stroke-[1.5pt]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Dashboard</span>
        </Link>
        {(user.role === 'NGO_ADMIN' || user.role === 'FIELD_WORKER') && (
          <Link href="/surveys/new" className={`flex items-center px-4 py-3 rounded-[4px] border-2 border-transparent transition-all duration-300 ${isActive('/surveys/new')}`}>
            <PlusCircle className="mr-3 h-4 w-4 stroke-[1.5pt]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Data</span>
          </Link>
        )}
        {user.role === 'NGO_ADMIN' && (
          <>
            <Link href="/admin/verification" className={`flex items-center px-4 py-3 rounded-[4px] border-2 border-transparent transition-all duration-300 ${isActive('/admin/verification')}`}>
              <CheckCircle className="mr-3 h-4 w-4 stroke-[1.5pt]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verification</span>
            </Link>
            <Link href="/admin" className={`flex items-center px-4 py-3 rounded-[4px] border-2 border-transparent transition-all duration-300 ${isActive('/admin')}`}>
              <Users className="mr-3 h-4 w-4 stroke-[1.5pt]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Admin Panel</span>
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t-2 border-border mt-auto">
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="w-full flex items-center px-4 py-3 rounded-[4px] border-2 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300 group"
          >
            <div className="relative mr-3 h-4 w-4 flex items-center justify-center">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary stroke-[1.5pt]" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary stroke-[1.5pt]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
