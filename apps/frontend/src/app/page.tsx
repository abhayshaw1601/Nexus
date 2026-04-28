"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Heart,
  Zap,
  Map as MapIcon,
  ShieldCheck,
  ArrowRight,
  Database,
  Activity,
  Globe,
  Cpu
} from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useState } from "react";

// --- Components ---

const StatusDot = () => (
  <span className="relative flex h-2 w-2 mr-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
  </span>
);

const BentoNode = ({ icon: Icon, title, desc, color, id, minH }: { icon: any, title: string, desc: string, color: string, id: string, minH?: string }) => (
  <motion.div 
    whileHover={{ y: -5, x: -2, boxShadow: "12px 12px 0px 0px #000" }}
    className={`bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] min-[480px]:shadow-[8px_8px_0px_0px_#000] p-6 flex flex-col relative group transition-all duration-300 ${minH || 'min-h-[140px]'}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 ${color} border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]`}>
        <Icon className="w-5 h-5 text-black" />
      </div>
      <span className="font-mono text-[9px] font-black opacity-30">[{id}]</span>
    </div>

    <div className="space-y-3">
      <h4 className="font-heading font-black italic uppercase text-base tracking-[0.05em] leading-none">
        {title}
      </h4>
      <p className="font-mono text-[11.5px] leading-snug text-muted-foreground group-hover:text-black transition-colors tracking-[-0.01em]">
        {desc}
      </p>
    </div>
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, desc, delay, accent }: { icon: any, title: string, desc: string, delay: number, accent: string }) => (
  <motion.div
    initial={{ x: 100, y: 100, opacity: 0 }}
    whileInView={{ x: 0, y: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    className="bg-white border-4 border-black p-10 shadow-[4px_4px_0px_0px_#000] min-[480px]:shadow-[8px_8px_0px_0px_#000] flex flex-col gap-8 group mb-6 md:mb-0"
  >
    <div className={`w-16 h-16 ${accent} border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all`}>
      <Icon className="w-8 h-8 text-black" />
    </div>
    <div className="space-y-4">
      <h3 className="text-3xl font-black uppercase tracking-tighter italic">{title}</h3>
      <p className="font-medium text-lg leading-snug">{desc}</p>
    </div>
    <div className="mt-auto pt-8 border-t-2 border-black/10">
      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-black transition-colors">
        System Protocol v2.4 <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  </motion.div>
);

// --- Main Page ---

export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const springBgY = useSpring(bgY, { stiffness: 100, damping: 30 });

  const leftColumnY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const rightColumnY = useTransform(scrollYProgress, [0, 1], [0, -300]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#F1EFE7] text-black font-body dotted-grid" style={{ overflow: 'clip' }}>

      {/* Parallax Background Layer */}
      <motion.div
        style={{ y: springBgY }}
        className="absolute inset-0 pointer-events-none z-0 opacity-10"
      >
        <div className="absolute top-20 left-10 text-8xl font-black text-black">+</div>
        <div className="absolute top-[40%] right-[10%] text-9xl font-black text-black">+</div>
        <div className="absolute top-[70%] left-[15%] text-8xl font-black text-black">+</div>
        <div className="grid grid-cols-12 gap-4 h-[200%] w-full p-10">
          {Array.from({ length: 96 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-black rounded-full" />
          ))}
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-20 md:h-24 min-h-[60px] items-center justify-between px-4 md:px-20 border-b-4 border-black bg-[#F1EFE7]/90 backdrop-blur-sm" style={{ borderRight: 'none' }}>
        <div className="flex items-center gap-4 shrink-0">
          <div className="p-2 border-4 border-black bg-[#008080] shadow-[3px_3px_0px_0px_#000] md:shadow-[4px_4px_0px_0px_#000]">
            <Heart className="h-6 w-6 text-black fill-black/10" />
          </div>
          <span className="hidden md:block text-xl font-black uppercase tracking-[0.3em]">NexusImpact</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <Link href="/login" className="shrink-0">
            <button className="px-3 py-2 md:px-6 md:py-3 font-black text-[11px] md:text-[10px] uppercase tracking-widest border-4 border-black bg-white hover:bg-[#F1EFE7] shadow-[3px_3px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000] active:shadow-[2px_2px_0px_0px_#000] active:translate-x-[6px] active:translate-y-[6px] transition-all">
              Login
            </button>
          </Link>
          <Link href="/register" className="shrink-0">
            <button className="px-3 py-2 md:px-6 md:py-3 font-black text-[11px] md:text-[10px] uppercase tracking-widest border-4 border-black bg-[#FFD700] shadow-[3px_3px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000] active:shadow-[2px_2px_0px_0px_#000] active:translate-x-[6px] active:translate-y-[6px] transition-all">
              Join Network
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-[40px] md:pb-[100px] px-[20px] md:px-20 max-w-[1440px] mx-auto z-10 box-sizing-border-box">
        <div className="flex flex-col lg:grid lg:grid-cols-[0.6fr_0.4fr] gap-10 md:gap-24 items-center w-full max-w-full">

          {/* Hero Left */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-12"
          >
            <div className="flex flex-col gap-[40px]">
              <span className="bg-[#008080] text-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.4em] border-2 border-black inline-block w-fit">
                Analog to Digital v1.0
              </span>
              <h1 className="text-[clamp(3rem,10vw,6rem)] font-black leading-[0.8] tracking-[-0.06em] uppercase">
                Think<br />
                <span className="text-[#008080]">[</span>Nexus<span className="text-[#008080]">]</span>
              </h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-[1.25rem] font-mono font-semibold leading-tight max-w-[600px] border-l-4 border-black pl-8"
            >
              Turning physical field-data into real-time digital intelligence for global NGOs.
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-6 w-full">
              <Link href="/register" className="w-full md:w-auto">
                <button className="h-20 w-full px-12 text-lg font-black uppercase tracking-widest border-4 border-black bg-black text-white shadow-[4px_4px_0px_0px_#008080] min-[480px]:shadow-[8px_8px_0px_0px_#008080] hover:shadow-[2px_2px_0px_0px_#008080] hover:translate-x-[6px] hover:translate-y-[6px] transition-all flex items-center justify-center gap-4 group">
                  Initialize Impact <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Right: Premium Interface Image */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, x: 50 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
            className="relative"
          >
            {/* Background Watermark */}
            <div className="absolute -top-32 -right-40 text-[35vw] font-black text-black opacity-[0.03] pointer-events-none select-none tracking-tighter italic -z-10">
              NXS
            </div>

            <div className="relative z-10 w-[90vw] lg:w-full max-w-full ml-auto border-[6px] border-black shadow-[4px_4px_0px_0px_#000] min-[480px]:shadow-[20px_20px_0px_0px_#000] group overflow-hidden aspect-auto">
              <img 
                src="/hero-illustration.jpg" 
                alt="NexusImpact Mission Control" 
                className="w-full h-auto object-cover contrast-[1.1] group-hover:scale-[1.02] transition-all duration-700 ease-in-out mix-blend-multiply"
              />
              
              {/* Corner Accents */}
              
              
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-black py-10 md:py-[5svh] px-[20px] md:px-20 relative overflow-hidden flex flex-col justify-center">
        {/* Background Text */}
        <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none overflow-hidden">
          <span className="text-[40vw] font-black text-white leading-none tracking-tighter select-none">NEXUS</span>
        </div>

        <div className="max-w-[1440px] mx-auto space-y-10 relative z-10 w-full">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 border-b-4 border-white/20 pb-6">
            <h2 className="text-6xl md:text-9xl font-black text-white tracking-tighter uppercase italic leading-[0.8]">
              Tactical<br />Protocols
            </h2>
            <div className="max-w-xs text-right space-y-4">
              <p className="text-[#FFD700] text-sm uppercase tracking-[0.4em] font-black">Core Capabilities</p>
              <p className="text-white/60 text-lg font-medium leading-tight">
                Empowering NGOs with verified, high-velocity impact metrics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FeatureCard
              icon={Zap}
              title="AI Ingestion"
              desc="Neural OCR that converts handwritten field notes to JSON in <30s."
              accent="bg-[#008080]"
              delay={0.1}
            />
            <FeatureCard
              icon={MapIcon}
              title="Precision Maps"
              desc="Dynamic geospatial heatmapping that identifies resource gaps with sub-meter accuracy."
              accent="bg-[#FFD700]"
              delay={0.2}
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Verified Impact"
              desc="GPS-stamped volunteer oversight and automated task routing for absolute transparency."
              accent="bg-white"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black pt-32 pb-20 px-[20px] md:px-20 text-[#F1EFE7]">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-24 border-t-4 border-[#F1EFE7]/10 pt-24">

          <div className="col-span-1 md:col-span-2 space-y-12">
            <div className="flex items-center gap-4">
              <div className="p-2 border-2 border-[#F1EFE7] bg-[#008080]">
                <Heart className="h-8 w-8 text-black" />
              </div>
              <span className="text-3xl font-black uppercase tracking-[0.3em]">NexusImpact</span>
            </div>
            <p className="text-xl font-medium max-w-sm text-[#F1EFE7]/60 leading-snug">
              Think [Nexus]. Digitizing social change for the global analog majority.
            </p>
          </div>

          <div className="space-y-8">
            <h5 className="font-black uppercase tracking-widest text-xs text-[#FFD700]">Protocols</h5>
            <div className="flex flex-col gap-4 font-black uppercase tracking-widest text-[10px]">
              {["Data Ingestion", "Geospatial", "Oversight", "Security"].map(link => (
                <Link key={link} href="#" className="hover:text-[#008080] transition-colors">{link}</Link>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h5 className="font-black uppercase tracking-widest text-xs text-[#FFD700]">Network</h5>
            <div className="flex flex-col gap-4 font-black uppercase tracking-widest text-[10px]">
              {["API Docs", "Changelog", "System Status", "Support"].map(link => (
                <Link key={link} href="#" className="hover:text-[#008080] transition-colors">{link}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto mt-32 flex flex-col md:flex-row justify-between items-center gap-8 border-t-2 border-[#F1EFE7]/5 pt-8 font-black uppercase tracking-[0.4em] text-[8px] text-[#F1EFE7]/30">
          <span>© 2026 NexusImpact. Protocol v4.0.2</span>
          <div className="flex gap-12">
            <Link href="#" className="hover:text-[#F1EFE7] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[#F1EFE7] transition-colors">Terms</Link>
            <Link href="#" className="hover:text-[#F1EFE7] transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
