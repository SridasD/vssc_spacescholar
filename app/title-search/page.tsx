"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { SearchResults } from "@/components/search/SearchResults";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { MenuBar } from "@/components/layout/MenuBar";
import {
  exportToExcel,
  exportToPDF,
  exportToDoc,
} from "@/lib/utils/exportResults";

const RECENT_KEY = "titleRecentSearches";

export default function TitleSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [results, setResults] = useState<any[]>([]);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [tempDocType, setTempDocType] = useState("");
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [tempYearFrom, setTempYearFrom] = useState("");
  const [tempYearTo, setTempYearTo] = useState("");

  const [docType, setDocType] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_KEY);
    if (stored) setRecentSearches(JSON.parse(stored));
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

  const fetchTitle = async (term: string) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setSelectedIds(new Set()); 
    try {
      const res = await fetch(`/api/title-search?query=${encodeURIComponent(term)}`);
      const data = await res.json();
      const allHits = Array.isArray(data)
        ? data.flatMap((group: any) =>
            (group?.hits || []).map((hit: any) => ({
              _id: hit?.id || group?.id,
              _source: { metadata: hit?.payload?.metadata || {} },
            }))
          )
        : [];
      setResults(allHits);
      setAllResults(allHits);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch title results");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      await fetchTitle(searchQuery);
      const updated = [
        searchQuery,
        ...recentSearches.filter((s) => s !== searchQuery),
      ].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
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
    fetchTitle(term).catch(() => {
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
      });
    });
  };

  const handleDeleteSearch = (searchToDelete: string) => {
    const updated = recentSearches.filter((s) => s !== searchToDelete);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    toast({ title: "Search Removed", description: "The search has been removed from history." });
  };

  const handleClearAllSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_KEY);
    toast({ title: "History Cleared", description: "All search history has been cleared." });
  };

  const applyFilters = (overrides?: { docType?: string; yearFrom?: string; yearTo?: string }) => {
    const effDocType = overrides?.docType ?? tempDocType;
    const effYearFrom = overrides?.yearFrom ?? tempYearFrom;
    const effYearTo = overrides?.yearTo ?? tempYearTo;

    let filtered = allResults;
    if (effDocType) filtered = filtered.filter((item) => item._source?.metadata?.doc_content_type === effDocType);
    if (effYearFrom) filtered = filtered.filter((item) => Number(item._source?.metadata?.doc_published_year) >= Number(effYearFrom));
    if (effYearTo) filtered = filtered.filter((item) => Number(item._source?.metadata?.doc_published_year) <= Number(effYearTo));
    setResults(filtered);
  };

  const clearFilters = () => {
    setTempDocType(""); setTempYearFrom(""); setTempYearTo("");
    setDocType(""); setYearFrom(""); setYearTo("");
    setResults(allResults);
  };

  const removeDocTypeFilter = () => { setTempDocType(""); setDocType(""); applyFilters({ docType: "" }); };
  const removeYearFilter = () => { setTempYearFrom(""); setTempYearTo(""); setYearFrom(""); setYearTo(""); applyFilters({ yearFrom: "", yearTo: "" }); };

  const hasActiveFilters = !!(docType || yearFrom || yearTo);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allSelected = results.length > 0 && results.every((r) => selectedIds.has(String(r._id)));
  const toggleSelectAll = () => {
    setSelectedIds(() => (allSelected ? new Set() : new Set(results.map((r) => String(r._id)))));
  };

  const handleExport = (type: "excel" | "pdf" | "doc") => {
    const chosen = results.filter((r) => selectedIds.has(String(r._id)));
    const data = chosen.length ? chosen : results;
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
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <MenuBar />

      <div className="relative flex-1 flex overflow-hidden bg-white">
        {/* Pink ambient canvas */}
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background:
              "#ffffff",
          }}
        />

        <div className="relative z-10 flex w-full">
          <div className="container mx-auto px-4 py-6 flex gap-6">

            {showAside && (
            <aside className="w-72 hidden md:block space-y-4">

              {showRefine && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden sticky top-6 shadow-[0_1px_0_rgba(13,20,36,0.02),0_18px_40px_-24px_rgba(13,20,36,0.16)]">
                <div className="px-4 py-3.5 flex items-center gap-2 bg-gradient-to-r from-pink-50 to-blue-50 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-white ring-1 ring-slate-200 flex items-center justify-center">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-pink-600" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-800">Refine Results</h2>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                      <FileType className="w-3.5 h-3.5 text-slate-500" />
                      Collection Type
                    </label>
                    <select
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm text-slate-700 focus:border-pink-500 focus:outline-none bg-white transition-colors"
                      value={tempDocType}
                      onChange={(e) => setTempDocType(e.target.value)}
                    >
                      <option value="">All Collections</option>
                      {docTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Published Year
                    </label>
                    <div className="flex gap-2 items-center">
                      <select
                        className="flex-1 px-2.5 py-2 border-2 border-slate-200 rounded-lg text-sm text-slate-700 focus:border-pink-500 focus:outline-none bg-white transition-colors"
                        value={tempYearFrom}
                        onChange={(e) => setTempYearFrom(e.target.value)}
                      >
                        <option value="">From</option>
                        {years.map((year) => (
                          <option key={String(year)} value={String(year)}>{year}</option>
                        ))}
                      </select>
                      <span className="text-slate-400 text-sm">—</span>
                      <select
                        className="flex-1 px-2.5 py-2 border-2 border-slate-200 rounded-lg text-sm text-slate-700 focus:border-pink-500 focus:outline-none bg-white transition-colors"
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

                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button" variant="outline"
                      className="flex-1 border-2 border-slate-200 hover:bg-slate-50 rounded-lg"
                      onClick={clearFilters}
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 bg-gradient-to-r from-pink-600 to-blue-600 hover:from-pink-700 hover:to-blue-700 text-white rounded-lg shadow-sm"
                      onClick={() => {
                        setDocType(tempDocType);
                        setYearFrom(tempYearFrom);
                        setYearTo(tempYearTo);
                        applyFilters();
                      }}
                    >
                      Apply
                    </Button>
                  </div>

                  {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {docType && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 border border-pink-200 text-pink-700 text-xs rounded-full">
                          <FileType className="w-3 h-3" />
                          {docType}
                          <button onClick={removeDocTypeFilter} className="ml-0.5 hover:bg-pink-100 rounded-full p-0.5">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      )}
                      {(yearFrom || yearTo) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 border border-pink-200 text-pink-700 text-xs rounded-full">
                          <Calendar className="w-3 h-3" />
                          {yearFrom || "…"} – {yearTo || "…"}
                          <button onClick={removeYearFilter} className="ml-0.5 hover:bg-pink-100 rounded-full p-0.5">
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
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_1px_0_rgba(13,20,36,0.02),0_18px_40px_-24px_rgba(13,20,36,0.16)]">
                  <div className="px-4 py-3.5 flex items-center justify-between bg-gradient-to-r from-pink-50 to-blue-50 border-b border-slate-100">
                    <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                      <div className="w-7 h-7 rounded-lg bg-white ring-1 ring-slate-200 flex items-center justify-center">
                        <History className="w-3.5 h-3.5 text-pink-600" />
                      </div>
                      Recent Searches
                    </h2>
                    <button onClick={handleClearAllSearches} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors group" title="Clear all">
                      <Trash2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-500" />
                    </button>
                  </div>

                  <ScrollArea className="max-h-[40vh]">
                    <div className="p-2 space-y-1">
                      {recentSearches.map((search, index) => (
                        <div key={index} className="group flex items-center rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all duration-200">
                          <button className="flex-1 flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-pink-700 text-left truncate min-w-0" onClick={() => runTerm(search)}>
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-pink-100 group-hover:text-pink-700 transition-colors flex-shrink-0">
                              <SearchIcon className="w-3.5 h-3.5" />
                            </span>
                            <span className="truncate">{search}</span>
                          </button>
                          <button onClick={() => handleDeleteSearch(search)} className="p-1.5 mr-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-md transition-all" title="Remove">
                            <X className="h-3 w-3 text-slate-400 hover:text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </aside>
            )}

                      <main className="flex-1 space-y-6 min-w-0">
              {/* Intro line only — no "Search" heading */}
              <p className="text-[16px] font-medium text-slate-700">
Search specifically within document titles across our repository of scholarly publications and research documents.

</p>
             
<div className="rounded-2xl p-[2.5px] bg-gradient-to-r from-pink-500 via-fuchsia-500 to-sky-500
                shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/40
                focus-within:shadow-fuchsia-500/40 transition-shadow duration-300">
  <form
    onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
    className="flex gap-2 items-stretch rounded-[14px] bg-white p-2"
  >
    <div className="relative flex-1 group">
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-400 group-focus-within:text-pink-600 transition-colors pointer-events-none" />
      <Input
        placeholder="Search Documents"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        className="pl-12 pr-10 h-11 text-base text-slate-900 placeholder:text-slate-400 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {searchQuery && (
        <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-md transition-colors">
          <X className="h-4 w-4 text-slate-400" />
        </button>
      )}
    </div>

    <Button
      type="submit"
      disabled={isLoading || !searchQuery.trim()}
      className="h-11 px-6 text-white font-semibold rounded-xl transition-all
                 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-blue-600
                 hover:from-pink-700 hover:via-fuchsia-700 hover:to-blue-700
                 shadow-md shadow-fuchsia-500/40 hover:shadow-fuchsia-500/60
                 hover:scale-[1.02] active:scale-95
                 disabled:saturate-[0.9] disabled:opacity-90 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><SearchIcon className="w-4 h-4 mr-2" />Search</>)}
    </Button>
  </form>
</div>

              {hasSearched && !isLoading && !error && (
                <div className="flex items-center gap-4 flex-wrap">
                  <p className="text-sm text-slate-600">
                    {results.length > 0 ? (
                      <>
                        Found{" "}
                        <span className="font-semibold text-slate-900">{results.length}</span>{" "}
                        {results.length === 1 ? "result" : "results"}
                        {searchQuery && (<>{" "}for{" "}<span className="font-semibold text-pink-700">&ldquo;{searchQuery}&rdquo;</span></>)}
                        {allResults.length > results.length && (
                          <span className="text-slate-400 ml-2">({results.length} shown, filtered)</span>
                        )}
                      </>
                    ) : (
                      <span>No results found</span>
                    )}
                  </p>

                  {results.length > 0 && (
                    <div className="flex items-center gap-3">
                      {/* Export dropdown — sits right next to the count, on the left */}
                      <div className="relative" ref={exportRef}>
                        <Button
                          type="button"
                          onClick={() => setShowExport((s) => !s)}
                          className="h-9 px-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-blue-600 hover:from-pink-700 hover:to-blue-700 text-white text-sm shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          Export{selectedCount > 0 ? ` (${selectedCount})` : ""}
                          <ChevronDown className="w-4 h-4" />
                        </Button>

                        {showExport && (
                          <div className="absolute left-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100 flex items-center gap-1.5">
                              <CheckSquare className="w-3 h-3" />
                              {selectedCount > 0 ? `${selectedCount} selected` : "All results"}
                            </div>
                            <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50" onClick={() => handleExport("excel")}>Excel</button>
                            <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50" onClick={() => handleExport("doc")}>DOC</button>
                            <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50" onClick={() => handleExport("pdf")}>PDF</button>
                          </div>
                        )}
                      </div>

                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4 accent-pink-600 cursor-pointer" />
                        Select all
                        {selectedCount > 0 && <span className="text-pink-700 font-medium">({selectedCount})</span>}
                      </label>
                    </div>
                  )}
                </div>
              )}

              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-red-700">{error}</p>
                  <p className="text-xs text-red-500 mt-1">Please try again in a moment.</p>
                </div>
              ) : hasSearched && isLoading ? (
                <div className="mt-8 w-full flex flex-col items-center justify-center py-12 select-none">
                  {/* animated illustration — save searching-docs.svg to /public/images/ */}
                  <img
                    src="/images/searching-docs.svg"
                    alt="Searching documents…"
                    className="w-[320px] max-w-full h-auto"
                  />
                  <p className="mt-2 text-sm font-semibold tracking-wide bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                    Searching through the cosmos<span className="ss-dots" />
                  </p>
                  <style dangerouslySetInnerHTML={{ __html: `
                    .ss-dots::after { content: ""; animation: ssDots 1.4s steps(4,end) infinite; }
                    @keyframes ssDots { 0%{content:"";} 25%{content:".";} 50%{content:"..";} 75%,100%{content:"...";} }
                  ` }} />
                </div>
              ) : (
                <SearchResults
                  results={results}
                  isLoading={isLoading}
                  allResults={allResults}
                  showExtras={true}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}