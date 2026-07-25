import { ElasticsearchConfig } from '@/lib/types/elasticsearch.types';

export const elasticsearchConfig: ElasticsearchConfig = {
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  scheme: process.env.ELASTICSEARCH_SCHEME || 'https',
  port: parseInt(process.env.ELASTICSEARCH_PORT || '9200', 10),
  apiKey: process.env.ELASTICSEARCH_API_KEY,
  index: 'document_staging_v2',
  defaultSize: 10,
  defaultFields: ['metadata.doc_title^4', 'cleaned_text^2'],
  retryAttempts: 3,
  retryDelay: 5000,
} as const;