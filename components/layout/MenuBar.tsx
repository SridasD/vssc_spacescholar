"use client";

import { Button } from "@/components/ui/button";
import {
  Home,
  Search,
  MessageSquare,
  HelpCircle,
  LifeBuoy,
  Menu,
  X,
  Globe,
  Database,
  User,
} from "lucide-react";
import Image from "next/image";
import isroVsscLogo from "@/public/images/isro-vssc-logo.png";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Set once the real "Ask a Librarian" destination is shared — when present,
// the link opens externally in a new tab instead of the internal page.
const ASK_LIBRARIAN_URL = process.env.NEXT_PUBLIC_ASK_LIBRARIAN_URL || "";
const OPAC_URL = process.env.NEXT_PUBLIC_OPAC_URL || "http://10.41.7.248/";
const LIBRARY_URL = "https://gyaanpath.vssc.dos.gov.in/";

interface NavLinkDef {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  external?: boolean;
  hoverClass: string;
}

// Internal app navigation (search modes, help, ask-a-librarian).
const NAV_LINKS: NavLinkDef[] = [
  { key: "home", label: "Home", icon: Home, href: "/", hoverClass: "hover:text-primary hover:bg-primary/10" },
  { key: "ai-search", label: "AI Search", icon: Search, href: "/search", hoverClass: "hover:text-saffron-deep hover:bg-saffron-soft" },
  { key: "title-search", label: "Title Search", icon: Search, href: "/title-search", hoverClass: "hover:text-peacock-deep hover:bg-peacock-soft" },
  {
    key: "ask-librarian",
    label: "Ask a Librarian",
    icon: HelpCircle,
    href: ASK_LIBRARIAN_URL || "/ask-librarian",
    external: !!ASK_LIBRARIAN_URL,
    hoverClass: "hover:text-leaf hover:bg-leaf-soft",
  },
  { key: "help", label: "Help", icon: LifeBuoy, href: "/help", hoverClass: "hover:text-peacock-deep hover:bg-peacock-soft" },
];

// External library resources — always open in a new tab.
const RESOURCE_LINKS = [
  { key: "library", label: "Library", icon: Globe, href: LIBRARY_URL, iconBg: "bg-peacock-soft group-hover:bg-peacock/20", iconColor: "text-peacock-deep", hoverClass: "hover:text-peacock-deep hover:bg-peacock-soft" },
  { key: "opac", label: "OPAC", icon: Database, href: OPAC_URL, iconBg: "bg-leaf-soft group-hover:bg-leaf/20", iconColor: "text-leaf", hoverClass: "hover:text-leaf hover:bg-leaf-soft" },
];

export function MenuBar() {
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    const go = (href: string, external?: boolean) => {
        setMobileOpen(false);
        if (external) {
            window.open(href, "_blank", "noopener,noreferrer");
        } else {
            router.push(href);
        }
    };

    return (
        <div className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
            <div
                className="h-[5px] w-full"
                style={{
                    background:
                        "linear-gradient(90deg, var(--saffron) 0 34%, #fff 34% 66%, var(--leaf) 66% 100%)",
                }}
                aria-hidden
            />
            <div className="max-w-[100rem] mx-auto px-4 h-16 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0" onClick={() => router.push("/")}>
                    <Image
                        src={isroVsscLogo}
                        alt="ISRO / VSSC"
                        width={38}
                        height={38}
                        className="object-contain flex-shrink-0"
                    />
                    <div className="hidden sm:flex flex-col leading-tight">
                        <span className="text-[13px] font-bold tracking-tight text-foreground whitespace-nowrap">
                            Library &amp; Information Resource Division
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                            Vikram Sarabhai Space Centre
                        </span>
                    </div>
                </div>

                {/* Desktop nav */}
                <div className="hidden 2xl:flex items-center gap-0.5 flex-shrink-0">
                    {NAV_LINKS.map(({ key, label, icon: Icon, href, external, hoverClass }) => (
                        <Button
                            key={key}
                            variant="ghost"
                            size="sm"
                            onClick={() => go(href, external)}
                            className={`flex items-center gap-1.5 rounded-full text-foreground/80 whitespace-nowrap px-2.5 ${hoverClass}`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </Button>
                    ))}

                    <span className="w-px h-6 bg-border mx-1" aria-hidden />

                    {RESOURCE_LINKS.map(({ key, label, icon: Icon, href, iconBg, iconColor, hoverClass }) => (
                        <a
                            key={key}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium text-foreground/80 transition-all whitespace-nowrap ${hoverClass}`}
                        >
                            <span className={`flex items-center justify-center w-5 h-5 rounded-md transition-colors ${iconBg}`}>
                                <Icon className={`w-3 h-3 ${iconColor}`} />
                            </span>
                            {label}
                        </a>
                    ))}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/login")}
                        className="flex items-center gap-1.5 rounded-full text-foreground/80 hover:text-primary hover:bg-primary/10 whitespace-nowrap px-2.5"
                    >
                        <User className="w-4 h-4" />
                        Admin Login
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => router.push("/chat")}
                        className="ml-1 flex items-center gap-1.5 rounded-full text-white shadow-sm hover:opacity-90 whitespace-nowrap px-3.5"
                        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), var(--peacock-deep))" }}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chat with LIA
                    </Button>
                </div>

                {/* Mobile / tablet toggle */}
                <button
                    type="button"
                    onClick={() => setMobileOpen((o) => !o)}
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileOpen}
                    className="2xl:hidden flex items-center justify-center w-10 h-10 rounded-full text-foreground/80 hover:bg-muted flex-shrink-0"
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile / tablet panel */}
            {mobileOpen && (
                <div className="2xl:hidden border-t border-border bg-white px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
                    {NAV_LINKS.map(({ key, label, icon: Icon, href, external, hoverClass }) => (
                        <button
                            key={key}
                            onClick={() => go(href, external)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/80 ${hoverClass}`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}

                    <div className="h-px bg-border my-2" aria-hidden />

                    {RESOURCE_LINKS.map(({ key, label, icon: Icon, href, hoverClass, iconColor }) => (
                        <a
                            key={key}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileOpen(false)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/80 ${hoverClass}`}
                        >
                            <Icon className={`w-4 h-4 ${iconColor}`} />
                            {label}
                        </a>
                    ))}

                    <button
                        onClick={() => go("/login")}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/80 hover:text-primary hover:bg-primary/10"
                    >
                        <User className="w-4 h-4" />
                        Admin Login
                    </button>

                    <button
                        onClick={() => go("/chat")}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white mt-1"
                        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), var(--peacock-deep))" }}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chat with LIA
                    </button>
                </div>
            )}
        </div>
    );
}
