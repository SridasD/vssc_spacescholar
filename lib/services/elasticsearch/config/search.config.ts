import { SearchQueryConfig } from '../types/search.types';

export const searchConfig: SearchQueryConfig = {
  index: 'document_demo_staging_v4',
  defaultSize: 10,
  defaultFields: ['metadata.doc_title^4', 'cleaned_text^2'],
} as const;