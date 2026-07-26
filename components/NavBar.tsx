
"use client";

import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import Image from "next/image";
import isroVsscLogo from "@/public/images/isro-vssc-logo.png";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, LayoutDashboard, ChevronDown, FileSpreadsheet, FileCheck2 } from "lucide-react";

const METADATA_STEPS = [
  {
    n: 1,
    href: "/metadata-splitter",
    title: "Split large files",
    desc: "Files over 1,000 rows are split into a ZIP of CSVs.",
    icon: FileSpreadsheet,
  },
  {
    n: 2,
    href: "/metadata-uploader",
    title: "Upload & review",
    desc: "Validate your CSV and submit it for processing.",
    icon: FileCheck2,
  },
];

const NavBar: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [metaOpen, setMetaOpen] = useState(false);
    const metaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!metaOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (metaRef.current && !metaRef.current.contains(e.target as Node)) {
          setMetaOpen(false);
        }
      };
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMetaOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [metaOpen]);

    return (
      <nav className="bg-white shadow border-b border-border">
        <div
          className="h-[5px] w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--saffron) 0 34%, #fff 34% 66%, var(--leaf) 66% 100%)",
          }}
          aria-hidden
        />
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div
                className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
                onClick={() => router.push("/")}
              >
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
            </div>
            <div className="flex items-center gap-1">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full text-foreground/80 hover:text-primary hover:bg-primary/10"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>

              <div className="relative" ref={metaRef}>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full text-foreground/80 hover:text-peacock-deep hover:bg-peacock-soft"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={metaOpen}
                  onClick={() => setMetaOpen((open) => !open)}
                >
                  <Upload className="w-4 h-4" />
                  Metadata uploader
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${metaOpen ? "rotate-180" : ""}`} />
                </Button>

                {metaOpen && (
                  <div className="absolute left-0 z-50 mt-2 w-80 rounded-xl border border-border bg-white shadow-lg overflow-hidden">
                    <div className="px-4 py-3 bg-peacock-soft border-b border-border">
                      <p className="text-sm font-semibold text-foreground m-0">Metadata upload workflow</p>
                      <p className="text-xs text-muted-foreground m-0 mt-0.5">Two steps — split large files first, then upload.</p>
                    </div>
                    <div className="py-1.5">
                      {METADATA_STEPS.map((step) => {
                        const isActive = pathname === step.href;
                        const Icon = step.icon;
                        return (
                          <Link key={step.n} href={step.href} onClick={() => setMetaOpen(false)}>
                            <div className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isActive ? "bg-peacock-soft" : "hover:bg-muted"}`}>
                              <span
                                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5 ${
                                  isActive ? "bg-peacock-deep text-white" : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {step.n}
                              </span>
                              <span className="min-w-0">
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                  <Icon className="w-3.5 h-3.5 text-peacock-deep flex-shrink-0" />
                                  {step.title}
                                  {isActive && (
                                    <span className="text-[10px] font-bold text-peacock-deep uppercase tracking-wide">
                                      · current
                                    </span>
                                  )}
                                </span>
                                <span className="block text-xs text-muted-foreground mt-0.5">{step.desc}</span>
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={() => router.push("/upload")}
                className="flex items-center gap-2 rounded-full text-foreground/80 hover:text-saffron-deep hover:bg-saffron-soft"
              >
                <Upload className="w-4 h-4" />
                Upload Documents
              </Button>
            </div>
            <div className="flex items-center">
              <div className="flex items-center ml-4 md:ml-6">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
};

export default NavBar;
