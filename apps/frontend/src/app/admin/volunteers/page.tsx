"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, FileImage, User, X } from "lucide-react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

const BG    = 'var(--bg)';
const BLACK = 'var(--border-color)';
const PUR   = 'var(--pur)';
const YLW   = 'var(--ylw)';
const WHITE = 'var(--shadow-color)';
const FG    = 'var(--fg)';
const CARD  = 'var(--card-bg)';

export default function VolunteerRequestsPage() {
  const { data: session, status } = useSession();
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && (session?.user as any)?.role !== 'NGO_ADMIN') router.push("/dashboard");
    else if (status === "authenticated") fetchPendingVolunteers();
  }, [status, session, router]);

  const fetchPendingVolunteers = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/volunteers/pending`, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      setVolunteers(res.data);
    } catch { console.error("Failed to fetch pending volunteers"); }
    finally { setLoading(false); }
  };

  const handleVerify = async (volunteerId: string, actionStatus: 'approved' | 'rejected') => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/admin/volunteers/${volunteerId}/verify`, { status: actionStatus }, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      setVolunteers(volunteers.filter(v => v._id !== volunteerId));
    } catch { alert(`Failed to ${actionStatus} volunteer`); }
  };

  const bruBtn = (onClick: () => void, label: string, icon: React.ReactNode, bg: string, color: string = '#000000') => (
    <button
      onClick={onClick}
      style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: bg, color: color, border: `2.5px solid ${BLACK}`, boxShadow: `6px 6px 0 ${WHITE}`, padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.1s, box-shadow 0.1s' }}
      onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'translate(4px,4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0px 0px 0 ${WHITE}`; }}
      onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = `6px 6px 0 ${WHITE}`; }}
    >
      {icon}{label}
    </button>
  );

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${BLACK}`, borderTopColor: PUR, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: BG }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: BG, position: 'relative' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: `2.5px solid ${BLACK}` }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '2.2rem', textTransform: 'uppercase', letterSpacing: '-0.04em', color: FG, margin: 0 }}>
            Volunteer Requests
          </h1>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--muted-fg)', marginTop: 10 }}>
            Review and verify new volunteer applications.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {volunteers.length === 0 ? (
            <div style={{ backgroundColor: CARD, border: `2.5px solid ${BLACK}`, boxShadow: `6px 6px 0 ${WHITE}`, padding: '5rem', textAlign: 'center' }}>
              <Clock style={{ margin: '0 auto 1rem', width: 48, height: 48, color: 'var(--muted-fg)' }} />
              <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', color: FG, margin: '0 0 8px' }}>Queue is empty</h3>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.75rem', color: 'var(--muted-fg)' }}>No pending volunteer requests at this time.</p>
            </div>
          ) : volunteers.map((volunteer) => (
            <div key={volunteer._id} style={{ backgroundColor: CARD, border: `2.5px solid ${BLACK}`, boxShadow: `6px 6px 0 ${WHITE}`, padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: YLW, color: '#000000', border: `2px solid ${BLACK}`, boxShadow: `2px 2px 0 ${WHITE}`, padding: '3px 10px' }}>
                    {volunteer.specialization || 'General'}
                  </span>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--muted-fg)' }}>
                    Applied: {new Date(volunteer.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <User style={{ width: 18, height: 18, color: FG }} />
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '1.2rem', color: FG, margin: 0 }}>{volunteer.name}</h3>
                </div>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.78rem', color: FG, fontStyle: 'italic', marginBottom: 12 }}>
                  &ldquo;{volunteer.experienceBio || 'No bio provided'}&rdquo;
                </p>
                {bruBtn(() => setSelectedProof(volunteer.idProofUrl), 'View ID Proof', <FileImage style={{ width: 14, height: 14 }} />, 'var(--bg)', FG)}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {bruBtn(() => handleVerify(volunteer._id, 'rejected'), 'Reject', <XCircle style={{ width: 16, height: 16 }} />, 'var(--bg)', FG)}
                {bruBtn(() => handleVerify(volunteer._id, 'approved'), 'Approve', <CheckCircle style={{ width: 16, height: 16 }} />, PUR, '#FFFFFF')}
              </div>
            </div>
          ))}
        </div>

        {/* ID Proof Modal */}
        {selectedProof && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', padding: '1rem' }}>
            <div style={{ backgroundColor: CARD, border: `2.5px solid ${BLACK}`, boxShadow: `8px 8px 0 ${WHITE}`, width: '100%', maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: `2.5px solid ${BLACK}`, backgroundColor: YLW }}>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: '#000000', margin: 0 }}>ID Proof</h3>
                <button onClick={() => setSelectedProof(null)} style={{ background: 'var(--bg)', border: `2px solid ${BLACK}`, boxShadow: `3px 3px 0 ${WHITE}`, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X style={{ width: 18, height: 18, color: FG }} />
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
                {selectedProof.toLowerCase().endsWith('.pdf')
                   ? <iframe src={selectedProof} style={{ width: '100%', height: '60vh', border: `2px solid ${BLACK}` }} />
                   : <img src={selectedProof} alt="ID Proof" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', border: `2px solid ${BLACK}` }} />
                }
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
