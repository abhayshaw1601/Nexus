import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Heart, Shield, Zap, Map as MapIcon } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background transition-colors duration-500">
      {/* Navigation */}
      <nav className="flex h-20 items-center justify-between px-8 md:px-20 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Heart className="h-8 w-8 text-blue-600 dark:text-blue-500" />
          <span className="text-2xl font-black text-foreground tracking-tighter">NEXUS<span className="text-blue-600 dark:text-blue-500">IMPACT</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="font-bold">Login</Button>
          </Link>
          <Link href="/register">
            <Button className="font-bold px-6">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-8 py-20 md:px-20 md:py-32 text-center relative overflow-hidden">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-background dark:from-blue-900/10 dark:to-background -z-10" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />

          <div className="max-w-4xl mx-auto relative">
            <div className="inline-block px-4 py-1.5 mb-6 text-xs font-black uppercase tracking-[0.2em] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
              The Future of Community Response
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-foreground leading-[0.9] mb-8 tracking-tighter">
              Bridging the Data Gap for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Community Response</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
              NexusImpact uses AI to digitize handwritten surveys, visualize urgent needs on geospatial heatmaps, and automate volunteer dispatch for maximum local impact.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-xl font-black shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform">
                  Launch Platform
                </Button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-10 text-xl font-bold border-2 hover:bg-muted transition-all">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-8 py-32 md:px-20 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="group p-10 rounded-[2rem] bg-card dark:bg-zinc-900/50 border border-border hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight">AI OCR Ingestion</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Transform paper-based surveys into structured digital data in seconds using our hybrid PaddleOCR and Gemini pipeline.
              </p>
            </div>
            <div className="group p-10 rounded-[2rem] bg-card dark:bg-zinc-900/50 border border-border hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <MapIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight">Geospatial Heatmaps</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Visualize community needs with precision. Our weighted heatmaps identify clusters of urgency while protecting resident privacy.
              </p>
            </div>
            <div className="group p-10 rounded-[2rem] bg-card dark:bg-zinc-900/50 border border-border hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight">Verified Impact</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Automate task dispatch to nearby volunteers. GPS-validated proof of completion ensures every contribution is verified.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-border px-8 md:px-20 bg-card">
        <div className="flex flex-col md:flex-row justify-between items-center gap-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            <span className="text-2xl font-black text-foreground tracking-tighter">NEXUS<span className="text-blue-600 dark:text-blue-500">IMPACT</span></span>
          </div>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">
            © 2026 NexusImpact. Empowering communities through data.
          </p>
          <div className="flex gap-8">
            <Link href="#" className="text-muted-foreground hover:text-blue-600 transition-colors font-bold text-sm">Privacy</Link>
            <Link href="#" className="text-muted-foreground hover:text-blue-600 transition-colors font-bold text-sm">Terms</Link>
            <Link href="#" className="text-muted-foreground hover:text-blue-600 transition-colors font-bold text-sm">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
