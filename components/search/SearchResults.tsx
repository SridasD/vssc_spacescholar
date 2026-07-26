import { SearchDocument } from "@/lib/types/search.types";
import { SearchResult } from "./SearchResult";
import Chatbot from "@/components/chat/Chatbot";
import { useState } from "react";

interface SearchResultsProps {
  results: SearchDocument[];
  allResults: SearchDocument[];
  isLoading: boolean;
  showExtras?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function SearchResults({
  results,
  allResults,
  isLoading,
  showExtras = true,
  selectedIds,
  onToggleSelect,
}: SearchResultsProps) {
  const [globalChats, setGlobalChats] = useState<
    { id: string; title: string; summary: string; author?: string; docId?: string }[]
  >([]);

  const [pendingChats, setPendingChats] = useState<string[]>([]);

  if (isLoading) {
    return (
      <div className="w-full flex items-start justify-center py-6 select-none">
        <div className="loader-card">
          <div className="loader-mandala" aria-hidden="true">
            <span className="loader-core" />
          </div>
          <strong className="block text-[0.94rem] text-foreground">
            Mapping your query across the knowledge universe...
          </strong>
          <span className="block mt-1.5 text-[0.78rem] text-muted-foreground">
            The animated loader is designed to be informative, calm and unmistakably in progress.
          </span>
        </div>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No documents found in this galaxy. Try a different search query.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {results.map((doc) => (
          <SearchResult
            key={doc._id}
            document={doc}
            showExtras={showExtras}
            globalChats={globalChats}
            setGlobalChats={setGlobalChats}
            pendingChats={pendingChats}
            setPendingChats={setPendingChats}
            selected={selectedIds?.has(String(doc._id)) ?? false}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>

      <div className="fixed bottom-4 left-4 flex gap-4 overflow-x-auto max-w-[90%] z-50 bg-white/80 p-2 rounded-lg">
        {globalChats.map((chat, index) => (
          <Chatbot
            key={chat.id}
            docKey={chat.id}
            windowIndex={index}
            docId={chat.docId}
            docTitle={chat.title}
            author={chat.author}
            summary={chat.summary}
            onClose={() =>
              setGlobalChats((prev) => prev.filter((c) => c.id !== chat.id))
            }
          />
        ))}
      </div>
    </div>
  );
}