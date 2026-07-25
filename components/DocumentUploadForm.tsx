"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MAX_FILE_SIZE } from "@/lib/config/constants";

export default function DocumentUploadForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    addlauthor: "",
    description: "",
    file: null as File | null,
    publishYear: "",
    contentType: "",
    additionalDetails: [] as string[],
    is_restricted: "No",
    document_no: "",
    accession_no: "",
  });

  const [touched, setTouched] = useState({
    publishYear: false,
  });

  const [errors, setErrors] = useState({
    title: null as string | null,
    author: null as string | null,
    addlauthor: null as string | null,
    publishYear: null as string | null,
    file: null as string | null,
    contentType: null as string | null,
    document_no: null as string | null,
    accession_no: null as string | null,
  });

  type ContentType = string | { id: string; content_type: string };
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);

  useEffect(() => {
    const fetchContentTypes = async () => {
      try {
        const response = await fetch("/api/content-types");
        const data = await response.json();
        setContentTypes(data.contentTypes);
      } catch (error) {
        console.error("Error fetching content types:", error);
        toast.error("Failed to load content types");
      }
    };
    fetchContentTypes();
  }, []);

  const [chipInput, setChipInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (touched.publishYear) {
      validateField("publishYear", formData.publishYear);
    }
  }, [formData.publishYear, touched.publishYear]);

  const trimLeadingSpaces = (value: string) => value.replace(/^\s+/, "");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "file" && (e.target as HTMLInputElement).files) {
      const file = (e.target as HTMLInputElement).files![0];

      if (formData.contentType === "5") {
        setFormData((prevData) => ({ ...prevData, file: null }));
        setErrors((prevErrors) => ({ ...prevErrors, file: null }));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          file: `File size must be less than ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB`,
        }));
        toast.error(
          `File size must be less than ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB`
        );
        return;
      }

      if (!/\.(pdf)$/i.test(file.name)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          file: "Only PDF files are allowed",
        }));
        toast.error("Only PDF files are allowed");
        return;
      }

      setFormData((prevData) => ({ ...prevData, file }));
      setErrors((prevErrors) => ({ ...prevErrors, file: null }));
    } else {
      const sanitizedValue = DOMPurify.sanitize(trimLeadingSpaces(value));
      setFormData((prevData) => ({ ...prevData, [name]: sanitizedValue }));
      validateField(name, sanitizedValue);
    }
  };

  const validateField = (name: string, value: string) => {
    let error: string | null = null;

    if (name === "publishYear") {
      const currentYear = new Date().getFullYear();
      const minYear = 1900;

      if (!value.trim()) {
        error = "Publish year is required";
      } else {
        const yearNum = parseInt(value);
        if (isNaN(yearNum)) {
          error = "Publish year must be a number";
        } else if (yearNum < minYear) {
          error = `Publish year must be ${minYear} or later`;
        } else if (yearNum > currentYear) {
          error = `Publish year cannot be in the future (max: ${currentYear})`;
        } else if (!Number.isInteger(yearNum)) {
          error = "Publish year must be a whole number";
        }
      }
    }
    if (name === "title" && !value.trim()) error = "Title is required";
    if (name === "author" && !value.trim()) error = "Author is required";
    if (name === "contentType" && !value.trim())
      error = "Document Type is required";
    if (name === "accession_no" && !value.trim())
      error = "Accession Number is required";

    if (name === "file" && formData.contentType !== "5" && !value) {
      error = "File is required";
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
  };

  const isSubmitEnabled = () => {
    const isFileRequired = formData.contentType !== "5";
    return (
      !Object.values(errors).some((error) => error !== null) &&
      formData.title.trim() &&
      formData.author.trim() &&
      formData.publishYear.trim() &&
      formData.contentType.trim() &&
      formData.accession_no.trim() &&
      (!isFileRequired || formData.file !== null)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmitEnabled()) {
      toast.error("Please correct errors before submitting.");
      return;
    }

    setIsLoading(true);
    setSuccess("");

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      const value = (formData as any)[key];
      if (key === "additionalDetails") {
        data.append(key, JSON.stringify(value));
      } else if (key === "file" && formData.contentType === "5") {
        return;
      } else if (value) {
        if (Array.isArray(value)) {
          value.forEach((item) => data.append(key, item));
        } else {
          data.append(key, value);
        }
      }
    });

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: data,
      });
      const responseData = await response.json();

      if (response.ok) {
        setSuccess("Document uploaded successfully!");
        toast.success("Document uploaded successfully!");

        setFormData({
          title: "",
          author: "",
          addlauthor: "",
          description: "",
          file: null,
          publishYear: "",
          contentType: "",
          additionalDetails: [],
          is_restricted: "No",
          document_no: "",
          accession_no: "",
        });

        const fileInput = document.getElementById("file") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        router.refresh();
      } else {
        throw new Error(responseData.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipAdd = () => {
    if (chipInput.trim()) {
      setFormData((prevData) => ({
        ...prevData,
        additionalDetails: [...prevData.additionalDetails, chipInput.trim()],
      }));
      setChipInput("");
    }
  };

  const handleChipDelete = (index: number) => {
    const newAdditionalDetails = formData.additionalDetails.filter(
      (_, idx) => idx !== index
    );
    setFormData((prevData) => ({
      ...prevData,
      additionalDetails: newAdditionalDetails,
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  const inputBase =
    "w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 text-slate-900 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-500 transition-all duration-200";
  const inputError =
    "w-full px-3.5 py-2.5 text-sm bg-white border border-red-300 text-slate-900 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all duration-200";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="bg-gradient-to-br from-teal-50/80 via-white to-amber-50/40 backdrop-blur-sm rounded-2xl border border-teal-200/50 p-6 sm:p-8 shadow-[0_4px_20px_rgba(13,148,136,0.08)]">
      <ToastContainer position="top-right" autoClose={3000} />

      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div variants={itemVariants} className="mb-7">
          <h1 className="text-2xl font-medium tracking-tight text-slate-900">
            Document upload
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Fill in the details below and attach your PDF.
          </p>
        </motion.div>

        {success && (
          <motion.div
            className="mb-5 p-3.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 text-sm"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {success}
          </motion.div>
        )}

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        >
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Left column */}
            <div className="space-y-5">
              <motion.div variants={itemVariants}>
                <label className={labelClass}>
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={errors.title ? inputError : inputBase}
                  placeholder="Enter document title"
                />
                {errors.title && (
                  <p className="mt-1 text-red-600 text-xs">{errors.title}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className={labelClass}>
                  Author <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  className={errors.author ? inputError : inputBase}
                  placeholder="Enter author name"
                />
                {errors.author && (
                  <p className="mt-1 text-red-600 text-xs">{errors.author}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className={labelClass}>Additional Author</label>
                <input
                  type="text"
                  name="addlauthor"
                  value={formData.addlauthor}
                  onChange={handleChange}
                  className={errors.addlauthor ? inputError : inputBase}
                  placeholder="Enter additional author"
                />
                {errors.addlauthor && (
                  <p className="mt-1 text-red-600 text-xs">{errors.addlauthor}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className={labelClass}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={inputBase}
                  placeholder="Enter document description"
                />
              </motion.div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <motion.div variants={itemVariants}>
                <label className={labelClass}>Document No</label>
                <input
                  type="text"
                  name="document_no"
                  value={formData.document_no}
                  onChange={handleChange}
                  className={errors.document_no ? inputError : inputBase}
                  placeholder="Enter document classification number"
                />
                {errors.document_no && (
                  <p className="mt-1 text-red-600 text-xs">
                    {errors.document_no}
                  </p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className={labelClass}>
                  Accession Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accession_no"
                  value={formData.accession_no}
                  onChange={handleChange}
                  className={errors.accession_no ? inputError : inputBase}
                  placeholder="Enter accession number"
                />
                {errors.accession_no && (
                  <p className="mt-1 text-red-600 text-xs">
                    {errors.accession_no}
                  </p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className={labelClass}>
                  Publish Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="publishYear"
                  value={formData.publishYear}
                  onChange={handleChange}
                  pattern="[0-9]{4}"
                  maxLength={4}
                  className={errors.publishYear ? inputError : inputBase}
                  placeholder="YYYY"
                />
                {errors.publishYear && (
                  <p className="mt-1 text-red-600 text-xs">
                    {errors.publishYear}
                  </p>
                )}
              </motion.div>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
                variants={itemVariants}
              >
                <div>
                  <label className={labelClass}>
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleChange}
                    className={errors.contentType ? inputError : inputBase}
                  >
                    <option value="">Select a type…</option>
                    {contentTypes.map((type, index) => {
                      const isTypeObject =
                        typeof type === "object" && type !== null;
                      const id = isTypeObject
                        ? (type as { id: string }).id
                        : type;
                      const contentTypeName = isTypeObject
                        ? (type as { content_type: string }).content_type
                        : type;
                      return (
                        <option key={id || `type-${index}`} value={id}>
                          {contentTypeName}
                        </option>
                      );
                    })}
                  </select>
                  {errors.contentType && (
                    <p className="mt-1 text-red-600 text-xs">
                      {errors.contentType}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Is Access Restricted?</label>
                  <select
                    name="is_restricted"
                    value={formData.is_restricted}
                    onChange={handleChange}
                    className={inputBase}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Full-width sections */}
          <motion.div variants={containerVariants} className="mt-6 space-y-5">
            <motion.div variants={itemVariants}>
              <label className={labelClass}>Additional Details</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chipInput}
                  onChange={(e) => setChipInput(e.target.value)}
                  className={inputBase}
                  placeholder="Type and press Enter to add details"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleChipAdd();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleChipAdd}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 transition-colors shadow-sm whitespace-nowrap"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {formData.additionalDetails.map((detail, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <span className="text-teal-800 text-xs">{detail}</span>
                    <button
                      type="button"
                      onClick={() => handleChipDelete(index)}
                      className="w-4 h-4 rounded-full flex items-center justify-center bg-teal-200 hover:bg-teal-300 transition-colors text-teal-800 text-xs leading-none"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {formData.contentType !== "5" && (
              <motion.div variants={itemVariants}>
                <label className={labelClass}>
                  Document File <span className="text-red-500">*</span>
                </label>
                <div className="relative p-6 border-2 border-dashed border-teal-300 rounded-xl bg-teal-50/40 hover:bg-teal-50/70 hover:border-teal-400 transition-colors">
                  <input
                    id="file"
                    name="file"
                    type="file"
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <svg
                      className="mx-auto h-10 w-10 text-teal-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.6"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      Drag and drop your file, or click to select
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      PDF only, maximum {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB
                    </p>
                  </div>
                </div>

                {formData.file && (
                  <motion.div
                    className="mt-3 p-3 bg-white border border-teal-200 rounded-lg flex items-center shadow-sm"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <svg
                      className="h-4 w-4 text-teal-600 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-sm text-slate-800">
                      {formData.file.name}{" "}
                      <span className="text-slate-500">
                        ({(formData.file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </span>
                  </motion.div>
                )}

                {errors.file && (
                  <p className="mt-1 text-red-600 text-xs">{errors.file}</p>
                )}
              </motion.div>
            )}

            <motion.div
              variants={itemVariants}
              className="pt-5 mt-5 border-t border-slate-200 flex justify-end gap-3"
            >
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isSubmitEnabled() || isLoading}
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center transition-all shadow-sm ${
                  isSubmitEnabled() && !isLoading
                    ? "bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white hover:shadow-md"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Uploading…
                  </>
                ) : (
                  "Upload Document"
                )}
              </button>
            </motion.div>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}