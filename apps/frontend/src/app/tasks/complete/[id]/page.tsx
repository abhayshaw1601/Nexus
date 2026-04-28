"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UploadCloud, CheckCircle2, AlertCircle, MapPin, ArrowLeft } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default function CompleteTaskPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [proofImages, setProofImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('manual');
  const [task, setTask] = useState<any>(null);
  const [reportData, setReportData] = useState({ 
    title: '', 
    category: 'Sanitation', 
    urgencyScore: '3', 
    affectedPeople: '',
    description: '', 
    lat: '', 
    lng: '' 
  });

  const getToken = () => (session?.user as any)?.accessToken;

  useEffect(() => {
    if (sessionStatus === "unauthenticated") router.push("/login");
    if (session && taskId) fetchTask();
  }, [session, sessionStatus, taskId]);

  const fetchTask = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setTask(res.data);
      // Pre-fill form with task data
      setReportData({
        title: `Completion: ${res.data.description?.substring(0, 50)}`,
        category: res.data.category || 'Sanitation',
        urgencyScore: '1', // Completed tasks are low urgency
        affectedPeople: '',
        description: '',
        lat: res.data.location?.coordinates[1]?.toString() || '',
        lng: res.data.location?.coordinates[0]?.toString() || ''
      });
    } catch (err) {
      console.error('Failed to fetch task:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const token = getToken();
    if (!token) { setStatus('error'); setMessage('Session expired'); return; }
    
    setIsUploading(true);
    setStatus('idle');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);
    
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/complete-report`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
      });
      setStatus('success');
      setMessage('Completion report uploaded! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to upload report');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { setStatus('error'); setMessage('Session expired'); return; }
    
    setIsUploading(true);
    setStatus('idle');
    
    try {
      const formData = new FormData();
      formData.append('title', reportData.title);
      formData.append('category', reportData.category);
      formData.append('urgencyScore', reportData.urgencyScore);
      formData.append('affectedPeople', reportData.affectedPeople || '0');
      formData.append('description', reportData.description);
      formData.append('coordinates', JSON.stringify([Number(reportData.lng), Number(reportData.lat)]));
      proofImages.forEach(img => formData.append('images', img));

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });

      setStatus('success');
      setMessage('Task marked as completed! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to submit completion report');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setReportData({ ...reportData, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }),
        () => alert("Unable to retrieve location.")
      );
    }
  };

  if (!task) return null;

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="neo-main" style={{ width: '100%', overflowX: 'hidden' }}>
        <div style={{ width: 'min(100%, 1200px)', margin: '0 auto', paddingBottom: '4rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '0', paddingBottom: '1.5rem', borderBottom: `2.5px solid var(--border-color)` }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-1">
                <h1 className="page-title">Complete Task Report</h1>
                <p className="page-subtitle">Submit completion proof and details</p>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="bg-white hover:bg-[#F2EFE9] transition-colors border-[2px] border-black shadow-[4px_4px_0px_0px_#000]">
                  <ArrowLeft style={{ width: 16, height: 16, marginRight: 4 }} /> Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Task Info Card */}
          <div className="neo-card-full-deep" style={{ marginTop: '2rem', marginBottom: '2rem', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              Original Task
            </h3>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <strong>Description:</strong> {task.description}
            </p>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.9rem' }}>
              <strong>Category:</strong> {task.category}
            </p>
          </div>

          {/* Main Form Card */}
          <div className="neo-card-full-deep" style={{ backgroundColor: 'white', border: '2px solid black', boxShadow: '8px 8px 0px 0px #000', padding: '2.5rem' }}>

            {/* Tab Control */}
            <div className="flex border-[3px] border-black shadow-[4px_4px_0px_0px_#000] bg-black mb-10">
              {(['ai', 'manual'] as const).map((tab, idx) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ cursor: 'pointer' }}
                  className={`flex-1 py-5 text-[0.8rem] font-black uppercase tracking-[0.15em] transition-all border-none outline-none ${
                    activeTab === tab ? 'bg-[#008080] text-white' : 'bg-white text-black hover:bg-[#F2EFE9]'
                  } ${idx === 0 ? 'border-r-[3px] border-black' : ''}`}
                >
                  {tab === 'ai' ? 'AI OCR Upload' : 'Manual Entry'}
                </button>
              ))}
            </div>

            {/* AI Upload Section */}
            {activeTab === 'ai' && (
              <form onSubmit={handleFileUpload} className="space-y-10">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
                  className={`w-full border-[3px] border-dashed p-16 text-center transition-all ${
                    isDragging ? 'border-[#008080] bg-[#008080]/5' : 'border-black bg-[#F2EFE9]/30'
                  }`}
                >
                  <UploadCloud className={`mx-auto mb-6 w-16 h-16 stroke-[1.5pt] ${isDragging ? 'text-[#008080]' : 'text-black/40'}`} />
                  <div className="font-body text-[0.9rem] text-black/60 mb-3 flex flex-col items-center gap-2">
                    <label htmlFor="file-upload" className="cursor-pointer font-bold text-black underline decoration-2 underline-offset-4 hover:text-[#008080] transition-colors">
                      Browse Proof Images
                      <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <span className="text-[0.7rem] uppercase font-black tracking-widest">or drag and drop completion proof</span>
                  </div>
                  <p className="font-body text-[0.7rem] font-bold text-black/40 uppercase tracking-wider">PNG, JPG up to 10MB</p>
                  {file && (
                    <div className="mt-8 p-3 bg-accent-success/10 border-2 border-accent-success inline-block">
                      <p className="font-body text-[0.8rem] font-black text-accent-success uppercase tracking-wider">
                        Ready: {file.name}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!file || isUploading}
                  size="lg"
                  className="w-full h-16 text-lg border-[3px] border-black shadow-[4px_4px_0px_0px_#000]"
                  isLoading={isUploading}
                  style={{ backgroundColor: '#008080', color: 'white' }}
                >
                  Submit Completion Report
                </Button>
              </form>
            )}

            {/* Manual Entry Form */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-10">
                
                <Input
                  label="Report Title"
                  required
                  value={reportData.title}
                  onChange={e => setReportData({ ...reportData, title: e.target.value })}
                  className="border-[3px] border-black"
                  placeholder="e.g. Water shortage in Block C"
                />

                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-4">
                    <label className="text-[0.75rem] font-black uppercase tracking-[0.1em] text-black/60 block">Category</label>
                    <select
                      className="flex h-[56px] w-full rounded-none border-[3px] border-black bg-white px-4 py-2 text-sm text-black focus:outline-none focus:ring-4 focus:ring-[#008080]/10 transition-all font-bold appearance-none cursor-pointer"
                      value={reportData.category}
                      onChange={e => setReportData({ ...reportData, category: e.target.value })}
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
                      value={reportData.urgencyScore}
                      onChange={e => setReportData({ ...reportData, urgencyScore: e.target.value })}
                      className="h-[56px] border-[3px] border-black"
                    />
                  </div>
                </div>

                <Input
                  label="Approx Affected People"
                  type="number"
                  min="0"
                  value={reportData.affectedPeople}
                  onChange={e => setReportData({ ...reportData, affectedPeople: e.target.value })}
                  className="border-[3px] border-black"
                  placeholder="e.g. 200"
                />

                <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-black/10 pb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-black">Coordinates</h3>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="flex items-center gap-2 px-6 py-3 bg-[#FFB300] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_#000] text-[0.7rem] font-black uppercase tracking-wider cursor-pointer active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                  >
                    <MapPin className="w-4 h-4" /> Use My Location
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input
                    label="Latitude"
                    placeholder="e.g. 12.9716"
                    required
                    value={reportData.lat}
                    onChange={e => setReportData({ ...reportData, lat: e.target.value })}
                    className="border-[3px] border-black"
                  />
                  <Input
                    label="Longitude"
                    placeholder="e.g. 77.5946"
                    required
                    value={reportData.lng}
                    onChange={e => setReportData({ ...reportData, lng: e.target.value })}
                    className="border-[3px] border-black"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[0.75rem] font-black uppercase tracking-[0.1em] text-black/60 block">Completion Description</label>
                  <textarea
                    required
                    className="flex min-h-[180px] w-full rounded-none border-[3px] border-black bg-white p-5 text-sm text-black focus:outline-none focus:ring-4 focus:ring-[#008080]/10 transition-all font-bold resize-vertical"
                    value={reportData.description}
                    onChange={e => setReportData({ ...reportData, description: e.target.value })}
                    placeholder="Describe what was completed and the current status..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[0.75rem] font-black uppercase tracking-[0.1em] text-black/60 block">Images (Optional)</label>
                  <label
                    className="flex items-center gap-3 w-full border-[3px] border-dashed border-black bg-[#F2EFE9]/30 px-5 py-4 cursor-pointer hover:bg-[#F2EFE9] transition-colors"
                  >
                    <UploadCloud className="w-5 h-5 text-black/40 flex-shrink-0" />
                    <span className="text-[0.75rem] font-black uppercase tracking-wider text-black/50">
                      Click to add images (JPG, PNG)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => {
                        if (e.target.files) setProofImages(Array.from(e.target.files));
                      }}
                    />
                  </label>
                  {proofImages.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {proofImages.map((img, i) => (
                        <div key={i} className="relative border-[2px] border-black" style={{ width: 72, height: 72 }}>
                          <img
                            src={URL.createObjectURL(img)}
                            alt={img.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={() => setProofImages(proofImages.filter((_, idx) => idx !== i))}
                            style={{
                              position: 'absolute', top: -8, right: -8,
                              width: 20, height: 20, borderRadius: '50%',
                              backgroundColor: '#ef4444', color: '#fff',
                              border: '2px solid #000', cursor: 'pointer',
                              fontSize: '0.65rem', fontWeight: 900,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isUploading}
                  className="w-full h-14 text-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] font-black uppercase tracking-wider"
                  isLoading={isUploading}
                  style={{ backgroundColor: '#008080' }}
                >
                  Submit Completion Report
                </Button>
              </form>
            )}

            {/* Status Feedback */}
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
                {status === 'success' ? <CheckCircle2 style={{ width: 28, height: 28, color: '#fff' }} /> : <AlertCircle style={{ width: 28, height: 28, color: '#fff' }} />}
                <p style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: '0.8rem', color: '#fff', margin: 0 }}>
                  {message}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
