"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, Clock, FileImage, User, X } from "lucide-react";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

export default function VolunteerRequestsPage() {
  const { data: session, status } = useSession();
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== 'NGO_ADMIN') {
      router.push("/dashboard");
    } else if (status === "authenticated") {
      fetchPendingVolunteers();
    }
  }, [status, session, router]);

  const fetchPendingVolunteers = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/volunteers/pending`, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      setVolunteers(res.data);
    } catch (err) {
      console.error("Failed to fetch pending volunteers");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (volunteerId: string, actionStatus: 'approved' | 'rejected') => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/admin/volunteers/${volunteerId}/verify`, {
        status: actionStatus
      }, {
        headers: { Authorization: `Bearer ${(session?.user as any).accessToken}` }
      });
      setVolunteers(volunteers.filter(v => v._id !== volunteerId));
    } catch (err) {
      alert(`Failed to ${actionStatus} volunteer`);
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
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground">Volunteer Requests</h1>
          <p className="text-muted-foreground mt-2">Review and verify new volunteer applications.</p>
        </div>

        <div className="grid gap-6">
          {volunteers.length === 0 ? (
            <div className="bg-card p-12 rounded-2xl border border-dashed border-border text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold text-foreground">Queue is empty</h3>
              <p className="text-muted-foreground">No pending volunteer requests to verify at this time.</p>
            </div>
          ) : (
            volunteers.map((volunteer) => (
              <div key={volunteer._id} className="bg-card dark:bg-zinc-900/50 dark:backdrop-blur-md rounded-2xl shadow-sm border border-border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all duration-300">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded uppercase tracking-wider">
                      {volunteer.specialization || 'General'}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">Applied: {new Date(volunteer.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-foreground" />
                    <h3 className="text-xl font-bold text-foreground">{volunteer.name}</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground italic">"{volunteer.experienceBio || 'No bio provided'}"</p>
                  
                  <div className="flex items-center mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedProof(volunteer.idProofUrl)}
                    >
                      <FileImage className="w-4 h-4 mr-2" />
                      View ID Proof
                    </Button>
                  </div>
                </div>
                
                <div className="flex space-x-3 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleVerify(volunteer._id, 'rejected')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                    onClick={() => handleVerify(volunteer._id, 'approved')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal for ID Proof */}
        {selectedProof && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
                <h3 className="text-lg font-bold">ID Proof</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedProof(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-4 flex-1 overflow-auto flex justify-center items-center bg-black/5">
                {selectedProof.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={selectedProof} className="w-full h-[60vh] rounded-lg" />
                ) : (
                  <img src={selectedProof} alt="ID Proof" className="max-w-full max-h-[60vh] object-contain rounded-lg" />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
