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
  const user = session?.user as any;
  const [tasks, setTasks] = useState<any[]>([]);
  const [centerLocation, setCenterLocation] = useState<[number, number] | null>(null);
  const [searchCoords, setSearchCoords] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [isOnDuty, setIsOnDuty] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && user) {
      // Redirect Admin to onboarding if they haven't created an NGO yet
      if (user.role === 'NGO_ADMIN' && !user.ngoId) {
        router.push("/ngo/onboarding");
        return;
      }

      fetchTasks();
      const s = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
        auth: { token: (session?.user as any)?.accessToken }
      });
      setSocket(s);
      return () => { s.disconnect(); };
    }
  }, [status, router, session, user?.role, user?.ngoId]);

  const fetchTasks = async () => {
    try {
      const isAdmin = user?.role === 'NGO_ADMIN';
      const endpoint = isAdmin ? '/tasks/all' : '/tasks';
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${user?.accessToken}` }
      });
      setTasks(res.data);
    } catch { console.error("Failed to fetch tasks"); }
  };

  if (status === "loading" || !session) return null;

  const pendingSurveys = tasks.filter((t) => t.status === "OPEN").length;
  const activeTasks = tasks.filter((t) => t.status === "ASSIGNED").length;
  const impactScore = "15%";
  const categories = ["ALL", ...Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)))];
  const filtered = filterCategory === "ALL" ? tasks : tasks.filter((t) => t.category === filterCategory);
  const displayed = showAll ? filtered : filtered.slice(0, 5);

  const BLACK = 'var(--border-color)';
  const WHITE = 'var(--shadow-color)';
  const PUR   = 'var(--pur)';
  const YLW   = 'var(--ylw)';
  const CRIT  = 'var(--accent-critical)';
  const SUCC  = 'var(--accent-success)';
  const SIDEBAR_BG = 'var(--sidebar-bg)';

  // ─── Theme-Aware Inline style tokens ──────────────────────────────────────
  const S = {
    page:       { display:'flex', height:'100vh', backgroundColor:'var(--bg)', position:'relative' as const },
    main:       { flex:1, overflowY:'auto' as const, backgroundColor:'var(--bg)' },
    header:     { display:'flex', height:80, alignItems:'center', justifyContent:'space-between', padding:'0 2rem', backgroundColor:'var(--header-bg)', borderBottom:'2.5px solid var(--border-color)' },
    h1:         { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:'1.1rem', textTransform:'uppercase' as const, letterSpacing:'0.2em', color:'var(--fg)', margin:0 },
    roleBadge:  { fontFamily:"'Space Mono',monospace", fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.2em', backgroundColor:PUR, color:'#FFFFFF', border:`2px solid ${BLACK}`, boxShadow:`2px 2px 0 ${WHITE}`, padding:'4px 12px' },
    statsGrid:  { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'2rem', padding:'2rem 2rem 0' },
    cardPurple: { backgroundColor:PUR, border:`2.5px solid ${BLACK}`, boxShadow:`6px 6px 0px ${WHITE}`, padding:'2rem' },
    cardYellow: { backgroundColor:YLW, border:`2.5px solid ${BLACK}`, boxShadow:`6px 6px 0px ${WHITE}`, padding:'2rem' },
    cardLabel:  { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:'0.6rem', textTransform:'uppercase' as const, letterSpacing:'0.25em', color:'#000', marginBottom:8 },
    cardValue:  { fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:'3.5rem', color:'#000', lineHeight:1, margin:0 },
    cardValueWhite: { fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:'3.5rem', color:'#FFFFFF', lineHeight:1, margin:0 },
    cardLabelWhite: { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:'0.6rem', textTransform:'uppercase' as const, letterSpacing:'0.25em', color:'#FFFFFF', marginBottom:8 },
    mapSection: { padding:'2rem', display:'flex', flexDirection:'column' as const, height:500 },
    mapHeader:  { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:16, paddingBottom:16, borderBottom:`2.5px solid var(--border-color)` },
    mapTitle:   { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:'1.4rem', textTransform:'uppercase' as const, letterSpacing:'-0.05em', color:'var(--fg)', margin:0 },
    searchInput:{ border:`2.5px solid ${BLACK}`, padding:'8px 12px', backgroundColor:'var(--card-bg)', fontFamily:"'Space Mono',monospace", fontSize:'0.75rem', outline:'none', color:'var(--fg)', boxShadow:`4px 4px 0 ${WHITE}` },
    tableWrap:  { margin:'0 2rem 2rem', backgroundColor:'var(--card-bg)', border:`2.5px solid ${BLACK}`, boxShadow:`6px 6px 0px ${WHITE}`, overflow:'hidden' },
    tableHead:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.5rem', borderBottom:`2.5px solid var(--border-color)` },
    tableTitle: { fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:'1.1rem', color:'var(--fg)', margin:0 },
    countBadge: { fontFamily:"'Space Mono',monospace", fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase' as const, backgroundColor:PUR, color:'#FFFFFF', border:`2px solid ${BLACK}`, boxShadow:`3px 3px 0px 0px #000`, padding:'4px 12px', minWidth: 'fit-content', whiteSpace: 'nowrap' },
    th:         { padding:'12px 24px', fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:'0.65rem', textTransform:'uppercase' as const, letterSpacing:'0.1em', color:'#000', backgroundColor:YLW, borderRight:`2px solid ${BLACK}`, borderBottom:`2.5px solid ${BLACK}` },
    td:         { padding:'12px 24px', fontFamily:"'Space Mono',monospace", fontSize:'0.8rem', color:'var(--fg)', borderRight:'1px solid rgba(128,128,128,0.2)', borderBottom:'1px solid rgba(128,128,128,0.2)' },
    tdB:        { padding:'12px 24px', borderRight:'1px solid rgba(128,128,128,0.2)', borderBottom:'1px solid rgba(128,128,128,0.2)' },
    select:     { appearance:'none' as const, backgroundColor:'var(--card-bg)', border:`2px solid ${BLACK}`, padding:'6px 32px', fontFamily:"'Space Mono',monospace", fontSize:'0.7rem', fontWeight:700, cursor:'pointer', color:'var(--fg)' },
  };

  const statusStyle = (st: string): React.CSSProperties => ({
    fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:'0.6rem', textTransform:'uppercase',
    letterSpacing:'0.1em', padding:'3px 8px', border:`2px solid ${BLACK}`, boxShadow:`2px 2px 0px ${WHITE}`, display:'inline-block',
    backgroundColor: st==='OPEN' ? PUR : st==='ASSIGNED' ? YLW : st==='COMPLETED' ? SUCC : 'var(--muted-fg)',
    color: (st==='OPEN' || st==='COMPLETED') ? '#FFFFFF' : '#000000',
  });

  const urgencyStyle = (score: number): React.CSSProperties => ({
    fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:'0.6rem', textTransform:'uppercase',
    padding:'3px 8px', border:`2px solid ${BLACK}`, boxShadow:`2px 2px 0px ${WHITE}`, display:'inline-block',
    backgroundColor: score >= 4 ? CRIT : YLW, 
    color: score >= 4 ? '#FFFFFF' : '#000000',
  });

  return (
    <VolunteerVerificationGuard>
      <div style={S.page}>
        <Sidebar />
        <NotificationModal socket={socket} volunteerLocation={centerLocation} />

      <main className="neo-main" style={{ flex:1, overflowY:'auto' as const, backgroundColor:'var(--bg)' }}>

          {/* ── HEADER (Desktop Only) ── */}
          <header className="desktop-only" style={{ ...S.header, display: 'flex' }}>
            <style jsx>{`
              @media (max-width: 767px) { .desktop-only { display: none !important; } }
            `}</style>
            <h1 style={S.h1}>Overview [ {user.name} ]</h1>
            <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
              {user.role === 'VOLUNTEER' && (
                <div style={{ display:'flex', alignItems:'center', gap:12, backgroundColor:'var(--card-bg)', border:`2px solid ${BLACK}`, padding:'6px 14px', boxShadow: `3px 3px 0 ${WHITE}` }}>
                  <span style={{ fontSize:'0.8rem', fontWeight:700, color: isOnDuty ? SUCC : 'var(--muted-fg)' }}>
                    {isOnDuty ? 'On Duty' : 'Off Duty'}
                  </span>
                  <button
                    onClick={() => setIsOnDuty(!isOnDuty)}
                    style={{ position:'relative', width:44, height:24, borderRadius:9999, backgroundColor: isOnDuty ? SUCC : '#444', border:'none', cursor:'pointer' }}
                  >
                    <span style={{ position:'absolute', top:4, left: isOnDuty ? 22 : 4, width:16, height:16, borderRadius:'50%', backgroundColor:WHITE, transition:'left 0.2s' }} />
                  </button>
                </div>
              )}
              <span style={S.roleBadge}>{user.role}</span>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut style={{ marginRight:8, width:16, height:16, strokeWidth:1.5 }} />
                Logout
              </Button>
            </div>
          </header>

          {/* ── MOBILE TITLE ── */}
          <div className="mobile-only" style={{ display: 'none', marginBottom: '24px', padding: '0 16px' }}>
            <style jsx>{`
              @media (max-width: 767px) { .mobile-only { display: block !important; } }
            `}</style>
            <h1 style={{ ...S.h1, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>Overview</h1>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-fg)', marginTop: 4 }}>
              Logged in as {user.name}
            </p>
          </div>

          {/* ── METRIC CARDS ── */}
          {user.role !== 'VOLUNTEER' && (
            <div className="stats-grid" style={S.statsGrid}>
              <style jsx>{`
                @media (max-width: 767px) { 
                  .stats-grid { 
                    display: flex !important; 
                    flex-direction: column !important; 
                    padding: 0 16px !important;
                    gap: 16px !important;
                  } 
                  .stats-grid > div {
                    width: 100% !important;
                    padding: 1.5rem !important;
                  }
                }
              `}</style>
              <div style={S.cardPurple}>
                <p style={S.cardLabelWhite}>Pending Surveys</p>
                <p style={S.cardValueWhite}>{pendingSurveys}</p>
              </div>
              <div style={S.cardYellow}>
                <p style={S.cardLabel}>Active Tasks</p>
                <p style={S.cardValue}>{activeTasks}</p>
              </div>
              <div style={{ ...S.cardPurple, backgroundColor:YLW }}>
                <p style={S.cardLabel}>Community Impact</p>
                <p style={S.cardValue}>{impactScore}</p>
              </div>
            </div>
          )}

          {/* ── GEOSPATIAL ── */}
          <section className="map-section" style={S.mapSection}>
            <style jsx>{`
              @media (max-width: 767px) {
                .map-section {
                  padding: 16px !important;
                  height: auto !important;
                }
                .map-container {
                  aspect-ratio: 1 / 1 !important;
                  height: auto !important;
                }
                .map-header-inner {
                  flex-direction: column !important;
                  align-items: flex-start !important;
                  gap: 12px !important;
                }
              }
            `}</style>
            <div className="map-header-inner" style={S.mapHeader}>
              <div>
                <p style={{ ...S.cardLabel, color:'var(--muted-fg)', marginBottom:4 }}>Global Intelligence</p>
                <h2 style={S.mapTitle}>Geospatial [Heatmap]</h2>
              </div>
              <div style={{ display:'flex', gap:12, width: '100%', maxWidth: '400px' }}>
                <input 
                  placeholder="Lat, Lng" 
                  style={{ ...S.searchInput, flex: 1 }}
                  value={searchCoords}
                  onChange={(e) => setSearchCoords(e.target.value)}
                />
                <Button size="sm" onClick={() => {
                  const [lat, lng] = searchCoords.split(",").map(Number);
                  if (lat && lng) setCenterLocation([lat, lng]);
                }}>Search</Button>
              </div>
            </div>
            <div className="map-container" style={{ flex:1, border:`2.5px solid ${BLACK}`, boxShadow:`4px 4px 0px ${WHITE}`, position:'relative', overflow:'hidden', minHeight: '300px' }}>
              {user.role === 'VOLUNTEER' ? (
                <VolunteerMap center={centerLocation} />
              ) : (
                <MapboxHeatmap tasks={tasks} center={centerLocation} />
              )}
            </div>
          </section>

          {/* ── TASKS TABLE ── */}
          <section className="table-wrap-container" style={S.tableWrap}>
            <style jsx>{`
              @media (max-width: 767px) {
                .table-wrap-container {
                  margin: 16px !important;
                  box-shadow: 4px 4px 0px ${WHITE} !important;
                }
                .table-header-inner {
                  padding: 1rem !important;
                }
                @media (max-width: 600px) {
                  .table-header-inner {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    gap: 1rem !important;
                  }
                  .table-controls-row {
                    width: 100% !important;
                    justify-content: flex-start !important;
                    gap: 12px !important;
                  }
                }
              }
            `}</style>
            <div className="table-header-inner" style={S.tableHead}>
              <h2 style={S.tableTitle}>Task Queue</h2>
              <div className="table-controls-row" style={{ display:'flex', gap:12, alignItems:'center' }}>
                <span style={S.countBadge}>{filtered.length} Records</span>
                <div style={{ position:'relative' }}>
                  <select 
                    style={S.select}
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Filter style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:PUR }} />
                  <ChevronDown style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:PUR }} />
                </div>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="desktop-only" style={{ display: 'block' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Description</th>
                      <th style={S.th}>Category</th>
                      <th style={S.th}>Urgency</th>
                      <th style={S.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((task) => (
                      <tr key={task._id} style={{ borderBottom:`1px solid rgba(128,128,128,0.15)` }}>
                        <td style={S.td}>{task.description}</td>
                        <td style={S.td}>
                          <span style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase' }}>{task.category}</span>
                        </td>
                        <td style={S.td}>
                          <span style={urgencyStyle(task.urgencyScore)}>Priority {task.urgencyScore}</span>
                        </td>
                        <td style={S.td}>
                          <span style={statusStyle(task.status)}>{task.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card Stack */}
            <div className="mobile-only" style={{ display: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '1rem' }}>
                {displayed.map((task) => (
                  <div key={task._id} style={{ border: `2px solid ${BLACK}`, padding: '1rem', backgroundColor: 'var(--card-bg)', boxShadow: `3px 3px 0px 0px #000`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: 12 }}>
                      <span className="neo-badge" style={{ color: PUR, marginBottom: 12, border: `2.5px solid ${BLACK}` }}>{task.category}</span>
                      <div className="neo-scroll-content" style={{ maxHeight: '100px', paddingRight: '4px' }}>
                        <h3 style={{ margin: '4px 0', fontSize: '0.9rem', fontWeight: 900 }}>{task.description}</h3>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
                      <span className="neo-badge" style={{ backgroundColor: task.urgencyScore >= 4 ? 'var(--accent-critical)' : 'var(--ylw)', color: task.urgencyScore >= 4 ? '#FFFFFF' : '#000000', boxShadow: '2px 2px 0 #000' }}>
                        Priority {task.urgencyScore}
                      </span>
                      <span style={statusStyle(task.status)}>{task.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!showAll && filtered.length > 5 && (
              <div style={{ padding:'12px 24px', borderTop:`2.5px solid ${BLACK}`, textAlign:'center', backgroundColor:SIDEBAR_BG }}>
                <button onClick={() => setShowAll(true)} style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.1em', background:'none', border:'none', cursor:'pointer', color:PUR }}>
                  Showing {displayed.length} of {filtered.length} — Click to expand
                </button>
              </div>
            )}
          </section>

        </main>
      </div>
    </VolunteerVerificationGuard>
  );
}
