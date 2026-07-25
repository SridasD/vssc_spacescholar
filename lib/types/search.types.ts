import type { estypes } from "@elastic/elasticsearch"; // Import estypes for Elasticsearch types
export interface DocumentMetadata {
  doc_reference_id: number;
  content_type_id: number;
  biblio_number: string;
  barcode: string;
  author: string;
  additional_author?: string;
  doc_title: string;
  doc_published_year?: number | null;
  acc_date?: string;
  doc_subject_details?: Record<string, string>;
  doc_content_type: string;
  accession_no?: string | null;
  document_no?: string | null;
  doc_is_restricted?: boolean;

  
  
}

// Modify the SearchDocument interface
export interface SearchDocument extends estypes.SearchHit {
  _source: {
    metadata: DocumentMetadata;
    url?: string;
  };
  _index: string;
}

export interface SearchParams {
  index: string;
  query: any; // Replace with a more specific query type if available
}
export interface SearchResponse {
  hits: {
    total: {
      value: number;
      relation: string;
    };
    hits: SearchDocument[];
  };
}
