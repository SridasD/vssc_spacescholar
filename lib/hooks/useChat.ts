import { useState, useCallback } from "react";
import { ChatMessage, ChatParams } from "@/lib/types/chat.types";

interface UseChatProps {
  docId?: string;
}

export function useChat({ docId }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: ChatMessage = {
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const chatParams: ChatParams = {
          index: "document_demo_staging_v4", // Add the required index parameter
          query: content,
          // Add other required search parameters
          size: 10,
          ...(docId && {
            bool: {
              must: [{ term: { _id: docId } }],
            },
          }),
        };

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chatParams),
        });

        if (!response.ok) throw new Error("Failed to fetch response");

        const data = await response.json();

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: processSearchResults(data),
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: "Sorry, I encountered an error processing your request.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [docId]
  );

  return {
    messages,
    isLoading,
    sendMessage,
  };
}

function processSearchResults(data: any): string {
  // TODO: Implement result processing logic
  if (data.hits?.hits?.length > 0) {
    // Extract relevant information from search results
    const hits = data.hits.hits;
    return hits
      .map(
        (hit: any) =>
          `Found document: ${hit._source.metadata?.doc_title || "Untitled"}`
      )
      .join("\n");
  }
  return "No relevant documents found.";
}
