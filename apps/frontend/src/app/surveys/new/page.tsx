"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { UploadCloud, CheckCircle2, AlertCircle, MapPin } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

const BG    = 'var(--bg)';
const BLACK = 'var(--border-color)';
const PUR   = 'var(--pur)';
const YLW   = 'var(--ylw)';
const SUCC  = 'var(--accent-success)';
const CRIT  = 'var(--accent-critical)';
const WHITE = 'var(--shadow-color)';
const FG    = 'var(--fg)';
const CARD  = 'var(--card-bg)';

const inp = {
  width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg)', border: `2.5px solid ${BLACK}`,
  boxShadow: 'var(--neo-shadow)', fontFamily: "'Space Mono',monospace", fontSize: '0.85rem',
  color: FG, outline: 'none', boxSizing: 'border-box' as const,
};
const SHADOW = 'var(--neo-shadow)';

const primaryBtn = (extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.85rem',
  textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: PUR, color: '#FFFFFF',
  border: `2.5px solid ${BLACK}`, boxShadow: SHADOW, padding: '14px 24px',
  cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s', display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', ...extra,
});

const secondaryBtn = (extra?: React.CSSProperties): React.CSSProperties => ({
  ...primaryBtn(extra), backgroundColor: 'var(--bg)', color: FG,
});

