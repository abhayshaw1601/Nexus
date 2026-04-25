"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Heart } from "lucide-react";
import axios from "axios";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "VOLUNTEER",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, formData);
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="w-full max-w-md space-y-12 neo-border bg-card p-12 rounded-[4px] transition-all duration-500">
        <div className="text-center space-y-6">
          <Heart className="mx-auto h-12 w-12 text-primary stroke-[1.5pt]" />
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase">
              JOIN<br />[NEXUS]
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Create an account for human impact
            </p>
          </div>
        </div>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Input
              label="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
            <Input
              label="Email address"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
            <Input
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Role</label>
              <select
                className="flex h-12 w-full rounded-[4px] border-2 border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 font-medium"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="VOLUNTEER">Volunteer</option>
                <option value="FIELD_WORKER">Field Worker</option>
                <option value="NGO_ADMIN">NGO Admin</option>
              </select>
            </div>
          </div>

          {error && <p className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em]">{error}</p>}

          <div>
            <Button
              type="submit"
              className="w-full h-14"
              isLoading={isLoading}
            >
              Initialize Profile
            </Button>
          </div>

          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Already have an account? </span>
            <Link
              href="/login"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
