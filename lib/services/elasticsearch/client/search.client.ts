
import type {
  SearchParams,
  SearchResult,
  DocumentMetadata,
  SearchDocument,
} from "../types/search.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type QdrantHit = {
  id: string;
  score: number;
  payload: {
    page_content?: string;
    metadata: DocumentMetadata;
    url?: string;
  };
  vector?: unknown;
  shard_key?: unknown;
  order_value?: unknown;
};

type QdrantGroup = {
  id: string | null;
  hits: QdrantHit[];
  lookup: unknown;
};

export class SearchClient {
  private static instance: SearchClient | null = null;

  private constructor() {}

  public static getInstance(): SearchClient {
    if (!SearchClient.instance) {
      SearchClient.instance = new SearchClient();
    }
    return SearchClient.instance;
  }

  public async search(params: SearchParams): Promise<SearchResult> {
    try {
      const requestBody = {
        query: params.query,
        docType: params.docType,
        yearFrom: params.yearFrom,
        yearTo: params.yearTo,
      };
      

      console.log(`Requesting URL ::  ${API_BASE_URL}/search`);

      const response = await fetch(`${API_BASE_URL}/search`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("data from search api-----", data);

      const isEsStyle =
        !Array.isArray(data) &&
        data &&
        typeof data === "object" &&
        (data as any).hits &&
        Array.isArray((data as any).hits.hits);

      if (isEsStyle) {
        const esData = data as any;

        return {
          took: esData.took ?? 0,
          timed_out: esData.timed_out ?? false,
          _shards: {
            total: esData._shards?.total ?? 1,
            successful: esData._shards?.successful ?? 1,
            failed: esData._shards?.failed ?? 0,
            skipped: esData._shards?.skipped ?? 0,
          },
          hits: {
            total: this.getTotalHits(esData.hits?.total),
            max_score: esData.hits?.max_score ?? 0,
            hits: this.processSearchHits(esData.hits.hits),
          },
        };
      }

      if (Array.isArray(data)) {
        const groups = data as QdrantGroup[];

        const allHits: QdrantHit[] = groups.flatMap((g) => g?.hits ?? []);

        console.log("flattened hits from Qdrant api -----", allHits);

        const esLikeHits = allHits.map((hit) => ({
          _index: "qdrant_index", 
          _id: hit.id,
          _score: hit.score ?? 0,
          _source: {
            metadata: hit.payload?.metadata,
            url: hit.payload?.url, 
          },
        }));

        const processedHits = this.processSearchHits(esLikeHits);
        const maxScore =
          processedHits.length > 0
            ? Math.max(...processedHits.map((h) => h._score ?? 0))
            : 0;

        return {
          took: 0, 
          timed_out: false,
          _shards: {
            total: 1,
            successful: 1,
            failed: 0,
            skipped: 0,
          },
          hits: {
            total: {
              value: processedHits.length,
              relation: "eq",
            },
            max_score: maxScore,
            hits: processedHits,
          },
        };
      }

      console.error("Unexpected search response format:", data);
      return {
        took: 0,
        timed_out: false,
        _shards: {
          total: 0,
          successful: 0,
          failed: 0,
          skipped: 0,
        },
        hits: {
          total: { value: 0, relation: "eq" },
          max_score: 0,
          hits: [],
        },
      };
    } catch (error) {
      this.handleSearchError(error);
    }
  }
  public async searchByTitle(query: string) {
    try {
      console.log(`Requesting URL :: ${API_BASE_URL}/title-search`);

      const response = await fetch(
        `${API_BASE_URL}/title-search?query=${query}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error("Title search error:", error);
      throw error;
    }
  }
  private getTotalHits(total: any): { value: number; relation: string } {
    if (!total) {
      return { value: 0, relation: "eq" };
    }
    if (typeof total === "number") {
      return { value: total, relation: "eq" };
    }
    return {
      value: total.value ?? 0,
      relation: total.relation ?? "eq",
    };
  }

  private processSearchHits(hits: any[]): SearchDocument[] {
    return hits
      .filter(
        (
          hit
        ): hit is {
          _source: { metadata: DocumentMetadata; url?: string };
          _index: string;
          _id: string;
          _score: number;
        } =>
          Boolean(hit._source?.metadata) &&
          this.isValidMetadata(hit._source.metadata) &&
          typeof hit._index === "string"
      )
      .map(
        (hit): SearchDocument => ({
          _index: hit._index,
          _id: hit._id,
          _score: hit._score ?? 0,
          _source: {
            metadata: hit._source.metadata,
            url: hit._source.url,
          },
        })
      );
  }

  private isValidMetadata(metadata: unknown): metadata is DocumentMetadata {
    if (!metadata || typeof metadata !== "object") {
      return false;
    }

    const requiredFields: Array<keyof DocumentMetadata> = [
      "doc_reference_id",
      "content_type_id",
      "biblio_number",
      "barcode",
      "author",
      "doc_title",
      "doc_content_type",
      "accession_no",
      "document_no",
      "doc_is_restricted",
    ];

    return requiredFields.every(
      (field) => field in (metadata as Record<string, unknown>)
    );
  }

  private handleSearchError(error: unknown): never {
    if (error instanceof Error) {
      throw {
        isSearchError: true,
        message: `Search operation failed: ${error.message}`,
        statusCode: error.message.includes("404") ? 404 : 500,
      };
    }
    throw {
      isSearchError: true,
      message: "Search operation failed: Unknown error occurred",
      statusCode: 500,
    };
  }
}

export const searchClient = SearchClient.getInstance();
