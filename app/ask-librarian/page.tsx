import Link from "next/link";
import { ChevronRight, Search, MessageSquare, Sparkles } from "lucide-react";
import { MenuBar } from "@/components/layout/MenuBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { AskLibrarianForm } from "@/components/AskLibrarianForm";

const quickLinks = [
  { href: "/search", label: "AI Search", icon: Sparkles },
  { href: "/title-search", label: "Title Search", icon: Search },
  { href: "/chat", label: "Chat with LIA", icon: MessageSquare },
];

export default function AskLibrarianPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MenuBar />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Link href="/" className="font-medium hover:text-primary">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="font-semibold text-foreground">Ask a Librarian</span>
          </nav>

          <div className="max-w-2xl mb-8">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary">
              Ask a Librarian
            </h1>
            <p className="mt-3 text-muted-foreground">
              Send your question to the Library &amp; Information Resource Division. A librarian
              will follow up using your preferred response method.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <AskLibrarianForm />
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-5">
                <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                  Faster routes
                </h2>
                <div className="space-y-1">
                  {quickLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
