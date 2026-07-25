import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const result = await query(
      "SELECT  content_type_id as id,content_type  FROM space_scholar.master_content_type where is_active=true ORDER BY content_type ASC"
    );
    // Wrapped in an object rather than returned as a bare array — a
    // top-level JSON array response is the classic shape exploitable by
    // JavaScript Hijacking (AppScan flagged this exact endpoint).
    return NextResponse.json({ contentTypes: result.rows });
  } catch (error) {
    console.error("Error fetching content types:", error);
    return NextResponse.json(
      { error: "Failed to fetch content types" },
      { status: 500 }
    );
  }
}
