import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  ImageRun,
  BorderStyle,
  WidthType,
} from "docx";

const BRAND_NAME = "SPACESCHOLAR";
const LOGO_PATH = "/images/isro-vssc-logo.png";
const BRAND_COLOR_RGB: [number, number, number] = [51, 45, 125]; // indigo
const BRAND_COLOR_HEX = "332D7D";

function getGeneratedTimestamp(): string {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

/** Fetches the report logo once per export — used by the PDF/DOCX headers (Excel stays text-only, see exportResults limitations below). */
async function loadLogo(): Promise<{ bytes: Uint8Array; base64: string } | null> {
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return {
      bytes: new Uint8Array(arrayBuffer),
      base64: `data:image/png;base64,${arrayBufferToBase64(arrayBuffer)}`,
    };
  } catch {
    return null;
  }
}

export const formatResults = (results: any[]) => {
  return results.map((item) => ({
    Title: item._source?.metadata?.doc_title || "N/A",
    Author: item._source?.metadata?.author || "N/A",
    Year: item._source?.metadata?.doc_published_year || "N/A",
    "Accession No": item._source?.metadata?.accession_no || "N/A",
    "Document No": item._source?.metadata?.document_no || "N/A",
    Type: item._source?.metadata?.doc_content_type || "N/A",
  }));
};
export const formatDashboardDocuments = (documents: any[]) => {
  return documents.map((doc) => ({
    Type: doc.content_type || "N/A",
    Title: doc.doc_title || "N/A",
    Author: doc.author || "N/A",
    Year: doc.doc_publishd_year || "N/A",
    Status: doc.status || "N/A",
    Uploaded: doc.uploaded_time || "N/A",
    "Accession No": doc.accession_no || "N/A",
  }));
};

// ---------------------------------------------------------------------------
// EXCEL — the free `xlsx` (SheetJS Community Edition) package used here can't
// render cell borders or embed an image; both require the paid SheetJS Pro
// build (or a different library, which pulls in vulnerable transitive deps —
// see project notes). The header below is therefore text-only: brand name,
// report title and generated timestamp as merged rows above the data table.
// PDF and DOCX get the full treatment (logo + real borders) below.
// ---------------------------------------------------------------------------

function buildExcelSheet(
  data: Record<string, unknown>[],
  reportTitle: string
): XLSX.WorkSheet {
  const columnCount = data.length > 0 ? Object.keys(data[0]).length : 6;

  const worksheet = XLSX.utils.aoa_to_sheet([
    [BRAND_NAME],
    [reportTitle],
    [`Generated: ${getGeneratedTimestamp()}`],
    [],
  ]);

  XLSX.utils.sheet_add_json(worksheet, data, { origin: -1 });

  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columnCount - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: columnCount - 1 } },
  ];

  return worksheet;
}

