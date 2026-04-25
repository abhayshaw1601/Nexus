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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-500 relative">
      <div className="w-full max-w-md space-y-8 bg-card dark:bg-zinc-900/50 dark:backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-border transition-all duration-500">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-zinc-100">
            Welcome to NexusImpact
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400 font-medium">
            Sign in to your account to manage community needs
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ngo.org"
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

          {error && <p className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</p>}

          <div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-bold"
              isLoading={isLoading}
            >
              Sign in
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600 dark:text-zinc-400">Don't have an account? </span>
            <Link
              href="/register"
              className="font-bold text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
