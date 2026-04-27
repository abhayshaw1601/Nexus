"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, PlusCircle, Users, CheckCircle, Sun, Moon, Heart } from "lucide-react";
import { useTheme } from "./Providers";
import { useState, useEffect } from "react";

const BLACK = 'var(--border-color)';
const WHITE = 'var(--shadow-color)';
const PUR   = 'var(--pur)';
const FG    = 'var(--fg)';
const SIDEBAR_BG = 'var(--sidebar-bg)';
const HEADER_BG = 'var(--header-bg)';

export default function Sidebar() {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const user = session?.user as any;
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!user) return null;

  const isActive = (path: string) => pathname === path;

  const linkStyle = (path: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', padding: '12px 16px',
    fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.65rem',
    letterSpacing: '0.15em', textTransform: 'uppercase',
    color: isActive(path) ? '#FFFFFF' : FG,
    backgroundColor: isActive(path) ? PUR : 'transparent',
    border: `2px solid ${isActive(path) ? BLACK : 'transparent'}`,
    boxShadow: isActive(path) ? `4px 4px 0px ${WHITE}` : 'none',
    transform: isActive(path) ? 'translate(-2px,-2px)' : 'none',
    textDecoration: 'none', transition: 'all 0.15s ease',
    cursor: 'pointer',
  });

  const handleHover = (e: React.MouseEvent<HTMLElement>, path: string, entering: boolean) => {
    if (isActive(path)) return;
    const el = e.currentTarget;
    if (entering) {
      el.style.backgroundColor = 'rgba(0, 137, 123, 0.1)';
      el.style.border = `2px solid ${BLACK}`;
      el.style.boxShadow = `3px 3px 0 ${WHITE}`;
      el.style.transform = 'translate(-1px,-1px)';
    } else {
      el.style.backgroundColor = 'transparent';
      el.style.border = `2px solid transparent`;
      el.style.boxShadow = 'none';
      el.style.transform = 'none';
    }
  };

  return (
    <aside style={{ width: 256, backgroundColor: SIDEBAR_BG, borderRight: `2.5px solid ${BLACK}`, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      {/* Logo */}
      <div style={{ display: 'flex', height: 80, alignItems: 'center', padding: '0 1.5rem', borderBottom: `2.5px solid ${BLACK}`, backgroundColor: HEADER_BG, flexShrink: 0 }}>
        <Heart style={{ width: 18, height: 18, color: PUR, strokeWidth: 1.5, marginRight: 10 }} />
        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: FG }}>
          NexusImpact
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <Link href="/dashboard" style={linkStyle('/dashboard')}
          onMouseEnter={(e: any) => handleHover(e, '/dashboard', true)}
          onMouseLeave={(e: any) => handleHover(e, '/dashboard', false)}
        >
          <LayoutDashboard style={{ marginRight: 12, width: 16, height: 16, strokeWidth: 1.5 }} />
          Dashboard
        </Link>

        {(user.role === 'NGO_ADMIN' || user.role === 'FIELD_WORKER') && (
          <Link href="/surveys/new" style={linkStyle('/surveys/new')}
            onMouseEnter={(e: any) => handleHover(e, '/surveys/new', true)}
            onMouseLeave={(e: any) => handleHover(e, '/surveys/new', false)}
          >
            <PlusCircle style={{ marginRight: 12, width: 16, height: 16, strokeWidth: 1.5 }} />
            Add Data
          </Link>
        )}

        {user.role === 'NGO_ADMIN' && (
          <>
            <Link href="/admin/verification" style={linkStyle('/admin/verification')}
              onMouseEnter={(e: any) => handleHover(e, '/admin/verification', true)}
              onMouseLeave={(e: any) => handleHover(e, '/admin/verification', false)}
            >
              <CheckCircle style={{ marginRight: 12, width: 16, height: 16, strokeWidth: 1.5 }} />
              Verification
            </Link>
            <Link href="/admin/volunteers" style={linkStyle('/admin/volunteers')}
              onMouseEnter={(e: any) => handleHover(e, '/admin/volunteers', true)}
              onMouseLeave={(e: any) => handleHover(e, '/admin/volunteers', false)}
            >
              <Users style={{ marginRight: 12, width: 16, height: 16, strokeWidth: 1.5 }} />
              Volunteer Requests
            </Link>
            <Link href="/admin" style={linkStyle('/admin')}
              onMouseEnter={(e: any) => handleHover(e, '/admin', true)}
              onMouseLeave={(e: any) => handleHover(e, '/admin', false)}
            >
              <Users style={{ marginRight: 12, width: 16, height: 16, strokeWidth: 1.5 }} />
              Admin Panel
            </Link>
          </>
        )}

        {user.ngoId && (
          <Link href="/ngo/details" style={linkStyle('/ngo/details')}
            onMouseEnter={(e: any) => handleHover(e, '/ngo/details', true)}
            onMouseLeave={(e: any) => handleHover(e, '/ngo/details', false)}
          >
            <Users style={{ marginRight: 12, width: 16, height: 16, strokeWidth: 1.5 }} />
            Organization
          </Link>
        )}
      </nav>

      {/* Theme toggle */}
      <div style={{ padding: '1rem', borderTop: `2.5px solid ${BLACK}` }}>
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '10px 16px', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: FG, backgroundColor: 'transparent', border: `2px solid transparent`, cursor: 'pointer', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 137, 123, 0.1)'; (e.currentTarget as HTMLElement).style.border = `2px solid ${BLACK}`; (e.currentTarget as HTMLElement).style.boxShadow = `3px 3px 0 ${WHITE}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.border = `2px solid transparent`; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
          >
            <div style={{ position: 'relative', width: 16, height: 16, marginRight: 12 }}>
              <Sun style={{ width: 16, height: 16, strokeWidth: 1.5, color: PUR }} />
            </div>
            {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        )}
      </div>
    </aside>
  );
}
