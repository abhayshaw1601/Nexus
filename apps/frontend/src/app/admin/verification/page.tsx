"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, Clock, MapPin, User } from "lucide-react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

export default function VerificationQueuePage() {
  const { data: session, status } = useSession();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== 'NGO_ADMIN') {
      router.push("/dashboard");
    } else if (status === "authenticated") {
      fetchPendingSurveys();
    }
  }, [status, session, router]);

  const fetchPendingSurveys = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/ngo/pending-reports`, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      setSurveys(res.data);
    } catch (err) {
      console.error("Failed to fetch pending surveys");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (surveyId: string, action: 'VERIFIED' | 'REJECTED') => {
    try {
      // Use the verify action on the survey directly
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/surveys/verify`, {
        surveyId,
        action
      }, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      setSurveys(surveys.filter(s => s._id !== surveyId));
    } catch (err) {
      alert(`Failed to ${action.toLowerCase()} survey`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-12 border-b-2 border-border pb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">Verification [ QUEUE ]</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-4">Review and approve human intent records.</p>
        </div>

        <div className="space-y-8 max-w-5xl">
          {surveys.length === 0 ? (
            <div className="neo-border p-20 rounded-[4px] bg-card text-center space-y-6">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground stroke-[1.5pt]" />
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Queue Empty</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">No pending records detected.</p>
              </div>
            </div>
          ) : (
            surveys.map((survey) => (
              <div key={survey._id} className="neo-border bg-card p-10 rounded-[4px] flex flex-col md:flex-row justify-between items-start gap-12 transition-all duration-300">
                <div className="space-y-8 flex-1">
                  <div className="flex items-center space-x-4">
                    <span className={`px-4 py-2 rounded-[4px] text-[10px] font-black uppercase tracking-widest ${
                      survey.urgency >= 4 ? 'bg-red-600 text-white' : 'bg-primary/10 text-primary'
                    }`}>
                      URGENCY_{survey.urgency || '0'}
                    </span>
                    <span className="text-[10px] font-black text-foreground bg-muted px-4 py-2 rounded-[4px] uppercase tracking-widest">
                      {survey.category}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-foreground uppercase leading-tight">{survey.description}</h3>
                    
                    {/* Data Stack Display */}
                    {survey.dataStack && Object.keys(survey.dataStack).length > 0 && (
                      <div className="neo-border bg-background p-6 rounded-[4px] mt-4">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-4 tracking-[0.3em]">Worker Data Stack</h4>
                        <pre className="text-xs text-foreground font-mono overflow-x-auto p-4 bg-muted/30 rounded-[4px]">
                          {JSON.stringify(survey.dataStack, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pt-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 stroke-[1.5pt]" />
                      Worker: <span className="text-foreground ml-2">{survey.fieldWorkerId?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 stroke-[1.5pt]" />
                      GPS: <span className="text-foreground ml-2">
                        {survey.location?.coordinates && survey.location.coordinates.length >= 2 && survey.location.coordinates[0] != null && survey.location.coordinates[1] != null
                          ? `${Number(survey.location.coordinates[1]).toFixed(4)}, ${Number(survey.location.coordinates[0]).toFixed(4)}` 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 w-full md:w-48">
                  <Button 
                    className="h-14 bg-green-600 text-white hover:bg-green-700"
                    onClick={() => handleVerify(survey._id, 'VERIFIED')}
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-14 border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    onClick={() => handleVerify(survey._id, 'REJECTED')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
