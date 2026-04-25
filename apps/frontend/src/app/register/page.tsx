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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-500 relative">
      <div className="w-full max-w-md space-y-8 bg-card dark:bg-zinc-900/50 dark:backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-border transition-all duration-500">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Join NexusImpact
          </h2>
          <p className="mt-2 text-sm text-muted-foreground font-medium">
            Create an account to start helping your community
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground dark:text-zinc-300 transition-colors">Role</label>
              <select
                className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-600/50 transition-all duration-300"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="VOLUNTEER">Volunteer</option>
                <option value="FIELD_WORKER">Field Worker</option>
                <option value="NGO_ADMIN">NGO Admin</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</p>}

          <div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-bold"
              isLoading={isLoading}
            >
              Register
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              href="/login"
              className="font-bold text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
