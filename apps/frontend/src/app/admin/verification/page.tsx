"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, Clock, MapPin, User } from "lucide-react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

const BG    = 'var(--bg)';
const BLACK = 'var(--border-color)';
const PUR   = 'var(--pur)';
const YLW   = 'var(--ylw)';
const CRIT  = 'var(--accent-critical)';
const WHITE = 'var(--shadow-color)';
const FG    = 'var(--fg)';
const CARD  = { backgroundColor: 'var(--card-bg)', border: `2.5px solid ${BLACK}`, boxShadow: `6px 6px 0px ${WHITE}` };

export default function VerificationQueuePage() {
  const { data: session, status } = useSession();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && (session?.user as any)?.role !== 'NGO_ADMIN') router.push("/dashboard");
    else if (status === "authenticated") fetchPendingSurveys();
  }, [status, session, router]);

  const fetchPendingSurveys = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/ngo/pending-reports`, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      setSurveys(res.data);
    } catch { console.error("Failed to fetch pending surveys"); }
    finally { setLoading(false); }
  };

  const handleVerify = async (surveyId: string, action: 'VERIFIED' | 'REJECTED') => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/verify`, { surveyId, action }, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      setSurveys(surveys.filter(s => s._id !== surveyId));
    } catch { alert(`Failed to ${action.toLowerCase()} survey`); }
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${BLACK}`, borderTopColor: PUR, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: BG }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: BG }}>

        {/* Page Header */}
        <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: `2.5px solid ${BLACK}` }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '2.2rem', textTransform: 'uppercase', letterSpacing: '-0.04em', color: FG, margin: 0 }}>
            Verification [ QUEUE ]
          </h1>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--muted-fg)', marginTop: 12 }}>
            Review and approve human intent records.
          </p>
        </div>

        {/* Queue List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 900 }}>
          {surveys.length === 0 ? (
            <div style={{ ...CARD, padding: '5rem', textAlign: 'center' }}>
              <Clock style={{ margin: '0 auto 1rem', width: 48, height: 48, color: 'var(--muted-fg)' }} />
              <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, textTransform: 'uppercase', fontSize: '1.2rem', color: FG, margin: '0 0 8px' }}>Queue Empty</h3>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--muted-fg)' }}>No pending records detected.</p>
            </div>
          ) : surveys.map((survey) => (
            <div key={survey._id} style={{ ...CARD, padding: '2rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                {/* Urgency + Category row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: 96, marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem', color: 'var(--muted-fg)' }}>1</span>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem', color: 'var(--muted-fg)' }}>5</span>
                    </div>
                    <div style={{ width: 96, height: 8, backgroundColor: 'var(--bg)', border: `1.5px solid ${BLACK}`, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: '100%', position: 'absolute', left: 0, top: 0, width: `${(survey.urgency / 5) * 100}%`, background: 'linear-gradient(to right, #3b82f6,#06b6d4,#eab308,#f97316,#ef4444)' }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: YLW, color: '#000000', border: `2px solid ${BLACK}`, boxShadow: `2px 2px 0 ${WHITE}`, padding: '3px 10px' }}>
                    {survey.category}
                  </span>
                </div>

                <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '1.3rem', textTransform: 'uppercase', color: FG, margin: '0 0 16px' }}>
                  {survey.description}
                </h3>

                {/* Data stack */}
                {survey.dataStack && Object.keys(survey.dataStack).length > 0 && (
                  <div style={{ backgroundColor: 'var(--bg)', border: `2px solid ${BLACK}`, padding: '1rem', marginBottom: 16 }}>
                    <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--muted-fg)', marginBottom: 8 }}>Worker Data Stack</p>
                    <pre style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', color: FG, overflowX: 'auto', margin: 0 }}>
                      {JSON.stringify(survey.dataStack, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 24, fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User style={{ width: 14, height: 14 }} /> Worker: <strong style={{ color: FG }}>{survey.fieldWorkerId?.name || 'Unknown'}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin style={{ width: 14, height: 14 }} /> GPS: <strong style={{ color: FG }}>
                      {survey.location?.coordinates?.length >= 2 ? `${Number(survey.location.coordinates[1]).toFixed(4)}, ${Number(survey.location.coordinates[0]).toFixed(4)}` : 'N/A'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 160 }}>
                <button
                  onClick={() => handleVerify(survey._id, 'VERIFIED')}
                  style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: PUR, color: '#FFFFFF', border: `2.5px solid ${BLACK}`, boxShadow: `6px 6px 0 ${WHITE}`, padding: '14px 0', cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'translate(4px,4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0px 0px 0 ${WHITE}`; }}
                  onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = `6px 6px 0 ${WHITE}`; }}
                >
                  <CheckCircle style={{ width: 16, height: 16 }} /> Approve
                </button>
                <button
                  onClick={() => handleVerify(survey._id, 'REJECTED')}
                  style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: 'var(--bg)', color: FG, border: `2.5px solid ${BLACK}`, boxShadow: `6px 6px 0 ${WHITE}`, padding: '14px 0', cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'translate(4px,4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0px 0px 0 ${WHITE}`; }}
                  onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = `6px 6px 0 ${WHITE}`; }}
                >
                  <XCircle style={{ width: 16, height: 16 }} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
