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

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#F2EFE9]"><p className="text-sm font-black uppercase tracking-widest animate-pulse">Scanning Neural Network...</p></div>;
  if (!ngo) return <div className="flex h-screen items-center justify-center bg-[#F2EFE9]"><p>Organization data not found.</p></div>;

  const stats = [
    { icon: Mail, label: 'Central_Endpoint', value: ngo.contactEmail },
    { icon: Globe, label: 'Digital_Domain', value: ngo.website || "NONE_ASSIGNED" },
    { icon: Users, label: 'Active_Members', value: `${ngo.stats?.members || 0} Registered` },
    { icon: MapPin, label: 'Total_Responses', value: `${ngo.stats?.tasks || 0} Records` },
  ];

  const TokenCard = () => (
    <div className="relative group w-full">
      <div className="p-8 bg-card border-4 border-border shadow-[12px_12px_0px_var(--shadow-color)] md:shadow-[12px_12px_0px_var(--shadow-color)] shadow-[4px_4px_0px_var(--shadow-color)] flex flex-col items-center gap-6 text-center transition-all hover:-translate-x-1 hover:-translate-y-1">
        <div className="space-y-2 w-full">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Authorization_Token</p>
          <div className="py-6 px-4 bg-background border-2 border-dashed border-border select-all font-mono text-4xl md:text-5xl font-black tracking-[0.25em] text-foreground transition-all hover:bg-pur/5 w-full">
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
  );

  return (
    <div className="flex h-screen bg-[#F2EFE9]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 pt-24 md:p-12 md:pt-12 bg-[#F2EFE9]">
        <div className="max-w-[1200px] mx-auto space-y-8 md:space-y-12 pb-12">

          {/* ── HERO HEADER GRID ── */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-end gap-6 md:gap-8 border-b-4 border-border pb-6">
            <div className="text-center md:text-left">
              <h1 className="text-5xl md:text-8xl font-black text-foreground tracking-tighter uppercase italic leading-none transition-all hover:tracking-normal duration-700">
                {ngo.name}
              </h1>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4 min-w-max">
              {/* Desktop Edit Button */}
              {user.role === 'NGO_ADMIN' && (
                <Button variant="outline" onClick={() => router.push("/ngo/edit")} className="hidden md:flex h-10 px-6 font-black uppercase tracking-widest text-[10px] neo-border bg-white hover:bg-gray-50">
                  Edit_Profile
                </Button>
              )}
              <div 
                className="text-center md:text-right cursor-pointer group" 
                onClick={() => window.open(`https://www.google.com/maps?q=${ngo.location.coordinates[1]},${ngo.location.coordinates[0]}`, '_blank')}
              >
                <p className="font-mono text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 group-hover:text-pur transition-colors">Established_Coordinates</p>
                <p className="font-mono text-base md:text-2xl font-black text-foreground group-hover:text-pur transition-colors leading-none">
                  [{ngo.location.coordinates[1].toFixed(4)}°N, {ngo.location.coordinates[0].toFixed(4)}°E]
                </p>
              </div>
            </div>
          </div>

          {/* ── MOBILE: TOKEN CARD AT TOP ── */}
          <div className="block lg:hidden mt-4">
            <TokenCard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 md:gap-12">

            {/* ── MAIN CONTENT COLUMN ── */}
            <div className="space-y-8 md:space-y-12">

              {/* MISSION MANIFESTO BOX */}
              <div className="relative group w-full">
                <div className="absolute -top-3 left-0 bg-foreground text-background px-4 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest z-10">
                  Mission_Manifesto
                </div>
                <div className="p-8 md:p-10 bg-card border-4 border-border shadow-[12px_12px_0px_var(--shadow-color)] md:shadow-[12px_12px_0px_var(--shadow-color)] shadow-[4px_4px_0px_var(--shadow-color)] transition-all group-hover:shadow-[16px_16px_0px_var(--shadow-color)] group-hover:-translate-x-1 group-hover:-translate-y-1">
                  <p className="text-xl md:text-3xl font-black leading-relaxed text-foreground italic">
                    "{ngo.description}"
                  </p>
                </div>
              </div>

              {/* 2-COLUMN STATS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.map((item, i) => (
                  <div key={i} className="p-6 bg-card border-4 border-border flex items-center gap-6 group hover:border-pur transition-colors min-h-[120px]">
                    <div className="bg-foreground/5 p-3 border-2 border-border group-hover:border-pur group-hover:bg-pur/10 transition-all">
                      <item.icon className="w-6 h-6 text-foreground group-hover:text-pur transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <span className="font-mono text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                      <p className="font-mono text-sm md:text-base font-black truncate text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* MOBILE: EDIT PROFILE AT BOTTOM */}
              {user.role === 'NGO_ADMIN' && (
                <div className="block md:hidden pt-8">
                  <Button 
                    onClick={() => router.push("/ngo/edit")} 
                    className="w-full h-16 font-black uppercase tracking-widest text-xs neo-border bg-white"
                    variant="outline"
                  >
                    Edit_Organization_Profile
                  </Button>
                </div>
              )}
            </div>

            {/* ── DESKTOP: ACTION ZONE SIDEBAR ── */}
            <div className="hidden lg:block space-y-8">
              <div className="sticky top-12">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-4 pl-1">Action_Zone</p>
                <TokenCard />
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
