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
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground">Verification Queue</h1>
          <p className="text-muted-foreground mt-2">Review and approve community reports submitted by field workers.</p>
        </div>

        <div className="grid gap-6">
          {surveys.length === 0 ? (
            <div className="bg-card p-12 rounded-2xl border border-dashed border-border text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold text-foreground">Queue is empty</h3>
              <p className="text-muted-foreground">No pending reports to verify at this time.</p>
            </div>
          ) : (
            surveys.map((survey) => (
              <div key={survey._id} className="bg-card dark:bg-zinc-900/50 dark:backdrop-blur-md rounded-2xl shadow-sm border border-border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all duration-300">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      survey.urgency >= 4 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      Urgency: {survey.urgency || 'N/A'}
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded uppercase tracking-wider">
                      {survey.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{survey.description}</h3>
                  
                  {/* Data Stack Display */}
                  {survey.dataStack && Object.keys(survey.dataStack).length > 0 && (
                    <div className="bg-muted/50 p-3 rounded-lg border border-border mt-2">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-widest">Worker Data Stack</h4>
                      <pre className="text-xs text-foreground font-mono overflow-x-auto p-2 bg-background/50 rounded">
                        {JSON.stringify(survey.dataStack, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1.5" />
                      Submitted by: <span className="font-bold ml-1 text-foreground">{survey.fieldWorkerId?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1.5" />
                      Location: <span className="font-bold ml-1 text-foreground">
                        {survey.location?.coordinates && survey.location.coordinates.length >= 2 && survey.location.coordinates[0] != null && survey.location.coordinates[1] != null
                          ? `${Number(survey.location.coordinates[1]).toFixed(4)}, ${Number(survey.location.coordinates[0]).toFixed(4)}` 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleVerify(survey._id, 'REJECTED')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                    onClick={() => handleVerify(survey._id, 'VERIFIED')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
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
