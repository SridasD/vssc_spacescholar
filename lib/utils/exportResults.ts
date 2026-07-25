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
} from "docx";

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
export const exportDashboardToExcel = (documents: any[]) => {
  const data = formatDashboardDocuments(documents);

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet["!cols"] = [
    { wch: 12 }, // Type
    { wch: 60 }, // Title
    { wch: 35 }, // Author
    { wch: 10 }, // Year
    { wch: 15 }, // Status
    { wch: 25 }, // Uploaded
    { wch: 18 }, // Accession No
  ];
  worksheet["!rows"] = [{ hpt: 25 }];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Latest Uploads"
  );

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const fileData = new Blob(
    [excelBuffer],
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    }
  );

  saveAs(fileData, "latest-uploads.xlsx");
};

export const exportDashboardToPDF = (documents: any[]) => {
  const data = formatDashboardDocuments(documents);

  const doc = new jsPDF();

  doc.text("Latest Uploads", 14, 15);

  autoTable(doc, {
    startY: 25,
    head: [["Title", "Author", "Year", "Status"]],
    body: data.map((item) => [
      item.Title,
      item.Author,
      item.Year,
      item.Status,
    ]),
  });

  doc.save("latest-uploads.pdf");
};

export const exportDashboardToDoc = async (documents: any[]) => {
  const data = formatDashboardDocuments(documents);

  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: "Latest Uploads",
          bold: true,
          size: 32,
        }),
      ],
      spacing: {
        after: 300,
      },
    }),
  ];

  data.forEach((item, index) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}.`,
            bold: true,
            size: 28,
          }),
        ],
      }),

      new Paragraph(`Title: ${item.Title}`),
      new Paragraph(`Author: ${item.Author}`),
      new Paragraph(`Year: ${item.Year}`),
      new Paragraph(`Status: ${item.Status}`),

      new Paragraph({
        text: " ",
        spacing: {
          after: 250,
        },
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  saveAs(
    new Blob([blob], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    "latest-uploads.docx"
  );
};

// EXCEL EXPORT
export const exportToExcel = (results: any[]) => {
  const data = formatResults(results);

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Search Results");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const fileData = new Blob(
    [excelBuffer],
    {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    }
  );

  saveAs(fileData, "search-results.xlsx");
};

// PDF EXPORT
export const exportToPDF = (results: any[]) => {
  const data = formatResults(results);

  const doc = new jsPDF();

  doc.text("Search Results", 14, 15);

  autoTable(doc, {
    startY: 25,
    head: [["Title", "Author", "Year", "Accession No"]],
    body: data.map((item) => [
      item.Title,
      item.Author,
      item.Year,
      item["Accession No"],
    ]),
  });

  doc.save("search-results.pdf");
};

// DOC EXPORT
export const exportToDoc = async (results: any[]) => {
  const data = formatResults(results);

  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: "Search Results",
          bold: true,
          size: 32,
        }),
      ],
      spacing: {
        after: 300,
      },
    }),
  ];

  data.forEach((item, index) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}.`,
            bold: true,
            size: 28,
          }),
        ],
        spacing: {
          after: 150,
        },
      }),

      new Paragraph(`Title: ${item.Title}`),
      new Paragraph(`Author: ${item.Author}`),
      new Paragraph(`Year: ${item.Year}`),
      new Paragraph(`Accession No: ${item["Accession No"]}`),
      new Paragraph(`Document No: ${item["Document No"]}`),
      new Paragraph(`Type: ${item.Type}`),

      new Paragraph({
        text: " ",
        spacing: {
          after: 250,
        },
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  saveAs(
    new Blob([blob], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    "search-results.docx"
  );
};