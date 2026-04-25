"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, PlusCircle, Users } from "lucide-react";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;

  if (!user) return null;

  const isActive = (path: string) => {
    return pathname === path ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-900 hover:bg-gray-100";
  };

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col h-screen sticky top-0">
      <div className="flex h-20 items-center px-6 border-b shrink-0">
        <span className="text-xl font-bold text-blue-600">NexusImpact</span>
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
          <Link href="/admin" className={`flex items-center px-4 py-2 rounded-md transition-colors ${isActive('/admin')}`}>
            <Users className="mr-3 h-5 w-5" />
            Admin Panel
          </Link>
        )}
      </nav>
    </aside>
  );
}
