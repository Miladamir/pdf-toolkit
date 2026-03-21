"use client";

import { useState, useEffect } from "react";
import { useFiles } from "@/context/FileContext";
import { imageToPdf } from "@/lib/tools/imageToPdf";
import { DropZone } from "@/components/ui/DropZone";
import { JsonLd } from "@/components/seo/JsonLd";
import { allTools } from "@/lib/toolsConfig";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Component for a single sortable image card
const SortableImage = ({ id, file, index, onRemove }: { id: string; file: File; index: number; onRemove: (id: string) => void }) => {
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

    const url = URL.createObjectURL(file);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden group cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-emerald-300"
        >
            <div className="w-full aspect-[8/11] bg-slate-100 overflow-hidden">
                <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
            </div>
            <span className="block text-center text-xs text-slate-500 font-medium py-1 border-t border-slate-100 bg-slate-50">
                {index + 1}
            </span>

            {/* Delete Button Overlay */}
            <button
                onClick={() => onRemove(id)}
                className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full shadow text-slate-400 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            {/* Drag Handle Layer */}
            <div {...attributes} {...listeners} className="absolute inset-0 z-0" />
        </div>
    );
};

export default function ImageToPdfPage() {
    const { files, addFiles, clearFiles, removeFile } = useFiles();
    const [isProcessing, setIsProcessing] = useState(false);
    const { showToast } = useToast();

    // Local state for the order of file IDs
    const [orderedIds, setOrderedIds] = useState<string[]>([]);

    // Sync local IDs when files context changes
    useEffect(() => {
        // If files exist and we haven't synced yet, or if files were added
        // We simply map the files to their IDs.
        // This maintains order for new files appended at the end.
        setOrderedIds(prev => {
            const currentFileIds = files.map(f => f.id);
            // If files were removed, filter them out
            const newIds = prev.filter(id => currentFileIds.includes(id));
            // If files were added, append them
            const addedIds = currentFileIds.filter(id => !prev.includes(id));
            return [...newIds, ...addedIds];
        });
    }, [files]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Handle Drag End - Reorder Logic
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setOrderedIds((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Get ordered files based on our local state
    const orderedFiles = orderedIds
        .map(id => files.find(f => f.id === id))
        .filter(Boolean) as { id: string; file: File }[];

    const handleRemove = (id: string) => {
        removeFile(id);
        // State sync will happen in useEffect
    };

    const handleProcess = async () => {
        if (orderedFiles.length === 0) {
            showToast("Please select at least one image.", "error");
            return;
        }
        setIsProcessing(true);
        try {
            await imageToPdf(orderedFiles.map(f => f.file));
            showToast("PDF Created Successfully!", "success");
        } catch (error) {
            console.error(error);
            showToast("Error creating PDF.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Related Tools
    const relatedTools = allTools.filter(t => ['pdf-to-image', 'merge', 'delete', 'watermark'].includes(t.id));

    // Schema
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Convert Images to PDF",
        "step": [
            { "@type": "HowToStep", "name": "Upload Images", "text": "Select multiple JPG, PNG, or image files." },
            { "@type": "HowToStep", "name": "Arrange Order", "text": "Drag and drop images to set their order." },
            { "@type": "HowToStep", "name": "Create PDF", "text": "Click 'Convert' to generate your PDF." }
        ]
    };

    return (
        <main className="bg-slate-50 text-slate-800 antialiased pt-16">
            <JsonLd data={howToSchema} />

            {/* SECTION 1: HERO & TOOL INTERFACE */}
            <section className="max-w-4xl mx-auto px-4 py-12">

                {/* Tool Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 mb-4">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                        Create PDF Instantly
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Image to PDF Converter
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Combine JPG, PNG, and other images into a single PDF document.
                    </p>
                </div>

                {/* Workspace Container */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 relative overflow-hidden">

                    {/* Decorative Background */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="relative bg-slate-50 rounded-2xl p-6">

                        {files.length === 0 ? (
                            <DropZone
                                onFilesSelected={addFiles}
                                accept="image/*"
                                multiple
                            />
                        ) : (
                            <div className="space-y-6">
                                {/* Editor Header */}
                                <div className="flex justify-between items-center mb-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-emerald-100 rounded flex items-center justify-center text-emerald-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{files.length} Images Selected</span>
                                    </div>
                                    <div className="text-xs font-medium text-slate-500">Drag to reorder</div>
                                </div>

                                {/* Image Grid with DnD */}
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-4 bg-white rounded-xl border border-slate-100 min-h-[300px]">
                                            {orderedFiles.map((item, index) => (
                                                <SortableImage
                                                    key={item.id}
                                                    id={item.id}
                                                    file={item.file}
                                                    index={index}
                                                    onRemove={handleRemove}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>

                                {/* Action Footer */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                                    <label className="cursor-pointer text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                        Add More Images
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
                                        />
                                    </label>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={clearFiles}
                                            className="px-4 py-2 text-sm text-slate-500 hover:text-red-600 transition"
                                        >
                                            Clear All
                                        </button>
                                        <button
                                            onClick={handleProcess}
                                            disabled={isProcessing}
                                            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 disabled:opacity-75"
                                        >
                                            {isProcessing ? "Creating..." : "Create PDF"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Any Image Format</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Preserves Quality</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Unlimited Files</div>
                </div>
            </section>

            {/* SECTION 2: HOW TO */}
            <section className="max-w-6xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">How to Convert Images to PDF</h2>
                    <p className="text-slate-500 mt-2 max-w-xl mx-auto">Create a PDF from your photos or scans in seconds.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload Images</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Select multiple JPG, PNG, TIFF, or BMP files to convert.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Reorder</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Drag thumbnails to arrange the order of images in the final PDF.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Convert</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Click the button to generate and download your combined PDF.</p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: WHY USE THIS TOOL */}
            <section className="mt-24 bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Left: Visual */}
                        <div className="relative hidden md:block">
                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative z-10">
                                <div className="flex justify-center items-center space-x-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="w-16 h-20 bg-white border border-slate-200 rounded shadow-sm"></div>
                                        <div className="w-16 h-20 bg-white border border-slate-200 rounded shadow-sm"></div>
                                        <div className="w-16 h-20 bg-white border border-slate-200 rounded shadow-sm"></div>
                                    </div>

                                    <div className="text-2xl text-emerald-500">→</div>

                                    <div className="w-20 h-28 bg-white border border-slate-200 rounded shadow-md flex items-center justify-center text-slate-300 font-bold text-xs">
                                        PDF
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-500 mt-6 font-medium">Combine multiple formats into one PDF</p>
                            </div>
                        </div>

                        {/* Right: Content */}
                        <div>
                            <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Document Creation</span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Why Convert Images to PDF?</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Converting images to PDF is essential for professional archiving, sharing, and printing. PDFs maintain the layout and quality of your images across all devices, ensuring your photos or scanned documents look exactly as intended.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Professional Portfolios</h4>
                                        <p className="text-sm text-slate-500">Combine artwork or photography into a single, presentable document.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Scanned Documents</h4>
                                        <p className="text-sm text-slate-500">Merge multiple scan files into one cohesive digital document.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Secure Sharing</h4>
                                        <p className="text-sm text-slate-500">PDFs are harder to edit than images, keeping your content safe.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 4: WHY CHOOSE US (Brand UVP) - FULL GRID */}
            <section className="bg-slate-900 py-20 mt-24 relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900 rounded-full blur-3xl opacity-30"></div>

                <div className="max-w-6xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-3">Why Choose PDF Toolkit?</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Built for users who demand speed, privacy, and quality without compromise.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Feature 1 */}
                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Total Privacy</h3>
                            <p className="text-slate-400 text-sm">We never upload your files to a remote server. Everything stays in your browser.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Blazing Fast</h3>
                            <p className="text-slate-400 text-sm">No upload queues. Local processing means instant results every time.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">High Quality</h3>
                            <p className="text-slate-400 text-sm">We preserve the original resolution of your images. No blurry documents.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-400 mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">100% Free</h3>
                            <p className="text-slate-400 text-sm">No hidden fees, no forced accounts. Just free tools for everyone.</p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No Watermarks</h3>
                            <p className="text-slate-400 text-sm">We never brand your documents. Your files belong to you.</p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Works Offline</h3>
                            <p className="text-slate-400 text-sm">Since processing is local, you can work even without internet.</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* SECTION 5: FAQ */}
            <section className="max-w-4xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
                    <p className="text-slate-500 mt-2">Common questions about converting images to PDF.</p>
                </div>

                <div className="space-y-4">
                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Which image formats are supported?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            We support all major image formats including JPG, PNG, TIFF, BMP, GIF, and WebP. You can even mix different formats in a single PDF.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Is there a limit to the number of images?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            There is no hard limit imposed by the tool. However, creating a PDF from hundreds of high-resolution images may require a computer with sufficient memory.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Will the images lose quality?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            No. We embed the original images into the PDF container without re-compressing them. This ensures your photos remain crisp and clear.
                        </div>
                    </details>
                </div>
            </section>

            {/* SECTION 6: RELATED TOOLS */}
            <section className="max-w-6xl mx-auto px-4 mt-24 pb-20">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-slate-900">Related PDF Tools</h2>
                    <p className="text-slate-500 mt-1 text-sm">Explore other free tools for your workflow.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {relatedTools.map(tool => (
                        <Link key={tool.id} href={tool.path} className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition flex flex-col items-center text-center">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${getIconColors(tool.id)}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tool.icon}></path>
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-700 group-hover:text-brand-600">{tool.name}</h3>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}

const getIconColors = (id: string) => {
    const colors: Record<string, string> = {
        "pdf-to-image": "bg-amber-50 text-amber-600",
        merge: "bg-indigo-50 text-indigo-600",
        delete: "bg-rose-50 text-rose-600",
        watermark: "bg-orange-50 text-orange-600",
    };
    return colors[id] || "bg-slate-100 text-slate-600";
};