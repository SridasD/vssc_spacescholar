import type { Client, ClientOptions } from '@elastic/elasticsearch';
import type { estypes } from '@elastic/elasticsearch'; // Import estypes for Elasticsearch types

export interface ElasticsearchConfig {
  node: string;
  scheme: string;
  port: number;
  apiKey?: string;
  index: string;
  defaultSize: number;
  defaultFields: string[];
  retryAttempts: number;
  retryDelay: number;
}

export interface ElasticsearchClientOptions extends ClientOptions {
  node: string;
  auth?: {
    apiKey: string;
  };
  tls?: {
    ca: Buffer; // Ensure you have a valid Buffer type for CA certificate
    rejectUnauthorized: boolean;
  };
}

export interface SearchOptions {
  query: string;
  page?: number; // Optional page number for pagination
  size?: number; // Optional size for number of results per page
  fields?: string[]; // Optional fields to return in search results
}

// Use estypes to get SearchResponse and SearchHit types
export type ESSearchResponse<T> = estypes.SearchResponse<T>;
export type SearchHit<T> = estypes.SearchHit<T>;

export type { Client }; // Export Client type as is
