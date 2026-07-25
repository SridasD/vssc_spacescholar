import { getElasticsearchClient } from "./client";
import { elasticsearchConfig } from "@/lib/config/elasticsearch.config";
import {
  SearchParams,
  SearchDocument,
  SearchResponse,
} from "./types/search.types";

export class SearchService {
  private static instance: SearchService;
  private client = getElasticsearchClient();

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  public async search({
    query,
    fields = elasticsearchConfig.defaultFields,
  }: SearchParams): Promise<{ total: number; hits: SearchDocument[] }> {
    try {
      const response = await this.client.search<{
        metadata: any;
        url?: string;
      }>({
        index: elasticsearchConfig.index,
        body: {
          query: {
            multi_match: {
              query,
              fields,
              type: "most_fields",
              operator: "or",
              fuzziness: "AUTO",
              minimum_should_match: "70%",
            },
          },
          highlight: {
            fields: fields.reduce(
              (acc, field) => ({
                ...acc,
                [field]: {
                  pre_tags: ["<strong>"],
                  post_tags: ["</strong>"],
                  number_of_fragments: 3,
                },
              }),
              {}
            ),
          },
          track_total_hits: true,
        },
      });
      // Handle total hits correctly
      // Safe handling of total with all possible cases
      let total = 0;
      if (response.hits.total) {
        if (typeof response.hits.total === "number") {
          total = response.hits.total;
        } else if ("value" in response.hits.total) {
          total = response.hits.total.value;
        }
      }
      return {
        total,
        hits: response.hits.hits as SearchDocument[],
      };
    } catch (error) {
      console.error("Search error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "An error occurred during search"
      );
    }
  }
}

export const searchService = SearchService.getInstance();
