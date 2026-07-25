import Link from "next/link";
import {
  ChevronRight,
  Headset,
  MessageCircleQuestion,
  Database,
  PlayCircle,
  MessageSquarePlus,
  ListChecks,
  ExternalLink,
} from "lucide-react";
import { MenuBar } from "@/components/layout/MenuBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";

// These three pieces of content are pending from the library team — the page
// ships with clear placeholders and picks up the real content the moment
// these env vars are set, no code changes needed.
const HELP_VIDEO_URL = process.env.NEXT_PUBLIC_HELP_VIDEO_URL || "";
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL || "";
const ASK_LIBRARIAN_URL = process.env.NEXT_PUBLIC_ASK_LIBRARIAN_URL || "";

const HELP_INSTRUCTION_STEPS = [
  "Getting started with AI Search",
  "Using Title Search for known works",
  "Opening a document in IntelliDoc",
  "Asking LIA for research support",
];

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MenuBar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Link href="/" className="font-medium hover:text-primary">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="font-semibold text-foreground">Help</span>
          </nav>

          <div className="max-w-2xl mb-10">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary">
              Help &amp; Support
            </h1>
            <p className="mt-3 text-muted-foreground">
              Learn how to get the most out of Space Scholar, or send us feedback if
              something isn&apos;t working the way you expect.
            </p>
          </div>

          {/* 1. User help video */}
          <section className="mb-8">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
              <PlayCircle className="w-4 h-4 text-peacock-deep" />
              User Help Video
            </h2>
            <Card className="border-border shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {HELP_VIDEO_URL ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={HELP_VIDEO_URL}
                      title="Space Scholar help video"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full flex flex-col items-center justify-center gap-2 bg-peacock-soft/50 text-center px-6">
                    <PlayCircle className="w-10 h-10 text-peacock-deep" />
                    <p className="text-sm font-medium text-foreground/80">
                      Help video coming soon
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      A walkthrough of AI Search, Title Search, IntelliDoc and LIA will be
                      posted here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 2. Feedback */}
          <section className="mb-8">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
              <MessageSquarePlus className="w-4 h-4 text-leaf" />
              Feedback
            </h2>
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">Tell us what&apos;s working — or not</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your feedback goes straight to the Library &amp; Information Resource Division.
                  </p>
                </div>
                {FEEDBACK_URL ? (
                  <a
                    href={FEEDBACK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--leaf), var(--peacock-deep))" }}
                  >
                    Give Feedback
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-muted-foreground bg-muted flex-shrink-0 cursor-not-allowed"
                    title="Feedback link coming soon"
                  >
                    Give Feedback
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 3. Help instructions */}
          <section className="mb-10">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
              <ListChecks className="w-4 h-4 text-saffron-deep" />
              Help Instructions
            </h2>
            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <ol className="space-y-3">
                  {HELP_INSTRUCTION_STEPS.map((step, i) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-saffron-soft text-saffron-deep text-xs font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{step}</p>
                        <p className="text-sm text-muted-foreground mt-0.5 italic">
                          Instructions coming soon.
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </section>

          {/* Other ways to reach us */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
              Other ways to reach us
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                  <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-saffron-soft text-saffron-deep mb-4">
                    <Headset className="w-5 h-5" />
                  </span>
                  <h3 className="font-semibold text-foreground mb-1.5">Library help desk</h3>
                  <p className="text-sm text-muted-foreground">
                    General queries about the catalogue, borrowing, or account access.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                  <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-leaf-soft text-leaf mb-4">
                    <MessageCircleQuestion className="w-5 h-5" />
                  </span>
                  <h3 className="font-semibold text-foreground mb-1.5">Research consultation</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Need help finding sources for a research problem? Ask a librarian directly.
                  </p>
                  {ASK_LIBRARIAN_URL ? (
                    <a
                      href={ASK_LIBRARIAN_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Ask a Librarian
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <Link
                      href="/ask-librarian"
                      className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Ask a Librarian
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                  <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-peacock-soft text-peacock-deep mb-4">
                    <Database className="w-5 h-5" />
                  </span>
                  <h3 className="font-semibold text-foreground mb-1.5">Catalogue &amp; access</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Browse the full library catalogue or the online public access catalogue (OPAC).
                  </p>
                  <div className="flex flex-col gap-1 text-sm font-semibold text-primary">
                    <a
                      href="https://gyaanpath.vssc.dos.gov.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline inline-flex items-center gap-1"
                    >
                      Library
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={process.env.NEXT_PUBLIC_OPAC_URL || "http://10.41.7.248/"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline inline-flex items-center gap-1"
                    >
                      OPAC
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
