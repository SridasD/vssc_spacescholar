"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  History,
  Search as SearchIcon,
  X,
  Trash2,
  SlidersHorizontal,
  Calendar,
  FileType,
  Loader2,
  Download,
  ChevronDown,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSearch } from "@/lib/hooks/useSearch";
import { SearchResults } from "@/components/search/SearchResults";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { MenuBar } from "@/components/layout/MenuBar";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import {
  exportToExcel,
  exportToPDF,
  exportToDoc,
} from "@/lib/utils/exportResults";

type SortKey = "relevance" | "newest" | "oldest" | "title";

const AI_SAMPLE_PROMPTS = [
  "Benefits of regenerative cooling in liquid rocket engine?",
  "What is crew module?",
];

function sortResults(items: any[], sortKey: SortKey) {
  if (sortKey === "relevance") return items;
  const sorted = [...items];
  if (sortKey === "newest") {
    sorted.sort(
      (a, b) =>
        Number(b._source?.metadata?.doc_published_year || 0) -
        Number(a._source?.metadata?.doc_published_year || 0)
    );
  } else if (sortKey === "oldest") {
    sorted.sort(
      (a, b) =>
        Number(a._source?.metadata?.doc_published_year || 0) -
        Number(b._source?.metadata?.doc_published_year || 0)
    );
  } else if (sortKey === "title") {
    sorted.sort((a, b) =>
      String(a._source?.metadata?.doc_title || "").localeCompare(
        String(b._source?.metadata?.doc_title || "")
      )
    );
  }
  return sorted;
}

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { allResults, isLoading, error, totalHits, searchDocuments } = useSearch();
  const [hasSearched, setHasSearched] = useState(false);
  const initialParamsHandled = useRef(false);

  const [tempDocTypes, setTempDocTypes] = useState<Set<string>>(new Set());
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [tempYearFrom, setTempYearFrom] = useState("");
  const [tempYearTo, setTempYearTo] = useState("");

  const [selectedDocTypes, setSelectedDocTypes] = useState<Set<string>>(new Set());
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const { toast } = useToast();

  const [sortKey, setSortKey] = useState<SortKey>("relevance");
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) setRecentSearches(JSON.parse(stored));
  }, []);

  // Arriving from home / discovery cards / analytics tiles with ?q= and/or
  // ?docType= — seed state and auto-run the search once.
  useEffect(() => {
    if (initialParamsHandled.current) return;
    initialParamsHandled.current = true;
    const q = searchParams.get("q");
    const docType = searchParams.get("docType");
    if (docType) {
      setTempDocTypes(new Set([docType]));
      setSelectedDocTypes(new Set([docType]));
    }
    if (q) {
      setSearchQuery(q);
      setHasSearched(true);
      searchDocuments({ query: q }).then(() => {
        const updated = [q, ...JSON.parse(localStorage.getItem("recentSearches") || "[]").filter((s: string) => s !== q)].slice(0, 10);
        setRecentSearches(updated);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!allResults.length) {
      setDocTypes([]);
      return;
    }
    const uniqueDocTypes = Array.from(
      new Set(
        allResults
          .map((item) => item._source?.metadata?.doc_content_type)
          .filter(Boolean)
      )
    );
    setDocTypes(uniqueDocTypes as string[]);
  }, [allResults]);

  const docTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allResults.forEach((item) => {
      const type = item._source?.metadata?.doc_content_type;
      if (type) counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [allResults]);

  const years = Array.from(
    new Set(
      allResults
        .map((item) => item._source?.metadata?.doc_published_year)
        .filter(Boolean)
    )
  ).sort((a, b) => Number(a) - Number(b));

  useEffect(() => {
    if (!showExport) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExport]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setHasSearched(true);
    setSelectedIds(new Set());
    setCurrentPage(1);
    try {
      await searchDocuments({ query: searchQuery });
      const updated = [
        searchQuery,
        ...recentSearches.filter((s) => s !== searchQuery),
      ].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
      });
    }
  };

  const runTerm = (term: string) => {
    setSearchQuery(term);
    setHasSearched(true);
    setSelectedIds(new Set());
    setCurrentPage(1);
    searchDocuments({ query: term });
  };

  const handleDeleteSearch = (searchToDelete: string) => {
    const updated = recentSearches.filter((s) => s !== searchToDelete);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
    toast({ title: "Search Removed", description: "The search has been removed from history." });
  };

  const handleClearAllSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
    toast({ title: "History Cleared", description: "All search history has been cleared." });
  };

  const toggleTempDocType = (type: string) => {
    setTempDocTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const applyFilters = () => {
    setSelectedDocTypes(new Set(tempDocTypes));
    setYearFrom(tempYearFrom);
    setYearTo(tempYearTo);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setTempDocTypes(new Set());
    setTempYearFrom("");
    setTempYearTo("");
    setSelectedDocTypes(new Set());
    setYearFrom("");
    setYearTo("");
    setCurrentPage(1);
  };

  const removeDocTypeFilter = (type: string) => {
    setTempDocTypes((prev) => {
      const next = new Set(prev);
      next.delete(type);
      return next;
    });
    setSelectedDocTypes((prev) => {
      const next = new Set(prev);
      next.delete(type);
      return next;
    });
    setCurrentPage(1);
  };
  const removeYearFilter = () => {
    setTempYearFrom("");
    setTempYearTo("");
    setYearFrom("");
    setYearTo("");
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedDocTypes.size > 0 || !!yearFrom || !!yearTo;

  // Filter → sort (paging happens below)
  const filteredResults = useMemo(() => {
    let filtered = allResults;
    if (selectedDocTypes.size > 0) {
      filtered = filtered.filter((item) =>
        selectedDocTypes.has(item._source?.metadata?.doc_content_type)
      );
    }
    if (yearFrom) {
      filtered = filtered.filter(
        (item) => Number(item._source?.metadata?.doc_published_year) >= Number(yearFrom)
      );
    }
    if (yearTo) {
      filtered = filtered.filter(
        (item) => Number(item._source?.metadata?.doc_published_year) <= Number(yearTo)
      );
    }
    return filtered;
  }, [allResults, selectedDocTypes, yearFrom, yearTo]);

  const sortedResults = useMemo(
    () => sortResults(filteredResults, sortKey),
    [filteredResults, sortKey]
  );

  const totalPages =
    pageSize === "all" ? 1 : Math.max(1, Math.ceil(sortedResults.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedResults = useMemo(() => {
    if (pageSize === "all") return sortedResults;
    const start = (safePage - 1) * pageSize;
    return sortedResults.slice(start, start + pageSize);
  }, [sortedResults, pageSize, safePage]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allVisibleSelected =
    pagedResults.length > 0 && pagedResults.every((r) => selectedIds.has(String(r._id)));
  const toggleSelectVisible = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        pagedResults.forEach((r) => next.delete(String(r._id)));
        return next;
      }
      const next = new Set(prev);
      pagedResults.forEach((r) => next.add(String(r._id)));
      return next;
    });
  };

  const handleExport = (type: "excel" | "pdf" | "doc") => {
    const chosen = sortedResults.filter((r) => selectedIds.has(String(r._id)));
    const data = chosen.length ? chosen : sortedResults;
    if (!data.length) {
      toast({ title: "Nothing to export", description: "Run a search first." });
      setShowExport(false);
      return;
    }
    if (type === "excel") exportToExcel(data);
    else if (type === "pdf") exportToPDF(data);
    else exportToDoc(data);
    setShowExport(false);
  };

  const selectedCount = selectedIds.size;

  const showRefine = hasSearched && allResults.length > 0;
  const showRecents = recentSearches.length > 0;
  const showAside = showRefine || showRecents;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MenuBar />

      {/* Search console */}
      <div
        className="relative overflow-hidden px-4 py-6"
        style={{
          background:
            "radial-gradient(circle at 90% 0%, rgba(245,196,78,0.22), transparent 26%), linear-gradient(135deg, var(--peacock-deep), hsl(var(--primary)) 58%, var(--peacock))",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-3">
            <button
              onClick={() => router.push(`/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-primary bg-white shadow-md"
            >
              AI Search
            </button>
            <button
              onClick={() => router.push(`/title-search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white/70 bg-white/10 hover:bg-white/15 hover:text-white transition-colors"
            >
              Title Search
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2 items-stretch rounded-2xl bg-white p-2"
          >
            <div className="relative flex-1 group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-peacock/70 group-focus-within:text-peacock-deep transition-colors pointer-events-none" />
              <Input
                placeholder="Ask about a concept, material, mission or research problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-12 pr-10 h-12 text-base text-foreground placeholder:text-muted-foreground bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-md transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="h-12 px-6 text-white font-semibold rounded-xl transition-all bg-gradient-to-r from-saffron to-saffron-deep hover:opacity-90 shadow-md disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><SearchIcon className="w-4 h-4 mr-2" />Discover</>)}
            </Button>
          </form>
          <p className="mt-3 text-xs text-white/75">
            Describe a topic in everyday language — Spacescholar finds conceptually related records, not just keyword matches.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-white/60">Try a sample:</span>
            {AI_SAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => runTerm(prompt)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex-1 flex overflow-hidden bg-background">
        <div className="relative z-10 flex w-full">
          <div className="container mx-auto px-4 py-6 flex gap-6">

            {showAside && (
              <aside className="w-72 hidden md:block space-y-4">

                {showRefine && (
                  <div className="bg-white border border-border rounded-2xl overflow-hidden sticky top-6 shadow-sm">
                    <div className="px-4 py-3.5 flex items-center justify-between gap-2 bg-gradient-to-r from-peacock-soft to-saffron-soft border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white ring-1 ring-border flex items-center justify-center">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-peacock-deep" />
                        </div>
                        <h2 className="text-sm font-semibold text-foreground">Refine Results</h2>
                      </div>
                      {hasActiveFilters && (
                        <button onClick={clearFilters} className="text-[11px] font-semibold text-saffron-deep hover:underline">
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="p-4 space-y-4">
                      <div>
                        <label className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                          <FileType className="w-3.5 h-3.5 text-muted-foreground" />
                          Document Type
                        </label>
                        <div className="space-y-1.5">
                          {docTypes.map((type) => (
                            <label key={type} className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tempDocTypes.has(type)}
                                onChange={() => toggleTempDocType(type)}
                                className="w-4 h-4 accent-peacock cursor-pointer"
                              />
                              <span className="flex-1">{type}</span>
                              <span className="text-xs font-medium text-muted-foreground">{docTypeCounts[type] ?? 0}</span>
                            </label>
                          ))}
                          {docTypes.length === 0 && (
                            <p className="text-xs text-muted-foreground">No results yet.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          Published Year
                        </label>
                        <div className="flex gap-2 items-center">
                          <select
                            className="flex-1 px-2.5 py-2 border-2 border-border rounded-lg text-sm text-foreground focus:border-peacock focus:outline-none bg-white transition-colors"
                            value={tempYearFrom}
                            onChange={(e) => setTempYearFrom(e.target.value)}
                          >
                            <option value="">From</option>
                            {years.map((year) => (
                              <option key={String(year)} value={String(year)}>{year}</option>
                            ))}
                          </select>
                          <span className="text-muted-foreground text-sm">—</span>
                          <select
                            className="flex-1 px-2.5 py-2 border-2 border-border rounded-lg text-sm text-foreground focus:border-peacock focus:outline-none bg-white transition-colors"
                            value={tempYearTo}
                            onChange={(e) => setTempYearTo(e.target.value)}
                          >
                            <option value="">To</option>
                            {years.map((year) => (
                              <option key={String(year)} value={String(year)}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <Button
                        type="button"
                        className="w-full bg-gradient-to-r from-saffron to-peacock-deep hover:opacity-90 text-white rounded-lg shadow-sm"
                        onClick={applyFilters}
                      >
                        Apply filters
                      </Button>

                      {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {Array.from(selectedDocTypes).map((type) => (
                            <span key={type} className="inline-flex items-center gap-1 px-2.5 py-1 bg-peacock-soft border border-peacock/20 text-peacock-deep text-xs rounded-full">
                              <FileType className="w-3 h-3" />
                              {type}
                              <button onClick={() => removeDocTypeFilter(type)} className="ml-0.5 hover:bg-peacock/10 rounded-full p-0.5">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                          {(yearFrom || yearTo) && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-saffron-soft border border-saffron/20 text-saffron-deep text-xs rounded-full">
                              <Calendar className="w-3 h-3" />
                              {yearFrom || "…"} – {yearTo || "…"}
                              <button onClick={removeYearFilter} className="ml-0.5 hover:bg-saffron/10 rounded-full p-0.5">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {recentSearches.length > 0 && (
                  <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3.5 flex items-center justify-between bg-gradient-to-r from-peacock-soft to-saffron-soft border-b border-border">
                      <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <div className="w-7 h-7 rounded-lg bg-white ring-1 ring-border flex items-center justify-center">
                          <History className="w-3.5 h-3.5 text-peacock-deep" />
                        </div>
                        Recent Searches
                      </h2>
                      <button onClick={handleClearAllSearches} className="p-1.5 hover:bg-muted rounded-md transition-colors group" title="Clear all">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-rose-500" />
                      </button>
                    </div>

                    <div className="max-h-[40vh] overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {recentSearches.map((search, index) => (
                          <div key={index} className="group flex items-center w-full rounded-xl border border-transparent hover:border-border hover:bg-muted/60 transition-all duration-200">
                            <button className="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-peacock-deep text-left" onClick={() => runTerm(search)} title={search}>
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-peacock-soft group-hover:text-peacock-deep transition-colors flex-shrink-0">
                                <SearchIcon className="w-3.5 h-3.5" />
                              </span>
                              <span className="flex-1 min-w-0 truncate">{search}</span>
                            </button>
                            <button onClick={() => handleDeleteSearch(search)} className="p-1.5 mr-1.5 flex-shrink-0 hover:bg-rose-50 rounded-md transition-all" title="Remove">
                              <X className="h-3 w-3 text-muted-foreground hover:text-rose-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </aside>
            )}

            <main className="flex-1 space-y-4 min-w-0">
              {hasSearched && !isLoading && !error && (
                <div className="flex items-center gap-3 flex-wrap bg-white border border-border rounded-2xl px-4 py-3 shadow-sm">
                  <p className="text-sm text-muted-foreground flex-1 min-w-[180px]">
                    {sortedResults.length > 0 ? (
                      <>
                        Found{" "}
                        <span className="font-semibold text-foreground">
                          {hasActiveFilters ? sortedResults.length : totalHits}
                        </span>{" "}
                        {(hasActiveFilters ? sortedResults.length : totalHits) === 1 ? "result" : "results"}
                        {searchQuery && (<>{" "}for{" "}<span className="font-semibold text-peacock-deep">&ldquo;{searchQuery}&rdquo;</span></>)}
                      </>
                    ) : (
                      <span>No results found</span>
                    )}
                  </p>

                  {sortedResults.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                        <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectVisible} className="w-3.5 h-3.5 accent-saffron cursor-pointer" />
                        Select visible
                      </label>

                      <select
                        value={sortKey}
                        onChange={(e) => { setSortKey(e.target.value as SortKey); setCurrentPage(1); }}
                        className="h-9 px-2.5 text-xs font-medium border border-border rounded-lg bg-white text-foreground focus:outline-none focus:border-peacock"
                      >
                        <option value="relevance">Sort: Relevance</option>
                        <option value="newest">Sort: Newest</option>
                        <option value="oldest">Sort: Oldest</option>
                        <option value="title">Sort: Title</option>
                      </select>

                      <select
                        value={String(pageSize)}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPageSize(v === "all" ? "all" : Number(v));
                          setCurrentPage(1);
                        }}
                        className="h-9 px-2.5 text-xs font-medium border border-border rounded-lg bg-white text-foreground focus:outline-none focus:border-peacock"
                      >
                        <option value="10">10 / page</option>
                        <option value="20">20 / page</option>
                        <option value="all">Show all</option>
                      </select>

                      <div className="relative" ref={exportRef}>
                        <Button
                          type="button"
                          onClick={() => setShowExport((s) => !s)}
                          className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-saffron to-peacock-deep hover:opacity-90 text-white text-xs shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export{selectedCount > 0 ? ` (${selectedCount})` : ""}
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>

                        {showExport && (
                          <div className="absolute right-0 mt-2 w-40 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border flex items-center gap-1.5">
                              <CheckSquare className="w-3 h-3" />
                              {selectedCount > 0 ? `${selectedCount} selected` : "All results"}
                            </div>
                            <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-peacock-soft" onClick={() => handleExport("excel")}>Excel</button>
                            <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-peacock-soft" onClick={() => handleExport("doc")}>DOC</button>
                            <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-peacock-soft" onClick={() => handleExport("pdf")}>PDF</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-100 flex items-center justify-center">
                    <X className="w-6 h-6 text-rose-600" />
                  </div>
                  <p className="text-sm font-medium text-rose-700">{error}</p>
                  <p className="text-xs text-rose-500 mt-1">Please try again in a moment.</p>
                </div>
              ) : hasSearched && isLoading ? (
                <div className="mt-4 w-full flex items-start justify-center py-6 select-none">
                  <div className="loader-card">
                    <div className="loader-mandala" aria-hidden="true">
                      <span className="loader-core" />
                    </div>
                    <strong className="block text-[0.94rem] text-foreground">
                      Mapping your query across the knowledge universe...
                    </strong>

                  </div>
                </div>
              ) : (
                <>
                  <SearchResults
                    results={pagedResults}
                    isLoading={isLoading}
                    allResults={allResults}
                    showExtras={true}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                  />
                  {hasSearched && !error && pageSize !== "all" && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        className="w-9 h-9 grid place-items-center rounded-lg border border-border bg-white text-foreground/70 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                        .map((p, idx, arr) => (
                          <span key={p} className="flex items-center gap-1.5">
                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                              <span className="text-muted-foreground text-sm px-1">…</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(p)}
                              className={`w-9 h-9 rounded-lg text-sm font-semibold ${p === safePage
                                  ? "bg-primary text-white"
                                  : "border border-border bg-white text-foreground/70 hover:bg-muted"
                                }`}
                            >
                              {p}
                            </button>
                          </span>
                        ))}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                        className="w-9 h-9 grid place-items-center rounded-lg border border-border bg-white text-foreground/70 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}
