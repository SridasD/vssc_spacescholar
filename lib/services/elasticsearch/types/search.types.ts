import type { estypes } from "@elastic/elasticsearch"; // Import estypes for Elasticsearch types

export interface SearchQueryConfig {
  index: string; // The name of the Elasticsearch index to search
  defaultSize: number; // Default number of results to return
  defaultFields: string[]; // Default fields to retrieve from documents
}

export interface SearchParams {
  index: string;
  query: string;
  docType?: string;
  yearFrom?: string;
  yearTo?: string;
  fields?: string[];
  page?: number;
  size?: number;
  sort?: {
    field: string;
    order: "asc" | "desc";
  };
}

export interface DocumentMetadata {
  doc_reference_id: number;
  content_type_id: number;
  biblio_number: string;
  barcode: string;
  author?: string;
  additional_author?: string | null;
  doc_title: string;
  doc_published_year?: number;
  acc_date?: string | null;
  doc_subject_details?: Record<string, string>;
  doc_content_type: string;
   doc_is_restricted?: boolean;

  // already added per your last change
  accession_no?: string | null;
  document_no?: string | null;

 
}

export interface SearchDocument {
  _index: string;
  _id: string;
  _score: number;
  _source: {
    metadata: DocumentMetadata;
    url?: string;
  };
}

export interface SearchResult {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped?: number;
    failed: number;
  };
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number;
    hits: SearchDocument[];
  };
}

export interface SearchResponse {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped?: number;
    failed: number;
  };
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number;
    hits: SearchDocument[];
  };
}
