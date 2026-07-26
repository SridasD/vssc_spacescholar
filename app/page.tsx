"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MessageSquare,
  ArrowRight,
  FileText,
  Sparkles,
  X,
  Brain,
} from "lucide-react";
import Image from "next/image";
import { MenuBar } from "@/components/layout/MenuBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import LiaPortrait from "@/components/LiaPortrait";

const LIA_FACE = "/images/LIAface.png";

type SearchMode = "ai" | "title";

const SAMPLE_PROMPTS: Record<SearchMode, string[]> = {
  ai: [
    "Benefits of regenerative cooling in liquid rocket engine?",
    "What is crew module?",
  ],
  title: ["Additive manufacturing", "Chandrayaan", "Thermal Protection System"],
};

const MODE_COPY: Record<
  SearchMode,
  { placeholder: string; submitLabel: string; targetPath: string }
> = {
  ai: {
    placeholder: "Ask about a concept, material, mission or research problem...",
    submitLabel: "Discover",
    targetPath: "/search",
  },
  title: {
    placeholder: "Enter words from a known document title...",
    submitLabel: "Find title",
    targetPath: "/title-search",
  },
};

const DISCOVERY_CARDS = [
  {
    key: "ai",
    icon: Sparkles,
    title: "AI Search",
    description:
      "Search the way you think—with natural language and AI-powered semantic understanding to discover conceptually relevant records.",
    linkLabel: "Explore concepts",
    href: "/search",
    accent: "saffron" as const,
  },
  {
    key: "title",
    icon: Search,
    title: "Title Search",
    description: "Find a known work using exact or partial words from its title.",
    linkLabel: "Find a title",
    href: "/title-search",
    accent: "peacock" as const,
  },
  {
    key: "intellidoc",
    icon: FileText,
    title: "IntelliDoc",
    description:
      "Understand documents faster with AI-powered summaries and contextual answers through chat.",
    linkLabel: "Open a document",
    href: "/search",
    accent: "indigo" as const,
  },
  {
    key: "lia",
    icon: MessageSquare,
    title: "LIA",
    description:
      "Need help finding information, exploring resources, services or getting research support? Just ask…",
    linkLabel: "Talk to LIA",
    href: "/chat",
    accent: "leaf" as const,
  },
];

const ACCENT_CLASSES: Record<
  "saffron" | "peacock" | "indigo" | "leaf",
  { icon: string; bg: string; glow: string }
> = {
  saffron: { icon: "text-saffron-deep", bg: "bg-saffron-soft", glow: "rgba(244,122,31,0.14)" },
  peacock: { icon: "text-peacock-deep", bg: "bg-peacock-soft", glow: "rgba(7,158,210,0.14)" },
  indigo: { icon: "text-primary", bg: "bg-primary/10", glow: "rgba(51,45,125,0.14)" },
  leaf: { icon: "text-leaf", bg: "bg-leaf-soft", glow: "rgba(22,139,114,0.14)" },
};

const STAT_ACCENTS = ["saffron", "peacock", "leaf", "indigo"] as const;

