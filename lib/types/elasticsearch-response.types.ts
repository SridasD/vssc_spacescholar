import { DocumentMetadata } from '@/lib/services/elasticsearch/types/search.types';

export interface ElasticsearchHit {
  _index: string;
  _id: string;
  _score: number | null; // _score can be null
  _source: {
    metadata: DocumentMetadata;
    url?: string;
  };
}

export interface ElasticsearchResponse<T = ElasticsearchHit> {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  hits: {
    total: number | { value: number; relation: string };
    max_score: number | null;
    hits: T[];
  };
}
