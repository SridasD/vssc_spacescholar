"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Document {
    id: number;
    title: string;
    description: string | null;
    filename: string;
    file_type: string;
    file_size: number;
    file_path: string;
    created_at: string;
}
interface DocumentListProps {
    limit?: number;
}

export default function DocumentList({ limit }: DocumentListProps) {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await fetch("/api/documents");

                if (!response.ok) {
                    throw new Error("Failed to fetch documents");
                }

                const data = await response.json();
                setDocuments(data.documents || []);
            } catch (error) {
                console.error("Error fetching documents:", error);
                setError("Failed to load documents");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleDownload = (document: Document) => {
        if (typeof window !== 'undefined') {
            const link = window.document.createElement("a");
            link.href = document.file_path;
            link.setAttribute("download", document.filename);
            link.setAttribute("target", "_blank");
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this document?")) {
            return;
        }

        setDeletingId(id);

        try {
            const response = await fetch(`/api/documents/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete document");
            }

            setDocuments((prevDocuments) =>
                prevDocuments.filter((doc) => doc.id !== id)
            );

            router.refresh();
        } catch (error) {
            console.error("Error deleting document:", error);
            alert("Failed to delete document");
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-2 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="ml-2">Loading documents...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-600 bg-red-100 rounded-md">
                {error}
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-md">
                <p>No documents found. Upload your first document!</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Document
                        </th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Size
                        </th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Uploaded
                        </th>
                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((document) => (
                        <tr key={document.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{document.title}</div>
                                        {document.description && (
                                            <div className="text-sm text-gray-500">{document.description}</div>
                                        )}
                                        <div className="text-xs text-gray-500">{document.filename}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{formatFileSize(document.file_size)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{formatDate(document.created_at)}</div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                <button
                                    onClick={() => handleDownload(document)}
                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                    Download
                                </button>
                                <button
                                    onClick={() => handleDelete(document.id)}
                                    disabled={deletingId === document.id}
                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                >
                                    {deletingId === document.id ? "Deleting..." : "Delete"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}