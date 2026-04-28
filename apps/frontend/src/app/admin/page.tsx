"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Trash2, Users, LayoutDashboard } from "lucide-react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

const BG    = 'var(--bg)';
const BLACK = 'var(--border-color)';
const PUR   = 'var(--pur)';
const YLW   = 'var(--ylw)';
const SUCC  = 'var(--accent-success)';
const WHITE = 'var(--shadow-color)';
const FG    = 'var(--fg)';
const CARD  = { backgroundColor: 'var(--card-bg)', border: `2.5px solid ${BLACK}`, boxShadow: `6px 6px 0px ${WHITE}` };
const TH    = { padding: '12px 24px', fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#000', backgroundColor: YLW, borderRight: `2px solid ${BLACK}`, borderBottom: `2.5px solid ${BLACK}` };
const TD    = { padding: '12px 24px', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem', color: FG, borderRight: `1px solid rgba(128,128,128,0.2)`, borderBottom: `1px solid rgba(128,128,128,0.2)` };


export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'users'>('tasks');

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'NGO_ADMIN') fetchData();
    else if (session?.user) router.push("/dashboard");
  }, [session, router]);

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` } };
      const [tasksRes, usersRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tasks/all`, config),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users`, config)
      ]);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
    } catch (error) { 
      console.error("Failed to fetch admin data:", error); 
    }
  };

  const handleVerify = async (taskId: string) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/verify`, {}, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      fetchData();
    } catch { alert("Failed to verify task"); }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      fetchData();
    } catch { alert("Failed to delete task"); }
  };

  if (status === "loading" || !session) return null;

  const tabBtn = (tab: 'tasks' | 'users', label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.75rem',
        textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 24px',
        backgroundColor: activeTab === tab ? PUR : 'var(--bg)',
        color: activeTab === tab ? '#FFFFFF' : '#000000', border: `2.5px solid ${BLACK}`,
        boxShadow: activeTab === tab ? `4px 4px 0 ${WHITE}` : `6px 6px 0 ${WHITE}`,
        transform: activeTab === tab ? 'translate(2px,2px)' : 'none',
        cursor: 'pointer', transition: 'all 0.1s',
      }}
    >
      {label}
    </button>
  );

  const statusBadge = (s: string) => {
    const bg = s === 'VERIFIED' ? SUCC : s === 'COMPLETED' ? PUR : 'var(--bg)';
    const color = (s === 'VERIFIED' || s === 'COMPLETED') ? '#FFFFFF' : '#000000';
    return (
      <span style={{ 
        fontFamily: "'Space Mono',monospace", 
        fontWeight: 700, 
        fontSize: '0.6rem', 
        textTransform: 'uppercase', 
        letterSpacing: '0.08em', 
        backgroundColor: bg, 
        color: color, 
        border: `2px solid ${BLACK}`, 
        boxShadow: `3px 3px 0px 0px #000`, 
        padding: '4px 12px', 
        display: 'inline-block',
        minWidth: 'fit-content'
      }}>
        {s}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: BG }}>
      <Sidebar />
      <main className="neo-main" style={{ flex: 1, overflowY: 'auto', backgroundColor: BG }}>
        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `2.5px solid ${BLACK}`, paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '2.2rem', textTransform: 'uppercase', letterSpacing: '-0.04em', color: FG, margin: 0 }}>
              Admin Panel
            </h1>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--muted-fg)', marginTop: 10 }}>
              System oversight and resource management.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {tabBtn('tasks', 'Task Queue')}
            {tabBtn('users', 'User Base')}
          </div>
        </div>

        {activeTab === 'tasks' ? (
          <div className="neo-card-full-deep" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: `2.5px solid ${BLACK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card-bg)' }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '1rem', color: FG, margin: 0 }}>Global Tasks ({tasks.length})</h2>
              <LayoutDashboard style={{ width: 20, height: 20, color: PUR }} />
            </div>

            {/* Desktop Table */}
            <div className="desktop-only" style={{ display: 'block' }}>
              <style>{`
                @media (max-width: 767px) { .desktop-only { display: none !important; } }
              `}</style>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH}>Title</th>
                    <th style={TH}>Category</th>
                    <th style={TH}>Urgency</th>
                    <th style={TH}>Status</th>
                    <th style={TH}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t._id}>
                      <td style={TD}>{t.title}</td>
                      <td style={TD}>{t.category}</td>
                      <td style={TD}>{t.urgencyScore}</td>
                      <td style={TD}>{statusBadge(t.status)}</td>
                      <td style={TD}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          {t.status === 'COMPLETED' && (
                            <button onClick={() => handleVerify(t._id)} style={{ padding: '4px', background: PUR, border: `1.5px solid ${BLACK}`, cursor: 'pointer' }}>
                              <CheckCircle2 style={{ width: 14, height: 14, color: '#FFFFFF' }} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(t._id)} style={{ padding: '4px', background: 'var(--accent-critical)', border: `1.5px solid ${BLACK}`, cursor: 'pointer' }}>
                            <Trash2 style={{ width: 14, height: 14, color: '#FFFFFF' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack */}
            <div className="mobile-only" style={{ display: 'none' }}>
              <style>{`
                @media (max-width: 767px) { .mobile-only { display: flex !important; flex-direction: column; gap: 16px; padding: 16px; } }
              `}</style>
              {tasks.map(t => (
                <div key={t._id} style={{ border: `2px solid ${BLACK}`, padding: '1rem', backgroundColor: 'var(--card-bg)', boxShadow: `3px 3px 0px 0px #000`, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: 12 }}>
                    <span className="neo-badge" style={{ color: PUR, marginBottom: 12, border: `2.5px solid ${BLACK}` }}>{t.category}</span>
                    <div className="neo-scroll-content" style={{ maxHeight: '100px', paddingRight: '4px' }}>
                      <h3 style={{ margin: '4px 0', fontSize: '1rem', fontWeight: 900 }}>{t.title}</h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', fontFamily: "'Space Mono', monospace" }}>Urgency: {t.urgencyScore}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12 }}>
                    {statusBadge(t.status)}
                    <div style={{ display: 'flex', gap: 12 }}>
                      {t.status === 'COMPLETED' && (
                        <button onClick={() => handleVerify(t._id)} style={{ padding: '8px', background: PUR, border: `2px solid ${BLACK}`, cursor: 'pointer', display: 'flex', boxShadow: `3px 3px 0px 0px #000` }}>
                          <CheckCircle2 style={{ width: 16, height: 16, color: '#FFFFFF' }} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(t._id)} style={{ padding: '8px', background: 'var(--accent-critical)', border: `2px solid ${BLACK}`, cursor: 'pointer', display: 'flex', boxShadow: `3px 3px 0px 0px #000` }}>
                        <Trash2 style={{ width: 16, height: 16, color: '#FFFFFF' }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="neo-card-full-deep" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: `2.5px solid ${BLACK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card-bg)' }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '1rem', color: FG, margin: 0 }}>Active Users ({users.length})</h2>
              <Users style={{ width: 20, height: 20, color: PUR }} />
            </div>

            {/* Desktop Table */}
            <div className="desktop-only" style={{ display: 'block' }}>
              <style>{`
                @media (max-width: 767px) { .desktop-only { display: none !important; } }
              `}</style>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH}>Name</th>
                    <th style={TH}>Email</th>
                    <th style={TH}>Role</th>
                    <th style={TH}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td style={TD}>{u.name}</td>
                      <td style={TD}>{u.email}</td>
                      <td style={TD}>{u.role}</td>
                      <td style={TD}>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', border: `1.5px solid ${BLACK}`, background: u.isVerified ? SUCC : YLW, color: u.isVerified ? '#FFFFFF' : '#000000' }}>
                          {u.isVerified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack */}
            <div className="mobile-only" style={{ display: 'none' }}>
              <style>{`
                @media (max-width: 767px) { .mobile-only { display: flex !important; flex-direction: column; gap: 16px; padding: 16px; } }
              `}</style>
              {users.map(u => (
                <div key={u._id} style={{ border: `2px solid ${BLACK}`, padding: '1rem', backgroundColor: 'var(--card-bg)', boxShadow: `4px 4px 0 ${WHITE}`, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: 12 }}>
                    <span className="neo-badge" style={{ color: PUR, marginBottom: 12, border: `2.5px solid ${BLACK}` }}>{u.role}</span>
                    <div className="neo-scroll-content" style={{ maxHeight: '100px', paddingRight: '4px' }}>
                      <h3 style={{ margin: '4px 0', fontSize: '1rem', fontWeight: 900 }}>{u.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.75rem', fontFamily: "'Space Mono', monospace" }}>{u.email}</p>
                    </div>
                  </div>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem', fontWeight: 700, padding: '4px 12px', border: `1.5px solid ${BLACK}`, background: u.isVerified ? SUCC : YLW, color: u.isVerified ? '#FFFFFF' : '#000000', display: 'inline-block', width: 'fit-content', marginTop: 'auto' }}>
                    {u.isVerified ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
