import { NextResponse } from "next/server";
import { searchClient } from "@/lib/services/elasticsearch/client/search.client";
import { SearchParams } from "@/lib/services/elasticsearch/types/search.types";

export async function POST(request: Request) {
  try { 
    const params: SearchParams = await request.json();

    // Check for empty query
    if (!params.query?.trim()) {
      console.log("Empty query, returning empty results");
      return NextResponse.json(
        {
          hits: {
            total: {
              value: 0,
              relation: "eq",
            },
            hits: [],
          },
        },
        { status: 500 }
      );
    }

    // Perform the search
    const results = await searchClient.search(params);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
