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
}

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

  try {
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