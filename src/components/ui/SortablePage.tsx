"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortablePageProps {
    id: string;
    index: number; // 1-based
    rotation: number;
    url: string;
    onRotate: () => void;
    onDelete?: () => void; // Added delete handler
}

export const SortablePage: React.FC<SortablePageProps> = ({
    id,
    index,
    rotation,
    url,
    onRotate,
    onDelete,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden group cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:border-violet-300"
        >
            {/* Image Container with Rotation */}
            <div
                className="relative w-full aspect-[8/11] bg-slate-100 overflow-hidden"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                <img src={url} alt={`Page ${index}`} className="w-full h-full object-cover" />
            </div>

            {/* Page Number */}
            <span className="block text-center text-xs text-slate-500 font-medium py-1 border-t border-slate-100 bg-slate-50">
                {index}
            </span>

            {/* Hover Controls Overlay */}
            <div className="page-controls absolute top-1 right-1 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                {/* Rotate Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onRotate(); }}
                    className="w-6 h-6 bg-white rounded shadow text-slate-500 hover:text-violet-600 hover:bg-violet-50 flex items-center justify-center transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>

                {/* Delete Button */}
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="w-6 h-6 bg-white rounded shadow text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                )}
            </div>

            {/* Drag Handle (Invisible layer over the image to allow dragging) */}
            <div
                {...attributes}
                {...listeners}
                className="absolute inset-0 z-0"
                style={{ top: 0, bottom: '24px' }} // Exclude bottom number area from drag start if desired, or cover all
            />
        </div>
    );
};