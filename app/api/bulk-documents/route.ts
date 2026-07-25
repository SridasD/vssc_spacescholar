import { NextRequest, NextResponse } from "next/server";
import { getClient, query } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/jwt";

export const runtime = "nodejs";

const SERVER_ROW_CAP = 10_000;
const UPLOAD_ROOT = "uploaded_files";
const BOOKS_CONTENT_TYPE_ID = 5;

/** ===== Types ===== */
type BulkRowIn = {
  accession_no?: string | null;
  document_no?: string | null;
  barcode?: string | null;

  doc_title: string;
  doc_published_year: string;

  author?: string | null;
  addl_author?: string | null;
  bibiloNumber?: string | null;
  is_restricted?: boolean | string | null;
  contentType?: number | string | null;

  doc_type_name?: string | null;

  doc_subject_dtls?: any;
  extras?: Record<string, any> | null;
};

function isValidYear(y?: string | null) {
  return !!(y && /^\d{4}$/.test(String(y).trim()) && Number(y) >= 1800);
}
function normalizeBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}
const normalizeKey = (k: string) =>
  (k || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
function pickByAliases(
  obj: Record<string, any> | null | undefined,
  aliases: string[]
): any {
  if (!obj) return undefined;
  const normMap = new Map<string, any>();
  for (const [k, v] of Object.entries(obj)) normMap.set(normalizeKey(k), v);
  for (const alias of aliases) if (normMap.has(alias)) return normMap.get(alias);
  return undefined;
}

const Aliases = {
  author: ["author", "authors"],
  addlAuthor: [
    "additionalauthor",
    "additional_author",
    "additional author",
    "addl_author",
    "coauthor",
    "co_author",
  ],
  isRestricted: [
    "isrestricted",
    "is_restricted",
    "is restricted",
    "restricted",
  ],
  additionalDetails: [
    "additionaldetails",
    "additional_details",
    "additional details",
    "doc_subject_dtls",
    "subjectdetails",
    "subject_details",
  ],
  biblioNumber: [
    "bibilonumber",
    "biblio_number",
    "biblionumber",
    "biblio no",
    "biblio",
    "bibilo_number",
    "bibilo",
  ],
  documentNo: [
    "documentno",
    "document_no",
    "document no",
    "docno",
    "doc_no",
  ],
  legacyAccessionFromBarcode: ["barcode"],
  documentType: ["documenttype", "document_type", "document type"],
};

/** ===== Path helpers — must stay identical to single-upload route ===== */
function slugifyFolder(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function sanitizeAccession(s: string): string {
  return (s || "").toString().trim().replace(/[^a-zA-Z0-9_-]+/g, "");
}

async function loadContentTypeNameMap(): Promise<Map<number, string>> {
  const { rows } = await query(
    `SELECT content_type_id, content_type
       FROM space_scholar.master_content_type
      WHERE is_active = true`
  );
  const map = new Map<number, string>();
  for (const r of rows) {
    map.set(Number(r.content_type_id), String(r.content_type));
  }
  return map;
}

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
    } catch (e) {
      console.error("[bulk-api] JSON parse error:", e);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    /* ===== DUPLICATE CHECK (no insert) ===== */
    if (
      (body?.mode === "check_accession" && Array.isArray(body?.accessionNos)) ||
      (body?.mode === "check" && Array.isArray(body?.barcodes))
    ) {
      try {
        const raw =
          (Array.isArray(body?.accessionNos) && body.accessionNos) ||
          (Array.isArray(body?.barcodes) && body.barcodes) ||
          [];
        const normalized = Array.from(
          new Set(
            raw
              .map((s: any) => (s ?? "").toString().trim().toLowerCase())
              .filter(Boolean)
          )
        );
        if (normalized.length === 0) {
          return NextResponse.json(
            { exists: [], exists_detail: [] },
            { status: 200 }
          );
        }

        const client = await getClient();
        const { rows } = await client.query<{ accession_no: string }>(
          `SELECT accession_no FROM space_scholar.documents 
           WHERE LOWER(TRIM(accession_no)) = ANY($1::text[])`,
          [normalized]
        );
        const existsLower = new Set(
          rows.map((r) =>
            (r.accession_no ?? "").toString().trim().toLowerCase()
          )
        );
        return NextResponse.json(
          {
            exists: Array.from(existsLower),
            exists_detail: rows.map((r) => r.accession_no),
          },
          { status: 200 }
        );
      } catch (e: any) {
        console.error("[bulk-api check_accession] error:", e?.message || e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
      }
    }

    // ---- Insert path ----
    const rows: BulkRowIn[] = Array.isArray(body?.rows) ? body.rows : [];
    if (rows.length === 0)
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    const limited = rows.slice(0, SERVER_ROW_CAP);

    const prepared = limited.map((r, idx) => {
      const accession_no = (r.accession_no ?? r.barcode ?? "").toString();
      const err: string[] = [];
      if (!r.doc_title?.trim()) err.push("Title is required");
      if (!isValidYear(r.doc_published_year))
        err.push("Year must be YYYY and ≥ 1800");
      if (!accession_no?.trim()) err.push("Accession No. is required");
      const contentType =
        r.contentType != null && r.contentType !== ""
          ? Number(r.contentType)
          : 5;
      return {
        index: idx,
        input: { ...r, accession_no, contentType },
        errors: err,
      };
    });

    const invalid = prepared.filter((p) => p.errors.length > 0);
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed for some rows",
          invalid: invalid.map((p) => ({
            index: p.index,
            errors: p.errors,
          })),
        },
        { status: 400 }
      );
    }

    const accessionOriginal = prepared.map(
      (p) => p.input.accession_no as string
    );
    const accessionLower = accessionOriginal.map((b) =>
      (b || "").trim().toLowerCase()
    );
    const indicesByAcc = new Map<string, number[]>();
    accessionLower.forEach((b, i) => {
      const arr = indicesByAcc.get(b) || [];
      arr.push(i);
      indicesByAcc.set(b, arr);
    });
    const intraDupList = Array.from(indicesByAcc.entries())
      .filter(([, idxs]) => idxs.length > 1)
      .map(([accLower, indices]) => ({
        accession_no: accessionOriginal[indices[0]],
        indices,
      }));
    if (intraDupList.length > 0) {
      return NextResponse.json(
        {
          error: "Duplicate accession numbers in upload",
          duplicates_in_payload: intraDupList,
        },
        { status: 400 }
      );
    }

    const client = await getClient();
    try {
      const { rows: existing } = await client.query<{ accession_no: string }>(
        `SELECT accession_no FROM space_scholar.documents WHERE LOWER(TRIM(accession_no)) = ANY($1::text[])`,
        [Array.from(new Set(accessionLower))]
      );
      if (existing.length > 0) {
        const existingLowerSet = new Set(
          existing.map((r) => String(r.accession_no).trim().toLowerCase())
        );
        const duplicates_detail = Array.from(existingLowerSet).map(
          (accLower) => ({
            accession_no:
              accessionOriginal[accessionLower.indexOf(accLower)],
            indices: indicesByAcc.get(accLower) || [],
          })
        );
        return NextResponse.json(
          {
            error: "Duplicate accession numbers exist in DB",
            duplicates: duplicates_detail.map((d) => d.accession_no),
            duplicates_detail,
          },
          { status: 409 }
        );
      }

      const ctNameMap = await loadContentTypeNameMap();

      await client.query("BEGIN");
      await client.query(`SET LOCAL statement_timeout = '60s'`);
      const todayISO = new Date().toISOString().split("T")[0];

      const insertValues = prepared.map((p) => {
        const r = p.input;
        const extras = (r.extras ?? {}) as Record<string, any>;

        const author =
          r.author ?? pickByAliases(extras, Aliases.author) ?? null;
        const addl_author =
          r.addl_author ?? pickByAliases(extras, Aliases.addlAuthor) ?? null;

        const biblioFromExtras = pickByAliases(extras, Aliases.biblioNumber);
        const biblioText = (
          r.bibiloNumber ??
          (biblioFromExtras !== undefined ? biblioFromExtras : "")
        )
          ?.toString()
          .trim();
        const biblio = biblioText ? biblioText : null;

        const document_no =
          (
            r.document_no ??
            pickByAliases(extras, Aliases.documentNo) ??
            ""
          )
            .toString()
            .trim() || null;

        const isRestrictedRaw =
          r.is_restricted ?? pickByAliases(extras, Aliases.isRestricted);
        const is_restricted = normalizeBool(isRestrictedRaw);

        let subject: any;
        const rawSubject =
          r.doc_subject_dtls ??
          pickByAliases(extras, Aliases.additionalDetails);

        if (rawSubject == null || rawSubject === "") {
          subject = {};
        } else if (typeof rawSubject === "object") {
          subject = rawSubject;
        } else if (typeof rawSubject === "string") {
          const s = rawSubject.trim();
          if (!s) {
            subject = {};
          } else {
            try {
              subject = JSON.parse(s);
            } catch {
              subject = { additional_details: s };
            }
          }
        } else {
          subject = { additional_details: String(rawSubject) };
        }

        const contentType = Number(r.contentType || 5);

        // ==== Build doc_location ====
        // All content types use same folder structure: /uploaded_files/<slug>/<accession>.<ext>
        // Books (content type 5) get .book extension; everything else gets .pdf
        const candidateLabel =
          (r.doc_type_name && r.doc_type_name.toString().trim()) ||
          (pickByAliases(extras, Aliases.documentType) ?? "")
            .toString()
            .trim() ||
          ctNameMap.get(contentType) ||
          `type-${contentType}`;

        const folder = slugifyFolder(candidateLabel);
        const fileAcc = sanitizeAccession(r.accession_no);
        const extension =
          contentType === BOOKS_CONTENT_TYPE_ID ? "book" : "pdf";
        const doc_location = `/${UPLOAD_ROOT}/${folder}/${fileAcc}.${extension}`;

        return [
          contentType,
          biblio,
          r.accession_no.trim(),
          document_no,
          author,
          addl_author,
          r.doc_title.trim(),
          Number(r.doc_published_year),
          todayISO,
          doc_location,
          false,
          "PENDING",
          JSON.stringify(subject ?? {}),
          is_restricted,
          1,
          0,
        ];
      });

      const columns = [
        "content_type_id",
        "bibilo_number",
        "accession_no",
        "document_no",
        "author",
        "addtnl_author",
        "doc_title",
        "doc_publishd_year",
        "acc_date",
        "doc_location",
        "isprocessed",
        "status",
        "doc_subject_dtls",
        "is_restricted",
        "error_id",
        "retry_count",
      ];

      const valuePlaceholders = insertValues
        .map(
          (row, i) =>
            `(${row
              .map((_, j) => `$${i * columns.length + j + 1}`)
              .join(", ")})`
        )
        .join(",\n");
      const flatValues = insertValues.flat();

      const insertQuery = `INSERT INTO space_scholar.documents (
        ${columns.join(",\n        ")}
      ) VALUES
      ${valuePlaceholders}
      RETURNING accession_no`;

      try {
        const result = await client.query(insertQuery, flatValues);
        await client.query("COMMIT");
        return NextResponse.json(
          {
            inserted: result.rowCount,
            failedCount: 0,
            ids: result.rows.map((r) => r.accession_no),
            message: "All rows inserted in a single transaction",
          },
          { status: 200 }
        );
      } catch (e: any) {
        await client.query("ROLLBACK");
        console.error(
          "[bulk-api] DB error during bulk insert:",
          e?.message || e,
          e
        );
        return NextResponse.json(
          {
            error: e?.message || "DB error during transaction",
            details: e,
          },
          { status: 500 }
        );
      }
    } catch (e: any) {
      console.error("[bulk-api] transactional error:", e?.message || e);
      return NextResponse.json(
        { error: e?.message || "DB error during transaction" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("[bulk-api] unexpected error:", err?.message || err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}