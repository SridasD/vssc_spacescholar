
import { NextResponse } from "next/server";
import { z } from "zod";
import { searchClient } from "@/lib/services/elasticsearch/client/search.client";

// .strict() rejects any unexpected fields (e.g. is_admin/role/index) instead
// of silently ignoring them — closes the API Mass Assignment finding.
// "index" is deliberately not an accepted client field: which index gets
// searched is always decided server-side from SEARCH_INDEX below.
const searchSchema = z
  .object({
    query: z.string().trim().max(1000).optional(),
    page: z.number().int().min(0).max(100_000).optional(),
    size: z.number().int().min(1).max(100).optional(),
    fields: z.array(z.string()).max(50).optional(),
    sort: z
      .object({ field: z.string(), order: z.enum(["asc", "desc"]) })
      .optional(),
  })
  .strict();

const EMPTY_RESULT = {
  took: 0,
  timed_out: false,
  _shards: { total: 0, successful: 0, failed: 0 },
  hits: { total: { value: 0, relation: "eq" }, max_score: 0, hits: [] },
};

export async function POST(request: Request) {
  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = searchSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid search request", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const payload = parsed.data;

  const query = (payload.query ?? "").trim();
  const page = payload.page ?? 0;
  const size = payload.size ?? 10;
  const fields = payload.fields;
  const sort = payload.sort;
  const index = process.env.SEARCH_INDEX;

  if (!query) {
    return NextResponse.json(EMPTY_RESULT, { status: 200 });
  }

  try {
    const results = await searchClient.search({
      query,
      page,
      size,
      fields,
      sort,
      index,
    } as any);

    try {
      const hits: any[] = results?.hits?.hits ?? [];
      const sample = hits.slice(0, 5);
      const union = new Set<string>();
      sample.forEach((h) => {
        const md = h?._source?.metadata || {};
        Object.keys(md).forEach((k) => union.add(k));
      });
      console.log("[/api/search] metadata keys (first up to 5 hits):", Array.from(union).sort());
    } catch {}

    return NextResponse.json(results, { status: 200 });
  } catch (err: any) {
    const status = err?.statusCode || err?.status || 502;
    const message = err?.message || "Failed to perform search";
    const detail = err?.body || err?.stack || null;

    // Log the full detail (may include stack traces/upstream bodies) server-side
    // only — never return it to the client.
    console.error("[/api/search] upstream error:", { status, message, detail });
    return NextResponse.json(
      { message: "Failed to perform search", isSearchError: true },
      { status }
    );
  }
}
