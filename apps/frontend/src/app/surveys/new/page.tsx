"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UploadCloud, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function NewSurveyPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
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
        headers: { 'Content-Type': 'multipart/form-data' }
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setStatus('idle');

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tasks/create`, {
        surveyId: null, // No source survey for manual
        category: manualData.category,
        urgencyScore: Number(manualData.urgencyScore),
        description: manualData.description,
        coordinates: [Number(manualData.lng), Number(manualData.lat)]
      });
      
      setStatus('success');
      setMessage('Task created manually and added to the heatmap!');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      setStatus('error');
      setMessage('Failed to create task manually.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Add Community Data</h1>
            <p className="text-gray-600 mt-2">Upload a paper survey for AI processing or enter data manually.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b">
            <button 
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'ai' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('ai')}
            >
              AI OCR Upload
            </button>
            <button 
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'manual' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('manual')}
            >
              Manual Entry
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'ai' ? (
              <form onSubmit={handleFileUpload} className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:bg-gray-50 transition-colors">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-bold text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-2">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
                  {file && <p className="mt-4 text-sm font-bold text-green-600">Selected: {file.name}</p>}
                </div>
                
                <Button type="submit" className="w-full h-12 text-lg" disabled={!file || isUploading} isLoading={isUploading}>
                  Process with AI
                </Button>
              </form>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-900">Category</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500"
                      value={manualData.category}
                      onChange={e => setManualData({...manualData, category: e.target.value})}
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
                    onChange={e => setManualData({...manualData, urgencyScore: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <Input 
                    label="Latitude" placeholder="e.g. 12.97" required
                    value={manualData.lat}
                    onChange={e => setManualData({...manualData, lat: e.target.value})}
                  />
                  <Input 
                    label="Longitude" placeholder="e.g. 77.59" required
                    value={manualData.lng}
                    onChange={e => setManualData({...manualData, lng: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-900">Description</label>
                  <textarea 
                    required
                    className="flex w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    value={manualData.description}
                    onChange={e => setManualData({...manualData, description: e.target.value})}
                    placeholder="Describe the community need..."
                  />
                </div>
                
                <Button type="submit" className="w-full h-12 text-lg" disabled={isUploading} isLoading={isUploading}>
                  Add to Heatmap
                </Button>
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
      </div>
    </div>
  );
}
