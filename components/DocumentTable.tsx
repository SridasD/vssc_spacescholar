"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  exportDashboardToExcel,
  exportDashboardToPDF,
  exportDashboardToDoc,
} from "@/lib/utils/exportResults";


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

interface DocumentTableProps {
  limit?: number;
  initialPage?: number;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "INPROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];

export default function DocumentTable({
  limit = 10,
  initialPage = 1,
}: DocumentTableProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(initialPage);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const [retryTarget, setRetryTarget] = useState<Document | null>(null);
  const [retryingAcc, setRetryingAcc] = useState<string | null>(null);

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
  }, [page, limit, statusFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-teal-50 text-teal-800 border-teal-300";
      case "PENDING":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "INPROGRESS":
        return "bg-blue-50 text-blue-800 border-blue-300";
      case "FAILED":
        return "bg-red-50 text-red-800 border-red-300";
      default:
        return "bg-gray-50 text-gray-800 border-gray-300";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-teal-600";
      case "PENDING":
        return "bg-amber-500";
      case "INPROGRESS":
        return "bg-blue-500";
      case "FAILED":
        return "bg-red-500 animate-pulse";
      default:
        return "bg-slate-400";
    }
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

  return (
    <div className="space-y-4 bg-gradient-to-br from-teal-50/80 via-white to-amber-50/40 backdrop-blur-sm rounded-2xl border border-teal-200/50 p-6 shadow-[0_4px_20px_rgba(13,148,136,0.08)]">
      <ToastContainer position="top-right" autoClose={4000} />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/80 backdrop-blur-sm border border-teal-200/60 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-teal-700">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <label
              htmlFor="status-filter"
              className="text-xs uppercase tracking-widest font-semibold text-teal-800"
            >
              Filter by status
            </label>
          </div>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="min-w-[160px] px-3 py-2 text-sm font-medium bg-white border-2 border-teal-300 text-teal-900 rounded-lg
                       hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-500
                       transition-all duration-200 cursor-pointer shadow-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setShowExport(!showExport)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium 
                      bg-gradient-to-r from-teal-500 to-cyan-500 text-white 
                      rounded-lg shadow-sm hover:shadow-md 
                      hover:from-teal-600 hover:to-cyan-600 
                      transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16v-8m0 8l-3-3m3 3l3-3M4 20h16"
              />
            </svg>

            Export

            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showExport && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50">

            <button
              onClick={() => exportDashboardToExcel(documents)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
            >
              Excel
            </button>

            <button
              onClick={() => exportDashboardToPDF(documents)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
            >
              PDF
            </button>

            <button
              onClick={() => exportDashboardToDoc(documents)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
            >
              DOC
            </button>

            </div>
            )}
        </div>
        {statusFilter !== "ALL" && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-100/80 border border-teal-300 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
            <span className="text-xs font-medium text-teal-800">
              Showing {documents.length}{" "}
              <span className="font-bold">{statusFilter}</span> document
              {documents.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* States */}
      {isLoading && documents.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-slate-700">Loading documents…</span>
        </div>
      ) : error && documents.length === 0 ? (
        <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      ) : documents.length === 0 ? (
        <div className="p-8 text-center text-slate-600 bg-gradient-to-br from-teal-50/60 to-amber-50/40 rounded-lg border border-white/60">
          <p>
            No documents found
            {statusFilter !== "ALL" ? ` with status "${statusFilter}"` : ""}.
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-xl border border-teal-200/70 shadow-md">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-semibold tracking-wider text-left text-white uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold tracking-wider text-left text-white uppercase">
                    Doc Title
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold tracking-wider text-left text-white uppercase">
                    Author
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold tracking-wider text-left text-white uppercase">
                    Year
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold tracking-wider text-center text-white uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold tracking-wider text-left text-white uppercase">
                    Uploaded
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold tracking-wider text-center text-white uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document, index) => {
                  console.log("DOCUMENT:", document);
                  const isFailed = document.status === "FAILED";
                  const isRetrying =
                    retryingAcc === document.accession_no &&
                    retryingAcc !== null;
                  return (
                    <tr
                      key={`${document.accession_no || document.biblio_number}-${index}`}
                      className={`border-b border-slate-200 transition-colors duration-150 ${
  index % 2 === 0 ? "bg-white" : "bg-teal-50"
} hover:bg-teal-100/70`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">
                        {document.content_type}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-slate-900">
                          {document.doc_title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {document.accession_no
                            ? `${document.accession_no}`
                            : ""}
                          {document.biblio_number
                            ? ` · #${document.biblio_number}`
                            : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">
                        {document.author}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-800">
                        {document.doc_publishd_year}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <span
                          className={`px-3 py-1 inline-flex items-center gap-1.5 text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                            document.status
                          )}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(
                              document.status
                            )}`}
                          />
                          {document.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                        {formatDate(document.uploaded_time)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        {isFailed && document.accession_no ? (
                          <button
                            type="button"
                            onClick={() => setRetryTarget(document)}
                            disabled={isRetrying}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 shadow-sm ${
                              isRetrying
                                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                : "bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                            }`}
                            title="Retry this document"
                          >
                            {isRetrying ? (
                              <>
                                <svg
                                  className="w-3.5 h-3.5 animate-spin"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                                Retrying…
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                                Retry
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-2 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-teal-200/60 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="inline-flex items-center justify-center px-2.5 py-1 bg-teal-100 text-teal-800 font-semibold text-xs rounded-md">
                {documents.length > 0 ? (page - 1) * limit + 1 : 0} –{" "}
                {Math.min(page * limit, totalDocuments)}
              </span>
              <span className="text-slate-500">of</span>
              <span className="font-semibold text-slate-900">
                {totalDocuments}
              </span>
              <span className="text-slate-500">documents</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={page === 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white border border-teal-300 text-teal-800 rounded-lg hover:bg-teal-50 hover:border-teal-500
                           disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:hover:bg-slate-50
                           transition-all duration-150 shadow-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-slate-700 bg-teal-50 rounded-lg border border-teal-200">
                Page{" "}
                <span className="font-semibold text-teal-900">{page}</span> of{" "}
                <span className="font-semibold text-teal-900">
                  {totalPages || 1}
                </span>
              </span>
              <button
                onClick={handleNextPage}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white border border-teal-300 text-teal-800 rounded-lg hover:bg-teal-50 hover:border-teal-500
                           disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:hover:bg-slate-50
                           transition-all duration-150 shadow-sm"
              >
                Next
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
               
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
          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-teal-200">
            <AlertDialog.Title className="text-lg font-semibold text-slate-900">
              Retry this document?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-slate-600 mt-2">
              {retryTarget && (
                <>
                  <span className="block">
                    <span className="font-medium text-slate-900">
                      {retryTarget.doc_title}
                    </span>
                  </span>
                  <span className="block mt-1 text-xs text-slate-500">
                    {retryTarget.accession_no} · {retryTarget.content_type}
                  </span>
                  <span className="block mt-3">
                    This will move the document back to{" "}
                    <strong>PENDING</strong> and clear the error. It will be
                    re-processed.
                  </span>
                </>
              )}
            </AlertDialog.Description>
            <div className="flex justify-end gap-2 mt-5">
              <AlertDialog.Cancel className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </AlertDialog.Cancel>
              <AlertDialog.Action
                onClick={confirmRetry}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-lg transition-all shadow-sm"
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