export default function NewSurveyPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [manualData, setManualData] = useState({ category: 'Sanitation', urgencyScore: '3', description: '', lat: '', lng: '' });
  const [surveyId, setSurveyId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true); setStatus('idle');
    const formData = new FormData();
    formData.append('file', file);
    if (session?.user) formData.append('fieldWorkerId', (session.user as any).id);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${(session?.user as any).accessToken}` }
      });
      setStatus('success'); setMessage('Survey uploaded! AI is analyzing the document.');
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err: any) {
      setStatus('error'); setMessage(err.response?.data?.message || 'Failed to upload survey.');
    } finally { setIsUploading(false); }
  };

  const handleSaveDraft = async () => {
    if (!session?.user) return;
    setIsUploading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/save-draft`, {
        surveyId, category: manualData.category, urgency: Number(manualData.urgencyScore),
        description: manualData.description,
        location: { type: 'Point', coordinates: [Number(manualData.lng), Number(manualData.lat)] }
      }, { headers: { Authorization: `Bearer ${(session.user as any).accessToken}` } });
      setSurveyId(res.data.survey._id);
      setStatus('success'); setMessage('Draft saved!');
      setTimeout(() => setStatus('idle'), 2000);
    } catch { setStatus('error'); setMessage('Failed to save draft.'); }
    finally { setIsUploading(false); }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setIsUploading(true); setStatus('idle');
    try {
      const draftRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/save-draft`, {
        surveyId, category: manualData.category, urgency: Number(manualData.urgencyScore),
        description: manualData.description,
        location: { type: 'Point', coordinates: [Number(manualData.lng), Number(manualData.lat)] }
      }, { headers: { Authorization: `Bearer ${(session.user as any).accessToken}` } });
      const currentSurveyId = draftRes.data.survey._id;
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/submit`, { surveyId: currentSurveyId }, {
        headers: { Authorization: `Bearer ${(session.user as any).accessToken}` }
      });
      setStatus('success'); setMessage('Survey submitted for verification!');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch { setStatus('error'); setMessage('Failed to submit survey.'); }
    finally { setIsUploading(false); }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setManualData({ ...manualData, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }),
        () => alert("Unable to retrieve location.")
      );
    }
  };

  const label = (text: string) => (
    <label style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: FG, display: 'block', marginBottom: 8 }}>
      {text}
    </label>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh] bg-[#F2EFE9] overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 pt-24 md:p-12 md:pt-12" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="max-w-5xl w-full mx-auto mb-10">

        {/* Page Header */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column-reverse', 
          gap: '1.5rem', 
          borderBottom: `2.5px solid ${BLACK}`,
          paddingBottom: '2rem',
          zIndex: 30,
          position: 'relative'
        }} className="md:flex-row md:justify-between md:items-end">
          <div style={{ flex: 1 }}>
            <h1 className="page-title" style={{ lineHeight: 1.1, margin: 0, textAlign: 'left' }}>
              Add Community Data
            </h1>
            <p className="page-subtitle" style={{ marginTop: '1rem' }}>
              Upload a paper survey for AI processing or enter data manually.
            </p>
          </div>
          <Link href="/dashboard" style={{ width: '100%', maxWidth: 'fit-content' }}>
            <button style={{ 
              fontFamily: "'Plus Jakarta Sans',sans-serif", 
              fontWeight: 900, 
              fontSize: '0.7rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em', 
              backgroundColor: PUR, 
              color: '#FFFFFF', 
              border: `2.5px solid ${BLACK}`, 
              boxShadow: SHADOW, 
              padding: '12px 24px', 
              cursor: 'pointer', 
              width: '100%',
              whiteSpace: 'nowrap' 
            }}>
              ← Back to Dashboard
            </button>
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="tab-switcher" style={{ 
          display: 'flex', 
          width: '100%', 
          zIndex: 20,
          position: 'relative',
          gap: 0
        }}>
          {(['ai', 'manual'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                fontFamily: "'Plus Jakarta Sans',sans-serif", 
                fontWeight: 900, 
                fontSize: '12px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em', 
                padding: '14px 20px', 
                backgroundColor: activeTab === tab ? PUR : 'var(--card-bg)', 
                color: activeTab === tab ? '#FFFFFF' : FG, 
                border: `2.5px solid ${BLACK}`, 
                boxShadow: activeTab === tab ? 'none' : SHADOW, 
                transform: activeTab === tab ? 'translate(2px,2px)' : 'none', 
                cursor: 'pointer', 
                flex: 1,
                transition: 'all 0.1s'
              }}
            >
              {tab === 'ai' ? 'AI OCR Upload' : 'Manual Entry'}
            </button>
          ))}
        </div>

        {/* Main form card */}
        <div className="neo-card-full" style={{ zIndex: 10, position: 'relative', marginTop: 0 }}>

          {/* ─ AI Tab ─ */}
          {activeTab === 'ai' && (
            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
                style={{ border: `2.5px dashed ${isDragging ? PUR : BLACK}`, backgroundColor: isDragging ? 'rgba(0, 137, 123, 0.1)' : 'var(--bg)', boxShadow: isDragging ? `0 0 0 3px ${PUR}` : 'none', padding: '4rem', textAlign: 'center', transition: 'all 0.15s' }}
              >
                <UploadCloud style={{ margin: '0 auto 1rem', width: 48, height: 48, color: isDragging ? PUR : 'var(--muted-fg)', strokeWidth: 1.5 }} />
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.85rem', color: 'var(--muted-fg)', marginBottom: 8 }}>
                  <label htmlFor="file-upload" style={{ cursor: 'pointer', fontWeight: 700, color: FG, textDecoration: 'underline' }}>
                    Upload a file
                    <input id="file-upload" type="file" style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                  </label>
                  {' '}or drag and drop
                </div>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--muted-fg)' }}>PNG, JPG, GIF up to 5MB</p>
                {file && <p style={{ marginTop: 12, fontFamily: "'Space Mono',monospace", fontSize: '0.8rem', fontWeight: 700, color: SUCC }}>Selected: {file.name}</p>}
              </div>
              <button
                type="submit"
                disabled={!file || isUploading}
                style={{ ...primaryBtn({ maxWidth: 400, margin: '0 auto' }), opacity: (!file || isUploading) ? 0.5 : 1 }}
                onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'translate(2px,2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0px 0px 0 #000'; }}
                onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = SHADOW; }}
              >
                {isUploading ? 'Processing...' : 'Process with AI'}
              </button>
            </form>
          )}

          {/* ─ Manual Tab ─ */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-grid-2col">
                <div>
                  {label('Category')}
                  <select
                    style={inp}
                    value={manualData.category}
                    onChange={e => setManualData({ ...manualData, category: e.target.value })}
                  >
                    {['Sanitation', 'Medical', 'Education', 'Infrastructure', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  {label('Urgency Score (1-5)')}
                  <input type="number" min="1" max="5" required style={inp} value={manualData.urgencyScore}
                    onChange={e => setManualData({ ...manualData, urgencyScore: e.target.value })} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  {label('Coordinates')}
                  <button type="button" onClick={handleGetCurrentLocation}
                    style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: YLW, color: '#000000', border: `2px solid ${BLACK}`, boxShadow: `3px 3px 0 ${WHITE}`, padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'translate(2px,2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0px 0px 0 #000'; }}
                    onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '3px 3px 0 #000'; }}
                  >
                    <MapPin style={{ width: 12, height: 12 }} /> Use My Location
                  </button>
                </div>
                <div className="form-grid-2col">
                  <div>
                    {label('Latitude')}
                    <input type="text" placeholder="e.g. 12.97" required style={inp} value={manualData.lat}
                      onChange={e => setManualData({ ...manualData, lat: e.target.value })} />
                  </div>
                  <div>
                    {label('Longitude')}
                    <input type="text" placeholder="e.g. 77.59" required style={inp} value={manualData.lng}
                      onChange={e => setManualData({ ...manualData, lng: e.target.value })} />
                  </div>
                </div>
              </div>

              <div>
                {label('Description')}
                <textarea
                  required
                  style={{ ...inp, minHeight: 120, resize: 'vertical' }}
                  value={manualData.description}
                  onChange={e => setManualData({ ...manualData, description: e.target.value })}
                  placeholder="Describe the community need..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <button type="button" onClick={handleSaveDraft} disabled={isUploading} style={secondaryBtn({ flex: 1 })}
                  onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'translate(2px,2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0px 0px 0 #000'; }}
                  onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = SHADOW; }}>
                  Save Draft
                </button>
                <button type="submit" disabled={isUploading} style={primaryBtn({ flex: 1 })}
                  onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'translate(2px,2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0px 0px 0 #000'; }}
                  onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = SHADOW; }}>
                  {isUploading ? 'Submitting...' : 'Submit Survey'}
                </button>
              </div>
            </form>
          )}

          {/* Status messages */}
          {status === 'success' && (
            <div style={{ marginTop: '1.5rem', padding: '1rem 1.5rem', backgroundColor: SUCC, border: `2.5px solid ${BLACK}`, boxShadow: `4px 4px 0 ${WHITE}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 style={{ width: 20, height: 20, flexShrink: 0, color: '#FFFFFF' }} />
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{message}</p>
            </div>
          )}
          {status === 'error' && (
            <div style={{ marginTop: '1.5rem', padding: '1rem 1.5rem', backgroundColor: CRIT, border: `2.5px solid ${BLACK}`, boxShadow: SHADOW, display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertCircle style={{ width: 20, height: 20, flexShrink: 0, color: '#FFFFFF' }} />
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{message}</p>
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
