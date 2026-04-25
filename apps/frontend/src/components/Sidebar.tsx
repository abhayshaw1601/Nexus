"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, PlusCircle, Users, CheckCircle } from "lucide-react";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;

  if (!user) return null;

  const isActive = (path: string) => {
    return pathname === path 
      ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold" 
      : "text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800 hover:text-foreground";
  };

  return (
    <aside className="w-64 bg-card dark:bg-zinc-950 border-r border-border shadow-sm flex flex-col h-screen sticky top-0 transition-colors duration-300">
      <div className="flex h-20 items-center px-6 border-b border-border shrink-0">
        <span className="text-xl font-bold text-blue-600 dark:text-blue-500">NexusImpact</span>
      </div>
      <nav className="mt-6 px-4 space-y-2 flex-1">
        <Link href="/dashboard" className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/dashboard')}`}>
          <LayoutDashboard className="mr-3 h-5 w-5" />
          Dashboard
        </Link>
        {(user.role === 'NGO_ADMIN' || user.role === 'FIELD_WORKER') && (
          <Link href="/surveys/new" className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/surveys/new')}`}>
            <PlusCircle className="mr-3 h-5 w-5" />
            Add Data
          </Link>
        )}
        {user.role === 'NGO_ADMIN' && (
          <>
            <Link href="/admin/verification" className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/admin/verification')}`}>
              <CheckCircle className="mr-3 h-5 w-5" />
              Verification Queue
            </Link>
            <Link href="/admin" className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/admin')}`}>
              <Users className="mr-3 h-5 w-5" />
              Admin Panel
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
