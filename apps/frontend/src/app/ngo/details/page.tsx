"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import axios from "axios";
import { Users, Copy, Check, Globe, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NGODetailsPage() {
  const { data: session, status } = useSession();
  const [ngo, setNgo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
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
      setNgo(res.data);
    } catch (err) {
      console.error("Failed to fetch NGO details", err);
    } finally {
      setLoading(false);
    }
  };

  const copyJoinCode = () => {
    if (ngo?.joinCode) {
      navigator.clipboard.writeText(ngo.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-background"><p className="text-sm font-black uppercase tracking-widest animate-pulse">Scanning Neural Network...</p></div>;
  if (!ngo) return <div className="flex h-screen items-center justify-center bg-background"><p>Organization data not found.</p></div>;

  const BLACK = 'var(--border-color)';
  const WHITE = 'var(--shadow-color)';
  const PUR = 'var(--pur)';
  const FG = 'var(--fg)';

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-12 bg-background">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* ── HERO SECTION ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-border pb-4">
            <div className="flex-1">
              <h1 className="text-7xl font-black text-foreground tracking-tighter uppercase italic leading-none transition-all hover:tracking-normal duration-700">
                {ngo.name}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-4 min-w-max">
              {user.role === 'NGO_ADMIN' && (
                <Button variant="outline" onClick={() => router.push("/ngo/edit")} className="h-9 px-4 font-black uppercase tracking-widest text-[9px] neo-border">
                  Edit_Profile
                </Button>
              )}
              <div className="text-right cursor-pointer group" onClick={() => window.open(`https://www.google.com/maps?q=${ngo.location.coordinates[1]},${ngo.location.coordinates[0]}`, '_blank')}>
                <p className="font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 group-hover:text-pur transition-colors">Established_Coordinates</p>
                <p className="font-mono text-lg font-black text-foreground group-hover:text-pur transition-colors leading-none">
                  [{ngo.location.coordinates[1].toFixed(4)}°N, {ngo.location.coordinates[0].toFixed(4)}°E]
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── LEFT: CORE DATA ── */}
            <div className="lg:col-span-8 space-y-8">

              {/* DESCRIPTION BOX */}
              <div className="relative group">
                <div className="absolute -top-3 -left-3 bg-foreground text-background px-3 py-1 font-mono text-[9px] font-black uppercase tracking-widest z-10">
                  Mission_Manifesto
                </div>
                <div className="p-8 bg-card border-4 border-border shadow-[12px_12px_0px_var(--shadow-color)] transition-all group-hover:shadow-[16px_16px_0px_var(--shadow-color)] group-hover:-translate-x-1 group-hover:-translate-y-1">
                  <p className="text-xl font-bold leading-relaxed text-foreground italic">
                    "{ngo.description}"
                  </p>
                </div>
              </div>

              {/* DATA GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Mail, label: 'Central_Endpoint', value: ngo.contactEmail },
                  { icon: Globe, label: 'Digital_Domain', value: ngo.website || "NONE_ASSIGNED" },
                  { icon: Users, label: 'Active_Members', value: `${ngo.stats?.members || 0} Registered` },
                  { icon: MapPin, label: 'Total_Responses', value: `${ngo.stats?.tasks || 0} Records` },
                ].map((item, i) => (
                  <div key={i} className="p-6 bg-card border-2 border-border flex flex-col gap-3 group hover:border-pur transition-colors">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-pur transition-colors" />
                      <span className="font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                    </div>
                    <p className="font-mono text-sm font-bold truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: ACCESS CONTROLS ── */}
            <div className="lg:col-span-4 space-y-8">

              {/* JOIN CODE CARD */}
              <div className="relative">
                <div className="p-8 bg-card border-4 border-border shadow-[12px_12px_0px_var(--shadow-color)] space-y-8 text-center relative group hover:shadow-[16px_16px_0px_var(--shadow-color)] transition-all hover:-translate-x-1 hover:-translate-y-1">

                  <div className="space-y-2">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Authorization_Token</p>
                    <div className="py-6 px-4 bg-background border-2 border-dashed border-border select-all font-mono text-5xl font-black tracking-[0.25em] text-foreground transition-all hover:bg-pur/5">
                      {ngo.joinCode}
                    </div>
                  </div>

                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight tracking-wider px-4">
                    Distribute this token to synchronize field workers & volunteers with your node.
                  </p>

                  <Button
                    onClick={copyJoinCode}
                    className="w-full h-14 font-black uppercase tracking-[0.2em] text-[10px] neo-border"
                    variant={copied ? "mint" : "primary"}
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "TOKEN_SECURED" : "COPY_ACCESS_TOKEN"}
                  </Button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
