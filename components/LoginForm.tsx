"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import vsscLogo from '@/public/images/vssc-logo.png';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Wrong credentials, lockout, etc. — an expected user-facing outcome,
        // not a bug, so it's shown inline without logging/throwing.
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      // Genuinely unexpected (network failure, malformed response, etc.)
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-sm">
      {/* Clickable "Back to home" — top-left of the card area */}
      <button
        onClick={() => router.push('/')}
        className="absolute -top-12 left-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
        aria-label="Back to home"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3.5 h-3.5"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Home
      </button>

      {/* Card with saffron-to-indigo gradient border */}
      <div className="relative rounded-2xl bg-gradient-to-br from-saffron/50 via-peacock/30 to-primary/50 p-[1px] shadow-[0_8px_40px_rgba(51,45,125,0.12)]">
        <div className="relative bg-white rounded-2xl p-8">
          {/* Logo + Title */}
          <div className="relative flex flex-col items-center mb-8">
            <div className="mb-4">
              <Image
                src={vsscLogo}
                alt="VSSC Logo"
                width={64}
                height={64}
                priority
                className="object-contain"
              />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-primary">
              SPACE SCHOLAR
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Sign in to continue
            </p>
          </div>

          {/* Hidden register link block — preserved */}
          <div className="text-center hidden">
            <p className="text-sm text-muted-foreground">
              New Explorer?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Initialize Account
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground bg-white border border-input rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                placeholder="you@institution.edu"
                aria-label="Enter your email address"
                title="Please enter a valid email address"
              />
              <span className="block mt-1.5 text-xs text-muted-foreground">
                Use your institutional email for verification
              </span>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder-muted-foreground bg-white border border-input rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Hidden remember-me block — preserved */}
            <div className="items-center justify-between hidden">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="w-4 h-4 text-primary bg-white border-input rounded focus:ring-primary"
                />
                <label htmlFor="remember-me" className="block ml-2 text-sm text-foreground/80">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:underline">
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white rounded-full shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              style={{ background: "linear-gradient(135deg, var(--saffron), var(--saffron-deep))" }}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 text-center space-y-2">
        <p className="text-xs font-medium text-foreground/70 tracking-wide">
          SPACE SCHOLAR © 2026 · Vikram Sarabhai Space Centre
        </p>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 flex-wrap">
          <span className="italic">&quot;A Partnership in Innovation&quot;</span>
          <span className="inline-block w-1 h-1 bg-saffron rounded-full" />
          <span className="bg-gradient-to-r from-primary to-peacock-deep bg-clip-text text-transparent">
            VSSC &amp; Digital University Kerala
          </span>
        </p>
      </footer>
    </div>
  );
}