import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/jwt";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // ---- Auth ----
    // Never trust a client-supplied x-user-id header — verify the JWT directly.
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ---- Body ----
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const accessionNo = (body?.accession_no ?? "").toString().trim();
    if (!accessionNo) {
      return NextResponse.json(
        { error: "accession_no is required" },
        { status: 400 }
      );
    }

    // ---- Update only if currently FAILED ----
    // Returns the updated row so we can confirm something happened.
    const result = await query(
      `UPDATE space_scholar.documents
          SET status      = 'PENDING'::space_scholar.job_status_enum,
              error_id    = NULL,
              isprocessed = false
        WHERE accession_no = $1
          AND status = 'FAILED'
        RETURNING accession_no, status`,
      [accessionNo]
    );

    if (result.rowCount === 0) {
      // Row either doesn't exist or isn't currently FAILED.
      const check = await query(
        `SELECT status FROM space_scholar.documents WHERE accession_no = $1`,
        [accessionNo]
      );
      if (check.rowCount === 0) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          error: `Cannot retry: document is currently '${check.rows[0].status}', not FAILED`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: "Retry queued",
        accession_no: result.rows[0].accession_no,
        status: result.rows[0].status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Retry error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to retry document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}