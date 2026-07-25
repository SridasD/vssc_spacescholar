

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({
        hits: [],
      });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/title-search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },     
        body: JSON.stringify({
          query,
        }),

      }
    );
    if (!response.ok) {
      const errorText = await response.text();

      console.error("TITLE SEARCH BACKEND ERROR:");
      console.error(errorText);

      if (
        response.status === 404 ||
        errorText.includes("No results found")
      ) {
        return NextResponse.json([]);
      }

      return NextResponse.json(
        { error: "Failed to fetch title search results" },
        { status: response.status }
      );
    }





    const data = await response.json();

    console.log("TITLE SEARCH API RESPONSE:", data);

    return NextResponse.json(data);

  } catch (error) {
    console.error("Title search error:", error);

    return NextResponse.json(
      { error: "Failed to perform title search" },
      { status: 500 }
    );
  }
}

