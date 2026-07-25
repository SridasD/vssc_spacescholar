import { SearchParams } from "@/lib/services/elasticsearch/types/search.types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  query: string;
  docId?: string;
}

export interface ChatResponse {
  response: string;
  error?: string;
}

export type ChatParams = SearchParams;
