import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Heart, Shield, Zap, Map as MapIcon, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background transition-colors duration-500">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-8 md:px-20 glass-nav">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-primary stroke-[1.5pt]" />
          <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground">NexusImpact</span>
        </div>
        <div className="hidden md:flex items-center gap-12">
          {["Home", "Impact", "Solutions", "Contact"].map((item) => (
            <Link key={item} href="#" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors">
              {item}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Login</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-20">
        <section className="px-8 py-20 md:px-20 md:py-32 max-w-[1440px] mx-auto overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-20 items-center">
            {/* Left Column: Clean Typography */}
            <div className="space-y-12">
              <div className="space-y-6">
                <h1 className="text-6xl md:text-[120px] font-black text-foreground leading-[0.85] tracking-[-0.04em]">
                  THINK<br />
                  <span className="text-primary">[</span>NEXUS<span className="text-primary">]</span>
                </h1>
                <p className="text-lg md:text-2xl text-foreground font-medium max-w-xl leading-snug">
                  Synergizing human intent<br />
                  with digital precision.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <Link href="/register">
                  <Button size="lg" className="h-16 px-10 group">
                    Launch Platform <ArrowRight className="ml-3 h-5 w-5 stroke-[1.5pt] group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="h-16 px-10">
                    Explore Solutions
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Doodle Asset Container */}
            <div className="relative group">
              <div className="neo-border p-4 bg-white dark:bg-zinc-900 overflow-hidden rounded-[8px] transition-transform duration-500 group-hover:scale-[1.02]">
                <Image 
                  src="/hero-doodle.jpg" 
                  alt="NexusImpact Puzzle Doodle" 
                  width={800} 
                  height={800} 
                  className="w-full h-auto grayscale contrast-125 mix-blend-multiply dark:mix-blend-normal dark:invert dark:grayscale-0"
                  priority
                />
              </div>
              {/* Floating Label for Japanese Boutique Feel */}
              <div className="absolute -bottom-4 -right-4 bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] px-6 py-3 rounded-[4px] shadow-lg">
                Visual Narrative 01
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-8 py-32 md:px-20 bg-background border-t-2 border-foreground/5">
          <div className="max-w-[1440px] mx-auto space-y-20">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b-2 border-foreground/5 pb-12">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter">CORE<br />SYNERGIES</h2>
              <p className="text-muted-foreground text-sm uppercase tracking-[0.2em] font-bold max-w-xs text-right">
                Digitizing handwritten surveys with AI precision.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "AI INGESTION", desc: "Transform handwritten paper surveys into validated digital records in under 30 seconds." },
                { icon: MapIcon, title: "PRECISION MAPS", desc: "Geospatial heatmaps that protect privacy while revealing critical resource gaps." },
                { icon: Shield, title: "VERIFIED IMPACT", desc: "Automated task routing and GPS validation for transparent volunteer oversight." }
              ].map((feature, i) => (
                <div key={i} className="neo-border p-10 space-y-8 bg-card hover:bg-muted/30 transition-all duration-300 rounded-[8px]">
                  <div className="w-12 h-12 bg-primary/10 rounded-[4px] flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary stroke-[1.5pt]" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black tracking-tight">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t-2 border-foreground/5 px-8 md:px-20 bg-background">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary stroke-[1.5pt]" />
            <span className="text-xl font-black uppercase tracking-[0.3em] text-foreground leading-none">NexusImpact</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
              © 2026 NexusImpact. Built for the Human Intent.
            </p>
            <div className="flex gap-8">
              {["Privacy", "Terms", "Contact"].map(item => (
                <Link key={item} href="#" className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground hover:text-primary transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
