"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Download, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Loader2, Search, X } from "lucide-react";
import {
  exportDashboardToExcel,
  exportDashboardToPDF,
  exportDashboardToDoc,
} from "@/lib/utils/exportResults";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DOCUMENT_STATUS_TO_KEY, STATUS_COLORS } from "@/lib/dashboardTheme";

interface Document {
  accession_no: string | null;
  error_id: number | null;
  content_type: string;
  biblio_number: string;
  barcode: string;
  doc_title: string;
  author: string;
  doc_publishd_year: number;
  status: string;
  uploaded_time: string;
}

/** External deep-link trigger — bump `nonce` to force a status-filter jump even if `status` repeats. */
export interface FocusSignal {
  status: string;
  nonce: number;
}

interface DocumentTableProps {
  limit?: number;
  initialPage?: number;
  focusSignal?: FocusSignal | null;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "INPROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];

function StatusBadge({ status }: { status: string }) {
  const key = DOCUMENT_STATUS_TO_KEY[status];
  const colors = key ? STATUS_COLORS[key] : null;
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 border-transparent font-semibold ${colors ? `${colors.pillBg} ${colors.pillText}` : "bg-muted text-muted-foreground"}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors?.dot ?? "bg-muted-foreground"} ${status === "FAILED" ? "animate-pulse" : ""}`} />
      {status}
    </Badge>
  );
}

export default function DocumentTable({
  limit = 10,
  initialPage = 1,
  focusSignal = null,
}: DocumentTableProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(initialPage);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const lastFocusNonce = useRef<number | null>(null);

  const [retryTarget, setRetryTarget] = useState<Document | null>(null);
  const [retryingAcc, setRetryingAcc] = useState<string | null>(null);

  // Debounce the raw input into `searchTerm`, which actually drives the fetch — avoids
  // firing a request on every keystroke, and resets to page 1 when the term changes.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter && statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const response = await fetch(`/api/documents/list?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch documents");

