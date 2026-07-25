import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import { join } from "path";
import { query } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/jwt";
import {
  MAX_FILE_SIZE,
  BOOK_PHYSICAL_LOCATION,
} from "@/lib/config/constants";

// Root folder under project root for uploaded PDFs.
// Final path shape: /uploaded_files/<content-type-slug>/<accession>.pdf
const UPLOAD_ROOT = "uploaded_files";

// Slugify content-type name to a folder-safe token (must match bulk route)
function slugifyFolder(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Sanitize accession to a file-safe token (must match bulk route)
function sanitizeAccession(s: string): string {
  return (s || "").toString().trim().replace(/[^a-zA-Z0-9_-]+/g, "");
}

// Look up content type name by id
async function getContentTypeName(contentTypeId: string): Promise<string> {
  const result = await query(
    `SELECT content_type
       FROM space_scholar.master_content_type
      WHERE content_type_id = $1
        AND is_active = true`,
    [contentTypeId]
  );
  return result.rows[0]?.content_type || `type-${contentTypeId}`;
}

// Validate form data
function validateFormData(formData: FormData) {
  const contentType = formData.get("contentType") as string | null;
  const requiredFields = [
    "title",
    "author",
    "publishYear",
    "contentType",
    "accession_no",
  ];

  if (contentType !== "5") {
    requiredFields.push("file");
  }

  for (const field of requiredFields) {
    if (!formData.get(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (contentType !== "5") {
    const file = formData.get("file") as File;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds the limit (${MAX_FILE_SIZE / (1024 * 1024)}MB)`
      );
    }
  }
}

// Safe JSON parsing for additionalDetails
function safeParseAdditionalDetails(additionalDetails: string | null): any[] {
  if (!additionalDetails) return [];

  const trimmedDetails = additionalDetails.trim();
  if (!trimmedDetails) return [];

  try {
    if (trimmedDetails.startsWith("[") || trimmedDetails.startsWith("{")) {
      const parsed = JSON.parse(trimmedDetails);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    return [trimmedDetails];
  } catch (error) {
    console.error("JSON parse error for additionalDetails:", {
      error: error instanceof Error ? error.message : "Unknown error",
      data: additionalDetails,
    });
    return [trimmedDetails];
  }
}

// Rollback file on failure
async function rollbackFile(filePath: string) {
  try {
    await unlink(filePath);
    console.log(`Rolled back file: ${filePath}`);
  } catch (error) {
    console.error(`Failed to rollback file: ${filePath}`, error);
  }
}

export async function POST(req: NextRequest) {
  console.log("====+===== /api/documents/upload endpoint HIT ====");

  let savedFilePath: string | null = null;

  try {
    // ---- Auth ----
    // Never trust a client-supplied x-user-id header — verify the JWT directly.
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ---- Parse form data ----
    const formData = await req.formData();

    const contentType = formData.get("contentType") as string | null;
    const file = contentType !== "5" ? (formData.get("file") as File) : null;

    validateFormData(formData);

    const title = formData.get("title") as string | null;
    const author = formData.get("author") as string | null;
    const addlauthor = formData.get("addlauthor") as string | null;
    const description = formData.get("description") as string | null;
    const bibiloNumber = formData.get("bibiloNumber") as string | null;
    const barcode = formData.get("barcode") as string | null;
    const publishYear = formData.get("publishYear") as string | null;
    const document_no = formData.get("document_no") as string | null;
    const accession_no = formData.get("accession_no") as string;
    const is_restricted = formData.get("is_restricted") === "true";

    const additionalDetails = formData.get("additionalDetails") as
      | string
      | null;
    const parsedDetails = safeParseAdditionalDetails(additionalDetails);

    const transformedDetails = Array.isArray(parsedDetails)
      ? parsedDetails.reduce((acc, detail, index) => {
          acc[`subject ${index + 1}`] = detail;
          return acc;
        }, {} as Record<string, any>)
      : {};
    const jsonbParsedDetails = JSON.stringify(transformedDetails);

    // ---- Build the file path (matches bulk route convention) ----
    let docLocation = BOOK_PHYSICAL_LOCATION; // default for content type 5

    if (contentType !== "5" && file) {
      const contentTypeName = await getContentTypeName(contentType!);
      const folder = slugifyFolder(contentTypeName);
      const fileAcc = sanitizeAccession(accession_no);

      if (!folder) {
        throw new Error("Could not derive a valid folder name from content type");
      }
      if (!fileAcc) {
        throw new Error("Accession number is invalid for use as a filename");
      }

      const uploadDir = join(process.cwd(), UPLOAD_ROOT, folder);
      await mkdir(uploadDir, { recursive: true });

      const filename = `${fileAcc}.pdf`;
      const absPath = join(uploadDir, filename);

      const fileBuffer = Buffer.from(await file.arrayBuffer());

      // The file is always stored with a .pdf extension regardless of the
      // browser-supplied MIME type, so verify the actual content by magic
      // bytes rather than trusting the filename/Content-Type.
      const isPdf = fileBuffer.subarray(0, 5).toString("latin1") === "%PDF-";
      if (!isPdf) {
        throw new Error("Uploaded file is not a valid PDF");
      }

      await writeFile(absPath, fileBuffer);
      savedFilePath = absPath;

      docLocation = `/${UPLOAD_ROOT}/${folder}/${filename}`;
    }

    // ---- DB insert ----
    const insertQuery = `
      SELECT * FROM space_scholar.fn_insert_document_metadata_v2(
        $1::integer, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11::space_scholar.job_status_enum, $12::jsonb, $13, $14, $15, $16, $17
      );
    `;
    const values = [
      contentType,
      bibiloNumber,
      barcode,
      author,
      addlauthor,
      title,
      publishYear ? parseInt(publishYear) : null,
      new Date().toISOString().split("T")[0],
      docLocation,
      false,
      "PENDING",
      jsonbParsedDetails,
      is_restricted,
      "SOME_ERROR_CODE",
      0,
      document_no,
      accession_no,
    ];

    const result = await query(insertQuery, values);
    const metadataResponse = result.rows[0]?.fn_insert_document_metadata_v2;

    if (!metadataResponse || !metadataResponse.success) {
      console.error(
        "Database insertion failed:",
        metadataResponse?.message || "Unknown error"
      );
      if (savedFilePath) await rollbackFile(savedFilePath);
      throw new Error(metadataResponse?.message || "Database insertion failed");
    }

    const documentId = metadataResponse.id;

    return NextResponse.json(
      {
        message: "File saved and document metadata saved successfully",
        documentId,
        title,
        filePath: docLocation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Document upload error:", error);

    if (savedFilePath) await rollbackFile(savedFilePath);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An error occurred during document upload" },
      { status: 500 }
    );
  }
}