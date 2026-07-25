"use client";

import { useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Papa from "papaparse";
import JSZip from "jszip";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const normalizeKey = (k: string) => (k || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

type RawRow = Record<string, string>;

const MAX_ROWS = 10_000;     
const SPLIT_ROWS = 1_000;    

const REQUIRED_NORMALIZED = ["accessionno", "title", "year", "documenttype"] as const;
const REQUIRED_DISPLAY: Record<(typeof REQUIRED_NORMALIZED)[number], string> = {
  accessionno: "Accession No",
  title: "Title",
  year: "Year",
  documenttype: "Document Type",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

function parseYear(cell: string | undefined | null): number | null {
  if (!cell) return null;
  const s = String(cell).trim();
  const m = s.match(/\b(\d{4})\b/);
  if (m) return Number(m[1]);
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export default function DashboardBulkSplitter() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [headersOriginal, setHeadersOriginal] = useState<string[]>([]);
  const [headersNormalized, setHeadersNormalized] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [fileNameBase, setFileNameBase] = useState<string>("");

  const [yearOk, setYearOk] = useState<boolean>(true);
  const [yearInvalidCount, setYearInvalidCount] = useState<number>(0);
  const [yearExamples, setYearExamples] = useState<{ idx: number; value: string }[]>([]);

  const rowCount = rows.length;
  const colCount = headersOriginal.length;

  const requiredOk = useMemo(() => {
    const norm = new Set(headersNormalized);
    return REQUIRED_NORMALIZED.every((key) => norm.has(key));
  }, [headersNormalized]);

  const missingRequired = useMemo(() => {
    const norm = new Set(headersNormalized);
    const missing: string[] = [];
    REQUIRED_NORMALIZED.forEach((k) => {
      if (!norm.has(k)) missing.push(REQUIRED_DISPLAY[k]);
    });
    return missing;
  }, [headersNormalized]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    e.currentTarget.value = ""; 
    if (!f) return;

    if (!/\.csv$/i.test(f.name) && f.type !== "text/csv") {
      toast.error("Only .csv files are allowed.");
      return;
    }

    setParsing(true);
    setFile(null);
    setRows([]);
    setHeadersOriginal([]);
    setHeadersNormalized([]);
    setFileNameBase(f.name.replace(/\.csv$/i, ""));
    setYearOk(true);
    setYearInvalidCount(0);
    setYearExamples([]);

    Papa.parse<RawRow>(f, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      complete: (res) => {
        try {
          const metaFields = (res.meta?.fields || []) as string[];
          const originalHeaders =
            metaFields.length > 0 ? metaFields : Object.keys((res.data?.[0] as RawRow) || {});
          const normalized = originalHeaders.map((h) => normalizeKey(h));

          const cleanedRows: RawRow[] = (res.data || []).map((r) => {
            const out: RawRow = {};
            originalHeaders.forEach((h) => (out[h] = (r as any)?.[h] ?? ""));
            return out;
          });

          if (cleanedRows.length > MAX_ROWS) {
            setParsing(false);
            toast.error(
              `This file has ${cleanedRows.length.toLocaleString()} rows. ` +
                `Maximum allowed is ${MAX_ROWS.toLocaleString()}. Please upload a smaller CSV.`
            );
            return; 
          }

        
          const requiredMissingNow: string[] = [];
          const normalizedSet = new Set(normalized);
          REQUIRED_NORMALIZED.forEach((k) => {
            if (!normalizedSet.has(k)) requiredMissingNow.push(REQUIRED_DISPLAY[k]);
          });

          let yearIsOk = true;
          let badCount = 0;
          const examples: { idx: number; value: string }[] = [];

          const yearHeaderOriginal = originalHeaders.find((h) => normalizeKey(h) === "year");
          if (yearHeaderOriginal) {
            for (let i = 0; i < cleanedRows.length; i++) {
              const yRaw = cleanedRows[i][yearHeaderOriginal];
              const y = parseYear(yRaw);
              if (y === null || y < 1800) {
                badCount++;
                if (examples.length < 3) {
                  examples.push({ idx: i + 2 /* + header row */, value: String(yRaw ?? "") });
                }
              }
            }
            if (badCount > 0) yearIsOk = false;
          } else {
            yearIsOk = false;
          }

          setHeadersOriginal(originalHeaders);
          setHeadersNormalized(normalized);
          setRows(cleanedRows);
          setFile(f);
          setParsing(false);
          setYearOk(yearIsOk);
          setYearInvalidCount(badCount);
          setYearExamples(examples);

            toast.success(
              <span>
              Successfully loaded your CSV with{" "}
              <span style={{
                display: "inline-block",
                background: "#818cf8",
                color: "#fff",
                borderRadius: "9999px",
                padding: "0.15em 0.7em",
                fontWeight: 600,
                fontSize: "0.95em",
                margin: "0 0.2em"
              }}>
                {cleanedRows.length.toLocaleString()}
              </span>
              row{cleanedRows.length === 1 ? "" : "s"} and{" "}
              <span style={{
                display: "inline-block",
                background: "#818cf8",
                color: "#fff",
                borderRadius: "9999px",
                padding: "0.15em 0.7em",
                fontWeight: 600,
                fontSize: "0.95em",
                margin: "0 0.2em"
              }}>
                {originalHeaders.length}
              </span>
              column{originalHeaders.length === 1 ? "" : "s"}.
              </span>
            );

          if (cleanedRows.length <= SPLIT_ROWS) {
            toast.info(`Your file has ${cleanedRows.length.toLocaleString()} row(s), which is within the allowed limit. No splitting is needed—your CSV is ready as-is!`);
          }

          if (requiredMissingNow.length) {
            toast.error(`Missing required columns: ${requiredMissingNow.join(", ")}`);
          }
          if (!yearIsOk) {
            if (!yearHeaderOriginal) {
              toast.error("Missing required column: Year");
            } else if (badCount > 0) {
              const ex =
                examples.length > 0
                  ? ` e.g., row ${examples[0].idx} value "${examples[0].value}"`
                  : "";
              toast.error(
                `Year must be ≥ 1800. Found ${badCount.toLocaleString()} invalid row(s)${ex}.`
              );
            }
          }
        } catch (err) {
          console.error(err);
          setParsing(false);
          toast.error("Failed to load CSV.");
        }
      },
      error: (err) => {
        console.error(err);
        setParsing(false);
        toast.error("Failed to parse CSV.");
      },
    });
  };

  const splitAndZip = async () => {
    if (!file || rows.length === 0) return;

    if (!requiredOk) {
      toast.error(`Missing required columns: ${missingRequired.join(", ")}. Cannot split.`);
      return;
    }
    if (!yearOk) {
      if (yearInvalidCount > 0) {
        toast.error(
          `Year must be ≥ 1800. Found ${yearInvalidCount.toLocaleString()} invalid row(s). Fix and re-upload.`
        );
      } else {
        toast.error("Missing or invalid Year column. Fix and re-upload.");
      }
      return;
    }
    if (rowCount <= SPLIT_ROWS) {
      toast.info(`Your file has ${rowCount.toLocaleString()} row(s), which is within the allowed limit. No splitting is needed—your CSV is ready as-is!`);
      return;
    }

    try {
      const zip = new JSZip();
      const headerRow = headersOriginal;
      const totalParts = Math.ceil(rowCount / SPLIT_ROWS);

      for (let part = 0; part < totalParts; part++) {
        const from = part * SPLIT_ROWS;
        const to = Math.min(from + SPLIT_ROWS, rowCount);
        const slice = rows.slice(from, to);
        const csvText = Papa.unparse(slice, { columns: headerRow });

        const partNum = String(part + 1).padStart(2, "0");
        const name = `${fileNameBase}_part${partNum}_of${String(totalParts).padStart(2, "0")}.csv`;
        zip.file(name, csvText);
      }

      toast.info("Preparing ZIP…");
      const blob = await zip.generateAsync({ type: "blob" });
      const zipName = `${fileNameBase}_split_${SPLIT_ROWS}.zip`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success(
        `Created ${totalParts} file(s) of ${SPLIT_ROWS.toLocaleString()} rows each. ZIP downloaded.`
      );
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create ZIP.");
    }
  };

  const canSplit = !!file && requiredOk && yearOk && rowCount > SPLIT_ROWS;

  return (
    <>
      <ToastContainer position="top-right" autoClose={10000} />

      <motion.h2
        className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 mb-6 w-[90%]"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Step 1: Data Split Engine
      </motion.h2>

     
      <motion.aside
        variants={itemVariants}
        className="mb-6 p-4 rounded-lg bg-white/10 border border-white/10 text-blue-100"
      >
        <div className="font-semibold mb-2">How to Use</div>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>
        <span className="font-medium">Upload a CSV file</span> by dragging it here or clicking the upload area.
          </li>
          <li>
        <span className="font-medium">Required columns:</span> <span className="font-medium text-blue-200">Accession No, Title, Year, Document Type</span>
          </li>
          <li>
        <span className="font-medium">Year</span> must be <span className="font-medium text-blue-200">1800 or later</span> and cannot be empty or zero.
          </li> 
          <li>
        If your file has more than <span className="font-medium text-green-200">1,000 rows</span>, it will be split into multiple CSV files of 1,000 rows each and downloaded as a ZIP.
          </li>
          <li>
        Files with more than <span className="font-medium text-red-200">10,000 rows</span> are not supported and will be rejected.
          </li>
          <li>
        <span className="font-medium">Sample CSV format:</span>{" "}
        <button
          type="button"
          className="underline text-blue-200 hover:text-blue-100 transition"
          onClick={() => {
            const sample = [
          [
            "Accession No",
            "Title",
            "Author",
            "Additional Author",
            "Document Type",
            "Is Restricted",
            "Year",
            "Additional Details",
            "Document No",
          ],
            ];
            const csv = sample.map((row) => row.join(",")).join("\r\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "sample_format_for_space_scholar_metadata.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
        >
          Download sample CSV
        </button>
          </li>
        </ul>
      </motion.aside>

      <motion.div
        variants={itemVariants}
        className="relative p-6 border-2 border-dashed border-blue-400/50 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload CSV"
        />
        <div className="text-center pointer-events-none">
          <svg
        className="mx-auto h-12 w-12 text-blue-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
          >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
          </svg>
          <p className="mt-2 text-sm text-blue-200">
        Drag & drop your CSV, or click to select
          </p>
          {/* <p className="mt-1 text-xs text-blue-300">Processed locally in your browser.</p> */}
        </div>
      </motion.div>

      {file && (
        <motion.div
          variants={itemVariants}
          className="mt-6 p-4 bg-white/10 border border-white/10 rounded-lg text-blue-100"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="font-semibold">
              File: <span className="opacity-90">{file.name}</span>
            </div>
            <div className="text-sm">
              Rows: <strong>{rowCount.toLocaleString()}</strong>&nbsp;•&nbsp;Columns:{" "}
              <strong>{colCount}</strong>
            </div>
            <div className="text-sm">
              Required columns:{" "}
              {requiredOk ? (
                <span className="text-green-300 font-semibold">OK</span>
              ) : (
                <span className="text-red-300 font-semibold">
                  Missing: {missingRequired.join(", ")}
                </span>
              )}
            </div>
            <div className="text-sm">
              Year check:{" "}
              {yearOk ? (
                <span className="text-green-300 font-semibold">OK</span>
              ) : (
                <span className="text-red-300 font-semibold">
                  {yearInvalidCount > 0
                    ? `${yearInvalidCount.toLocaleString()} invalid`
                    : `Missing/invalid`}
                </span>
              )}
            </div>
          </div>

          {/* If year invalid, show a tiny hint with examples */}
          {!yearOk && yearInvalidCount > 0 && yearExamples.length > 0 && (
            <div className="mt-2 text-xs text-red-200">
              Examples:{" "}
              {yearExamples.map((ex, i) => (
                <span key={i} className="mr-2">
                  row {ex.idx}: “{ex.value || "∅"}”
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setRows([]);
                setHeadersOriginal([]);
                setHeadersNormalized([]);
                setFileNameBase("");
                setYearOk(true);
                setYearInvalidCount(0);
                setYearExamples([]);
              }}
              className="px-4 py-2 rounded-lg bg-transparent border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => {
                if (!requiredOk) {
                  toast.error(`Missing required columns: ${missingRequired.join(", ")}`);
                  return;
                }
                if (!yearOk) {
                  if (yearInvalidCount > 0) {
                    toast.error(
                      `Year must be ≥ 1800. Found ${yearInvalidCount.toLocaleString()} invalid row(s).`
                    );
                  } else {
                    toast.error("Missing or invalid Year column.");
                  }
                  return;
                }
                if (rowCount <= SPLIT_ROWS) {
                    toast.info(`Your file has ${rowCount.toLocaleString()} row(s), which is within the allowed limit. No splitting is needed—your CSV is ready as-is!`);
                  return;
                }
                splitAndZip();
                }}
                disabled={parsing || !file || !requiredOk || !yearOk || rowCount <= SPLIT_ROWS}
                className={`px-5 py-2 rounded-lg flex items-center justify-center font-semibold shadow-sm transition-all duration-200
                  ${
                  parsing || !file || !requiredOk || !yearOk || rowCount <= SPLIT_ROWS
                  ? "bg-gray-100 text-red-500 cursor-not-allowed border border-gray-200 opacity-70"
                  : "bg-gradient-to-r from-blue-600 to-cyan-400 hover:from-blue-700 hover:to-cyan-500 text-white border border-blue-400 ring-2 ring-blue-200/30 hover:ring-blue-300/60 focus:outline-none focus:ring-4 focus:ring-blue-300"
                  }
                `}
                title={
                  !file
                  ? "Please upload a CSV file first."
                  : !requiredOk
                  ? "Some required columns are missing. Please check your CSV."
                  : !yearOk
                  ? "Year column must be present and all values ≥ 1800."
                  : rowCount <= SPLIT_ROWS
                  ? "No split required for files with 1,000 rows or less."
                  : "Split and download as ZIP"
                }
                >
                {rowCount <= SPLIT_ROWS ? "No Split Required" : "Split into 1,000-row CSVs (.zip)"}
                 
            </button>
          </div>

          {/* Header chips */}
          {headersOriginal.length > 0 && (
            <div className="mt-4 text-xs opacity-90">
              <div className="mb-1 font-semibold">Detected headers:</div>
              <div className="flex flex-wrap gap-2">
                {headersOriginal.map((h) => (
                  <span
                    key={h}
                    className="px-2 py-1 rounded bg-blue-500/25 border border-blue-400/40"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {parsing && <div className="mt-3 text-blue-200 text-sm">Parsing… please wait</div>}
        </motion.div>
      )}
    </>
  );
}