      const data = await response.json();
      setDocuments(data.documents || []);
      setTotalDocuments(data.totalCount || 0);
      setTotalPages(Math.ceil((data.totalCount || 0) / limit));
      setError("");
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, searchTerm]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (!focusSignal || lastFocusNonce.current === focusSignal.nonce) return;
    lastFocusNonce.current = focusSignal.nonce;
    setStatusFilter(focusSignal.status);
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
  }, [focusSignal]);

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

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const confirmRetry = async () => {
    if (!retryTarget?.accession_no) return;
    const acc = retryTarget.accession_no;

    setRetryingAcc(acc);
    const toastId = toast.loading(`Retrying ${acc}…`);

    try {
      const res = await fetch("/api/documents/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accession_no: acc }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.update(toastId, {
          render: data?.error || "Retry failed",
          type: "error",
          isLoading: false,
          autoClose: 8000,
        });
        return;
      }

      toast.update(toastId, {
        render: `${acc} queued for retry`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      await fetchDocuments();
    } catch (e) {
      console.error("Retry failed:", e);
      toast.update(toastId, {
        render: "Retry failed — check console",
        type: "error",
        isLoading: false,
        autoClose: 8000,
      });
    } finally {
      setRetryingAcc(null);
      setRetryTarget(null);
    }
  };

  const RetryButton = ({ document, className }: { document: Document; className?: string }) => {
    const isRetrying = retryingAcc === document.accession_no && retryingAcc !== null;
    if (document.status !== "FAILED" || !document.accession_no) return null;
    return (
      <button
        type="button"
        onClick={() => setRetryTarget(document)}
        disabled={isRetrying}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
          isRetrying
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        } ${className ?? ""}`}
        title="Retry this document"
      >
        {isRetrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        {isRetrying ? "Retrying…" : "Retry"}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <ToastContainer position="top-right" autoClose={4000} />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, author, accession no…"
              className="min-w-[220px] pl-8 pr-8 py-1.5 text-sm bg-white border border-border text-foreground rounded-lg
                         placeholder:text-muted-foreground hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30
                         transition-all duration-150"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <label htmlFor="status-filter" className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="min-w-[150px] px-3 py-1.5 text-sm font-medium bg-white border border-border text-foreground rounded-lg
                       hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30
                       transition-all duration-150 cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {statusFilter !== "ALL" && (
            <span className="text-xs text-muted-foreground">
              {documents.length} <span className="font-semibold text-foreground">{statusFilter}</span> document{documents.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setShowExport(!showExport)}
            title="Exports the currently loaded page only"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium bg-white border border-border text-foreground rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-all duration-150"
          >
            <Download className="w-4 h-4" />
            Export page
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showExport && (
            <div className="absolute right-0 mt-2 w-36 bg-white border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              <button onClick={() => exportDashboardToExcel(documents)} className="w-full text-left px-4 py-2 text-sm hover:bg-muted">
                Excel
              </button>
              <button onClick={() => exportDashboardToPDF(documents)} className="w-full text-left px-4 py-2 text-sm hover:bg-muted">
                PDF
              </button>
              <button onClick={() => exportDashboardToDoc(documents)} className="w-full text-left px-4 py-2 text-sm hover:bg-muted">
                DOC
              </button>
            </div>
          )}
        </div>
      </div>

      {/* States */}
      {isLoading && documents.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error && documents.length === 0 ? (
        <div className="p-4 text-rose-800 bg-rose-50 border border-rose-200 rounded-lg text-sm">{error}</div>
      ) : documents.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg border border-border text-sm">
          No documents found
          {searchTerm ? ` matching "${searchTerm}"` : ""}
          {statusFilter !== "ALL" ? ` with status "${statusFilter}"` : ""}.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Type</TableHead>
                  <TableHead>Doc Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document, index) => (
                  <TableRow key={`${document.accession_no || document.biblio_number}-${index}`}>
                    <TableCell className="text-sm text-foreground/90 whitespace-nowrap">{document.content_type}</TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium text-foreground">{document.doc_title}</div>
                      <div className="text-xs text-muted-foreground">
                        {document.accession_no ? `${document.accession_no}` : ""}
                        {document.biblio_number ? ` · #${document.biblio_number}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground/90 whitespace-nowrap">{document.author}</TableCell>
                    <TableCell className="text-sm text-foreground/90 whitespace-nowrap">{document.doc_publishd_year}</TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={document.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(document.uploaded_time)}</TableCell>
                    <TableCell className="text-center">
                      <RetryButton document={document} className="mx-auto" />
                      {document.status !== "FAILED" && <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {documents.map((document, index) => (
              <div key={`${document.accession_no || document.biblio_number}-${index}`} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{document.doc_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {document.content_type} · {document.author}
                    </p>
                  </div>
                  <StatusBadge status={document.status} />
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>{document.doc_publishd_year} · {formatDate(document.uploaded_time)}</span>
                  <RetryButton document={document} />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1">
            <div className="text-sm text-muted-foreground">
              {documents.length > 0 ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, totalDocuments)} of{" "}
              <span className="font-semibold text-foreground">{totalDocuments}</span> documents
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={page === 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white border border-border text-foreground rounded-lg hover:border-primary/40
                           disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-muted-foreground">
                Page <span className="font-semibold text-foreground">{page}</span> of{" "}
                <span className="font-semibold text-foreground">{totalPages || 1}</span>
              </span>
              <button
                onClick={handleNextPage}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white border border-border text-foreground rounded-lg hover:border-primary/40
                           disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Retry confirmation dialog */}
      <AlertDialog.Root
        open={retryTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRetryTarget(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-border">
            <AlertDialog.Title className="text-lg font-semibold text-foreground">Retry this document?</AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-muted-foreground mt-2">
              {retryTarget && (
                <>
                  <span className="block">
                    <span className="font-medium text-foreground">{retryTarget.doc_title}</span>
                  </span>
                  <span className="block mt-1 text-xs text-muted-foreground">
                    {retryTarget.accession_no} · {retryTarget.content_type}
                  </span>
                  <span className="block mt-3">
                    This will move the document back to <strong>PENDING</strong> and clear the error. It will be re-processed.
                  </span>
                </>
              )}
            </AlertDialog.Description>
            <div className="flex justify-end gap-2 mt-5">
              <AlertDialog.Cancel className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/70 rounded-lg transition-colors">
                Cancel
              </AlertDialog.Cancel>
              <AlertDialog.Action
                onClick={confirmRetry}
                className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all"
              >
                Yes, retry
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
