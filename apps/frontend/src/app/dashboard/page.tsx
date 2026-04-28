"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { LogOut, MapPin, ChevronDown, Filter, LayoutDashboard, CheckCircle2, Navigation } from "lucide-react";
import dynamic from "next/dynamic";
import axios from "axios";
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
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [navigatingToTask, setNavigatingToTask] = useState<string | null>(null);
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
    setIsLoadingTasks(true);
    setTaskError(null);
    try {
      const isAdmin = user?.role === 'NGO_ADMIN';
      const endpoint = isAdmin ? '/tasks/all' : '/tasks';
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${user?.accessToken}` }
      });
      console.log('[Dashboard] Fetched tasks:', res.data);
      setTasks(res.data);

      // Check if volunteer has an active task
      if (user?.role === 'VOLUNTEER') {
        const activeTask = res.data.find((t: any) => 
          t.status === 'ASSIGNED' && t.assignedVolunteerId?._id === user?.id
        );
        setActiveTaskId(activeTask?._id || null);
      }
    } catch (err: any) {
      console.error("Failed to fetch tasks:", err.response?.data || err.message);
      setTaskError(err.response?.data?.message || err.message || 'Failed to load tasks');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/accept`, {}, {
        headers: { Authorization: `Bearer ${user?.accessToken}` }
      });
      setActiveTaskId(taskId);
      fetchTasks(); // Refresh
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept task');
    }
  };

  const handleNavigateToTask = (task: any) => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setNavigatingToTask(task._id);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const [taskLng, taskLat] = task.location.coordinates;

        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (taskLat - userLat) * Math.PI / 180;
        const dLng = (taskLng - userLng) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLat * Math.PI / 180) * Math.cos(taskLat * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Open Google Maps with directions
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${taskLat},${taskLng}&travelmode=driving`;
        
        // Show distance alert
        alert(`Distance to task: ${distance.toFixed(2)} km\n\nOpening Google Maps for navigation...`);
        
        // Open in new tab
        window.open(mapsUrl, '_blank');
        
        setNavigatingToTask(null);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please enable location services.");
        setNavigatingToTask(null);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleLocateTask = (task: any) => {
    if (task.location?.coordinates?.length >= 2) {
      // Coordinates are stored as [lng, lat] — Leaflet needs [lat, lng]
      const [lng, lat] = task.location.coordinates;
      setCenterLocation([lat, lng]);
      // Scroll to map
      document.querySelector('.map-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearch = () => {
    const [lat, lng] = searchCoords.split(",").map(s => Number(s.trim()));
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      setCenterLocation([lat, lng]);
    } else {
      alert('Enter coordinates as: Lat, Lng (e.g. 12.9716, 77.5946)');
    }
  };

  if (status === "loading" || !session) return null;

  const pendingSurveys = tasks.filter((t) => t.status === "OPEN").length;
  const activeTasks = tasks.filter((t) => t.status === "ASSIGNED").length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED" || t.status === "VERIFIED").length;
  const impactScore = tasks.length > 0
    ? `${Math.round((completedTasks / tasks.length) * 100)}%`
    : "N/A";
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
            <style>{`
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
            </div>
          </header>

          {/* ── MOBILE TITLE ── */}
          <div className="mobile-only" style={{ display: 'none', marginBottom: '24px', padding: '0 16px' }}>
            <style>{`
              @media (max-width: 767px) { .mobile-only { display: block !important; } }
            `}</style>
            <h1 style={{ ...S.h1, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>Overview</h1>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-fg)', marginTop: 4 }}>
              Logged in as {user.name}
            </p>
          </div>

          {/* ── ERROR BANNER ── */}
          {taskError && (
            <div style={{ margin: '1rem 2rem', padding: '1rem 1.5rem', backgroundColor: 'var(--accent-critical)', border: `2.5px solid ${BLACK}`, boxShadow: `4px 4px 0 ${WHITE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#fff', margin: 0 }}>API Error</p>
                <p style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: '0.75rem', color: '#fff', margin: '4px 0 0' }}>{taskError}</p>
              </div>
              <button
                onClick={fetchTasks}
                style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 16px', backgroundColor: '#fff', color: '#000', border: `2px solid ${BLACK}`, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Retry
              </button>
            </div>
          )}

          {/* ── LOADING INDICATOR ── */}
          {isLoadingTasks && (
            <div style={{ margin: '0.5rem 2rem', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.7 }}>
              <div style={{ width: 14, height: 14, border: `2px solid ${BLACK}`, borderTopColor: 'var(--pur)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-fg)' }}>Loading tasks...</span>
            </div>
          )}

          {/* ── METRIC CARDS ── */}
          {user.role !== 'VOLUNTEER' && (
            <div className="stats-grid" style={S.statsGrid}>
              <style>{`
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
            <style>{`
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
              {user.role !== 'VOLUNTEER' && (
                <div style={{ display:'flex', gap:12, width: '100%', maxWidth: '400px' }}>
                  <input 
                    placeholder="Lat, Lng  e.g. 12.97, 77.59" 
                    style={{ ...S.searchInput, flex: 1 }}
                    value={searchCoords}
                    onChange={(e) => setSearchCoords(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button size="sm" onClick={handleSearch}>Search</Button>
                </div>
              )}
            </div>
            <div className="map-container" style={{ flex:1, border:`2.5px solid ${BLACK}`, boxShadow:`4px 4px 0px ${WHITE}`, position:'relative', overflow:'hidden', minHeight: '300px' }}>
            {/* ── VOLUNTEER MAP with heatmap support ── */}
              {user.role === 'VOLUNTEER' ? (
                <VolunteerMap isOnDuty={isOnDuty} tasks={tasks} centerLocation={centerLocation} />
              ) : (
                <MapboxHeatmap tasks={tasks} centerLocation={centerLocation} />
              )}
            </div>
          </section>

          {/* ── TASKS TABLE ── */}
          <section className="table-wrap-container" style={S.tableWrap}>
            <style>{`
              @media (max-width: 1024px) {
                .desktop-only { display: none !important; }
                .mobile-only { display: block !important; }
                
                .table-wrap-container {
                  margin: 16px !important;
                  box-shadow: 4px 4px 0px ${WHITE} !important;
                }
                .table-header-inner {
                  padding: 1.5rem !important;
                  flex-direction: column !important;
                  align-items: flex-start !important;
                  gap: 1rem !important;
                }
                .table-controls-row {
                  width: 100% !important;
                  display: flex !important;
                  justify-content: space-between !important;
                  gap: 12px !important;
                }
                .table-controls-row > div {
                  flex: 1;
                }
                .table-controls-row select {
                  width: 100%;
                }
              }
              @media (min-width: 1025px) {
                .mobile-only { display: none !important; }
                .desktop-only { display: block !important; }
              }
            `}</style>
            
            <div className="table-header-inner" style={S.tableHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={S.tableTitle}>Task Queue</h2>
                <LayoutDashboard style={{ width: 18, height: 18, color: PUR }} />
              </div>
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
            <div className="desktop-only">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Description</th>
                      <th style={S.th}>Category</th>
                      <th style={S.th}>Urgency</th>
                      <th style={S.th}>Status</th>
                      <th style={{ ...S.th, borderRight: 'none' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.length === 0 && !isLoadingTasks && (
                      <tr>
                        <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', fontFamily: "'Space Mono',monospace", fontSize: '0.75rem', color: 'var(--muted-fg)' }}>
                          {taskError ? 'Error loading tasks — see banner above' : 'No tasks yet. Submit a survey to create one.'}
                        </td>
                      </tr>
                    )}
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
                        <td style={{ ...S.td, borderRight: 'none' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Volunteer: Accept OPEN tasks (only if no active task) */}
                            {user.role === 'VOLUNTEER' && task.status === 'OPEN' && (
                              <button
                                onClick={() => handleAcceptTask(task._id)}
                                disabled={!!activeTaskId}
                                title={activeTaskId ? "Complete your current task first" : "Accept Task"}
                                style={{ 
                                  display:'flex', 
                                  alignItems:'center', 
                                  gap:4, 
                                  fontFamily:"'Plus Jakarta Sans',sans-serif", 
                                  fontWeight:900, 
                                  fontSize:'0.55rem', 
                                  textTransform:'uppercase', 
                                  letterSpacing:'0.1em', 
                                  padding:'4px 10px', 
                                  backgroundColor: activeTaskId ? 'var(--muted-fg)' : 'var(--pur)', 
                                  color:'#fff', 
                                  border:`2px solid var(--border-color)`, 
                                  boxShadow:`2px 2px 0 var(--shadow-color)`, 
                                  cursor: activeTaskId ? 'not-allowed' : 'pointer',
                                  opacity: activeTaskId ? 0.5 : 1
                                }}
                              >
                                <CheckCircle2 style={{ width:12, height:12 }} /> Accept
                              </button>
                            )}
                            {/* Volunteer: Navigate to ASSIGNED task */}
                            {user.role === 'VOLUNTEER' && task.status === 'ASSIGNED' && task.assignedVolunteerId?._id === user?.id && (
                              <>
                                <button
                                  onClick={() => {
                                    console.log('Navigate clicked - Task:', task._id, 'Assigned to:', task.assignedVolunteerId?._id, 'Current user:', user?.id);
                                    handleNavigateToTask(task);
                                  }}
                                  disabled={navigatingToTask === task._id}
                                  title="Navigate to task location"
                                  style={{ 
                                    display:'flex', 
                                    alignItems:'center', 
                                    gap:4, 
                                    fontFamily:"'Plus Jakarta Sans',sans-serif", 
                                    fontWeight:900, 
                                    fontSize:'0.55rem', 
                                    textTransform:'uppercase', 
                                    letterSpacing:'0.1em', 
                                    padding:'4px 10px', 
                                    backgroundColor:'var(--accent-success)', 
                                    color:'#fff', 
                                    border:`2px solid var(--border-color)`, 
                                    boxShadow:`2px 2px 0 var(--shadow-color)`, 
                                    cursor:'pointer' 
                                  }}
                                >
                                  <Navigation style={{ width:12, height:12 }} /> Navigate
                                </button>
                                <button
                                  onClick={() => {
                                    // Navigate to completion report page
                                    router.push(`/tasks/complete/${task._id}`);
                                  }}
                                  title="Mark task as completed"
                                  style={{ 
                                    display:'flex', 
                                    alignItems:'center', 
                                    gap:4, 
                                    fontFamily:"'Plus Jakarta Sans',sans-serif", 
                                    fontWeight:900, 
                                    fontSize:'0.55rem', 
                                    textTransform:'uppercase', 
                                    letterSpacing:'0.1em', 
                                    padding:'4px 10px', 
                                    backgroundColor:'#10b981', 
                                    color:'#fff', 
                                    border:`2px solid var(--border-color)`, 
                                    boxShadow:`2px 2px 0 var(--shadow-color)`, 
                                    cursor:'pointer' 
                                  }}
                                >
                                  <CheckCircle2 style={{ width:12, height:12 }} /> Complete
                                </button>
                              </>
                            )}
                            {/* All roles: Locate task on map */}
                            <button
                              onClick={() => handleLocateTask(task)}
                              title="Locate on map"
                              style={{ display:'flex', alignItems:'center', gap:4, fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:'0.55rem', textTransform:'uppercase', letterSpacing:'0.1em', padding:'4px 10px', backgroundColor:'var(--ylw)', color:'#000', border:`2px solid var(--border-color)`, boxShadow:`2px 2px 0 var(--shadow-color)`, cursor:'pointer' }}
                            >
                              <Navigation style={{ width:12, height:12 }} /> Locate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card Stack */}
            <div className="mobile-only">
              <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                {displayed.length === 0 ? (
                  <div style={{ padding: '3rem 1.5rem', border: `2px solid ${BLACK}`, backgroundColor: '#FFFFFF', textAlign: 'center', boxShadow: `4px 4px 0px #000` }}>
                    <LayoutDashboard style={{ width: 48, height: 48, color: 'var(--muted-fg)', margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-fg)' }}>
                      Global Tasks (0)
                    </p>
                  </div>
                ) : (
                  displayed.map((task) => (
                    <div key={task._id} style={{ border: `2px solid ${BLACK}`, padding: '1.5rem', backgroundColor: 'var(--card-bg)', boxShadow: `4px 4px 0px #000`, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ marginBottom: 16 }}>
                        <div className="neo-scroll-content" style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '8px', marginBottom: 16 }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, lineHeight: 1.3 }}>{task.description}</h3>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Category</span>
                            <span className="neo-badge" style={{ color: PUR, border: `2px solid ${BLACK}`, backgroundColor: 'transparent', padding: '2px 8px', fontSize: '0.7rem' }}>{task.category}</span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Urgency</span>
                            <span style={{ ...urgencyStyle(task.urgencyScore), boxShadow: '2px 2px 0 #000' }}>
                              Priority {task.urgencyScore}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</span>
                            <span style={statusStyle(task.status)}>{task.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Action Buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                        {user.role === 'VOLUNTEER' && task.status === 'OPEN' && (
                          <button
                            onClick={() => handleAcceptTask(task._id)}
                            disabled={!!activeTaskId}
                            title={activeTaskId ? "Complete your current task first" : "Accept Task"}
                            style={{ 
                              flex: 1,
                              padding: '10px 16px', 
                              background: activeTaskId ? 'var(--muted-fg)' : 'var(--pur)', 
                              border: `2px solid ${BLACK}`, 
                              cursor: activeTaskId ? 'not-allowed' : 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: 6, 
                              boxShadow: `3px 3px 0px 0px #000`, 
                              fontFamily: "'Plus Jakarta Sans',sans-serif", 
                              fontWeight: 900, 
                              fontSize: '0.65rem', 
                              color: '#fff', 
                              textTransform: 'uppercase',
                              opacity: activeTaskId ? 0.5 : 1
                            }}
                          >
                            <CheckCircle2 style={{ width: 16, height: 16 }} /> Accept
                          </button>
                        )}
                        {user.role === 'VOLUNTEER' && task.status === 'ASSIGNED' && task.assignedVolunteerId?._id === user?.id && (
                          <>
                            <button 
                              onClick={() => handleNavigateToTask(task)} 
                              disabled={navigatingToTask === task._id}
                              style={{ 
                                flex: 1,
                                padding: '10px 16px', 
                                background: 'var(--accent-success)', 
                                border: `2px solid ${BLACK}`, 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                gap: 6, 
                                boxShadow: `3px 3px 0px 0px #000`, 
                                fontFamily: "'Plus Jakarta Sans',sans-serif", 
                                fontWeight: 900, 
                                fontSize: '0.65rem', 
                                color: '#fff', 
                                textTransform: 'uppercase' 
                              }}
                            >
                              <Navigation style={{ width: 16, height: 16 }} /> Navigate
                            </button>
                            <button 
                              onClick={() => {
                                // Navigate to completion report page
                                router.push(`/tasks/complete/${task._id}`);
                              }}
                              style={{ 
                                flex: 1,
                                padding: '10px 16px', 
                                background: '#10b981', 
                                border: `2px solid ${BLACK}`, 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                gap: 6, 
                                boxShadow: `3px 3px 0px 0px #000`, 
                                fontFamily: "'Plus Jakarta Sans',sans-serif", 
                                fontWeight: 900, 
                                fontSize: '0.65rem', 
                                color: '#fff', 
                                textTransform: 'uppercase' 
                              }}
                            >
                              <CheckCircle2 style={{ width: 16, height: 16 }} /> Complete
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleLocateTask(task)} 
                          style={{ 
                            flex: user.role === 'VOLUNTEER' && (task.status === 'OPEN' || (task.status === 'ASSIGNED' && task.assignedVolunteerId?._id === user?.id)) ? 0 : 1,
                            minWidth: '100px',
                            padding: '10px 16px', 
                            background: 'var(--ylw)', 
                            border: `2px solid ${BLACK}`, 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: 6, 
                            boxShadow: `3px 3px 0px 0px #000`, 
                            fontFamily: "'Plus Jakarta Sans',sans-serif", 
                            fontWeight: 900, 
                            fontSize: '0.65rem', 
                            color: '#000', 
                            textTransform: 'uppercase' 
                          }}
                        >
                          <MapPin style={{ width: 16, height: 16 }} /> Locate
                        </button>
                      </div>
                    </div>
                  ))
                )}
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
