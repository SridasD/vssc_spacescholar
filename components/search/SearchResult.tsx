import { Card, CardContent } from "@/components/ui/card";
import { SearchDocument } from "@/lib/types/search.types";
import {
  Book,
  FileDigit,
  FileBox,
  File,
  MonitorSmartphone,
  ShieldAlert,
  Sparkles,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback, JSX } from "react";
import { toast } from "sonner";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const API_UPLOADS_URL =
  process.env.NEXT_PUBLIC_API_UPLOADS_URL || "http://localhost:8000";

interface SearchResultProps {
  document: SearchDocument;
  showExtras?: boolean;
  globalChats: {
    id: string;
    title: string;
    summary: string;
    author?: string;
    docId?: string;
  }[];
  setGlobalChats: React.Dispatch<
    React.SetStateAction<
      {
        id: string;
        title: string;
        summary: string;
        author?: string;
        docId?: string;
      }[]
    >
  >;
  pendingChats: string[];
  setPendingChats: React.Dispatch<React.SetStateAction<string[]>>;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

interface BadgeConfig {
  color: string;
  railColor: string;
  cardTint: string;  
  accent: string;    
  icon: JSX.Element;
}

const joinUrl = (base: string, path: string) =>
  `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

const PdfIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M6.25 2.75h7.19L18.5 7.81V17.5a2.25 2.25 0 0 1-2.25 2.25H6.25A2.25 2.25 0 0 1 4 17.5V5A2.25 2.25 0 0 1 6.25 2.75Z"
      fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
    />
    <path d="M13.25 2.75v3.5a1.5 1.5 0 0 0 1.5 1.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="2.5" y="12" width="13.5" height="6.4" rx="1.4" fill="#DC2626" />
    <text x="9.25" y="16.7" textAnchor="middle" fontSize="4.4" fontWeight="700" letterSpacing="0.2" fill="#ffffff"
      fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif">PDF</text>
  </svg>
);

export function SearchResult({
  document,
  showExtras = true,
  globalChats,
  setGlobalChats,
  pendingChats,
  setPendingChats,
  selected = false,
  onToggleSelect,
}: SearchResultProps) {
  const getFullUrlFromMetadata = (metadata?: {
    doc_content_type?: string | null;
    accession_no?: string | null;
  }) => {
    if (!metadata?.doc_content_type || !metadata?.accession_no) return undefined;
    const folder = String(metadata.doc_content_type).trim().toLowerCase().replace(/\s+/g, "-");
    const accession = String(metadata.accession_no).trim();
    if (!folder || !accession) return undefined;
    const prefix = process.env.NODE_ENV === "production" ? "" : "uploaded_files/";
    const relativePath = `${prefix}${encodeURIComponent(folder)}/${encodeURIComponent(accession)}.pdf`;
    return joinUrl(API_UPLOADS_URL, relativePath);
  };

  const { metadata } = document._source;
  const isRestricted = Boolean(metadata?.doc_is_restricted);
  const fullUrl = getFullUrlFromMetadata(document._source?.metadata);

  const accessionNo = metadata?.accession_no ?? null;
  const documentNo = metadata?.document_no ?? null;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChatOpen = useCallback(async () => {
    if (isLoading) return;

    const docKey = String(document._id || metadata?.doc_reference_id || "");
    const alreadyOpenLocally = globalChats.some((c) => c.id === docKey);
    const alreadyOpenGlobally = !!globalThis.document.querySelector(
      `.chatbox-window[data-doc-key="${docKey}"]`
    );

    if (alreadyOpenLocally || alreadyOpenGlobally) {
      toast.warning("Already open", {
        description: `"${metadata?.doc_title || "This document"}" is already open in IntelliDoc.`,
        duration: 4000,
      });
      return;
    }

    const totalActiveChats = globalChats.length + pendingChats.length;
    if (totalActiveChats >= 4) {
      toast.error("Maximum limit reached", {
        description: "Only 4 IntelliDoc windows can be opened at a time.",
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setPendingChats((prev) => [...prev, docKey]);

    if (metadata?.doc_content_type === "Ebooks") {
      setGlobalChats((prev) => [
        ...prev,
        { id: docKey, title: metadata?.doc_title || "Untitled", summary: "", docId: String(metadata?.doc_reference_id || "") },
      ]);
      setPendingChats((prev) => prev.filter((id) => id !== docKey));
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        id: docKey,
        doc_reference_id: String(metadata?.doc_reference_id || ""),
        session_id: "default",
      };

      const response = await fetch(`${API_BASE_URL}/summary`, {
        method: "POST",
        headers: { accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "An error occurred while generating the summary";
        let description = "Please try again later";
        switch (response.status) {
          case 404: errorMessage = "Document not found"; description = "The requested document could not be found"; break;
          case 429: errorMessage = "Too many requests"; description = "Please wait a moment before trying again"; break;
          case 503: errorMessage = "Service unavailable"; description = "The service is temporarily unavailable. Please try again later"; break;
          default: console.error(`HTTP error! status: ${response.status}`);
        }
        toast.error(errorMessage, { description, duration: 5000 });
        setPendingChats((prev) => prev.filter((id) => id !== docKey));
        setIsLoading(false);
        return;
      }

      const summaryData = await response.json();
      const answer = summaryData.answer ?? summaryData.summary ?? summaryData.result ?? summaryData.text;
      if (!answer) throw new Error("Invalid summary data received (no answer/summary/result/text field found)");

      setGlobalChats((prev) => {
        if (prev.some((c) => c.id === docKey)) return prev;
        return [
          ...prev,
          { id: docKey, title: metadata?.doc_title || "Untitled", summary: answer, docId: String(metadata?.doc_reference_id || "") },
        ];
      });
      setPendingChats((prev) => prev.filter((id) => id !== docKey));
    } catch (error) {
      console.error("Error generating summary:", error);
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        toast.error("Connection error", {
          description: "Could not connect to the server. Please check your network or try again later.",
          duration: 5000,
        });
      } else if (error instanceof Error) {
        setError(error.message);
        toast.error("Summary error", { description: error.message, duration: 5000 });
      } else {
        setError("An unexpected error occurred");
      }
      setPendingChats((prev) => prev.filter((id) => id !== docKey));
    } finally {
      setIsLoading(false);
    }
  }, [
    document._id, metadata?.doc_reference_id, metadata?.doc_title,
    metadata?.doc_content_type, globalChats, pendingChats, isLoading,
  ]);

  const getDocumentBadgeConfig = (docType?: string): BadgeConfig => {
    switch (docType) {
      case "Books":
        return { color: "border-indigo-300 text-primary bg-indigo-50", railColor: "bg-primary", cardTint: "from-indigo-100/70 via-indigo-50/45 to-indigo-50/20", accent: "accent-indigo-500", icon: <Book className="h-3 w-3 mr-1" /> };
      case "Ebooks":
        return { color: "border-peacock/40 text-peacock-deep bg-peacock-soft", railColor: "bg-peacock", cardTint: "from-peacock-soft/70 via-peacock-soft/45 to-peacock-soft/20", accent: "accent-peacock", icon: <MonitorSmartphone className="h-3 w-3 mr-1" /> };
      case "Reports":
        return { color: "border-amber-400 text-amber-800 bg-amber-50", railColor: "bg-turmeric", cardTint: "from-amber-100/70 via-amber-50/45 to-amber-50/20", accent: "accent-amber-500", icon: <FileBox className="h-3 w-3 mr-1" /> };
      case "Micro Fiche":
        return { color: "border-saffron/40 text-saffron-deep bg-saffron-soft", railColor: "bg-saffron", cardTint: "from-saffron-soft/70 via-saffron-soft/45 to-saffron-soft/20", accent: "accent-saffron", icon: <FileDigit className="h-3 w-3 mr-1" /> };
      case "Estandards":
        return { color: "border-rose-300 text-rose-700 bg-rose-50", railColor: "bg-rose-500", cardTint: "from-rose-100/70 via-rose-50/45 to-rose-50/20", accent: "accent-rose-500", icon: <FileDigit className="h-3 w-3 mr-1" /> };
      default:
        return { color: "border-leaf/40 text-leaf bg-leaf-soft", railColor: "bg-leaf", cardTint: "from-leaf-soft/70 via-leaf-soft/45 to-leaf-soft/20", accent: "accent-leaf", icon: <File className="h-3 w-3 mr-1" /> };
    }
  };

  const handleCopyCitation = useCallback(async () => {
    const citation = [
      metadata?.author,
      metadata?.doc_title,
      metadata?.doc_published_year,
      metadata?.accession_no ? `Accession No: ${metadata.accession_no}.` : null,
    ]
      .filter(Boolean)
      .join(". ")
      .replace(/\.\.+/g, ".");
    try {
      await navigator.clipboard.writeText(citation);
      toast.success("Citation copied", { duration: 2500 });
    } catch {
      toast.error("Could not copy citation");
    }
  }, [metadata?.author, metadata?.doc_title, metadata?.doc_published_year, metadata?.accession_no]);

  const badgeConfig = getDocumentBadgeConfig(metadata?.doc_content_type);

  const relevancePct =
    document._score != null ? Math.min(100, Math.round(document._score * 100)) : null;

  const subjectsList =
    metadata?.doc_subject_details && Object.keys(metadata.doc_subject_details).length > 0
      ? Object.values(metadata.doc_subject_details)
      : [];

  return (
    <>
      <Card
        className={`relative w-full mb-3 overflow-hidden rounded-2xl
                   bg-white border border-border
                   shadow-sm
                   transition-all duration-300 ease-out
                   hover:-translate-y-0.5 hover:border-primary/25
                   hover:shadow-md`}
      >
        {/* color rail */}
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${badgeConfig.railColor}`} aria-hidden />

        {/* ============ SINGLE COLUMN — everything aligned under the title ============ */}
        <CardContent className="p-6 md:p-7 flex flex-col gap-3.5 min-w-0">

          {/* Header: collection badge + concept-match badge + restricted badge + select checkbox */}
          <div className="flex items-center flex-wrap gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded border ${badgeConfig.color}
                          text-[10px] font-bold tracking-[0.12em] uppercase w-fit`}
            >
              {badgeConfig.icon}
              {metadata?.doc_content_type || "Document"}
            </span>

            {showExtras && relevancePct !== null && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-saffron/30 text-saffron-deep bg-saffron-soft text-[10px] font-bold tracking-[0.06em] uppercase w-fit">
                {relevancePct}% concept match
              </span>
            )}

            {metadata?.doc_content_type !== "Books" && isRestricted && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-700 text-[10px] font-bold tracking-[0.1em] uppercase w-fit" title="This item is restricted">
                <ShieldAlert className="h-3 w-3" />
                Restricted
              </span>
            )}

            {showExtras && onToggleSelect && (
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect(String(document._id))}
                aria-label="Select document for export"
                className={`w-4 h-4 cursor-pointer rounded ml-auto ${badgeConfig.accent}`}
                title="Select for export"
              />
            )}
          </div>

          {/* Title */}
          <h3 className="text-[18px] md:text-[20px] leading-[1.3] tracking-[-0.005em] font-semibold text-foreground break-words">
            {metadata?.doc_title || "Untitled Document"}
          </h3>

          {/* Author */}
          {(metadata?.author || metadata?.additional_author) && (
            <div className="text-[14px] font-medium text-foreground/80">
              {[metadata?.author, metadata?.additional_author].filter(Boolean).join(", ")}
            </div>
          )}

          {/* Subjects */}
          {subjectsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {subjectsList.map((subject, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-full bg-peacock-soft border border-peacock/15 text-peacock-deep text-[12px] font-semibold">
                  {String(subject)}
                </span>
              ))}
            </div>
          )}


          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 pt-3.5 border-t border-dashed border-border mt-1"
            style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
          >
            {showExtras && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] tracking-[0.16em] uppercase text-muted-foreground">Accession No.</span>
                <span className="text-[15px] font-semibold text-foreground">{accessionNo || "N/A"}</span>
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] tracking-[0.16em] uppercase text-muted-foreground">Year</span>
              <span className="text-[15px] font-semibold text-foreground">{metadata?.doc_published_year || "N/A"}</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] tracking-[0.16em] uppercase text-muted-foreground">Document No.</span>
              <span className="text-[15px] font-semibold text-foreground">{documentNo || "N/A"}</span>
            </div>
          </div>

          {/* Bottom action bar — mirrors the template's result-actions row */}
          {metadata?.doc_content_type !== "Books" && !isRestricted && (
            <div className="flex items-center flex-wrap gap-2 pt-3.5 border-t border-dashed border-border">
              <Button
                variant="outline" size="sm" onClick={handleChatOpen} disabled={isLoading}
                aria-label="Explore document with AI"
                className="group relative overflow-hidden border border-peacock bg-peacock-soft text-peacock-deep text-[11px] font-bold tracking-[0.10em] uppercase hover:bg-gradient-to-br hover:from-peacock hover:to-peacock-deep hover:text-white hover:border-transparent hover:shadow-md focus-visible:ring-2 focus-visible:ring-peacock/40 focus-visible:ring-offset-1 active:scale-95 transition-all duration-300"
                title="Explore document with AI"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" aria-hidden />
                <Sparkles className="h-3.5 w-3.5 mr-1.5 relative transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <span className="relative">IntelliDoc</span>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-sm">
                    <div className="w-4 h-4 border-2 border-peacock border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </Button>

              {fullUrl && (
                <a href={fullUrl} target="_blank" rel="noopener noreferrer" aria-label="Open document" title="Open document"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-slate-300 text-slate-500 shadow-[0_1px_0_rgba(13,20,36,0.02)] transition-all duration-200 hover:border-red-400 hover:text-red-600 hover:bg-red-50 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:ring-offset-1">
                  <PdfIcon className="h-5 w-5" />
                </a>
              )}

              <button
                type="button"
                onClick={handleCopyCitation}
                aria-label="Copy citation"
                title="Copy citation"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-slate-300 text-slate-500 shadow-[0_1px_0_rgba(13,20,36,0.02)] transition-all duration-200 hover:border-primary/40 hover:text-primary hover:bg-primary/5 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}