interface ContentTypeStat {
  contentType: string;
  totalDocuments: number;
}

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("ai");
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<ContentTypeStat[]>([]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    fetch("/api/content-types/stats")
      .then((res) => res.json())
      .then((data) => setStats(data.contentStats || []))
      .catch(() => setStats([]));
  }, []);

  const runSearch = (term: string, activeMode: SearchMode = mode) => {
    if (!term.trim()) return;
    router.push(`${MODE_COPY[activeMode].targetPath}?q=${encodeURIComponent(term)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const scrollToSearch = () => {
    heroRef.current?.scrollIntoView({ behavior: "smooth" });
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MenuBar />

      {/* Hero */}
      <section ref={heroRef} className="relative isolate overflow-hidden px-4 py-16 sm:py-20">
        {/* Base gradient wash */}
        <div
          className="absolute inset-0 -z-30"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 12% 18%, rgba(244,122,31,0.14), transparent 27%), radial-gradient(circle at 88% 20%, rgba(7,158,210,0.14), transparent 28%), radial-gradient(circle at 80% 86%, rgba(22,139,114,0.12), transparent 24%), linear-gradient(180deg, #fffdf9 0%, #fff7eb 52%, #f8f7ff 100%)",
          }}
        />
        {/* Dot-grid texture, fading out toward the bottom */}
        <div
          className="absolute inset-0 -z-30 opacity-25"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(51,45,125,0.5) 1.1px, transparent 1.2px), radial-gradient(circle, rgba(244,122,31,0.38) 1px, transparent 1.2px)",
            backgroundPosition: "0 0, 15px 15px",
            backgroundSize: "32px 32px",
            maskImage: "linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.6) 56%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.6) 56%, transparent 100%)",
          }}
        />
        {/* Rangoli blur blobs */}
        <div className="hero-rangoli hero-rangoli-one" aria-hidden />
        <div className="hero-rangoli hero-rangoli-two" aria-hidden />
        {/* Orbit rings + drifting particles */}
        <div className="hero-orbit-stage" aria-hidden>
          <span className="hero-orbit-ring hero-orbit-ring-1" />
          <span className="hero-orbit-ring hero-orbit-ring-2" />
          <span className="hero-orbit-ring hero-orbit-ring-3" />
          <span className="hero-orbit-particle hero-orbit-particle-1" />
          <span className="hero-orbit-particle hero-orbit-particle-2" />
          <span className="hero-orbit-particle hero-orbit-particle-3" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="hero-logo-wrap">
            <Image
              src="/web-app-manifest-512x512.png"
              alt="VSSC"
              width={110}
              height={110}
              className="hero-logo object-contain mx-auto"
              priority
            />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] text-foreground">
            <span className="bg-gradient-to-r from-saffron-deep via-saffron to-peacock-deep bg-clip-text text-transparent">
              SPACE SCHOLAR
            </span>
          </h1>
          <p className="mt-3 text-sm sm:text-base font-medium text-muted-foreground tracking-wide">
            AI-Powered Knowledge Discovery
          </p>

          {/* Search command */}
          <div className="mt-8 rounded-3xl border border-border bg-white p-3 shadow-lg text-left">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-primary/10 mb-3">
              {(["ai", "title"] as SearchMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    mode === m
                      ? "bg-white text-primary shadow-sm"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {m === "ai" ? (
                    <Sparkles className="w-3.5 h-3.5" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  {m === "ai" ? "AI Search" : "Title Search"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 items-stretch">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={MODE_COPY[mode].placeholder}
                  aria-keyshortcuts="Control+K"
                  title="Press Ctrl+K to jump to this search box from anywhere on the page"
                  className="w-full h-14 pl-12 pr-20 rounded-2xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-md"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                ) : (
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 pointer-events-none"
                    aria-hidden="true"
                    title="Press Ctrl+K to focus search"
                  >
                    <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-semibold text-muted-foreground">
                      Ctrl
                    </kbd>
                    <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-semibold text-muted-foreground">
                      K
                    </kbd>
                  </span>
                )}
                <span className="sr-only">Keyboard shortcut: press Control and K together to focus this search box</span>
              </div>
              <button
                type="submit"
                className="px-6 rounded-2xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, var(--saffron), var(--saffron-deep))" }}
              >
                <Sparkles className="w-4 h-4" />
                {MODE_COPY[mode].submitLabel}
              </button>
            </form>

            <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
              <span className="text-xs font-semibold text-muted-foreground">Try a sample:</span>
              {SAMPLE_PROMPTS[mode].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setQuery(prompt);
                    runSearch(prompt);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-primary border border-border bg-white hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Search, label: "Natural-language discovery", accent: "saffron" as const },
              { icon: Brain, label: "Semantic Understanding", accent: "indigo" as const },
              { icon: FileText, label: "Document Summarisation", accent: "peacock" as const },
              { icon: MessageSquare, label: "Deep Level Interaction", accent: "leaf" as const },
            ].map(({ icon: Icon, label, accent }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/70 border border-border text-left"
              >
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${ACCENT_CLASSES[accent].bg}`}
                >
                  <Icon className={`w-5 h-5 ${ACCENT_CLASSES[accent].icon}`} />
                </span>
                <span className="text-sm font-semibold text-foreground/85">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .hero-logo-wrap { position: relative; display: inline-grid; place-items: center; margin-bottom: 0; }
          .hero-logo-wrap::before {
            content: ""; position: absolute; width: 82%; aspect-ratio: 1; border-radius: 50%;
            background: radial-gradient(circle, rgba(7,158,210,0.16), transparent 68%);
            filter: blur(4px); animation: hero-logo-halo 4.8s ease-in-out infinite;
          }
          .hero-logo { position: relative; filter: drop-shadow(0 18px 20px rgba(33,27,91,0.14)); animation: hero-logo-float 6s ease-in-out infinite; }
          @keyframes hero-logo-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          @keyframes hero-logo-halo { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }

          .hero-rangoli {
            position: absolute; z-index: -20; width: 340px; height: 340px; border-radius: 50%; opacity: 0.16;
            background: radial-gradient(circle at center, transparent 0 17%, var(--indigo, hsl(var(--primary))) 17.5% 18.3%, transparent 18.8% 29%, var(--saffron) 29.5% 30.3%, transparent 31%),
                        repeating-conic-gradient(from 22.5deg, rgba(7,158,210,0.8) 0 5deg, transparent 5deg 17deg),
                        radial-gradient(circle, rgba(245,196,78,0.92) 0 2.5%, transparent 3% 100%);
            animation: hero-rangoli-breathe 7s ease-in-out infinite;
          }
          .hero-rangoli-one { top: 6%; left: -140px; }
          .hero-rangoli-two { right: -150px; bottom: -4%; transform: scale(0.8); animation-delay: -3.5s; }
          @keyframes hero-rangoli-breathe { 0%, 100% { opacity: 0.13; transform: scale(1); } 50% { opacity: 0.2; transform: scale(1.06); } }

          .hero-orbit-stage {
            position: absolute; top: 42%; left: 50%; z-index: -20; width: min(1040px, 94vw); aspect-ratio: 1.9;
            transform: translate(-50%, -50%) rotate(-7deg); pointer-events: none;
          }
          .hero-orbit-ring { position: absolute; inset: 8%; border: 1px solid rgba(51,45,125,0.14); border-radius: 50%; }
          .hero-orbit-ring-2 { inset: 18% 4%; border-color: rgba(244,122,31,0.18); transform: rotate(10deg); }
          .hero-orbit-ring-3 { inset: 0 16%; border-color: rgba(7,158,210,0.16); transform: rotate(-13deg); }
          .hero-orbit-particle {
            position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; margin: -4px; border-radius: 50%;
            background: var(--saffron); box-shadow: 0 0 0 8px rgba(244,122,31,0.1), 0 0 24px rgba(244,122,31,0.5);
            animation: hero-orbit-a 10s linear infinite;
          }
          .hero-orbit-particle-2 { width: 7px; height: 7px; background: var(--peacock); box-shadow: 0 0 0 8px rgba(7,158,210,0.09), 0 0 24px rgba(7,158,210,0.46); animation: hero-orbit-b 13s linear infinite reverse; }
          .hero-orbit-particle-3 { width: 6px; height: 6px; background: var(--leaf); box-shadow: 0 0 0 7px rgba(22,139,114,0.09), 0 0 22px rgba(22,139,114,0.4); animation: hero-orbit-c 16s linear infinite; }
          @keyframes hero-orbit-a { from { transform: rotate(0deg) translateX(min(400px,38vw)) rotate(0deg); } to { transform: rotate(360deg) translateX(min(400px,38vw)) rotate(-360deg); } }
          @keyframes hero-orbit-b { from { transform: rotate(0deg) translateX(min(320px,30vw)) rotate(0deg); } to { transform: rotate(360deg) translateX(min(320px,30vw)) rotate(-360deg); } }
          @keyframes hero-orbit-c { from { transform: rotate(0deg) translateX(min(260px,24vw)) rotate(0deg); } to { transform: rotate(360deg) translateX(min(260px,24vw)) rotate(-360deg); } }

          @media (prefers-reduced-motion: reduce) {
            .hero-logo, .hero-logo-wrap::before, .hero-rangoli, .hero-orbit-particle { animation: none !important; }
          }
        ` }} />
      </section>

      {/* Discovery grid */}
      <section className="px-4 py-14 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest text-saffron-deep bg-white border border-saffron/20 shadow-[0_8px_26px_rgba(33,27,91,0.06)]">
            <span className="w-2 h-2 rounded-full bg-saffron shadow-[0_0_0_5px_rgba(244,122,31,0.12)]" />
            Knowledge pathways
          </span>
          <h2 className="font-display mt-3 text-2xl sm:text-3xl font-bold text-foreground max-w-xl">
            One doorway, four intelligent routes.
          </h2>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DISCOVERY_CARDS.map(({ key, icon: Icon, title, description, linkLabel, href, accent }) => (
              <button
                key={key}
                onClick={() => router.push(href)}
                className="group relative overflow-hidden text-left rounded-2xl border border-border bg-gradient-to-br from-white to-[#fbfbff] p-6 hover:-translate-y-1 hover:shadow-lg hover:border-border/80 transition-all duration-300"
              >
                <span
                  aria-hidden
                  className="absolute -right-14 -bottom-16 w-[170px] h-[170px] rounded-full blur-[2px] transition-transform duration-500 group-hover:scale-[1.18]"
                  style={{ background: ACCENT_CLASSES[accent].glow }}
                />
                <span
                  className={`relative flex items-center justify-center w-11 h-11 rounded-xl ${ACCENT_CLASSES[accent].bg}`}
                >
                  <Icon className={`w-5 h-5 ${ACCENT_CLASSES[accent].icon}`} />
                </span>
                <h3 className="relative mt-4 font-semibold text-foreground">{title}</h3>
                <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
                <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {linkLabel}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* LIA spotlight */}
      <section
        className="relative overflow-hidden px-4 py-16"
        style={{
          background:
            "radial-gradient(circle at 90% 10%, rgba(244,122,31,0.18), transparent 27%), linear-gradient(135deg, var(--peacock-deep), #302b73 55%, hsl(var(--primary)))",
        }}
      >
        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 items-center">
          <LiaPortrait className="min-h-[380px] sm:min-h-[420px]" />

          <div className="text-white">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-white/10 border border-white/15 text-[#ffe2c7]">
              <span className="w-2 h-2 rounded-full bg-saffron shadow-[0_0_0_5px_rgba(244,122,31,0.18)]" />
              LIA · Virtual Assistant
            </span>
            <h2 className="font-display mt-4 text-3xl sm:text-4xl font-bold leading-tight">
              A conversation layer for your information assistance
            </h2>
            <p className="mt-4 text-white/80 max-w-lg">
              Your Library Intelligent Assistant is always available to help with resource
              discovery, service inquiries and research support.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/chat")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                style={{ background: "linear-gradient(135deg, var(--saffron), var(--saffron-deep))" }}
              >
                <MessageSquare className="w-4 h-4" />
                Chat with LIA
              </button>
              <button
                onClick={scrollToSearch}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
              >
                Return to search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest text-saffron-deep bg-white border border-saffron/20 shadow-[0_8px_26px_rgba(33,27,91,0.06)]">
            <span className="w-2 h-2 rounded-full bg-saffron shadow-[0_0_0_5px_rgba(244,122,31,0.12)]" />
            Knowledge ecosystem
          </span>
          <h2 className="font-display mt-3 text-2xl sm:text-3xl font-bold text-foreground max-w-xl">
            Comprehensive analytics of Space Scholar&apos;s knowledge ecosystem.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            A live breakdown of the repository by content type .
          </p>

          {stats.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {stats.map((stat, i) => {
                const accent = STAT_ACCENTS[i % STAT_ACCENTS.length];
                return (
                  <div
                    key={stat.contentType}
                    className="text-left rounded-2xl border border-border bg-white p-6 relative overflow-hidden"
                  >
                    <span
                      className={`font-display text-3xl font-bold ${ACCENT_CLASSES[accent].icon}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-3 font-semibold text-foreground">{stat.contentType}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {stat.totalDocuments.toLocaleString()} item
                      {stat.totalDocuments === 1 ? "" : "s"}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Loading knowledge ecosystem statistics…
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
