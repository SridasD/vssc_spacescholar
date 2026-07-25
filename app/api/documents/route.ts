import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    // Never trust a client-supplied x-user-id header — verify the JWT directly.
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call the stored procedure to get overall document stats
    const overallStatsResult = await query(
      "SELECT * FROM space_scholar.get_overall_document_stats()"
    );

    // Call the stored procedure to get document content stats
    const contentStatsResult = await query(
      "SELECT * FROM space_scholar.get_document_content_stats()"
    );

    

    const overallStats = overallStatsResult.rows[0];
    const contentStats = contentStatsResult.rows; 
 

    return NextResponse.json({
      overallStats,
      contentStats, 
    });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching documents" },
      { status: 500 }
    );
  }
}
