"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, AlertCircle, ArrowRight, Save, Image as ImageIcon } from "lucide-react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

export default function VerifySurveyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const [surveyData, setSurveyData] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);

  const getToken = () => (session?.user as any)?.accessToken;

  useEffect(() => {
    const fetchSurvey = async () => {
      const token = getToken();
      if (!token) return;
      
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/surveys/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSurveyData(res.data);
        
        if (res.data.extractedEntries && res.data.extractedEntries.length > 0) {
          setEntries(res.data.extractedEntries);
        } else {
          // Fallback to single entry for older data
          setEntries([{
            category: res.data.category || 'Other',
            urgency: res.data.urgency || 3,
            description: res.data.description || '',
            latitude: res.data.location?.coordinates?.[1]?.toString() || '',
            longitude: res.data.location?.coordinates?.[0]?.toString() || '',
          }]);
        }
      } catch (err: any) {
        console.error("Failed to fetch survey:", err);
        setStatus('error');
        setMessage("Could not load survey data.");
      } finally {
        setLoading(false);
      }
    };

    if (id && session) fetchSurvey();
  }, [id, session]);

  const handleEntryChange = (index: number, field: string, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setIsSubmitting(true);
    setStatus('idle');

    try {
      // For simplicity, we'll update the survey with the first entry's data 
      // and potentially handle multi-task creation on the backend if we want to be thorough.
      // But for now, let's just save the updated list.
      
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/save-draft`, {
        surveyId: id,
        extractedEntries: entries, // Backend should handle this list
        // Fallback for top-level fields
        category: entries[0]?.category,
        urgency: entries[0]?.urgency,
        description: entries[0]?.description,
        location: entries[0]?.latitude && entries[0]?.longitude ? {
           type: 'Point',
           coordinates: [Number(entries[0].longitude), Number(entries[0].latitude)]
        } : undefined
      }, { headers: { Authorization: `Bearer ${token}` } });

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/submit`, {
        surveyId: id,
      }, { headers: { Authorization: `Bearer ${token}` } });

      setStatus('success');
      setMessage('All entries verified and submitted!');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      console.error("Submission failed:", err);
      setStatus('error');
      setMessage(err.response?.data?.message || "Failed to submit entries.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-layout">
        <Sidebar />
        <main className="neo-main flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#008080] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-black uppercase tracking-widest text-black/40">Analyzing Document Layers...</p>
          </div>
        </main>
      </div>
    );
  }

  const getImageUrl = () => {
    if (!surveyData?.rawImageUrl) return null;
    // If it's already a full URL (Cloudinary), return it directly
    if (surveyData.rawImageUrl.startsWith('http')) {
      return surveyData.rawImageUrl;
    }
    // Fallback for older local paths
    const path = surveyData.rawImageUrl.replace(/\\/g, '/');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.split('/api')[0];
    return `${baseUrl}/${encodeURI(path)}`;
  };

  const imageUrl = getImageUrl();

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="neo-main">
        <div style={{ width: 'min(100%, 1500px)', margin: '0 auto', paddingBottom: '4rem' }}>
          
          <div className="mb-10 pb-6 border-b-[2.5px] border-black flex justify-between items-end">
            <div>
              <h1 className="page-title text-4xl">Data [ Verification ]</h1>
              <p className="page-subtitle">Detected {entries.length} survey entries in this document</p>
            </div>
            <div className="bg-black text-white px-6 py-2 font-black uppercase text-[0.7rem] tracking-widest shadow-[4px_4px_0px_0px_#008080]">
              Survey ID: {id?.toString().slice(-8).toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left: Original Document Preview (Sticky) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="sticky top-10">
                <div className="bg-black p-1 inline-block">
                  <span className="text-white text-[0.6rem] font-black uppercase tracking-widest px-3 py-1 flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" /> Original Document
                  </span>
                </div>
                
                <div className="neo-card border-[3px] border-black bg-[#F2EFE9] shadow-[8px_8px_0px_0px_#000] overflow-hidden min-h-[700px] flex items-center justify-center relative">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Uploaded Survey" 
                      className="max-w-full h-auto object-contain transition-transform hover:scale-110 duration-500 cursor-zoom-in"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/600x800?text=Preview+Error+Check+URL";
                        console.error("Image failed to load:", imageUrl);
                      }}
                    />
                  ) : (
                    <div className="text-center opacity-20">
                      <ImageIcon className="w-20 h-20 mx-auto mb-4" />
                      <p className="font-black uppercase tracking-tighter text-2xl">Image Not Found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Extracted Data Verification (Scrollable) */}
            <div className="lg:col-span-6 space-y-8">
              <div className="bg-[#008080] p-1 inline-block shadow-[4px_4px_0px_0px_#000]">
                <span className="text-white text-[0.6rem] font-black uppercase tracking-widest px-3 py-1 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> AI Extracted Entries
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                {entries.map((entry, idx) => (
                  <div key={idx} className="neo-card-full-deep bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_#000] p-8 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-black text-white px-4 py-1 font-black text-[0.6rem] uppercase tracking-widest">
                      Entry #{idx + 1}
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                        <label className="text-[0.65rem] font-black uppercase tracking-wider text-black/40">Category</label>
                        <select
                          className="flex h-[48px] w-full border-[3px] border-black bg-white px-4 text-sm font-bold appearance-none cursor-pointer"
                          value={entry.category}
                          onChange={e => handleEntryChange(idx, 'category', e.target.value)}
                        >
                          {['Sanitation', 'Medical', 'Education', 'Infrastructure', 'Other'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                         <Input
                          label="Urgency"
                          type="number"
                          min="1"
                          max="5"
                          value={entry.urgency}
                          onChange={e => handleEntryChange(idx, 'urgency', Number(e.target.value))}
                          className="h-[48px] border-[3px] border-black"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Input
                          label="Latitude"
                          value={entry.latitude || ''}
                          onChange={e => handleEntryChange(idx, 'latitude', e.target.value)}
                          className="h-[48px] border-[3px] border-black font-mono text-[0.8rem]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          label="Longitude"
                          value={entry.longitude || ''}
                          onChange={e => handleEntryChange(idx, 'longitude', e.target.value)}
                          className="h-[48px] border-[3px] border-black font-mono text-[0.8rem]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[0.65rem] font-black uppercase tracking-wider text-black/40">Description</label>
                      <textarea
                        className="flex min-h-[120px] w-full border-[3px] border-black bg-white p-4 text-sm font-bold resize-none leading-relaxed"
                        value={entry.description}
                        onChange={e => handleEntryChange(idx, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-6 space-y-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-16 text-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] font-black uppercase tracking-[0.2em]"
                    isLoading={isSubmitting}
                    style={{ backgroundColor: '#008080' }}
                  >
                    Confirm All {entries.length} Entries <ArrowRight className="ml-3 w-5 h-5" />
                  </Button>
                  
                  {status !== 'idle' && (
                    <div className={`p-4 flex items-center gap-3 border-[3px] border-black shadow-[4px_4px_0px_0px_#000] ${status === 'success' ? 'bg-[#008080] text-white' : 'bg-[#FF4D4D] text-white'}`}>
                      {status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <p className="font-bold text-[0.8rem] uppercase tracking-wider">{message}</p>
                    </div>
                  )}
                </div>
              </form>

              <div className="p-6 bg-[#F2EFE9] border-[3px] border-black border-dashed mt-8">
                <p className="text-[0.6rem] font-bold text-black/40 uppercase tracking-widest leading-relaxed">
                  <Save className="inline w-3 h-3 mr-1 mb-1" /> All changes are saved as a draft automatically. Confirming will create live task(s) for field workers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
