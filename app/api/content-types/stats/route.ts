import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      "SELECT * FROM space_scholar.get_document_content_stats()"
    );

    // Public endpoint — only expose per-type totals, never the internal
    // pending/processing/failed breakdown (that stays behind /api/documents,
    // which requires auth).
    const contentStats = result.rows.map((row: any) => ({
      contentType: row.content_type,
      totalDocuments: parseInt(row.total_documents, 10) || 0,
    }));

    return NextResponse.json({ contentStats });
  } catch (error) {
    console.error("Error fetching content type stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch content type stats" },
      { status: 500 }
    );
  }
}
