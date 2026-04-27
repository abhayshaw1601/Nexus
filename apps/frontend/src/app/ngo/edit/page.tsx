"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import axios from "axios";
import Sidebar from "@/components/Sidebar";
import { Save, ArrowLeft } from "lucide-react";

export default function NGOEditPage() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    coordinates: [0, 0],
    contactEmail: "",
    website: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const user = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") {
      fetchNGODetails();
    }
  }, [status, router]);

  const fetchNGODetails = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/ngo/my-ngo`, {
        headers: { Authorization: `Bearer ${user?.accessToken}` }
      });
      const { name, description, location, contactEmail, website } = res.data;
      setFormData({
        name,
        description,
        coordinates: location.coordinates,
        contactEmail,
        website: website || "",
      });
    } catch (err) {
      console.error("Failed to fetch NGO details", err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/ngo/update`,
        formData,
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` }
        }
      );
      router.push("/ngo/details");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update NGO");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="flex h-screen items-center justify-center bg-background"><p className="text-sm font-black uppercase tracking-widest animate-pulse">Syncing Database...</p></div>;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-12">
        <div className="max-w-2xl mx-auto space-y-12">
          
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">
                [EDIT_ORG_PROFILE]
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Modify organization parameters
              </p>
            </div>
            <Button variant="outline" onClick={() => router.back()} className="h-10 px-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 bg-card p-10 border-4 border-border shadow-[12px_12px_0px_var(--shadow-color)]">
            <div className="space-y-6">
              <Input
                label="Organization Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-[4px] border-2 border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 font-medium"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Contact Email"
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
                <Input
                  label="Website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Headquarters Coordinates (Lng, Lat)</label>
                <div className="grid grid-cols-2 gap-6">
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
            </div>

            {error && <p className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em]">{error}</p>}

            <Button type="submit" className="w-full h-14" isLoading={isLoading}>
              <Save className="w-4 h-4 mr-2" /> Save Global Changes
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
