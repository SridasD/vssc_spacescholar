import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/jwt";
import { getDocuments } from "@/services/documentService";

const ALLOWED_STATUSES = new Set([
  "ALL",
  "PENDING",
  "INPROGRESS",
  "COMPLETED",
  "FAILED",
]);

export async function GET(request: NextRequest) {
  try {
    // Never trust a client-supplied x-user-id header — verify the JWT directly.
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const MAX_PAGE = 100_000;
const MAX_LIMIT = 100;

const searchParams = request.nextUrl.searchParams;
const page = parseInt(searchParams.get("page") || "1", 10);
const limit = parseInt(searchParams.get("limit") || "10", 10);
const rawStatus = searchParams.get("status");
const search = (searchParams.get("search") || "").trim().slice(0, 200) || null;

if (
  !Number.isFinite(page) || page < 1 || page > MAX_PAGE ||
  !Number.isFinite(limit) || limit < 1 || limit > MAX_LIMIT
) {
  return NextResponse.json(
    { error: `Invalid pagination parameters (page: 1-${MAX_PAGE}, limit: 1-${MAX_LIMIT})` },
    { status: 400 }
  );
}

    // Validate status if provided
    let status: string | null = null;
    if (rawStatus) {
      const normalized = rawStatus.toUpperCase();
      if (!ALLOWED_STATUSES.has(normalized)) {
        return NextResponse.json(
          { error: "Invalid status filter" },
          { status: 400 }
        );
      }
      status = normalized === "ALL" ? null : normalized;
    }

    const documentsResponse = await getDocuments(page, limit, { status, search });

    return NextResponse.json({ ...documentsResponse });
  } catch (error) {
    console.error("Error in documents API:", error);
    return NextResponse.json(
      { error: "Failed to retrieve documents" },
      { status: 500 }
    );
  }
}