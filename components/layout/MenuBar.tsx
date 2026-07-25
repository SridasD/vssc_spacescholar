"use client";

import { Button } from "@/components/ui/button";
import {
  Home,
  Search,
  MessageSquare,
  Download,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import vsscLogo from '@/public/images/vssc-logo.png';
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export function MenuBar() {
    const router = useRouter();
    const [showExport, setShowExport] = useState(false);
    const exportRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                exportRef.current &&
                !exportRef.current.contains(event.target as Node)
            ) {
                setShowExport(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
                    <Image
                        src={vsscLogo}
                        alt="VSSC Logo"
                        width={40}
                        height={40}
                        className="object-contain"
                    />
                    <span className="font-semibold text-lg bg-gradient-to-r logo-gradient  bg-clip-text text-transparent">
                        SPACE SCHOLAR
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-primary"
                    >
                        <Home className="w-4 h-4" />
                        Home
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/search")}
                        className="flex items-center gap-2 text-primary"
                    >
                        <Search className="w-4 h-4" />
                       AI Search
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/title-search")}
                        className="flex items-center gap-2 text-primary"
                    >
                        <Search className="w-4 h-4" />
                        Title Search
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/chat")}
                        className="flex items-center gap-2 text-primary"
                    >
                        <MessageSquare className="w-5 h-5" />
                        Chat with LIA?
                    </Button>
                    {/* <div className="relative" ref={exportRef}>
                        <Button
                            variant="ghost"
                            onClick={() => setShowExport(!showExport)}
                            className="flex items-center gap-2 text-primary"
                        >
                            <Download className="w-4 h-4" />
                            Export
                            <ChevronDown className="w-4 h-4" />
                        </Button>

                        {showExport && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-50">
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                onClick={() => {
                                window.dispatchEvent(new Event("export-excel"));
                                setShowExport(false);
                                }}
                            >
                                Excel
                            </button>

                            <button
                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                onClick={() => {
                                window.dispatchEvent(new Event("export-doc"));
                                setShowExport(false);
                                }}
                            >
                                DOC
                            </button>

                            <button
                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                onClick={() => {
                                window.dispatchEvent(new Event("export-pdf"));
                                setShowExport(false);
                                }}
                            >
                                PDF
                            </button>
                            </div>
                        )}
                        </div> */}
                </div>
            </div>
        </div>
    );
}