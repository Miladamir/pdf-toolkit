"use client";

import { useState, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { getPdfPageCount } from "@/lib/pdf";
import { renderPagesInBatch } from "@/lib/pdf"; // Import the fast batch renderer
import { SortablePage } from "./SortablePage";
import { OrganizePageState } from "@/lib/tools/organize";

interface PageState extends OrganizePageState {
    id: string;
    url: string;
}

interface PageOrganizerProps {
    file: File;
    onChange: (pages: PageState[]) => void;
}

const BATCH_SIZE = 30; // Load 30 pages at a time for speed

export const PageOrganizer: React.FC<PageOrganizerProps> = ({ file, onChange }) => {
    const [allPages, setAllPages] = useState<PageState[]>([]); // Master list of state
    const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);

    // 1. Initialize state with page counts (Instant)
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const count = await getPdfPageCount(file);
            setTotalPages(count);

            // Create placeholder objects immediately (no images yet)
            const initialPages: PageState[] = Array.from({ length: count }, (_, i) => ({
                id: `page-${i}`,
                originalIndex: i,
                rotation: 0,
                url: "" // Empty initially
            }));

            setAllPages(initialPages);
            setLoading(false);
        };

        if (file) init();
    }, [file]);

    // 2. Load images ONLY for the current batch (Fast)
    useEffect(() => {
        if (allPages.length === 0) return;

        const loadBatch = async () => {
            const start = currentBatchIndex * BATCH_SIZE;
            const end = Math.min(start + BATCH_SIZE, totalPages);

            // Render this batch in parallel
            const urlMap = await renderPagesInBatch(file, start + 1, end);

            // Update the master state with new URLs
            setAllPages(prev => {
                const newPages = [...prev];
                urlMap.forEach((url, pageNum) => {
                    // pageNum is 1-based
                    const index = pageNum - 1;
                    if (newPages[index]) {
                        newPages[index] = { ...newPages[index], url };
                    }
                });
                return newPages;
            });
        };

        loadBatch();
    }, [currentBatchIndex, file, totalPages]);

    // Notify parent of changes
    useEffect(() => {
        onChange(allPages);
    }, [allPages]);

    // Drag and Drop Logic
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setAllPages(items => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleRotate = (id: string) => {
        setAllPages(items =>
            items.map(item =>
                item.id === id ? { ...item, rotation: (item.rotation + 90) % 360 } : item
            )
        );
    };

    // Get only the pages for the current view
    const start = currentBatchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, totalPages);
    const currentViewPages = allPages.slice(start, end);

    if (loading) return <div className="text-center p-8 text-muted-foreground">Analyzing document...</div>;

    return (
        <div className="space-y-6">
            {/* Navigation */}
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border">
                <button
                    onClick={() => setCurrentBatchIndex(i => i - 1)}
                    disabled={currentBatchIndex === 0}
                    className="px-4 py-2 bg-white border rounded shadow-sm disabled:opacity-50"
                >
                    ← Previous {BATCH_SIZE}
                </button>
                <span className="font-medium text-sm text-foreground">
                    Showing {start + 1} - {end} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentBatchIndex(i => i + 1)}
                    disabled={end >= totalPages}
                    className="px-4 py-2 bg-white border rounded shadow-sm disabled:opacity-50"
                >
                    Next {BATCH_SIZE} →
                </button>
            </div>

            {/* Grid */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={currentViewPages} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {currentViewPages.map((page) => (
                            page.url ? ( // Only render if URL exists
                                <SortablePage
                                    key={page.id}
                                    id={page.id}
                                    index={page.originalIndex + 1}
                                    rotation={page.rotation}
                                    url={page.url}
                                    onRotate={() => handleRotate(page.id)}
                                />
                            ) : (
                                // Skeleton for missing images in batch (rare, but good fallback)
                                <div key={page.id} className="h-48 bg-slate-100 animate-pulse rounded-lg" />
                            )
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};