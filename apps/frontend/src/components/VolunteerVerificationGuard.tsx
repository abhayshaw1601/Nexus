"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import axios from "axios";
import { FileUp, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function VolunteerVerificationGuard({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession();
  const user = session?.user as any;

  const [specialization, setSpecialization] = useState("General Labor");
  const [experienceBio, setExperienceBio] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user || user.role !== "VOLUNTEER") {
    return <>{children}</>;
  }

  // If approved, show the actual dashboard
  if (user.status === "approved" || user.isVerified) {
    return <>{children}</>;
  }

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload an ID Proof");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("specialization", specialization);
    formData.append("experienceBio", experienceBio);
    formData.append("idProof", file);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/volunteer/submit-details`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.accessToken}`
        }
      });
      // Update session to reflect new status
      await update({ status: "pending" });
      // Force reload to get updated session status
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit details");
      setIsLoading(false);
    }
  };

  // If status is incomplete (needs to submit details)
  if (user.status === "incomplete" || !user.status) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
          <div className="bg-blue-600 p-6 text-white text-center relative">
            <button
              onClick={() => signOut()}
              className="absolute top-4 right-4 text-white/80 hover:text-white text-sm font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Logout
            </button>
            <ShieldAlert className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-2xl font-black">Volunteer Verification Required</h2>
            <p className="text-blue-100 mt-2 text-sm font-medium">Please provide your details to access the dashboard.</p>
          </div>

          <form onSubmit={handleSubmitDetails} className="p-6 space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Specialization</label>
              <select
                className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              >
                <option value="Medical">Medical</option>
                <option value="Technical">Technical</option>
                <option value="Logistics">Logistics</option>
                <option value="General Labor">General Labor</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">ID Proof</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileUp className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">
                    {file ? file.name : "Click to upload ID Card or Certificate"}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Experience / Bio</label>
              <textarea
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Briefly describe your experience..."
                required
                minLength={5}
                value={experienceBio}
                onChange={(e) => setExperienceBio(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

            <Button type="submit" className="w-full h-12 font-bold text-lg" isLoading={isLoading}>
              Submit Verification
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // If status is pending
  if (user.status === "pending") {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
            <ClockIcon className="w-10 h-10 text-yellow-600 dark:text-yellow-500" />
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Verification Pending</h2>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed">
            Your details have been submitted and are currently under review by an NGO Admin.
            You will gain access to the dashboard once approved.
          </p>
          <div className="pt-4">
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              Refresh Status
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === "rejected") {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-red-500/50 p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Verification Rejected</h2>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed">
            Unfortunately, your volunteer application was not approved. Please contact an admin for more details.
          </p>
        </div>
      </div>
    );
  }

  // Fallback
  return <>{children}</>;
}

// Simple clock icon component
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
