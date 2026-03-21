"use client";

import { useState, useEffect } from "react";
import { renderPageToImage } from "@/lib/pdf";
import { getPdfPageCount, renderPagesInBatch } from "@/lib/pdf";

interface PageSelectorProps {
    file: File;
    selectedPages: Set<number>; // 0-based indices
    onTogglePage: (index: number) => void;
}

const BATCH_SIZE = 20; // Pages per load

export const PageSelector: React.FC<PageSelectorProps> = ({
    file,
    selectedPages,
    onTogglePage,
}) => {
    const [pageUrls, setPageUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPageBatch, setCurrentPageBatch] = useState(0); // 0-indexed batch

    useEffect(() => {
        const loadPages = async () => {
            setLoading(true);
            const count = await getPdfPageCount(file);
            setTotalPages(count);

            // Calculate range for current batch
            const start = currentPageBatch * BATCH_SIZE;
            const end = Math.min(start + BATCH_SIZE, count);

            // Use the parallel renderer!
            const urlMap = await renderPagesInBatch(file, start + 1, end);

            // Convert Map to Array for rendering
            const urls: string[] = [];
            for (let i = start + 1; i <= end; i++) {
                urls.push(urlMap.get(i) || "");
            }

            setPageUrls(urls);
            setLoading(false);
        };

        if (file) loadPages();
    }, [file, currentPageBatch]); // Re-run when batch changes

    const totalPagesCount = Math.ceil(totalPages / BATCH_SIZE);

    return (
        <div className="space-y-6">
            {/* Page Info */}
            <div className="text-center text-sm text-muted-foreground">
                Showing Page {currentPageBatch * BATCH_SIZE + 1} - {Math.min((currentPageBatch + 1) * BATCH_SIZE, totalPages)} of {totalPages}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(BATCH_SIZE)].map((_, i) => (
                        <div key={i} className="w-full h-48 bg-slate-200 animate-pulse rounded-lg"></div>
                    ))}
                </div>
            )}

            {/* Page Grid */}
            {!loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {pageUrls.map((url, index) => {
                        // Calculate actual page index (0-based)
                        const actualIndex = (currentPageBatch * BATCH_SIZE) + index;
                        const isSelected = selectedPages.has(actualIndex);

                        return (
                            <div
                                key={actualIndex}
                                onClick={() => onTogglePage(actualIndex)}
                                className={`
                  relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                  ${isSelected
                                        ? "border-red-500 opacity-50 bg-red-50"
                                        : "border-transparent hover:border-primary"
                                    }
                `}
                            >
                                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                                    Page {actualIndex + 1}
                                </div>

                                {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 z-20">
                                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            Deleted
                                        </span>
                                    </div>
                                )}

                                <img src={url} alt={`Page ${actualIndex + 1}`} className="w-full h-auto" />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalPages > BATCH_SIZE && (
                <div className="flex justify-center items-center gap-4 pt-4">
                    <button
                        onClick={() => setCurrentPageBatch(prev => Math.max(prev - 1, 0))}
                        disabled={currentPageBatch === 0}
                        className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-200"
                    >
                        ← Previous
                    </button>

                    <span className="text-sm text-muted-foreground">
                        Page Set {currentPageBatch + 1} of {totalPagesCount}
                    </span>

                    <button
                        onClick={() => setCurrentPageBatch(prev => (prev < totalPagesCount - 1 ? prev + 1 : prev))}
                        disabled={currentPageBatch >= totalPagesCount - 1}
                        className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-200"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};