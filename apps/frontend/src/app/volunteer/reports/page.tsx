"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Clock, CheckCircle, XCircle, MapPin, Calendar, Users } from "lucide-react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

const BLACK = 'var(--border-color)';
const PUR   = 'var(--pur)';
const YLW   = 'var(--ylw)';
const WHITE = 'var(--shadow-color)';
const FG    = 'var(--fg)';
const BG    = 'var(--bg)';

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:  { bg: YLW,      color: '#000',  label: 'Pending' },
  VERIFIED: { bg: '#22c55e', color: '#fff',  label: 'Verified' },
  REJECTED: { bg: '#ef4444', color: '#fff',  label: 'Rejected' },
};

export default function VolunteerReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchReports();
  }, [status]);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/completion-reports/my`, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      setReports(res.data);
    } catch { console.error("Failed to fetch reports"); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${BLACK}`, borderTopColor: PUR, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="neo-main">

        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: `2.5px solid ${BLACK}` }}>
          <h1 className="page-title">My Reports</h1>
          <p className="page-subtitle">{reports.length} record{reports.length !== 1 ? 's' : ''} found</p>
        </div>

        {reports.length === 0 ? (
          <div style={{ padding: '5rem', textAlign: 'center', border: `2.5px solid ${BLACK}`, boxShadow: `6px 6px 0 ${WHITE}` }}>
            <ClipboardCheck style={{ margin: '0 auto 1rem', width: 48, height: 48, color: 'var(--muted-fg)' }} />
            <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, textTransform: 'uppercase', fontSize: '1.1rem', color: FG, margin: '0 0 8px' }}>No Reports Yet</h3>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--muted-fg)' }}>
              Complete a task to submit your first report.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reports.map(report => {
              const s = STATUS_STYLES[report.status] || STATUS_STYLES.PENDING;
              const urgency = report.urgencyScore || 1;
              const date = new Date(report.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

              return (
                <div key={report._id} style={{
                  border: `2.5px solid ${BLACK}`,
                  boxShadow: `6px 6px 0 ${WHITE}`,
                  backgroundColor: 'var(--card-bg)',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  {/* Top row: title + status badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: FG, margin: 0 }}>
                        {report.title}
                      </h3>
                      {report.taskId?.description && (
                        <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--muted-fg)', margin: '4px 0 0' }}>
                          Task: {report.taskId.description}
                        </p>
                      )}
                    </div>
                    <span style={{
                      backgroundColor: s.bg, color: s.color,
                      border: `2px solid ${BLACK}`, padding: '4px 12px',
                      fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900,
                      fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      {report.status === 'PENDING' && <Clock style={{ width: 12, height: 12 }} />}
                      {report.status === 'VERIFIED' && <CheckCircle style={{ width: 12, height: 12 }} />}
                      {report.status === 'REJECTED' && <XCircle style={{ width: 12, height: 12 }} />}
                      {s.label}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                    <span className="neo-badge" style={{ backgroundColor: YLW, color: '#000', border: `2px solid ${BLACK}`, fontSize: '0.6rem' }}>
                      {report.category}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 70, height: 6, backgroundColor: BG, border: `1.5px solid ${BLACK}`, overflow: 'hidden', position: 'relative' }}>
                        <div style={{ height: '100%', position: 'absolute', left: 0, top: 0, width: `${(urgency / 5) * 100}%`, background: 'linear-gradient(to right, #3b82f6, #ef4444)' }} />
                      </div>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem', color: 'var(--muted-fg)' }}>Urgency {urgency}/5</span>
                    </div>
                    {report.affectedPeople > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted-fg)' }}>
                        <Users style={{ width: 12, height: 12 }} />
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem' }}>{report.affectedPeople} affected</span>
                      </div>
                    )}
                    {report.location?.coordinates?.length >= 2 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted-fg)' }}>
                        <MapPin style={{ width: 12, height: 12 }} />
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem' }}>
                          {Number(report.location.coordinates[1]).toFixed(4)}, {Number(report.location.coordinates[0]).toFixed(4)}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted-fg)' }}>
                      <Calendar style={{ width: 12, height: 12 }} />
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem' }}>{date}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.75rem', color: FG, margin: 0, lineHeight: 1.6 }}>
                    {report.description}
                  </p>

                  {/* Proof images */}
                  {report.proofImageUrls?.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      {report.proofImageUrls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img
                            src={url}
                            alt={`proof-${i}`}
                            style={{ width: 72, height: 72, objectFit: 'cover', border: `2px solid ${BLACK}` }}
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