export const exportDashboardToExcel = (documents: any[]) => {
  const data = formatDashboardDocuments(documents);
  const worksheet = buildExcelSheet(data, "Latest Uploads Report");

  worksheet["!cols"] = [
    { wch: 12 }, // Type
    { wch: 60 }, // Title
    { wch: 35 }, // Author
    { wch: 10 }, // Year
    { wch: 15 }, // Status
    { wch: 25 }, // Uploaded
    { wch: 18 }, // Accession No
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Latest Uploads");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const fileData = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(fileData, "latest-uploads.xlsx");
};

export const exportToExcel = (results: any[]) => {
  const data = formatResults(results);
  const worksheet = buildExcelSheet(data, "Search Results Report");

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Search Results");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const fileData = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(fileData, "search-results.xlsx");
};

// ---------------------------------------------------------------------------
// PDF — logo + brand header, generated timestamp, a bordered ("grid" theme)
// table, and a repeated page-frame border on every page.
// ---------------------------------------------------------------------------

function drawPdfHeader(doc: jsPDF, logo: { base64: string } | null, reportTitle: string): number {
  const marginX = 14;

  if (logo) {
    doc.addImage(logo.base64, "PNG", marginX, 10, 14, 14);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...BRAND_COLOR_RGB);
  doc.text(BRAND_NAME, logo ? marginX + 18 : marginX, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated: ${getGeneratedTimestamp()}`, 196, 12, { align: "right" });

  const ruleY = 28;
  doc.setDrawColor(200);
  doc.setLineWidth(0.4);
  doc.line(marginX, ruleY, 196, ruleY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text(reportTitle, marginX, ruleY + 8);

  return ruleY + 14;
}

function drawPdfPageFrame(doc: jsPDF) {
  doc.setDrawColor(190);
  doc.setLineWidth(0.3);
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  doc.rect(8, 8, width - 16, height - 16);
}

export const exportDashboardToPDF = async (documents: any[]) => {
  const data = formatDashboardDocuments(documents);
  const doc = new jsPDF();
  const logo = await loadLogo();
  const startY = drawPdfHeader(doc, logo, "Latest Uploads Report");

  autoTable(doc, {
    startY,
    head: [["Title", "Author", "Year", "Status"]],
    body: data.map((item) => [item.Title, item.Author, item.Year, item.Status]),
    theme: "grid",
    styles: { lineColor: [190, 190, 190], lineWidth: 0.2, fontSize: 9 },
    headStyles: { fillColor: BRAND_COLOR_RGB, textColor: 255, fontStyle: "bold" },
    margin: { left: 14, right: 14 },
    didDrawPage: () => drawPdfPageFrame(doc),
  });

  doc.save("latest-uploads.pdf");
};

export const exportToPDF = async (results: any[]) => {
  const data = formatResults(results);
  const doc = new jsPDF();
  const logo = await loadLogo();
  const startY = drawPdfHeader(doc, logo, "Search Results Report");

  autoTable(doc, {
    startY,
    head: [["Title", "Author", "Year", "Accession No"]],
    body: data.map((item) => [item.Title, item.Author, item.Year, item["Accession No"]]),
    theme: "grid",
    styles: { lineColor: [190, 190, 190], lineWidth: 0.2, fontSize: 9 },
    headStyles: { fillColor: BRAND_COLOR_RGB, textColor: 255, fontStyle: "bold" },
    margin: { left: 14, right: 14 },
    didDrawPage: () => drawPdfPageFrame(doc),
  });

  doc.save("search-results.pdf");
};

// ---------------------------------------------------------------------------
// DOCX — logo + brand header, generated timestamp, and a fully bordered table
// (the `Table`/`TableRow`/`TableCell` imports were already present but unused
// by the previous paragraph-per-row layout).
// ---------------------------------------------------------------------------

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" },
  left: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" },
  right: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" },
};

function buildDocxHeader(logo: { bytes: Uint8Array } | null, reportTitle: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (logo) {
    paragraphs.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logo.bytes,
            transformation: { width: 48, height: 48 },
            type: "png",
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: BRAND_NAME, bold: true, size: 32, color: BRAND_COLOR_HEX })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: reportTitle, bold: true, size: 26 })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Generated: ${getGeneratedTimestamp()}`, italics: true, size: 18, color: "666666" }),
      ],
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 8 } },
    })
  );

  return paragraphs;
}

function buildDocxTable(headers: string[], rows: (string | number)[][]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (label) =>
        new TableCell({
          borders: CELL_BORDER,
          shading: { fill: BRAND_COLOR_HEX },
          children: [
            new Paragraph({
              children: [new TextRun({ text: label, bold: true, color: "FFFFFF", size: 19 })],
            }),
          ],
        })
    ),
  });

  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              borders: CELL_BORDER,
              children: [new Paragraph({ children: [new TextRun({ text: String(cell ?? ""), size: 18 })] })],
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
}

export const exportDashboardToDoc = async (documents: any[]) => {
  const data = formatDashboardDocuments(documents);
  const logo = await loadLogo();

  const doc = new Document({
    sections: [
      {
        children: [
          ...buildDocxHeader(logo, "Latest Uploads Report"),
          buildDocxTable(
            ["Type", "Title", "Author", "Year", "Status"],
            data.map((item) => [item.Type, item.Title, item.Author, item.Year, item.Status])
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(
    new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    "latest-uploads.docx"
  );
};

export const exportToDoc = async (results: any[]) => {
  const data = formatResults(results);
  const logo = await loadLogo();

  const doc = new Document({
    sections: [
      {
        children: [
          ...buildDocxHeader(logo, "Search Results Report"),
          buildDocxTable(
            ["Title", "Author", "Year", "Accession No", "Document No", "Type"],
            data.map((item) => [
              item.Title,
              item.Author,
              item.Year,
              item["Accession No"],
              item["Document No"],
              item.Type,
            ])
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(
    new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    "search-results.docx"
  );
};
