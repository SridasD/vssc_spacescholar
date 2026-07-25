"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function XDocumentUploadForm() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        // Validate form fields
        if (!title.trim()) {
            setError("Title is required");
            setIsLoading(false);
            return;
        }

        if (!file) {
            setError("Please select a file to upload");
            setIsLoading(false);
            return;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError("File size exceeds 10MB limit");
            setIsLoading(false);
            return;
        }

        try {
            // Create form data for file upload
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("file", file);

            // Send upload request
            const response = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            // Reset form
            setTitle("");
            setDescription("");
            setFile(null);
            setSuccess("Document uploaded successfully!");

            // Refresh the documents list
            router.refresh();

            // Reset file input
            const fileInput = document.getElementById("file") as HTMLInputElement;
            if (fileInput) {
                fileInput.value = "";
            }
        } catch (error) {
            console.error("Upload error:", error);
            setError(error instanceof Error ? error.message : "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-3 text-sm text-green-600 bg-green-100 rounded-md">
                    {success}
                </div>
            )}

            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title*
                </label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Document title"
                    required
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Optional description"
                />
            </div>

            <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                    Document File*
                </label>
                <input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full px-3 py-2 mt-1 text-sm text-gray-500 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                />
                {file && (
                    <p className="mt-1 text-xs text-gray-500">
                        Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                )}
                <p className="mt-1 text-xs text-gray-500">Maximum file size: 10MB</p>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
                {isLoading ? "Uploading..." : "Upload Document"}
            </button>
        </form>
    );
}