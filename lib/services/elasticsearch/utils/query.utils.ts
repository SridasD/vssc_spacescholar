import { SearchParams } from '../types/search.types';
import { searchConfig } from '../config/search.config';

export function buildSearchQuery({
  query,
  page = 0,
  size = searchConfig.defaultSize,
  fields = searchConfig.defaultFields,
}: SearchParams) {
  return {
    index: searchConfig.index,
    body: {
      from: page * size,
      size,
      query: {
        multi_match: {
          query,
          fields,
          type: 'most_fields',
          operator: 'or',
          fuzziness: 'AUTO',
        },
      },
    },
  };
}