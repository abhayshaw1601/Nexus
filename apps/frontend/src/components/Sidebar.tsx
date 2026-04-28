"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, PlusCircle, Users, CheckCircle, Heart, Menu, X, LogOut, ClipboardList } from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

const BLACK = 'var(--border-color)';
const WHITE = 'var(--shadow-color)';
const PUR = 'var(--pur)';
const FG = 'var(--fg)';
const SIDEBAR_BG = 'var(--sidebar-bg)';
const HEADER_BG = 'var(--header-bg)';

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when navigating
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (!user) return null;

  const isActive = (path: string) => pathname === path;

  const linkStyle = (path: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', padding: '12px 16px',
    fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.65rem',
    letterSpacing: '0.15em', textTransform: 'uppercase',
    color: isActive(path) ? '#FFFFFF' : FG,
    backgroundColor: isActive(path) ? PUR : 'transparent',
    border: `2px solid ${isActive(path) ? BLACK : 'transparent'}`,
    boxShadow: isActive(path) ? `8px 8px 0px ${WHITE}` : 'none',
    transform: isActive(path) ? 'translate(-2px,-2px)' : 'none',
    textDecoration: 'none', transition: 'all 0.15s ease',
    cursor: 'pointer', minHeight: 48,
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

  const sidebarContent = (
    <aside style={{
      width: '100%',
      height: '100%',
      backgroundColor: SIDEBAR_BG,
      borderRight: `2.5px solid ${BLACK}`,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Logo / Header in Drawer */}
      <div style={{ display: 'flex', height: 64, alignItems: 'center', padding: '0 16px', borderBottom: `2.5px solid ${BLACK}`, backgroundColor: HEADER_BG, flexShrink: 0, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Aligned Close button for mobile */}
          {isMobile ? (
            <button
              onClick={() => setMobileOpen(false)}
              style={{ background: 'transparent', border: 'none', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: FG, marginLeft: -14 }}
            >
              <X style={{ width: 24, height: 24 }} />
            </button>
          ) : (
            <>
              <Heart style={{ width: 18, height: 18, color: PUR, strokeWidth: 1.5, marginRight: 10 }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: FG }}>
                NexusImpact
              </span>
            </>
          )}
        </div>
        {isMobile && (
          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: FG }}>
            Menu
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <Link href="/dashboard" style={linkStyle('/dashboard')}
          onMouseEnter={(e: React.MouseEvent<HTMLElement>) => handleHover(e, '/dashboard', true)}
          onMouseLeave={(e: React.MouseEvent<HTMLElement>) => handleHover(e, '/dashboard', false)}
        >
          <LayoutDashboard style={{ marginRight: 12, width: 16, height: 16, strokeWidth: 1.5 }} />
          Dashboard
        </Link>

        {(user.role === 'NGO_ADMIN' || user.role === 'FIELD_WORKER') && (
          <Link href="/surveys/new" style={linkStyle('/surveys/new')}
            onMouseEnter={(e: React.MouseEvent<HTMLElement>) => handleHover(e, '/surveys/new', true)}
            onMouseLeave={(e: React.MouseEvent<HTMLElement>) => handleHover(e, '/surveys/new', false)}
          >
            <PlusCircle style={{ marginRight: 12, width: 16, height: 16, strokeWidth: 1.5 }} />
            Add Data
          </Link>
        )}

        {user.role === 'NGO_ADMIN' && (
          <>
            <Link href="/admin/verification" style={linkStyle('/admin/verification')}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => handleHover(e, '/admin/verification', true)}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => handleHover(e, '/admin/verification', false)}
            >
              <CheckCircle style={{ marginRight: 12, width: 16, height: 16, strokeWidth: 1.5 }} />
              Verification
            </Link>
            <Link href="/admin/volunteers" style={linkStyle('/admin/volunteers')}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => handleHover(e, '/admin/volunteers', true)}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => handleHover(e, '/admin/volunteers', false)}
            >
              <Users style={{ marginRight: 12, width: 16, height: 16, strokeWidth: 1.5 }} />
              Volunteer Requests
            </Link>
            <Link href="/admin" style={linkStyle('/admin')}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => handleHover(e, '/admin', true)}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => handleHover(e, '/admin', false)}
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

        {user.role === 'VOLUNTEER' && (
          <Link href="/volunteer/reports" style={linkStyle('/volunteer/reports')}
            onMouseEnter={(e: any) => handleHover(e, '/volunteer/reports', true)}
            onMouseLeave={(e: any) => handleHover(e, '/volunteer/reports', false)}
          >
            <ClipboardList style={{ marginRight: 12, width: 16, height: 16, strokeWidth: 1.5 }} />
            Submitted Reports
          </Link>
        )}
      </nav>

      {/* Logout — anchored at bottom */}
      <div style={{ padding: '1rem', borderTop: `2.5px solid ${BLACK}`, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => signOut()}
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            padding: '12px 16px', 
            minHeight: 48, 
            fontFamily: "'Plus Jakarta Sans',sans-serif", 
            fontWeight: 900, 
            fontSize: '0.65rem', 
            letterSpacing: '0.15em', 
            textTransform: 'uppercase', 
            color: FG, 
            backgroundColor: 'transparent', 
            border: `2px solid transparent`, 
            cursor: 'pointer', 
            transition: 'all 0.15s ease' 
          }}
          onMouseEnter={e => { 
            const el = e.currentTarget as HTMLElement;
            el.style.backgroundColor = 'rgba(255, 92, 92, 0.1)'; 
            el.style.border = `2px solid var(--accent-critical)`; 
            el.style.boxShadow = `3px 3px 0 var(--accent-critical)`; 
            el.style.transform = 'translate(-1px,-1px)';
          }}
          onMouseLeave={e => { 
            const el = e.currentTarget as HTMLElement;
            el.style.backgroundColor = 'transparent'; 
            el.style.border = `2px solid transparent`; 
            el.style.boxShadow = 'none'; 
            el.style.transform = 'none';
          }}
        >
          <LogOut style={{ marginRight: 12, width: 16, height: 16, strokeWidth: 1.5, color: 'var(--accent-critical)' }} />
          LOGOUT
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Fixed Mobile Header Bar */}
      {isMobile && (
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: HEADER_BG,
          borderBottom: `2.5px solid ${BLACK}`,
          display: 'grid',
          gridTemplateColumns: '48px 1fr 48px',
          alignItems: 'center',
          padding: '0 16px',
          zIndex: 1000,
        }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
            }}
            aria-label="Open navigation"
          >
            <Menu style={{ width: 24, height: 24, color: FG }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', justifyContent: 'center', gridColumn: '2' }}>
            <Heart style={{ width: 18, height: 18, color: PUR, marginRight: 8, flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(0.9rem, 4vw, 1.25rem)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: FG,
              whiteSpace: 'nowrap',
            }}>
              NexusImpact
            </span>
          </div>
          <div style={{ gridColumn: '3' }} />
        </header>
      )}

      {/* Backdrop overlay — only visible on mobile when open */}
      {isMobile && mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          style={{ display: 'block' }}
        />
      )}

      {/* Sidebar wrapper — sticky on desktop, fixed slide-in on mobile */}
      <div className={`sidebar-wrapper${mobileOpen ? ' open' : ''}`}>
        {sidebarContent}
      </div>
    </>
  );
}
