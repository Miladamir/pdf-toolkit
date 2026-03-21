"use client";

import { useEffect, useState } from "react";
import { renderPageToImage } from "@/lib/pdf";

interface PdfThumbnailProps {
    file: File;
    pageNum?: number;
}

export const PdfThumbnail: React.FC<PdfThumbnailProps> = ({ file, pageNum = 1 }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const generateThumbnail = async () => {
            setLoading(true);
            const url = await renderPageToImage(file, pageNum);
            setThumbnailUrl(url);
            setLoading(false);
        };

        if (file) {
            generateThumbnail();
        }

        // Cleanup: Revoke URL to prevent memory leaks
        return () => {
            if (thumbnailUrl) {
                URL.revokeObjectURL(thumbnailUrl);
            }
        };
    }, [file, pageNum]);

    if (loading) {
        return (
            <div className="w-32 h-44 bg-slate-200 animate-pulse rounded-lg flex items-center justify-center">
                <span className="text-xs text-slate-400">Loading...</span>
            </div>
        );
    }

    if (!thumbnailUrl) {
        return (
            <div className="w-32 h-44 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-xs text-red-400">Error</span>
            </div>
        );
    }

    return (
        <div className="w-32 h-44 shadow-md rounded-lg overflow-hidden border border-border bg-white">
            <img
                src={thumbnailUrl}
                alt={`Page ${pageNum}`}
                className="w-full h-full object-cover"
            />
        </div>
    );
};