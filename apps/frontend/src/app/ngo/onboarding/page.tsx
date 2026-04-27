"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import axios from "axios";
import Sidebar from "@/components/Sidebar";

export default function NGOOnboarding() {
  const { data: session, update } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    coordinates: [77.5946, 12.9716], // Default Bangalore
    contactEmail: "",
    website: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/ngo/register`,
        formData,
        {
          headers: { Authorization: `Bearer ${(session.user as any).accessToken}` }
        }
      );
      
      // Update session with new ngoId
      await update({ ngoId: res.data._id });
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "NGO registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-12">
        <div className="max-w-2xl space-y-8">
          <div>
            <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase">
              REGISTER YOUR [NGO]
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-2">
              Establish your organization on the Nexus platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 border-2 border-border shadow-[8px_8px_0px_var(--shadow-color)]">
            <Input
              label="Organization Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="E.G. Green Earth Foundation"
            />
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-[4px] border-2 border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 font-medium"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does your NGO do?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contact Email"
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="admin@ngo.org"
              />
              <Input
                label="Website (Optional)"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://ngo.org"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Location (Lng, Lat)</label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  step="any"
                  value={formData.coordinates[0]}
                  onChange={(e) => setFormData({ ...formData, coordinates: [parseFloat(e.target.value), formData.coordinates[1]] })}
                />
                <Input
                  type="number"
                  step="any"
                  value={formData.coordinates[1]}
                  onChange={(e) => setFormData({ ...formData, coordinates: [formData.coordinates[0], parseFloat(e.target.value)] })}
                />
              </div>
            </div>

            {error && <p className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em]">{error}</p>}

            <Button type="submit" className="w-full h-14" isLoading={isLoading}>
              Establish Organization
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
