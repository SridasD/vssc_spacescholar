import { useState } from "react";
import { SearchDocument, SearchResponse } from "@/lib/types/search.types"; 

export function useSearch() {
  const [results, setResults] = useState<SearchDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalHits, setTotalHits] = useState(0);
  const [allResults, setAllResults] = useState<SearchDocument[]>([]);

  const searchDocuments = async (
    params: {
      query: string;
      type?: string;
      docType?: string;
      yearFrom?: string;
      yearTo?: string;
    },
    page = 0
  ) => {
    if (!params.query.trim()) {
      setResults([]);
      setTotalHits(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const isTitleSearch = params.type === "title";
      const response = await fetch(
        isTitleSearch
          ? `/api/title-search?query=${params.query}`
          : "/api/search",
        {
          method: isTitleSearch ? "GET" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: isTitleSearch
            ? undefined
            : JSON.stringify({
                query: params.query,
                page,
              }),
        }
      );

     if (!response.ok) {
  let raw = '';
  try { raw = await response.text(); } catch {}
  let detail = raw;
  try {
    const j = JSON.parse(raw);
    detail = j?.detail || j?.message || raw;
  } catch {}

  let errorMessage = "Failed to perform search";
  switch (response.status) {
    case 404: errorMessage = "Search endpoint not found"; break;
    case 429: errorMessage = "Too many requests. Please try again later."; break;
    case 503: errorMessage = "Search service is unavailable. Please try again later."; break;
    default:
      errorMessage = `Search API ${response.status}: ${detail || "Unknown server error"}`;
  }

  console.error("Search error response:", {
    status: response.status,
    detail,
    request: { ...params, page },
  });
  throw new Error(errorMessage);
}


      const data = await response.json();
    try {
  const hits = isTitleSearch
    ? data?.hits || []
    : data?.hits?.hits || [];
  if (hits.length === 0) {
    console.log('[useSearch] no results; metadata keys: []');
  } else {
    const sample = hits.slice(0, 5);
    const union = new Set<string>();
    sample.forEach((h: any) => {
      const md = h?._source?.metadata || {};
      Object.keys(md).forEach(k => union.add(k));
    });
    console.log(
      '[useSearch] metadata keys seen (first up to 5 hits):',
      Array.from(union).sort()
    );

    const m0 = sample[0]._source?.metadata as any;
    console.log('[useSearch] first hit values:', {
      accession_no: m0?.accession_no ?? null,
      document_no: m0?.document_no ?? null,
      doc_published_year: m0?.doc_published_year ?? null,
    });
  }
} catch {
  // ignore logging errors
}
      if (isTitleSearch) {
        const formatted = (data.hits || []).map((item: any) => ({
          _index: "title_search",
          _id: item.doc_reference_id?.toString() || "",
          _score: 1,
          _source: {
            metadata: item,
          },
        }));

        setResults(formatted);
        setAllResults(formatted);
        setTotalHits(formatted.length);
      } else {
        setResults(data.hits.hits);
        setAllResults(data.hits.hits);
        setTotalHits(data.hits.total.value);
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        console.error(
          `Connection to /api/search could not be established. Error: ${err.message}`
        );
        setError(
          "Connection error: Could not connect to the search service. Please check your network or try again later."
        );
      } else if (err instanceof Error) {
        console.error("Search error:", err.message);
        setError(err.message);
      } else {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred while searching.");
      }
      setResults([]);
      setTotalHits(0);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    results,
    allResults,        // 🔥 new
    setResults, 
    isLoading,
    error,
    totalHits,
    searchDocuments,
  };
}
