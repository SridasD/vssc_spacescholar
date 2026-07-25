"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import vsscLogo from '@/public/images/vssc-logo.png';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
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
        className="absolute -top-12 left-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors backdrop-blur-sm"
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

      {/* Card with glowing gradient border */}
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-500/40 via-indigo-500/30 to-purple-500/40 p-[1px] shadow-[0_8px_40px_rgba(59,130,246,0.15)]">
        {/* Soft glow behind card */}
        <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 blur-2xl rounded-3xl pointer-events-none" />

        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8">
          {/* Soft gradient glow behind logo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-blue-400/30 via-indigo-400/20 to-purple-400/30 blur-3xl rounded-full pointer-events-none" />

          {/* Logo + Title */}
          <div className="relative flex flex-col items-center mb-8">
            <div className="mb-4">
              <Image
                src={vsscLogo}
                alt="VSSC Logo"
                width={64}
                height={64}
                priority
                className="object-contain drop-shadow-[0_0_15px_rgba(96,165,250,0.4)]"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_20px_rgba(96,165,250,0.3)]">
              SPACE SCHOLAR
            </h1>
            <p className="text-sm text-gray-400 mt-1.5">
              Sign in to continue
            </p>
          </div>

          {/* Hidden register link block — preserved */}
          <div className="text-center hidden">
            <p className="text-sm text-gray-400">
              New Explorer?{" "}
              <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300 hover:underline">
                Initialize Account
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
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
                className="block w-full px-3.5 py-2.5 text-sm text-white placeholder-gray-500 bg-slate-800/60 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                placeholder="you@institution.edu"
                aria-label="Enter your email address"
                title="Please enter a valid email address"
              />
              <span className="block mt-1.5 text-xs text-gray-500">
                Use your institutional email for verification
              </span>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3.5 py-2.5 text-sm text-white placeholder-gray-500 bg-slate-800/60 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Hidden remember-me block — preserved */}
            <div className="items-center justify-between hidden">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="w-4 h-4 text-blue-500 bg-slate-800 border-slate-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-400 hover:text-blue-300 hover:underline">
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 text-center space-y-2">
        <p className="text-xs font-medium text-gray-300 tracking-wide">
          SPACE SCHOLAR © 2026 · Vikram Sarabhai Space Centre
        </p>
        <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5 flex-wrap">
          <span className="italic">&quot;A Partnership in Innovation&quot;</span>
          <span className="inline-block w-1 h-1 bg-blue-400 rounded-full" />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            VSSC &amp; Digital University Kerala
          </span>
        </p>
      </footer>
    </div>
  );
}