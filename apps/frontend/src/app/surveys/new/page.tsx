"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle2, AlertCircle, MapPin, Plus, ChevronLeft, FileText } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

const BLACK = 'var(--border-color)';
const PUR   = 'var(--pur)';
const YLW   = 'var(--ylw)';
const SUCC  = 'var(--accent-success)';
const CRIT  = 'var(--accent-critical)';
const WHITE = 'var(--shadow-color)';
const FG    = 'var(--fg)';
const SHADOW = 'var(--neo-shadow)';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT:     { bg: YLW,  color: '#000' },
  SUBMITTED: { bg: PUR,  color: '#fff' },
  VERIFIED:  { bg: SUCC, color: '#fff' },
  REJECTED:  { bg: CRIT, color: '#fff' },
};

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg)', border: `2.5px solid ${BLACK}`,
  boxShadow: SHADOW, fontFamily: "'Space Mono',monospace", fontSize: '0.85rem',
  color: FG, outline: 'none', boxSizing: 'border-box',
};

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

const emptyManual = { title: '', category: 'Sanitation', urgencyScore: '3', affectedPeople: '', description: '', lat: '', lng: '' };

export default function NewSurveyPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [file, setFile]               = useState<File | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus]           = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage]         = useState('');
  const [activeTab, setActiveTab]     = useState<'ai' | 'manual'>('ai');

  const [myReports, setMyReports]         = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showForm, setShowForm]           = useState(false);
  const [surveyId, setSurveyId]           = useState<string | null>(null);
  const [manualData, setManualData]       = useState(emptyManual);
  const [imageUrls, setImageUrls]         = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const token = (session?.user as any)?.accessToken;

  useEffect(() => {
    if (activeTab === 'manual' && token) fetchMyReports();
  }, [activeTab, token]);

  const fetchMyReports = async () => {
    setLoadingReports(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/surveys/my-surveys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyReports(res.data);
    } catch { console.error('Failed to fetch reports'); }
    finally { setLoadingReports(false); }
  };

  const resetForm = () => { setManualData(emptyManual); setSurveyId(null); setImageUrls([]); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !token) return;
    setUploadingImage(true);
    try {
      const uploads = await Promise.all(files.map(async (f) => {
        const fd = new FormData();
        fd.append('image', f);
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/upload-image`, fd, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
        });
        return res.data.imageUrl as string;
      }));
      setImageUrls(prev => [...prev, ...uploads]);
    } catch { alert('Failed to upload one or more images.'); }
    finally { setUploadingImage(false); e.target.value = ''; }
  };

  const openEdit = (report: any) => {
    setSurveyId(report._id);
    setImageUrls(report.imageUrls || []);
    setManualData({
      title:          report.title || '',
      category:       report.category || 'Sanitation',
      urgencyScore:   String(report.urgency ?? 3),
      affectedPeople: report.affectedPeople != null ? String(report.affectedPeople) : '',
      description:    report.description || '',
      lat:            report.location?.coordinates?.[1] != null ? String(report.location.coordinates[1]) : '',
      lng:            report.location?.coordinates?.[0] != null ? String(report.location.coordinates[0]) : '',
    });
    setShowForm(true);
  };

  const buildPayload = () => ({
    surveyId,
    title:          manualData.title,
    category:       manualData.category,
    urgency:        Number(manualData.urgencyScore),
    affectedPeople: manualData.affectedPeople ? Number(manualData.affectedPeople) : undefined,
    description:    manualData.description,
    location: { type: 'Point', coordinates: [Number(manualData.lng), Number(manualData.lat)] },
    imageUrls,
  });

  const handleSaveDraft = async () => {
    if (!token) return;
    setIsUploading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/save-draft`, buildPayload(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSurveyId(res.data.survey._id);
      setStatus('success'); setMessage('Draft saved!');
      setTimeout(() => { setStatus('idle'); setShowForm(false); resetForm(); fetchMyReports(); }, 1500);
    } catch { setStatus('error'); setMessage('Failed to save draft.'); }
    finally { setIsUploading(false); }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsUploading(true); setStatus('idle');
    try {
      const draftRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/save-draft`, buildPayload(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const id = draftRes.data.survey._id;
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/submit`, { surveyId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus('success'); setMessage('Survey submitted for verification!');
      setTimeout(() => { setStatus('idle'); setShowForm(false); resetForm(); fetchMyReports(); }, 1500);
    } catch { setStatus('error'); setMessage('Failed to submit survey.'); }
    finally { setIsUploading(false); }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !token) return;
    setIsUploading(true); setStatus('idle');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setStatus('success'); setMessage('Survey uploaded! AI is analyzing the document.');
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err: any) {
      setStatus('error'); setMessage(err.response?.data?.message || 'Failed to upload survey.');
    } finally { setIsUploading(false); }
  };

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setManualData(d => ({ ...d, lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) })),
      () => alert('Unable to retrieve location.')
    );
  };

  const lbl = (text: string) => (
    <label style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: FG, display: 'block', marginBottom: 8 }}>
      {text}
    </label>
  );

  const pressDown = (e: React.MouseEvent<HTMLButtonElement>, shadow = '0px 0px 0 #000') => {
    e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = shadow;
  };
  const pressUp = (e: React.MouseEvent<HTMLButtonElement>, shadow = SHADOW) => {
    e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = shadow;
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="neo-main">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: `2.5px solid ${BLACK}` }}>
          <div>
            <h1 className="page-title">Add Community Data</h1>
            <p className="page-subtitle">Upload a paper survey for AI processing or enter data manually.</p>
          </div>
          <Link href="/dashboard">
            <button style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: PUR, color: '#FFFFFF', border: `2.5px solid ${BLACK}`, boxShadow: SHADOW, padding: '10px 20px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ← Back to Dashboard
            </button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="tab-switcher">
          {(['ai', 'manual'] as const).map((tab) => (
            <button key={tab}
              onClick={() => { setActiveTab(tab); setShowForm(false); resetForm(); setStatus('idle'); }}
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '12px 32px', backgroundColor: activeTab === tab ? PUR : 'var(--bg)', color: activeTab === tab ? '#FFFFFF' : FG, border: `2.5px solid ${BLACK}`, boxShadow: SHADOW, transform: activeTab === tab ? 'translate(2px,2px)' : 'none', cursor: 'pointer', flex: 1 }}
            >
              {tab === 'ai' ? 'AI OCR Upload' : 'Manual Entry'}
            </button>
          ))}
        </div>

        <div className="neo-card-full">

          {/* ── AI Tab ── */}
          {activeTab === 'ai' && (
            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
                style={{ border: `2.5px dashed ${isDragging ? PUR : BLACK}`, backgroundColor: isDragging ? 'rgba(0,137,123,0.1)' : 'var(--bg)', padding: '4rem', textAlign: 'center', transition: 'all 0.15s' }}
              >
                <UploadCloud style={{ margin: '0 auto 1rem', width: 48, height: 48, color: isDragging ? PUR : 'var(--muted-fg)', strokeWidth: 1.5 }} />
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.85rem', color: 'var(--muted-fg)', marginBottom: 8 }}>
                  <label htmlFor="file-upload" style={{ cursor: 'pointer', fontWeight: 700, color: FG, textDecoration: 'underline' }}>
                    Upload a file
                    <input id="file-upload" type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
                  </label>
                  {' '}or drag and drop
                </div>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--muted-fg)' }}>PNG, JPG, GIF up to 5MB</p>
                {file && <p style={{ marginTop: 12, fontFamily: "'Space Mono',monospace", fontSize: '0.8rem', fontWeight: 700, color: SUCC }}>Selected: {file.name}</p>}
              </div>
              <button type="submit" disabled={!file || isUploading}
                style={{ ...primaryBtn({ maxWidth: 400, margin: '0 auto' }), opacity: (!file || isUploading) ? 0.5 : 1 }}
                onMouseDown={pressDown} onMouseUp={pressUp}>
                {isUploading ? 'Processing...' : 'Process with AI'}
              </button>
            </form>
          )}

          {/* ── Manual Tab ── */}
          {activeTab === 'manual' && (
            <div>
              {!showForm ? (
                /* LIST VIEW */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: FG, margin: 0 }}>My Reports</p>
                      <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--muted-fg)', margin: '4px 0 0' }}>
                        {myReports.length} record{myReports.length !== 1 ? 's' : ''} found
                      </p>
                    </div>
                    <button onClick={() => { resetForm(); setShowForm(true); }}
                      style={primaryBtn({ width: 'auto', padding: '12px 20px' })}
                      onMouseDown={pressDown} onMouseUp={pressUp}>
                      <Plus style={{ width: 16, height: 16 }} /> Add New Report
                    </button>
                  </div>

                  {loadingReports ? (
                    <div style={{ textAlign: 'center', padding: '3rem', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem', color: 'var(--muted-fg)' }}>Loading reports...</div>
                  ) : myReports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', border: `2.5px dashed ${BLACK}` }}>
                      <FileText style={{ margin: '0 auto 1rem', width: 40, height: 40, color: 'var(--muted-fg)' }} />
                      <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase', color: FG, margin: '0 0 6px' }}>No Reports Yet</p>
                      <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--muted-fg)', margin: 0 }}>Click "Add New Report" to create your first report.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {myReports.map((report) => {
                        const sc = STATUS_COLORS[report.status] || { bg: BLACK, color: '#fff' };
                        return (
                          <div key={report._id} style={{ backgroundColor: 'var(--bg)', border: `2.5px solid ${BLACK}`, boxShadow: SHADOW, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.95rem', color: FG, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {report.title || report.description?.slice(0, 60) || 'Untitled Report'}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem', backgroundColor: sc.bg, color: sc.color, padding: '2px 8px', border: `1.5px solid ${BLACK}`, fontWeight: 700 }}>
                                  {report.status}
                                </span>
                                {report.category && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--muted-fg)' }}>{report.category}</span>}
                                {report.urgency && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--muted-fg)' }}>Urgency {report.urgency}/5</span>}
                                {report.affectedPeople != null && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--muted-fg)' }}>~{report.affectedPeople} affected</span>}
                                {report.imageUrls?.length > 0 && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--muted-fg)' }}>{report.imageUrls.length} image{report.imageUrls.length !== 1 ? 's' : ''}</span>}
                                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--muted-fg)' }}>{new Date(report.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {report.status === 'DRAFT' && (
                              <button onClick={() => openEdit(report)}
                                style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: YLW, color: '#000', border: `2px solid ${BLACK}`, boxShadow: `3px 3px 0 ${WHITE}`, padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                                onMouseDown={(e) => pressDown(e, '0px 0px 0 #000')} onMouseUp={(e) => pressUp(e, `3px 3px 0 ${WHITE}`)}>
                                Edit Draft
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* FORM VIEW */
                <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <button type="button" onClick={() => { setShowForm(false); resetForm(); setStatus('idle'); }}
                    style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: 'transparent', color: FG, border: `2px solid ${BLACK}`, padding: '8px 16px', cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ChevronLeft style={{ width: 14, height: 14 }} /> Back to Reports
                  </button>

                  <div>
                    {lbl('Report Title')}
                    <input type="text" required style={inp} placeholder="e.g. Water shortage in Block C"
                      value={manualData.title} onChange={e => setManualData(d => ({ ...d, title: e.target.value }))} />
                  </div>

                  <div className="form-grid-2col">
                    <div>
                      {lbl('Category')}
                      <select style={inp} value={manualData.category} onChange={e => setManualData(d => ({ ...d, category: e.target.value }))}>
                        {['Sanitation', 'Medical', 'Education', 'Infrastructure', 'Water', 'Power', 'Other'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      {lbl('Urgency Score (1–5)')}
                      <input type="number" min="1" max="5" required style={inp} value={manualData.urgencyScore}
                        onChange={e => setManualData(d => ({ ...d, urgencyScore: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    {lbl('Approx Affected People')}
                    <input type="number" min="0" style={inp} placeholder="e.g. 250"
                      value={manualData.affectedPeople} onChange={e => setManualData(d => ({ ...d, affectedPeople: e.target.value }))} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      {lbl('Coordinates')}
                      <button type="button" onClick={useMyLocation}
                        style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: YLW, color: '#000', border: `2px solid ${BLACK}`, boxShadow: `3px 3px 0 ${WHITE}`, padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        onMouseDown={(e) => pressDown(e, '0px 0px 0 #000')} onMouseUp={(e) => pressUp(e, `3px 3px 0 ${WHITE}`)}>
                        <MapPin style={{ width: 12, height: 12 }} /> Use My Location
                      </button>
                    </div>
                    <div className="form-grid-2col">
                      <div>
                        {lbl('Latitude')}
                        <input type="text" placeholder="e.g. 12.97" required style={inp} value={manualData.lat}
                          onChange={e => setManualData(d => ({ ...d, lat: e.target.value }))} />
                      </div>
                      <div>
                        {lbl('Longitude')}
                        <input type="text" placeholder="e.g. 77.59" required style={inp} value={manualData.lng}
                          onChange={e => setManualData(d => ({ ...d, lng: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div>
                    {lbl('Description')}
                    <textarea required style={{ ...inp, minHeight: 120, resize: 'vertical' }}
                      value={manualData.description} onChange={e => setManualData(d => ({ ...d, description: e.target.value }))}
                      placeholder="Describe the community need..." />
                  </div>

                  {/* Image Upload */}
                  <div>
                    {lbl('Images (optional)')}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: uploadingImage ? 'not-allowed' : 'pointer', backgroundColor: 'var(--bg)', border: `2.5px dashed ${BLACK}`, padding: '14px 20px', opacity: uploadingImage ? 0.6 : 1 }}>
                      <UploadCloud style={{ width: 18, height: 18, color: 'var(--muted-fg)', flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.75rem', color: 'var(--muted-fg)' }}>
                        {uploadingImage ? 'Uploading...' : 'Click to add images (JPG, PNG)'}
                      </span>
                      <input type="file" accept="image/jpeg,image/jpg,image/png" multiple style={{ display: 'none' }} disabled={uploadingImage} onChange={handleImageUpload} />
                    </label>
                    {imageUrls.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                        {imageUrls.map((url, i) => (
                          <div key={i} style={{ position: 'relative', width: 90, height: 90, border: `2px solid ${BLACK}`, flexShrink: 0 }}>
                            <img src={url} alt={`upload-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <button type="button" onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                              style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, backgroundColor: CRIT, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <button type="button" onClick={handleSaveDraft} disabled={isUploading} style={secondaryBtn({ flex: 1 })}
                      onMouseDown={pressDown} onMouseUp={pressUp}>
                      Save Draft
                    </button>
                    <button type="submit" disabled={isUploading} style={primaryBtn({ flex: 1 })}
                      onMouseDown={pressDown} onMouseUp={pressUp}>
                      {isUploading ? 'Submitting...' : 'Submit Survey'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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
      </main>
    </div>
  );
}
