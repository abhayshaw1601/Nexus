import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Heart, Shield, Zap, Map as MapIcon } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navigation */}
      <nav className="flex h-20 items-center justify-between px-8 md:px-20 border-b">
        <div className="flex items-center gap-2">
          <Heart className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900 tracking-tight">NexusImpact</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-8 py-20 md:px-20 md:py-32 text-center bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
              Bridging the Data Gap for <span className="text-blue-600">Community Response</span>
            </h1>
            <p className="text-xl text-gray-900 mb-10 leading-relaxed max-w-2xl mx-auto">
              NexusImpact uses AI to digitize handwritten surveys, visualize urgent needs on geospatial heatmaps, and automate volunteer dispatch for maximum local impact.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg">
                  Launch Platform
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-8 py-20 md:px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow">
              <Zap className="h-12 w-12 text-blue-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI OCR Ingestion</h3>
              <p className="text-gray-900 leading-relaxed">
                Transform paper-based surveys into structured digital data in seconds using our hybrid PaddleOCR and Gemini pipeline.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow">
              <MapIcon className="h-12 w-12 text-blue-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Geospatial Heatmaps</h3>
              <p className="text-gray-900 leading-relaxed">
                Visualize community needs with precision. Our weighted heatmaps identify clusters of urgency while protecting resident privacy.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow">
              <Shield className="h-12 w-12 text-blue-600 mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Verified Impact</h3>
              <p className="text-gray-900 leading-relaxed">
                Automate task dispatch to nearby volunteers. GPS-validated proof of completion ensures every contribution is verified.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t px-8 md:px-20 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">NexusImpact</span>
          </div>
          <p className="text-gray-900 text-sm">
            © 2026 NexusImpact. Empowering communities through data.
          </p>
        </div>
      </footer>
    </div>
  );
}
