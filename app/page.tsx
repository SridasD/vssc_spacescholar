"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Search,
  MessageSquare,
  User,
  Globe,
  Database,
  ArrowRight,
  Brain,
  FileText,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import vsscLogo from "@/public/images/vssc-logo.png";

// LIA face — save LIAface.png to /public/images/LIAface.png
const LIA_FACE = "/images/LIAface.png";

export default function Home() {
  const router = useRouter();

  const features = [
    { icon: Brain, label: "Semantic Understanding" },
    { icon: FileText, label: "Document Summarisation" },
    { icon: MessageSquare, label: "Deep Level Interaction" },
  ];

  return (
    // Locked to viewport height so the footer is always visible without scrolling.
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* Header */}
      <header className="flex-shrink-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* Left: VSSC logo + Wordmark */}
          <div className="flex items-center gap-3">
            <Image
              src={vsscLogo}
              alt="VSSC Logo"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight text-gray-900">
                SPACE SCHOLAR
              </span>
              <span className="text-[10px] uppercase tracking-widest text-gray-500">
                Knowledge Repository
              </span>
            </div>
          </div>

          {/* Right: External resources + ISRO branding + Admin Login */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
              <a
                href="https://gyaanpath.vssc.dos.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700
                           hover:text-blue-700 hover:bg-blue-50 transition-all group"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                </span>
                Library
              </a>
              <a
                href={process.env.NEXT_PUBLIC_OPAC_URL || "http://10.41.7.248/"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700
                           hover:text-emerald-700 hover:bg-emerald-50 transition-all group"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                OPAC
              </a>
            </div>

            <div className="hidden sm:block w-16">
              <Image
                src="/images/vssc-orginal-logo.png"
                alt="ISRO / VSSC"
                width={100}
                height={50}
                className="object-contain w-full h-auto"
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push("/login")}
              className="text-sm flex items-center gap-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              <User className="w-4 h-4" />
              <span className="font-medium">Admin Login</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — fills the space between header and footer; scrolls internally only if a screen is very short */}
      <main className="relative flex-1 min-h-0 overflow-y-auto px-4 text-white">
        {/* Background — generated space + galaxy. Save space-bg.png to /public/images/space-bg.png */}
        <img
          src="/images/space-bg.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-950/55 to-slate-950/80" />

        {/* Content — vertically centred when it fits */}
        <div className="relative z-10 min-h-full w-full max-w-7xl mx-auto flex flex-col justify-center py-6">

          {/* ── Headline ── */}
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05]">
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              <span className="text-white drop-shadow-lg">Knowledge Discovery</span>
            </h1>
            <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500" />
            <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl">
             Discover and explore knowledge intelligently
with AI-powered search across your library's
digital resources.
            </p>
          </div>

          {/* ── Two main panels ── */}
          <div className="mt-7 grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">

            {/* SPACE SCHOLAR — search engine (wider) */}
            <button
              onClick={() => router.push("/search")}
              className="lg:col-span-3 group relative text-left rounded-3xl p-6
                         bg-white/[0.06] backdrop-blur-md border border-white/10
                         hover:bg-blue-500/[0.12] hover:border-blue-400/40
                         transition-all duration-300 cursor-pointer
                         shadow-xl hover:shadow-[0_0_60px_rgba(59,130,246,0.25)] hover:-translate-y-1"
            >
              <div className="flex items-start gap-5">
                {/* Glowing orbit icon (drop an astronaut illustration here if you have one) */}
                <div className="relative flex-shrink-0">
                  <div className="w-[76px] h-[76px] rounded-full flex items-center justify-center
                                  bg-gradient-to-br from-blue-500/40 to-blue-800/20 border border-blue-400/30
                                  shadow-[0_0_45px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_60px_rgba(59,130,246,0.6)] transition-shadow">
                    <Search className="w-8 h-8 text-blue-100" />
                  </div>
                  <div className="absolute inset-[-7px] rounded-full border border-blue-400/20" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl lg:text-2xl font-bold leading-tight bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                    SPACE SCHOLAR
                  </h3>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200/90">
                    Intelligent Search Engine
                  </p>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                   Find the relevant information you
are looking for using AI powered
solution.
                  </p>

                  <div className="mt-5 flex justify-end">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold
                                 bg-gradient-to-r from-blue-600 to-indigo-600 text-white
                                 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all"
                    >
                      EXPLORE
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {/* LIA — virtual assistant (no box; only the "Chat with LIA" button is clickable) */}
            <div
              className="lg:col-span-2 group relative p-6
                         flex flex-col items-center text-center justify-center"
            >
              {/* LIA face in a glowing ring */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full p-[3px]
                                bg-gradient-to-br from-purple-400 via-fuchsia-400 to-blue-400
                                shadow-[0_0_45px_rgba(168,85,247,0.5)] group-hover:shadow-[0_0_60px_rgba(168,85,247,0.7)] transition-shadow">
                  <img
                    src={LIA_FACE}
                    alt="LIA — Virtual Assistant"
                    className="w-full h-full rounded-full object-cover object-top bg-slate-900"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-500
                                 flex items-center justify-center border-2 border-slate-950 shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-bold bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
                LIA
              </h3>
              <p className="text-sm font-semibold text-white/90">Your Virtual Assistant</p>

              <div className="my-3 h-px w-16 bg-white/15" />

              <p className="text-sm text-slate-300 leading-relaxed">
                Ask LIA for information, assistance and more.
              </p>

              {/* Clickable button — this is the only clickable target now */}
              <button
                onClick={() => router.push("/chat")}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold
                           bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white cursor-pointer
                           shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Chat with LIA
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* ── Feature strip (no box) ── */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0
                                 bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-400/30">
                  <Icon className="w-5 h-5 text-indigo-200" />
                </span>
                <span className="text-sm font-medium text-slate-200">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 w-full bg-white border-t-2 border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Left: DUK Logo */}
            <div className="flex items-center w-24 sm:w-32 flex-shrink-0">
              <Image
                src="/images/duk-logo.png"
                alt="Digital University Kerala"
                width={100}
                height={50}
                className="object-contain w-full h-auto"
              />
            </div>

            {/* Centre: Copyright */}
            <div className="text-center order-first sm:order-none">
              <p className="text-sm font-bold text-gray-900 tracking-tight">
                SPACE SCHOLAR &copy; 2026
              </p>
              <p className="mt-0.5 text-sm text-gray-700 font-medium">
                An initiative by Library &amp; Information Resource Division,VSSC
              </p>
              <p className="mt-1 text-xs text-gray-700">
                  <span className="font-semibold text-blue-700">&ldquo;A Partnership in Innovation&rdquo;</span>
                  <span className="mx-1.5 text-gray-400">·</span>
                  <span className="font-medium text-gray-800">Vikram Sarabhai Space Centre &amp; Digital University Kerala</span>
              </p>
            </div>

            {/* Right: VSSC logo */}
            <div className="flex items-center justify-end w-24 sm:w-32 flex-shrink-0">
              <Image
                src={vsscLogo}
                alt="VSSC"
                width={50}
                height={50}
                className="object-contain opacity-85"
              />
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}