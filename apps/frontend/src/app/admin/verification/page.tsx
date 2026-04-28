"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, MapPin, User, Images, X, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

const BG    = 'var(--bg)';
const BLACK = 'var(--border-color)';
const PUR   = 'var(--pur)';
const YLW   = 'var(--ylw)';
const CRIT  = 'var(--accent-critical)';
const WHITE = 'var(--shadow-color)';
const FG    = 'var(--fg)';
const CARD  = { backgroundColor: 'var(--card-bg)', border: `2.5px solid ${BLACK}`, boxShadow: 'var(--neo-shadow)' };
const CARD_DEEP = { ...CARD, boxShadow: `8px 8px 0px ${WHITE}` };
const SHADOW = 'var(--neo-shadow)';

export default function VerificationQueuePage() {
  const { data: session, status } = useSession();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
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
    return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${BLACK}`, borderTopColor: PUR, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>;
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="neo-main">

        {/* Page Header */}
        <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: `2.5px solid ${BLACK}` }}>
          <h1 className="page-title">
            Verification [ QUEUE ]
          </h1>
          <p className="page-subtitle">
            Review and approve human intent records.
          </p>
        </div>

        {/* Queue List Container */}
        <div className="neo-card-full-deep">
          {surveys.length === 0 ? (
            <div style={{ ...CARD, padding: '5rem', textAlign: 'center', width: '95%', margin: '0 auto' }}>
              <Clock style={{ margin: '0 auto 1rem', width: 48, height: 48, color: 'var(--muted-fg)' }} />
              <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, textTransform: 'uppercase', fontSize: '1.2rem', color: FG, margin: '0 0 8px' }}>Queue Empty</h3>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--muted-fg)' }}>No pending records detected.</p>
            </div>
          ) : surveys.map((survey) => (
            <div key={survey._id} className="neo-card card-row" style={{ 
              padding: '24px', 
              display: 'flex', 
              gap: '20px', 
              marginBottom: '16px', 
              height: '350px', 
              width: '100%', 
              boxSizing: 'border-box',
              alignItems: 'stretch' 
            }}>
              
              {/* Left 70%: Information Section */}
              <div style={{ flex: 0.7, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* Row 1: Context (Urgency + Category) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexShrink: 0 }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: 100, marginBottom: 2 }}>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.55rem', color: 'var(--muted-fg)' }}>1</span>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.55rem', color: 'var(--muted-fg)' }}>5</span>
                    </div>
                    <div style={{ width: 100, height: 8, backgroundColor: 'var(--bg)', border: `2px solid ${BLACK}`, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: '100%', position: 'absolute', left: 0, top: 0, width: `${(survey.urgency / 5) * 100}%`, background: 'linear-gradient(to right, #3b82f6, #ef4444)' }} />
                    </div>
                  </div>
                  <span className="neo-badge" style={{ backgroundColor: YLW, color: '#000000', border: `2px solid ${BLACK}`, fontSize: '0.6rem' }}>
                    {survey.category}
                  </span>
                </div>

                {/* Row 2: Primary Data (Title/Description) - FLEX GROW */}
                <div className="neo-scroll-content" style={{ flexGrow: 1, paddingRight: '12px', marginBottom: 16, overflowY: 'auto' }}>
                  <h3 style={{ 
                    fontFamily: "'Plus Jakarta Sans',sans-serif", 
                    fontWeight: 900, 
                    fontSize: '1.4rem', 
                    textTransform: 'uppercase', 
                    color: FG, 
                    margin: 0, 
                    lineHeight: 1.2,
                    letterSpacing: '-0.01em'
                  }}>
                    {survey.description}
                  </h3>
                  
                  {/* Data stack if it exists */}
                  {survey.dataStack && Object.keys(survey.dataStack).length > 0 && (
                    <div style={{ backgroundColor: 'var(--bg)', border: `1.5px solid ${BLACK}`, padding: '0.75rem', marginTop: 12 }}>
                      <pre style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: FG, overflowX: 'auto', margin: 0 }}>
                        {JSON.stringify(survey.dataStack, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Row 3: Metadata (Worker + GPS) - ANCHORED AT BOTTOM OF LEFT COL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, paddingTop: 12, borderTop: `1px solid rgba(0,0,0,0.05)` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted-fg)' }}>
                    <User style={{ width: 12, height: 12 }} />
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem', textTransform: 'uppercase' }}>
                      Worker: <strong style={{ color: FG, fontWeight: 900 }}>{survey.fieldWorkerId?.name || 'Unknown'}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted-fg)' }}>
                    <MapPin style={{ width: 12, height: 12 }} />
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem', textTransform: 'uppercase' }}>
                      GPS: <strong style={{ color: FG, fontWeight: 900 }}>
                        {survey.location?.coordinates?.length >= 2 ? `${Number(survey.location.coordinates[1]).toFixed(4)}, ${Number(survey.location.coordinates[0]).toFixed(4)}` : 'N/A'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right 30%: Action Section - BUTTONS ANCHORED TO BOTTOM */}
              <div style={{
                flex: 0.3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                borderLeft: `2px solid rgba(0,0,0,0.1)`,
                paddingLeft: '20px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                  {survey.imageUrls?.length > 0 && (
                    <button
                      onClick={() => setLightbox({ images: survey.imageUrls, index: 0 })}
                      style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: YLW, color: '#000', border: `2.5px solid ${BLACK}`, boxShadow: `4px 4px 0px ${WHITE}`, padding: '14px 0', cursor: 'pointer', transition: 'all 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '0px 0px 0px #000'; }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `4px 4px 0px ${WHITE}`; }}
                    >
                      <Images style={{ width: 16, height: 16 }} /> View Images ({survey.imageUrls.length})
                    </button>
                  )}
                  <button
                    onClick={() => handleVerify(survey._id, 'VERIFIED')}
                    style={{ 
                      fontFamily: "'Plus Jakarta Sans',sans-serif", 
                      fontWeight: 900, 
                      fontSize: '0.75rem', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.1em', 
                      backgroundColor: PUR, 
                      color: '#FFFFFF', 
                      border: `2.5px solid ${BLACK}`, 
                      boxShadow: `4px 4px 0px ${WHITE}`, 
                      padding: '14px 0', 
                      cursor: 'pointer', 
                      transition: 'all 0.1s', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 8 
                    }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '0px 0px 0px #000'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `4px 4px 0px ${WHITE}`; }}
                  >
                    <CheckCircle style={{ width: 16, height: 16 }} /> Approve
                  </button>
                  <button
                    onClick={() => handleVerify(survey._id, 'REJECTED')}
                    style={{ 
                      fontFamily: "'Plus Jakarta Sans',sans-serif", 
                      fontWeight: 900, 
                      fontSize: '0.75rem', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.1em', 
                      backgroundColor: 'transparent', 
                      color: FG, 
                      border: `2.5px solid ${BLACK}`, 
                      boxShadow: `4px 4px 0px ${WHITE}`, 
                      padding: '14px 0', 
                      cursor: 'pointer', 
                      transition: 'all 0.1s', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 8 
                    }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = '0px 0px 0px #000'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `4px 4px 0px ${WHITE}`; }}
                  >
                    <XCircle style={{ width: 16, height: 16 }} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Image Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 20, right: 20, backgroundColor: 'transparent', border: `2px solid #fff`, color: '#fff', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>

          {/* Prev */}
          {lightbox.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(l => l ? { ...l, index: (l.index - 1 + l.images.length) % l.images.length } : null); }}
              style={{ position: 'absolute', left: 20, backgroundColor: 'transparent', border: `2px solid #fff`, color: '#fff', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft style={{ width: 20, height: 20 }} />
            </button>
          )}

          {/* Image */}
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '80vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <img
              src={lightbox.images[lightbox.index]}
              alt={`Image ${lightbox.index + 1}`}
              style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', border: `3px solid #fff` }}
            />
            {lightbox.images.length > 1 && (
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.75rem', color: '#fff' }}>
                {lightbox.index + 1} / {lightbox.images.length}
              </span>
            )}
          </div>

          {/* Next */}
          {lightbox.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(l => l ? { ...l, index: (l.index + 1) % l.images.length } : null); }}
              style={{ position: 'absolute', right: 20, backgroundColor: 'transparent', border: `2px solid #fff`, color: '#fff', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronRight style={{ width: 20, height: 20 }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
