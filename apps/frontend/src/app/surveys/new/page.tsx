"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadCloud, CheckCircle2, AlertCircle, MapPin } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { useLanguage } from "@/components/LanguageContext";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

export default function NewSurveyPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { currentLanguage } = useLanguage();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [manualData, setManualData] = useState({ category: 'Sanitation', urgencyScore: '3', description: '', lat: '', lng: '' });
  const [surveyId, setSurveyId] = useState<string | null>(null);

  const getToken = () => {
    const token = (session?.user as any)?.accessToken;
    if (!token) console.warn('[NewSurveyPage] accessToken is missing from session:', session);
    return token;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const token = getToken();
    if (!token) { setStatus('error'); setMessage('Session expired — please log out and log back in.'); return; }
    setIsUploading(true); setStatus('idle');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', currentLanguage.aiCode);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
      });
      setStatus('success'); setMessage('Survey uploaded! Redirecting to verification...');
      setTimeout(() => router.push(`/surveys/verify/${res.data.survey._id}`), 1500);
    } catch (err: any) {
      console.error('[handleFileUpload] error:', err.response?.data || err.message);
      setStatus('error'); setMessage(err.response?.data?.message || err.message || 'Failed to upload survey.');
    } finally { setIsUploading(false); }
  };

  const handleSaveDraft = async () => {
    const token = getToken();
    if (!token) { setStatus('error'); setMessage('Session expired — please log out and log back in.'); return; }
    setIsUploading(true);
    setStatus('idle');
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/save-draft`, {
        surveyId,
        category: manualData.category,
        urgency: Number(manualData.urgencyScore),
        description: manualData.description,
        location: { type: 'Point', coordinates: [Number(manualData.lng), Number(manualData.lat)] }
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSurveyId(res.data.survey._id);
      setStatus('success');
      setMessage('Draft saved successfully!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error('[handleSaveDraft] error:', err.response?.data || err.message);
      setStatus('error');
      setMessage(err.response?.data?.message || err.message || 'Failed to save draft.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { setStatus('error'); setMessage('Session expired — please log out and log back in.'); return; }
    setIsUploading(true);
    setStatus('idle');
    try {
      // Step 1: Save (or update) draft
      const draftRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/save-draft`, {
        surveyId,
        category: manualData.category,
        urgency: Number(manualData.urgencyScore),
        description: manualData.description,
        location: { type: 'Point', coordinates: [Number(manualData.lng), Number(manualData.lat)] }
      }, { headers: { Authorization: `Bearer ${token}` } });

      const currentSurveyId = draftRes.data.survey._id;
      setSurveyId(currentSurveyId);

      // Step 2: Submit the draft
      const submitRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/submit`, {
        surveyId: currentSurveyId
      }, { headers: { Authorization: `Bearer ${token}` } });

      setStatus('success');
      setMessage(submitRes.data.autoVerified
        ? 'Task created! It is now live on the dashboard.'
        : 'Survey submitted for admin verification.'
      );
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      console.error('[handleManualSubmit] error:', err.response?.data || err.message);
      setStatus('error');
      setMessage(err.response?.data?.message || err.message || 'Failed to submit survey.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setManualData({ ...manualData, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }),
        () => alert("Unable to retrieve location.")
      );
    }
  };



  return (
    <div className="page-layout">
      <Sidebar />
      <main className="neo-main" style={{ width: '100%', overflowX: 'hidden' }}>
        <div style={{ width: 'min(100%, 1200px)', margin: '0 auto', paddingBottom: '4rem' }}>

          {/* Header Row */}
          <div style={{ marginBottom: '0', paddingBottom: '1.5rem', borderBottom: `2.5px solid var(--border-color)` }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-1">
                <h1 className="page-title">
                  Add [ Community Data ]
                </h1>
                <p className="page-subtitle">
                  Upload survey document or manual telemetry entry
                </p>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="bg-white hover:bg-[#F2EFE9] transition-colors border-[2px] border-black shadow-[4px_4px_0px_0px_#000]">
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Master Card Container */}
          <div className="neo-card-full-deep" style={{
            backgroundColor: 'white',
            border: '2px solid black',
            boxShadow: '8px 8px 0px 0px #000',
            padding: '2.5rem',
            marginTop: '2rem'
          }}>

            {/* Segmented Tab Control */}
            <div className="flex border-[3px] border-black shadow-[4px_4px_0px_0px_#000] bg-black mb-10">
              {(['ai', 'manual'] as const).map((tab, idx) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ cursor: 'pointer' }}
                  className={`flex-1 py-5 text-[0.8rem] font-black uppercase tracking-[0.15em] transition-all border-none outline-none ${activeTab === tab
                    ? 'bg-[#008080] text-white'
                    : 'bg-white text-black hover:bg-[#F2EFE9]'
                    } ${idx === 0 ? 'border-r-[3px] border-black' : ''}`}
                >
                  {tab === 'ai' ? 'AI OCR Upload' : 'Manual Entry'}
                </button>
              ))}
            </div>

            {/* ─ AI Upload Section ─ */}
            {activeTab === 'ai' && (
              <form onSubmit={handleFileUpload} className="space-y-10">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
                  className={`w-full border-[3px] border-dashed p-16 text-center transition-all ${isDragging ? 'border-[#008080] bg-[#008080]/5' : 'border-black bg-[#F2EFE9]/30'
                    }`}
                >
                  <UploadCloud className={`mx-auto mb-6 w-16 h-16 stroke-[1.5pt] ${isDragging ? 'text-[#008080]' : 'text-black/40'}`} />
                  <div className="font-body text-[0.9rem] text-black/60 mb-3 flex flex-col items-center gap-2">
                    <label htmlFor="file-upload" className="cursor-pointer font-bold text-black underline decoration-2 underline-offset-4 hover:text-[#008080] transition-colors">
                      Browse Local Files
                      <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <span className="text-[0.7rem] uppercase font-black tracking-widest">or drag and drop survey here</span>
                  </div>
                  <p className="font-body text-[0.7rem] font-bold text-black/40 uppercase tracking-wider">PNG, JPG, PDF up to 10MB</p>

                  {file && (
                    <div className="mt-8 p-3 bg-accent-success/10 border-2 border-accent-success inline-block">
                      <p className="font-body text-[0.8rem] font-black text-accent-success uppercase tracking-wider">
                        Ready: {file.name}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-10 bg-[#F2EFE9]/50 border-[3px] border-black shadow-[8px_8px_0px_0px_#000] space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                    <div className="space-y-3">
                      <label className="text-[0.75rem] font-black uppercase tracking-[0.2em] text-black/60 block px-1">
                        Select Document Language
                      </label>
                      <LanguageSelector />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[0.75rem] font-black uppercase tracking-[0.2em] text-black/60 block px-1 invisible md:visible">
                        Action
                      </label>
                      <Button
                        type="submit"
                        disabled={!file || isUploading}
                        size="lg"
                        className="w-full h-[56px] text-[0.8rem] border-[3px] border-black shadow-[4px_4px_0px_0px_#000] font-black"
                        isLoading={isUploading}
                        style={{ backgroundColor: '#008080', color: 'white' }}
                      >
                        Initialize AI OCR Extraction
                      </Button>
                    </div>
                  </div>
                  <div className="pt-2 border-t-2 border-black/5">
                    <p className="text-[0.65rem] font-bold text-black/50 uppercase tracking-[0.15em] text-center leading-relaxed">
                      AI will automatically detect layout and extract handwriting<br className="hidden md:block" /> based on the selected document language
                    </p>
                  </div>
                </div>
              </form>
            )}

            {/* ─ Manual Entry Form ─ */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-10">

                {/* Standardized Control Group: Category & Urgency */}
                <div className="flex flex-col md:flex-row gap-8 justify-between">
                  <div className="flex-1 space-y-4">
                    <label className="text-[0.75rem] font-black uppercase tracking-[0.1em] text-black/60 block">Category</label>
                    <select
                      className="flex h-[56px] w-full rounded-none border-[3px] border-black bg-white px-4 py-2 text-sm text-black focus:outline-none focus:ring-4 focus:ring-[#008080]/10 transition-all font-bold appearance-none cursor-pointer"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'black\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'3\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
                      value={manualData.category}
                      onChange={e => setManualData({ ...manualData, category: e.target.value })}
                    >
                      {['Sanitation', 'Medical', 'Education', 'Infrastructure', 'Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex-1">
                    <Input
                      label="Urgency Level (1-5)"
                      type="number"
                      min="1"
                      max="5"
                      required
                      value={manualData.urgencyScore}
                      onChange={e => setManualData({ ...manualData, urgencyScore: e.target.value })}
                      className="h-[56px] border-[3px] border-black"
                    />
                  </div>
                </div>

                {/* Sub-Header: Location */}
                <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-black/10 pb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-black">Geospatial Telemetry</h3>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="flex items-center gap-2 px-6 py-3 bg-[#FFB300] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_#000] text-[0.7rem] font-black uppercase tracking-wider cursor-pointer active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                  >
                    <MapPin className="w-4 h-4" /> Fetch My Coordinates
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input
                    label="Latitude (Y)"
                    placeholder="e.g. 12.9716"
                    required
                    value={manualData.lat}
                    onChange={e => setManualData({ ...manualData, lat: e.target.value })}
                    className="border-[3px] border-black"
                  />
                  <Input
                    label="Longitude (X)"
                    placeholder="e.g. 77.5946"
                    required
                    value={manualData.lng}
                    onChange={e => setManualData({ ...manualData, lng: e.target.value })}
                    className="border-[3px] border-black"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[0.75rem] font-black uppercase tracking-[0.1em] text-black/60 block">Description of Community Need</label>
                  <textarea
                    required
                    className="flex min-h-[180px] w-full rounded-none border-[3px] border-black bg-white p-5 text-sm text-black focus:outline-none focus:ring-4 focus:ring-[#008080]/10 transition-all font-bold resize-vertical"
                    value={manualData.description}
                    onChange={e => setManualData({ ...manualData, description: e.target.value })}
                    placeholder="Enter detailed observations here..."
                  />
                </div>

                {/* Footer Action Bar: Stretched Buttons */}
                <div className="flex flex-col md:flex-row gap-6 pt-6">
                  <Button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isUploading}
                    variant="outline"
                    className="flex-1 h-14 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] text-black font-black uppercase tracking-wider"
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 h-14 text-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] font-black uppercase tracking-wider"
                    isLoading={isUploading}
                    style={{ backgroundColor: '#008080' }}
                  >
                    Submit Survey
                  </Button>
                </div>
              </form>
            )}

            {/* Status Feedback Zone — always inline below form */}
            {status !== 'idle' && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                border: '3px solid #000',
                boxShadow: '6px 6px 0px 0px #000',
                backgroundColor: status === 'success' ? 'var(--accent-success)' : 'var(--accent-critical)',
              }}>
                {status === 'success'
                  ? <CheckCircle2 style={{ width: 28, height: 28, color: '#fff', flexShrink: 0 }} />
                  : <AlertCircle style={{ width: 28, height: 28, color: '#fff', flexShrink: 0 }} />
                }
                <div>
                  <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#fff', margin: 0 }}>
                    {status === 'success' ? 'Success' : 'Error'}
                  </p>
                  <p style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: '0.8rem', color: '#fff', margin: '4px 0 0' }}>
                    {message}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
