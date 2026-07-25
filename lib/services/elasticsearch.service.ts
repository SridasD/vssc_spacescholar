import { Client } from '@elastic/elasticsearch';
import { elasticsearchConfig } from '@/lib/config/elasticsearch.config';
import { SearchResponse } from '@/lib/types/search.types';

class ElasticsearchService {
  private client: Client | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.client = new Client({
        node: elasticsearchConfig.node,
        auth: { apiKey: elasticsearchConfig.apiKey || '' },
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Elasticsearch client:', error);
      throw error;
    }
  }

  public async search(
    query: string,
    from = 0,
    size = elasticsearchConfig.defaultSize
  ): Promise<SearchResponse> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Elasticsearch client is not initialized');
    }

    try {
      const response = await this.client.search({
        index: elasticsearchConfig.index,
        body: {
          from,
          size,
          query: {
            multi_match: {
              query,
              fields: elasticsearchConfig.defaultFields,
              type: 'most_fields',
              operator: 'or',
              fuzziness: 'AUTO',
            },
          },
        },
      });

      return response as unknown as SearchResponse;
    } catch (error) {
      console.error('Search query failed:', error);
      throw error;
    }
  }
}

export const elasticsearchService = new ElasticsearchService();