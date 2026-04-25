"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
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
              THINK<br />[NEXUS]
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Sign in to manage human intent
            </p>
          </div>
        </div>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nexus.com"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-[10px] font-bold text-destructive uppercase tracking-[0.2em]">{error}</p>}

          <div>
            <Button
              type="submit"
              className="w-full h-14"
              isLoading={isLoading}
            >
              Enter Workspace
            </Button>
          </div>

          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Don't have an account? </span>
            <Link
              href="/register"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline underline-offset-4"
            >
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
