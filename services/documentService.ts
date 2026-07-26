import db from "@/lib/db";

export interface Document {
  accession_no: string | null;
  content_type: string;
  biblio_number: string;
  barcode: string;
  doc_title: string;
  author: string;
  doc_publishd_year: number;
  status: string;
  uploaded_time: string;
}

export interface DocumentsResponse {
  documents: Document[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetDocumentsFilters {
  status?: string | null;
  contentTypeId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  /** Free-text match against title / author / accession no / biblio number. */
  search?: string | null;
}

// Upper bound on how many rows we'll pull from the DB function to search over in
// memory. The stored function has no search parameter of its own, so a text
// search widens the fetch to this candidate set, filters in Node, then paginates
// the filtered result — avoiding a hand-written duplicate of the function's SQL.
const SEARCH_CANDIDATE_LIMIT = 2000;

/**
 * Fetch paginated document list from the database, with optional filters.
 * Filters are applied to BOTH the count query and the data query so pagination stays accurate.
 */
export async function getDocuments(
  page: number = 1,
  limit: number = 10,
  filters: GetDocumentsFilters = {}
): Promise<DocumentsResponse> {
  const offset = (page - 1) * limit;

  const status = filters.status && filters.status !== "ALL" ? filters.status : null;
  const contentTypeId = filters.contentTypeId ?? null;
  const startDate = filters.startDate ?? null;
  const endDate = filters.endDate ?? null;
  const search = filters.search?.trim() || null;

  try {
    if (search) {
      // Pull a wide candidate set (existing filters still applied server-side),
      // then match the search term client-side and paginate the filtered set.
      const candidatesQuery = `
        SELECT * FROM space_scholar.get_uploaded_documents_detailswith_limit_and_offset(
          p_limit := $1,
          p_offset := 0,
          p_content_type_id := $2,
          p_status := $3,
          p_start_date := $4,
          p_end_date := $5
        )
      `;
      const candidatesResult = await db.query(candidatesQuery, [
        SEARCH_CANDIDATE_LIMIT,
        contentTypeId,
        status,
        startDate,
        endDate,
      ]);

      const needle = search.toLowerCase();
      const matches = candidatesResult.rows.filter((doc: Document) =>
        [doc.doc_title, doc.author, doc.accession_no, doc.biblio_number]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle))
      );

      const totalCount = matches.length;
      const totalPages = Math.ceil(totalCount / limit) || 1;

      return {
        documents: matches.slice(offset, offset + limit),
        totalCount,
        page,
        limit,
        totalPages,
      };
    }

    // Filtered count — must apply the SAME filters as the data query
    const countQuery = `
      SELECT COUNT(*)::int AS count
      FROM space_scholar.documents d
      WHERE ($1::integer IS NULL OR d.content_type_id = $1)
        AND ($2::space_scholar.job_status_enum IS NULL OR d.status = $2)
        AND ($3::timestamp IS NULL OR d.uploaded_time >= $3)
        AND ($4::timestamp IS NULL OR d.uploaded_time <= $4)
    `;
    const countResult = await db.query(countQuery, [
      contentTypeId,
      status,
      startDate,
      endDate,
    ]);
    const totalCount = parseInt(countResult.rows[0].count);

    // Filtered, paginated data — uses the existing DB function
    const dataQuery = `
      SELECT * FROM space_scholar.get_uploaded_documents_detailswith_limit_and_offset(
        p_limit := $1,
        p_offset := $2,
        p_content_type_id := $3,
        p_status := $4,
        p_start_date := $5,
        p_end_date := $6
      )
    `;
    const result = await db.query(dataQuery, [
      limit,
      offset,
      contentTypeId,
      status,
      startDate,
      endDate,
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      documents: result.rows,
      totalCount,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
}

export async function deleteDocument(id: number): Promise<boolean> {
  try {
    const query = `
      DELETE FROM space_scholar.documents
      WHERE id = $1
      RETURNING id
    `;
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
}