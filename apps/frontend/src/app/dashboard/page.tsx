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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") {
      fetchTasks();
      const s = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
        auth: { token: (session.user as any).accessToken }
      });
      setSocket(s);
      return () => { s.disconnect(); };
    }
  }, [status, router, session]);

  const fetchTasks = async () => {
    try {
      const isAdmin = (session?.user as any)?.role === 'NGO_ADMIN';
      const endpoint = isAdmin ? '/tasks/all' : '/tasks';
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      setTasks(res.data);
    } catch { console.error("Failed to fetch tasks"); }
  };

  if (status === "loading" || !session) return null;

  const pendingSurveys = tasks.filter((t) => t.status === "OPEN").length;
  const activeTasks = tasks.filter((t) => t.status === "ASSIGNED").length;
  const impactScore = "15%";

  const user = session!.user as any;
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
    countBadge: { fontFamily:"'Space Mono',monospace", fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase' as const, backgroundColor:PUR, color:'#FFFFFF', border:`2px solid ${BLACK}`, boxShadow:`2px 2px 0 ${WHITE}`, padding:'3px 10px' },
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

        <main style={S.main}>

          {/* ── HEADER ── */}
          <header style={S.header}>
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

          {/* ── METRIC CARDS ── */}
          {user.role !== 'VOLUNTEER' && (
            <div style={S.statsGrid}>
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
          <section style={S.mapSection}>
            <div style={S.mapHeader}>
              <div>
                <p style={{ ...S.cardLabel, color:'var(--muted-fg)', marginBottom:4 }}>Global Intelligence</p>
                <h2 style={S.mapTitle}>Geospatial [Need_Heatmap]</h2>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <input 
                  placeholder="Lat, Lng (e.g. 12.97, 77.59)" 
                  style={S.searchInput}
                  value={searchCoords}
                  onChange={(e) => setSearchCoords(e.target.value)}
                />
                <Button size="sm" onClick={() => {
                  const [lat, lng] = searchCoords.split(",").map(Number);
                  if (lat && lng) setCenterLocation([lat, lng]);
                }}>Search</Button>
                <Button size="sm" variant="outline" onClick={() => setCenterLocation(null)}>
                  <MapPin style={{ width:14, height:14 }} />
                </Button>
              </div>
            </div>
            <div style={{ flex:1, border:`2.5px solid ${BLACK}`, boxShadow:`6px 6px 0px ${WHITE}`, position:'relative', overflow:'hidden' }}>
              {user.role === 'VOLUNTEER' ? (
                <VolunteerMap center={centerLocation} />
              ) : (
                <MapboxHeatmap tasks={tasks} center={centerLocation} />
              )}
            </div>
          </section>

          {/* ── TASKS TABLE ── */}
          <section style={S.tableWrap}>
            <div style={S.tableHead}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <h2 style={S.tableTitle}>Task Queue</h2>
                <span style={S.countBadge}>{filtered.length} Records</span>
              </div>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
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
