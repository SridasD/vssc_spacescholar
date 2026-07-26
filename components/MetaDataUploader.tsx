"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Papa from "papaparse";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MetadataWorkflowSteps from "./MetadataWorkflowSteps";

type RawRow = Record<string, string>;

type BulkRow = {
  id: string;
  title: string;
  year: string;
  accessionNo: string;
  documentNo: string;
  docTypeText: string;
  errors?: string[];
  extras?: Record<string, any>;
};

type FileGroup = {
  fileName: string;
  rows: BulkRow[];
  collapsed: boolean;
  csvDocType?: string;
};

type ContentTypeItem = { id: string | number; content_type: string };

const normalizeKey = (k: string) =>
  (k || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

function makeId() {
  if (typeof window !== "undefined" && (window as any).crypto?.randomUUID) {
    return (window as any).crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function validate(r: BulkRow) {
  const e: string[] = [];
  if (!r.title?.trim()) e.push("Title is required");
  if (!r.year?.trim()) e.push("Year is required");
  if (!/^\d{4}$/.test(r.year?.trim() || "")) e.push("Year must be 4 digits");
  if (!r.accessionNo?.trim()) e.push("Accession No is required");
  return e;
}

const HeaderAliases = {
  accessionNo: [
    "accessionno",
    "accession_no",
    "accessionnumber",
    "accession_number",
    "accession no",
    "accession",
  ],
  legacyBarcodeAsAccession: ["barcode"],
  title: ["doctitle", "doc_title", "title"],
  year: [
    "docpublishedyear",
    "doc_publishd_year",
    "doc_published_year",
    "year",
    "docpublishdyear",
  ],
  documentType: ["documenttype", "document_type", "document type"],
  documentNo: [
    "documentno",
    "document_no",
    "document no",
    "docno",
    "doc_no",
  ],
};

function pickByAliases(obj: Record<string, string>, aliases: string[]): string {
  for (const k of aliases) {
    if (k in obj) return obj[k] ?? "";
  }
  return "";
}

function requiredHeadersPresent(normHeaders: Set<string>) {
  const needSets = [
    [...HeaderAliases.accessionNo, ...HeaderAliases.legacyBarcodeAsAccession],
    HeaderAliases.title,
    HeaderAliases.year,
    HeaderAliases.documentType,
  ];
  return needSets.every((aliases) => aliases.some((a) => normHeaders.has(a)));
}

function useDuplicateMarkers(
  setGroups: React.Dispatch<React.SetStateAction<FileGroup[]>>
) {
  const markDuplicateAccessionNos = useCallback(
    (dups: string[], onlyFileName?: string) => {
      const dupSet = new Set(dups.map((s) => String(s).trim().toLowerCase()));
      setGroups((prev) =>
        prev.map((g) => {
          if (onlyFileName && g.fileName !== onlyFileName) return g;
          const rows = g.rows.map((r) => {
            const isDup = dupSet.has((r.accessionNo || "").trim().toLowerCase());
            if (!isDup) return r;
            const errs = new Set([
              ...(r.errors || []),
              "Duplicate: accession no exists in DB",
            ]);
            return { ...r, errors: Array.from(errs) };
          });
          return { ...g, rows };
        })
      );
    },
    [setGroups]
  );

  const markIntraPayloadDuplicates = useCallback(
    (
      items: Array<{ accession_no: string; indices: number[] }>,
      onlyFileName?: string
    ) => {
      const dupSet = new Set(
        items.map((d) => d.accession_no.trim().toLowerCase())
      );
      setGroups((prev) =>
        prev.map((g) => {
          if (onlyFileName && g.fileName !== onlyFileName) return g;
          const rows = g.rows.map((r) => {
            const isDup = dupSet.has((r.accessionNo || "").trim().toLowerCase());
            if (!isDup) return r;
            const errs = new Set([
              ...(r.errors || []),
              "Duplicate in this upload",
            ]);
            return { ...r, errors: Array.from(errs) };
          });
          return { ...g, rows };
        })
      );
    },
    [setGroups]
  );

  return { markDuplicateAccessionNos, markIntraPayloadDuplicates };
}

async function fetchDbDuplicateAccessionNos(
  accessionNos: string[]
): Promise<{ lower: string[]; detail: string[] }> {
  const uniqueLower = Array.from(
    new Set(
      accessionNos.map((b) => (b || "").trim().toLowerCase()).filter(Boolean)
    )
  );
  if (uniqueLower.length === 0) return { lower: [], detail: [] };

  const res = await fetch("/api/bulk-documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ mode: "check_accession", accessionNos: uniqueLower }),
  });

  if (!res.ok) {
    console.warn("[bulk check_accession] failed", await res.text());
    return { lower: [], detail: [] };
  }

  const data = await res.json();
  return {
    lower: Array.isArray(data?.exists) ? data.exists : [],
    detail: Array.isArray(data?.exists_detail) ? data.exists_detail : [],
  };
}

export default function DashboardBulk() {
  const [contentTypes, setContentTypes] = useState<ContentTypeItem[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<string>("");

  const selectedContentTypeLabel = useMemo(() => {
    const ct = contentTypes.find(
      (c) => String(c.id) === String(selectedContentType)
    );
    return ct?.content_type?.trim() || "";
  }, [contentTypes, selectedContentType]);

  const [groups, setGroups] = useState<FileGroup[]>([]);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submittingAll] = useState(false);
  const [submittingFile, setSubmittingFile] = useState<Record<string, boolean>>(
    {}
  );

  const { markDuplicateAccessionNos, markIntraPayloadDuplicates } =
    useDuplicateMarkers(setGroups);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/content-types");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted) {
          setContentTypes(data?.contentTypes || []);
        }
      } catch (e) {
        console.error("Failed to load content types:", e);
        toast.error("Failed to load categories. Please refresh.", {
          autoClose: 15000,
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const total = groups.reduce((a, g) => a + g.rows.length, 0);
    const withErrors = groups.reduce(
      (a, g) => a + g.rows.filter((r) => (r.errors?.length || 0) > 0).length,
      0
    );
    return { total, withErrors };
  }, [groups]);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!selectedContentType) {
        toast.info("Please select a Category before choosing CSV files.", {
          autoClose: 8000,
        });
        return;
      }
      if (!files || files.length === 0) return;

      const selected = Array.from(files);
      const csvOnly = selected.filter(
        (f) => /\.csv$/i.test(f.name) || f.type === "text/csv"
      );
      if (csvOnly.length !== selected.length) {
        toast.info("Only .csv files are allowed. Non-CSV files were skipped.", {
          autoClose: 8000,
        });
      }
      if (csvOnly.length === 0) return;

      const existingNames = new Set(groups.map((g) => g.fileName));
      let fresh = csvOnly.filter((f) => !existingNames.has(f.name));
      if (fresh.length === 0) {
        toast.info("All selected files are already added.", { autoClose: 6000 });
        return;
      }
      if (fresh.length !== csvOnly.length) {
        toast.info(
          "Some files were skipped because they are already added.",
          { autoClose: 6000 }
        );
      }

      if (fresh.length > 5) {
        toast.info(
          "You can upload up to 5 files at a time. Extra files were skipped.",
          { autoClose: 8000 }
        );
        fresh = fresh.slice(0, 5);
      }

      setParsing(true);

      const tasks = fresh.map(
        (file) =>
          new Promise<FileGroup>((resolve, reject) => {
            Papa.parse<RawRow>(file, {
              header: true,
              skipEmptyLines: true,
              complete: async (res) => {
                try {
                  const targetDocTypeLabel =
                    selectedContentTypeLabel.toLowerCase();

                  const metaFields: string[] = (res.meta?.fields || []) as string[];
                  const normHeaders = new Set(
                    metaFields.map((h) => normalizeKey(h))
                  );
                  if (!requiredHeadersPresent(normHeaders)) {
                    toast.error(
                      `${file.name}: missing required headers. Need Accession No, Title, Document Type, Year (aliases allowed). File skipped.`,
                      { autoClose: 20000 }
                    );
                    resolve({
                      fileName: file.name,
                      rows: [],
                      collapsed: false,
                    });
                    return;
                  }

                  const docTypeValues = new Set<string>();
                  let rows: BulkRow[] = (res.data || []).map((rec, idx) => {
                    const n: Record<string, string> = {};
                    const originals: Record<string, string> = {};
                    Object.entries(rec).forEach(([k, v]) => {
                      const val = (v ?? "").toString();
                      const norm = normalizeKey(k);
                      originals[k] = val;
                      n[norm] = val;
                    });

                    const accessionNo = pickByAliases(n, [
                      ...HeaderAliases.accessionNo,
                      ...HeaderAliases.legacyBarcodeAsAccession,
                    ]);
                    const title = pickByAliases(n, HeaderAliases.title);
                    const year = pickByAliases(n, HeaderAliases.year);
                    const documentNo = pickByAliases(n, HeaderAliases.documentNo);
                    const docTypeText = pickByAliases(
                      n,
                      HeaderAliases.documentType
                    ).trim();

                    if (docTypeText) docTypeValues.add(docTypeText.toLowerCase());

                    const excludeNorm = new Set<string>([
                      ...HeaderAliases.accessionNo,
                      ...HeaderAliases.legacyBarcodeAsAccession,
                      ...HeaderAliases.title,
                      ...HeaderAliases.year,
                      ...HeaderAliases.documentType,
                      ...HeaderAliases.documentNo,
                    ]);
                    const extras: Record<string, any> = {};
                    Object.entries(originals).forEach(([origKey, val]) => {
                      const norm = normalizeKey(origKey);
                      if (!excludeNorm.has(norm) && val !== "") {
                        extras[origKey] = val;
                      }
                    });

                    const row: BulkRow = {
                      id: `${file.name}-${idx}-${makeId()}`,
                      title,
                      year,
                      accessionNo,
                      documentNo,
                      docTypeText,
                      extras,
                    };
                    row.errors = validate(row);
                    return row;
                  });

                  if ((rows?.length ?? 0) > 1000) {
                    toast.error(
                      `${file.name}: has ${rows.length} rows; maximum 1000 rows allowed. File skipped.`,
                      { autoClose: 15000 }
                    );
                    resolve({
                      fileName: file.name,
                      rows: [],
                      collapsed: false,
                    });
                    return;
                  }

                  if (rows.length > 0) {
                    if (docTypeValues.size === 0) {
                      toast.error(
                        `${file.name}: missing "Document Type" values. File skipped.`,
                        { autoClose: 15000 }
                      );
                      resolve({
                        fileName: file.name,
                        rows: [],
                        collapsed: false,
                      });
                      return;
                    }
                    if (docTypeValues.size > 1) {
                      toast.error(
                        `${file.name}: multiple "Document Type" values found. Expected all rows to match "${selectedContentTypeLabel}". File skipped.`,
                        { autoClose: 20000 }
                      );
                      resolve({
                        fileName: file.name,
                        rows: [],
                        collapsed: false,
                      });
                      return;
                    }
                    const csvDocType = Array.from(docTypeValues)[0];
                    if (csvDocType !== targetDocTypeLabel) {
                      toast.error(
                        `${file.name}: The selected Category (“${selectedContentTypeLabel}”) does not match the "Document Type" found in the CSV (“${csvDocType}”). Please make sure you select the correct category before uploading this file. File skipped.`,
                        { autoClose: 20000 }
                      );
                      resolve({
                        fileName: file.name,
                        rows: [],
                        collapsed: false,
                      });
                      return;
                    }
                  }

                  const lowerMap = new Map<string, number[]>();
                  rows.forEach((r, i) => {
                    const k = (r.accessionNo || "").trim().toLowerCase();
                    if (!k) return;
                    const arr = lowerMap.get(k) || [];
                    arr.push(i);
                    lowerMap.set(k, arr);
                  });
                  const intraDupLower = new Set(
                    Array.from(lowerMap.entries())
                      .filter(([, idxs]) => idxs.length > 1)
                      .map(([k]) => k)
                  );

                  if (intraDupLower.size > 0) {
                    rows = rows.map((r) => {
                      const k = (r.accessionNo || "").trim().toLowerCase();
                      if (!k || !intraDupLower.has(k)) return r;
                      const errs = new Set([
                        ...(r.errors || []),
                        "Duplicate in this upload",
                      ]);
                      return { ...r, errors: Array.from(errs) };
                    });
                    toast.error(
                      `${file.name}: Duplicate Accession Nos within this file.`,
                      { autoClose: 12000 }
                    );
                  }

                  const accessionNos = rows.map((r) => r.accessionNo);
                  const dbDupes = await fetchDbDuplicateAccessionNos(
                    accessionNos
                  );

                  if (dbDupes.lower.length > 0) {
                    const dbLower = new Set(dbDupes.lower);
                    rows = rows.map((r) => {
                      const k = (r.accessionNo || "").trim().toLowerCase();
                      if (!k || !dbLower.has(k)) return r;
                      const errs = new Set([
                        ...(r.errors || []),
                        "Duplicate: accession no exists in DB",
                      ]);
                      return { ...r, errors: Array.from(errs) };
                    });
                    const preview =
                      dbDupes.detail.slice(0, 20).join(", ") +
                      (dbDupes.detail.length > 20
                        ? ` (+${dbDupes.detail.length - 20} more)`
                        : "");
                    toast.error(
                      `[${file.name}] Already in DB: ${preview}`,
                      { autoClose: 20000 }
                    );
                  }

                  resolve({
                    fileName: file.name,
                    rows,
                    collapsed: false,
                    csvDocType: Array.from(docTypeValues)[0],
                  });
                } catch (e) {
                  reject(e);
                }
              },
              error: (err) => reject(err),
            });
          })
      );

      Promise.all(tasks)
        .then((newGroups) => {
          const nonEmpty = newGroups.filter((g) => g.rows.length > 0);
          if (nonEmpty.length === 0) return;
          setGroups((prev) => [...prev, ...nonEmpty]);
        })
        .catch((e) => {
          console.error(e);
          toast.error("Failed to parse one or more CSV files.", {
            autoClose: 15000,
          });
        })
        .finally(() => setParsing(false));
    },
    [groups, selectedContentType, selectedContentTypeLabel]
  );

  const onPick = () => {
    if (!selectedContentType) {
      toast.info("Please select a Category before choosing CSV files.", {
        autoClose: 8000,
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.currentTarget.value = "";
  };

  const clearAll = () => setGroups([]);

  const setCell = (
    fileName: string,
    rowId: string,
    key: keyof BulkRow,
    value: string | boolean
  ) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.fileName !== fileName) return g;
        const rows = g.rows.map((r) => {
          if (r.id !== rowId) return r;
          const next = { ...r, [key]: value } as BulkRow;
          next.errors = validate(next);
          return next;
        });
        return { ...g, rows };
      })
    );
  };

  const removeRow = (fileName: string, rowId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.fileName === fileName
          ? { ...g, rows: g.rows.filter((r) => r.id !== rowId) }
          : g
      )
    );
  };

  const toggleCollapse = (fileName: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.fileName === fileName ? { ...g, collapsed: !g.collapsed } : g
      )
    );
  };

  function previewList(list: string[], max = 20) {
    const shown = list.slice(0, max);
    const more = list.length > max ? ` (+${list.length - max} more)` : "";
    return `${shown.join(", ")}${more}`;
  }
  function previewIntra(
    items: Array<{ accession_no: string; indices: number[] }>,
    max = 15
  ) {
    const shown = items.slice(0, max);
    const head = shown
      .map(
        (d) =>
          `${d.accession_no} (rows ${d.indices.map((i) => i + 1).join(", ")})`
      )
      .join(", ");
    const more = items.length > max ? ` (+${items.length - max} more)` : "";
    return `${head}${more}`;
  }

  const submitFile = async (fileName: string) => {
    if (!selectedContentType) {
      toast.info("Please select a Category first.", { autoClose: 8000 });
      return;
    }
    if (submittingFile[fileName]) {
      toast.info("Submission already in progress…");
      return;
    }

    const group = groups.find((g) => g.fileName === fileName);
    if (!group) return;

    const invalid = group.rows.filter((r) => (r.errors?.length || 0) > 0);
    if (invalid.length > 0) {
      toast.error(
        `[${fileName}] Fix required fields (Title, 4-digit Year, Accession No.) and remove duplicates in rows with errors.`,
        { autoClose: 15000 }
      );
      return;
    }

    const payload = group.rows.map(({ id, errors, docTypeText, ...r }) => ({
      accession_no: r.accessionNo,
      document_no: r.documentNo || null,
      doc_title: r.title,
      doc_published_year: r.year,
      contentType: selectedContentType,
      doc_type_name: docTypeText || selectedContentTypeLabel || null,
      extras: r.extras || {},
    }));

    if (payload.length === 0) {
      toast.info(`[${fileName}] No rows to submit.`, { autoClose: 8000 });
      return;
    }

    setSubmittingFile((s) => ({ ...s, [fileName]: true }));
    const toastId = toast.loading(
      `[${fileName}] Inserting ${payload.length} rows…`
    );

    try {
      const res = await fetch("/api/bulk-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rows: payload }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && Array.isArray(data?.duplicates_in_payload)) {
          markIntraPayloadDuplicates(data.duplicates_in_payload, fileName);
          toast.update(toastId, {
            render: `[${fileName}] Duplicates inside this file: ${previewIntra(
              data.duplicates_in_payload
            )}`,
            type: "error",
            isLoading: false,
            autoClose: 20000,
          });
          return;
        }
        if (
          res.status === 409 &&
          (Array.isArray(data?.duplicates) ||
            Array.isArray(data?.duplicates_detail))
        ) {
          const list: string[] = Array.isArray(data.duplicates)
            ? data.duplicates.map(String)
            : (data.duplicates_detail || []).map((x: any) =>
                String(x.accession_no ?? x)
              );
          markDuplicateAccessionNos(list, fileName);
          toast.update(toastId, {
            render: `[${fileName}] Already in DB: ${previewList(list)}`,
            type: "error",
            isLoading: false,
            autoClose: 20000,
          });
          return;
        }
        toast.update(toastId, {
          render: `[${fileName}] ${data?.error || res.statusText}`,
          type: "error",
          isLoading: false,
          autoClose: 15000,
        });
        return;
      }

      if (data.failedCount > 0) {
        const first = data.failures?.[0];
        toast.update(toastId, {
          render: `[${fileName}] Inserted: ${data.inserted}. Failed: ${data.failedCount}${
            first?.message ? ` (e.g., ${first.message})` : ""
          }`,
          type: "error",
          isLoading: false,
          autoClose: 20000,
        });
      } else {
        toast.update(toastId, {
          render: `${data.inserted} rows inserted successfully!`,
          type: "success",
          isLoading: false,
          autoClose: 10000,
        });
        setGroups((prev) => prev.filter((g) => g.fileName !== fileName));
      }
    } catch (e) {
      console.error(e);
      toast.update(toastId, {
        render: `[${fileName}] Submit failed. See console for details.`,
        type: "error",
        isLoading: false,
        autoClose: 15000,
      });
    } finally {
      setSubmittingFile((s) => {
        const { [fileName]: _, ...rest } = s;
        return rest;
      });
    }
  };

  const anySubmitting = Object.values(submittingFile).some(Boolean);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={15000}
        pauseOnHover
        pauseOnFocusLoss
        newestOnTop
      />

      {anySubmitting && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow">
            <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-700">
              Processing… please wait
            </span>
          </div>
        </div>
      )}

      <MetadataWorkflowSteps current={2} />

      <motion.h2
        className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-saffron-deep to-peacock-deep mb-6 w-[90%]"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Metadata Upload (CSV Only)
      </motion.h2>

      <div className="p-4 mb-4 rounded-xl border border-peacock/20 bg-peacock-soft text-foreground/80">
        <label className="block mb-2">
          Category (Content Type) <span className="text-rose-600">*</span>
        </label>
        <div className="flex gap-3 items-center">
          <select
            value={selectedContentType}
            onChange={(e) => setSelectedContentType(e.target.value)}
            className="min-w-[260px] p-2 rounded-lg bg-white border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-peacock"
            disabled={anySubmitting || parsing}
          >
            <option value="">
              Select a category…
            </option>
            {contentTypes.map((ct) => (
              <option
                key={ct.id}
                value={String(ct.id)}
              >
                {ct.content_type}
              </option>
            ))}
          </select>

          {selectedContentType && (
            <>
              <span className="text-xs px-2 py-1 rounded bg-peacock-soft border border-peacock/30 text-peacock-deep">
                Selected ID: {selectedContentType}
              </span>
              <span className="text-xs px-2 py-1 rounded bg-leaf-soft border border-leaf/30 text-leaf">
                Expected "Document Type": {selectedContentTypeLabel || "—"}
              </span>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Each CSV must have headers for Accession No, Title, Document Type,
          and Year. You can select up to 5 files at a time, and each file may
          contain at most 1000 rows.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={onFileChange}
          className="hidden"
          disabled={anySubmitting || parsing}
        />
        <button
          type="button"
          onClick={onPick}
          className={`px-4 py-2 rounded-lg text-white ${
            selectedContentType
              ? "bg-primary hover:bg-primary/90"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!selectedContentType || anySubmitting || parsing}
          title={
            selectedContentType ? "Pick CSV files" : "Select a Category first"
          }
        >
          Select CSV Files
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="px-4 py-2 rounded-lg bg-white border border-border text-foreground hover:bg-muted disabled:opacity-60"
          disabled={anySubmitting || parsing}
        >
          Clear All
        </button>
      </div>

      <div className="mt-4 text-sm text-foreground/80">
        <span className="mr-4">
          Files: <strong>{groups.length}</strong>
        </span>
        <span className="mr-4">
          Total Rows: <strong>{totals.total}</strong>
        </span>
        <span className={totals.withErrors ? "text-rose-600 font-semibold" : ""}>
          With Errors: <strong>{totals.withErrors}</strong>
        </span>
        {parsing && <span className="ml-3">Parsing…</span>}
      </div>

      <div className="mt-6 space-y-6">
        {groups.length === 0 ? (
          <div className="p-6 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-600">
              To upload metadata, please browse and select the required CSV
              file.
            </p>
          </div>
        ) : (
          groups.map((g) => {
            const isFileSubmitting = !!submittingFile[g.fileName];
            const fileHasErrors = g.rows.some(
              (r) => (r.errors?.length || 0) > 0
            );

            return (
              <div
                key={g.fileName}
                className="p-6 bg-white rounded-lg shadow overflow-auto"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <motion.h3
                    className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-pink-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16V4a2 2 0 012-2h8a2 2 0 012 2v12m-6 4h6a2 2 0 002-2v-8a2 2 0 00-2-2h-6a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      {g.fileName}
                    </span>
                  </motion.h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {g.csvDocType && (
                      <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-emerald-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4"
                          />
                        </svg>
                        Document Type:{" "}
                        <span className="font-semibold">{g.csvDocType}</span>
                      </span>
                    )}
                    {fileHasErrors && (
                      <span className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200">
                        Errors present — fix before submitting
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(g.fileName)}
                      className={`px-3 py-1 rounded-lg transition-colors duration-150 ${
                        g.collapsed
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      } disabled:opacity-60`}
                      aria-label={
                        g.collapsed
                          ? "Expand file details"
                          : "Collapse file details"
                      }
                    >
                      {g.collapsed ? (
                        <span className="inline-flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 5v14m7-7H5"
                            />
                          </svg>
                          Expand
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 12H5"
                            />
                          </svg>
                          Collapse
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => submitFile(g.fileName)}
                      className={`px-4 py-2 rounded-lg transition-colors duration-150 ${
                        isFileSubmitting
                          ? "bg-blue-300 text-white cursor-not-allowed"
                          : fileHasErrors
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      } disabled:opacity-60 flex items-center gap-2`}
                      title={
                        fileHasErrors
                          ? "Fix duplicates / errors before submitting"
                          : "Submit all rows in this file"
                      }
                      disabled={isFileSubmitting || fileHasErrors}
                      aria-busy={isFileSubmitting}
                    >
                      {isFileSubmitting ? (
                        <>
                          <svg
                            className="w-4 h-4 animate-spin"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 2v4"
                            />
                          </svg>
                          Submitting…
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Submit This File
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {!g.collapsed && (
                  <>
                    <div className="text-xs text-gray-600 mb-3">
                      Rows: <strong>{g.rows.length}</strong>
                      {(() => {
                        const errs = g.rows.filter(
                          (r) => (r.errors?.length || 0) > 0
                        ).length;
                        return errs > 0 ? (
                          <span className="ml-3 text-xs font-semibold text-red-600">
                            Errors: {errs} — fix before submitting
                          </span>
                        ) : null;
                      })()}
                    </div>

                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="py-2 px-3">
                            Accession No <span className="text-red-500">*</span>
                          </th>
                          <th className="py-2 px-3">Document No</th>
                          <th className="py-2 px-3">
                            Title <span className="text-red-500">*</span>
                          </th>
                          <th className="py-2 px-3">
                            Year <span className="text-red-500">*</span>
                          </th>
                          <th className="py-2 px-3">Document Type</th>
                          <th className="py-2 px-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.rows.map((r) => {
                          const hasAccErr = (r.errors || []).some(
                            (er) =>
                              er.includes("Accession") ||
                              er.startsWith("Duplicate")
                          );
                          const hasTitleErr = (r.errors || []).includes(
                            "Title is required"
                          );
                          const hasYearErr = (r.errors || []).some((er) =>
                            er.startsWith("Year")
                          );
                          return (
                            <tr key={r.id} className="border-t">
                              <td className="py-2 px-3">
                                <input
                                  className={`w-full border rounded px-2 py-1 ${
                                    hasAccErr
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                  value={r.accessionNo}
                                  onChange={(e) =>
                                    setCell(
                                      g.fileName,
                                      r.id,
                                      "accessionNo",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Accession No."
                                />
                              </td>

                              <td className="py-2 px-3">
                                <input
                                  className="w-full border rounded px-2 py-1 border-gray-300"
                                  value={r.documentNo || ""}
                                  onChange={(e) =>
                                    setCell(
                                      g.fileName,
                                      r.id,
                                      "documentNo",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Document No (optional)"
                                />
                              </td>

                              <td className="py-2 px-3">
                                <input
                                  className={`w-full border rounded px-2 py-1 ${
                                    hasTitleErr
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                  value={r.title}
                                  onChange={(e) =>
                                    setCell(
                                      g.fileName,
                                      r.id,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Title"
                                />
                              </td>

                              <td className="py-2 px-3">
                                <input
                                  className={`w-full border rounded px-2 py-1 ${
                                    hasYearErr
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                  value={r.year}
                                  onChange={(e) =>
                                    setCell(
                                      g.fileName,
                                      r.id,
                                      "year",
                                      e.target.value
                                    )
                                  }
                                  placeholder="YYYY"
                                />
                              </td>

                              <td className="py-2 px-3 align-middle">
                                <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100 border border-gray-300">
                                  {r.docTypeText || "—"}
                                </span>
                              </td>

                              <td className="py-2 px-3">
                                <button
                                  type="button"
                                  className="text-red-600 hover:underline"
                                  onClick={() => removeRow(g.fileName, r.id)}
                                >
                                  Delete
                                </button>
                                {r.errors && r.errors.length > 0 && (
                                  <div className="text-xs text-red-600 mt-1">
                                    {r.errors.join("; ")}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}