"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UploadCloud, CheckCircle2, AlertCircle, FileText, MapPin } from "lucide-react";
import axios from "axios";
import Link from "next/link";

import Sidebar from "@/components/Sidebar";

export default function NewSurveyPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Manual Entry State
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [manualData, setManualData] = useState({
    category: 'Sanitation',
    urgencyScore: '3',
    description: '',
    lat: '',
    lng: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setStatus('idle');

    const formData = new FormData();
    formData.append('file', file);
    if (session?.user) {
      formData.append('fieldWorkerId', (session.user as any).id);
    }

    try {
      // Calls the Node.js backend, which then calls the Python AI service
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${(session?.user as any).accessToken}`
        }
      });

      setStatus('success');
      setMessage('Survey uploaded successfully! The AI is analyzing the document.');
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to upload survey. Is the Python AI service running?');
    } finally {
      setIsUploading(false);
    }
  };

  const [surveyId, setSurveyId] = useState<string | null>(null);

  const handleSaveDraft = async () => {
    if (!session?.user) return;
    setIsUploading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/save-draft`, {
        surveyId,
        category: manualData.category,
        urgency: Number(manualData.urgencyScore),
        description: manualData.description,
        location: {
          type: 'Point',
          coordinates: [Number(manualData.lng), Number(manualData.lat)]
        }
      }, {
        headers: { Authorization: `Bearer ${(session.user as any).accessToken}` }
      });

      setSurveyId(res.data.survey._id);
      setStatus('success');
      setMessage('Draft saved successfully!');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      setMessage('Failed to save draft.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setIsUploading(true);
    setStatus('idle');

    try {
      // First save the draft (or update it)
      const draftRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/save-draft`, {
        surveyId,
        category: manualData.category,
        urgency: Number(manualData.urgencyScore),
        description: manualData.description,
        location: {
          type: 'Point',
          coordinates: [Number(manualData.lng), Number(manualData.lat)]
        }
      }, {
        headers: { Authorization: `Bearer ${(session.user as any).accessToken}` }
      });

      const currentSurveyId = draftRes.data.survey._id;

      // Then submit it
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/submit`, {
        surveyId: currentSurveyId
      }, {
        headers: { Authorization: `Bearer ${(session.user as any).accessToken}` }
      });

      setStatus('success');
      setMessage('Survey submitted for verification!');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      setStatus('error');
      setMessage('Failed to submit survey.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setManualData({
            ...manualData,
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
          });
        },
        (error) => {
          alert("Unable to retrieve your location. Please check your browser permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="flex h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Add Community Data</h1>
            <p className="text-muted-foreground mt-2">Upload a paper survey for AI processing or enter data manually.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="bg-card dark:bg-zinc-900/50 dark:backdrop-blur-md rounded-2xl shadow-sm border border-border overflow-hidden transition-all duration-300">
          <div className="flex border-b border-border">
            <button
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all ${
                activeTab === 'ai' 
                  ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-500' 
                  : 'text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800'
              }`}
              onClick={() => setActiveTab('ai')}
            >
              AI OCR Upload
            </button>
            <button
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all ${
                activeTab === 'manual' 
                  ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-500' 
                  : 'text-muted-foreground hover:bg-muted dark:hover:bg-zinc-800'
              }`}
              onClick={() => setActiveTab('manual')}
            >
              Manual Entry
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'ai' ? (
              <form onSubmit={handleFileUpload} className="space-y-6">
                <div 
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                      : 'border-border dark:border-zinc-700 hover:bg-muted/50 dark:hover:bg-zinc-800/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadCloud className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-muted-foreground'}`} />
                  <div className="flex text-sm text-muted-foreground justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-2">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">PNG, JPG, GIF up to 5MB</p>
                  {file && <p className="mt-4 text-sm font-bold text-green-600 dark:text-green-400">Selected: {file.name}</p>}
                </div>

                <Button type="submit" className="w-full h-12 text-lg" disabled={!file || isUploading} isLoading={isUploading}>
                  Process with AI
                </Button>
              </form>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Category</label>
                    <select
                      className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-colors"
                      value={manualData.category}
                      onChange={e => setManualData({ ...manualData, category: e.target.value })}
                    >
                      <option>Sanitation</option>
                      <option>Medical</option>
                      <option>Education</option>
                      <option>Infrastructure</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <Input
                    label="Urgency Score (1-5)"
                    type="number" min="1" max="5" required
                    value={manualData.urgencyScore}
                    onChange={e => setManualData({ ...manualData, urgencyScore: e.target.value })}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-foreground">Coordinates</h3>
                  <button 
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Use My Location
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-6 mt-2">
                  <Input
                    label="Latitude" placeholder="e.g. 12.97" required
                    value={manualData.lat}
                    onChange={e => setManualData({ ...manualData, lat: e.target.value })}
                  />
                  <Input
                    label="Longitude" placeholder="e.g. 77.59" required
                    value={manualData.lng}
                    onChange={e => setManualData({ ...manualData, lng: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Description</label>
                  <textarea
                    required
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 min-h-[100px] transition-colors"
                    value={manualData.description}
                    onChange={e => setManualData({ ...manualData, description: e.target.value })}
                    placeholder="Describe the community need..."
                  />
                </div>

                <div className="flex space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-12 text-lg" 
                    onClick={handleSaveDraft} 
                    disabled={isUploading}
                  >
                    Save Draft
                  </Button>
                  <Button type="submit" className="flex-1 h-12 text-lg" disabled={isUploading} isLoading={isUploading}>
                    Submit Survey
                  </Button>
                </div>
              </form>
            )}

            {status === 'success' && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-start border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-green-800 font-medium">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg flex items-start border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-800 font-medium">{message}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
