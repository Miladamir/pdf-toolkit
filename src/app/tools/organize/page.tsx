"use client";

import { useState, useEffect } from "react";
import { useFiles } from "@/context/FileContext";
import { organizePdf, OrganizePageState } from "@/lib/tools/organize";
import { getPdfPageCount, renderPagesInBatch } from "@/lib/pdf";
import { DropZone } from "@/components/ui/DropZone";
import { JsonLd } from "@/components/seo/JsonLd";
import { allTools } from "@/lib/toolsConfig";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { PageOrganizer } from "@/components/ui/PageOrganizer";

export default function OrganizePdfPage() {
    const { files, addFiles, clearFiles } = useFiles();
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageCount, setPageCount] = useState(0);
    const [pagesState, setPagesState] = useState<OrganizePageState[]>([]);
    const { showToast } = useToast();

    // Load PDF Info
    useEffect(() => {
        const loadPages = async () => {
            if (files.length > 0) {
                const file = files[0].file;
                const count = await getPdfPageCount(file);
                setPageCount(count);

                // Initialize state with 0 rotation for all pages
                const initialState: OrganizePageState[] = Array.from({ length: count }, (_, i) => ({
                    originalIndex: i,
                    rotation: 0,
                }));
                setPagesState(initialState);
            }
        };
        loadPages();
    }, [files]);

    const handleProcess = async () => {
        if (files.length === 0 || pagesState.length === 0) return;

        setIsProcessing(true);
        try {
            await organizePdf(files[0].file, pagesState);
            showToast("PDF Organized Successfully!", "success");
        } catch (error) {
            console.error(error);
            showToast("Error organizing PDF.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper for related tools
    const relatedTools = allTools.filter(t => ['merge', 'split', 'grayscale', 'compress'].includes(t.id));

    // SEO Schema
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Organize PDF Pages",
        "step": [
            { "@type": "HowToStep", "name": "Upload Document", "text": "Upload the PDF file you wish to organize." },
            { "@type": "HowToStep", "name": "Manage Pages", "text": "Drag pages to reorder, click icons to rotate." },
            { "@type": "HowToStep", "name": "Save Changes", "text": "Download your newly organized PDF file." }
        ]
    };

    return (
        <main className="bg-slate-50 text-slate-800 antialiased pt-16">
            <JsonLd data={howToSchema} />

            {/* SECTION 1: HERO & TOOL INTERFACE */}
            <section className="max-w-5xl mx-auto px-4 py-12">

                {/* Tool Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200 mb-4">
                        <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5 animate-pulse"></span>
                        Visual Editor
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Organize PDF Pages
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Reorder, rotate, and delete pages visually. Drag and drop to get the perfect arrangement.
                    </p>
                </div>

                {/* Workspace Container */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 relative overflow-hidden">

                    {/* Decorative Background */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="relative bg-slate-50 rounded-2xl p-6">

                        {files.length === 0 ? (
                            <DropZone onFilesSelected={addFiles} accept=".pdf" multiple={false} />
                        ) : (
                            <div className="space-y-6">
                                {/* Editor Header */}
                                <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center text-red-500">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{files[0].file.name}</span>
                                    </div>
                                    <div className="flex space-x-2 text-xs font-medium text-slate-500 items-center">
                                        <span className="bg-slate-50 px-2 py-1 rounded">{pageCount} Pages</span>
                                        <button
                                            onClick={clearFiles}
                                            className="text-red-500 hover:text-red-700 font-semibold"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                {/* Editor Grid (Using PageOrganizer Component) */}
                                <div className="bg-white rounded-xl border border-slate-100 p-4 min-h-[300px]">
                                    {files.length > 0 && (
                                        <PageOrganizer
                                            file={files[0].file}
                                            onChange={(state) => setPagesState(state)}
                                        />
                                    )}
                                </div>

                                {/* Action Footer */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 text-center sm:text-left">
                                        Drag thumbnails to reorder. Hover over a page to rotate or delete.
                                    </p>
                                    <button
                                        onClick={handleProcess}
                                        disabled={isProcessing}
                                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 disabled:opacity-75"
                                    >
                                        {isProcessing ? "Saving..." : "Save & Download"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Drag & Drop Interface</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Unlimited Usage</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Instant Preview</div>
                </div>
            </section>

            {/* SECTION 2: HOW TO */}
            <section className="max-w-6xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">How to Organize Your PDF</h2>
                    <p className="text-slate-500 mt-2 max-w-xl mx-auto">Take control of your document structure in three easy steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-lg transition">
                        <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload PDF</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Select the PDF file you wish to modify. It will be rendered into a visual page display.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-lg transition">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Rearrange</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Drag pages to new positions. Rotate pages that are upside down. Delete pages you don't need.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-lg transition">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Download</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Click "Save" to apply your changes and download the newly organized PDF file.</p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: WHY ORGANIZE */}
            <section className="mt-24 bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-sm font-bold text-violet-600 uppercase tracking-wider">Why Organize?</span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Perfect Your Document Flow</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Disorganized PDFs can lead to confusion and unprofessional presentations. Whether you scanned a document in the wrong order, or simply need to remove irrelevant pages, our tool gives you full control without the need for expensive software like Adobe Acrobat.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Fix Scanning Errors</h4>
                                        <p className="text-sm text-slate-500">Instantly correct the order of scanned pages without re-scanning.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Create Clean Reports</h4>
                                        <p className="text-sm text-slate-500">Remove blank pages or irrelevant sections before sharing with clients.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Intuitive Interface</h4>
                                        <p className="text-sm text-slate-500">Visual thumbnails make it easy to see exactly what you are changing.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Visual */}
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative overflow-hidden hidden md:block">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-100 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <div className="relative flex justify-center space-x-4">
                                <div className="w-1/3 space-y-2 opacity-50">
                                    <div className="h-6 bg-slate-200 rounded w-full"></div>
                                    <div className="h-6 bg-slate-200 rounded w-full"></div>
                                    <div className="h-6 bg-slate-200 rounded w-full"></div>
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-8 h-8 text-violet-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                </div>
                                <div className="w-1/3 space-y-2">
                                    <div className="h-6 bg-violet-300 rounded w-full animate-pulse"></div>
                                    <div className="h-6 bg-violet-200 rounded w-full"></div>
                                    <div className="h-6 bg-slate-200 rounded w-full"></div>
                                </div>
                            </div>
                            <p className="text-center text-xs text-slate-500 mt-6 relative z-10">Visual Drag & Drop Reordering</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 4: FAQ */}
            <section className="max-w-4xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
                    <p className="text-slate-500 mt-2">Common questions about organizing PDF pages.</p>
                </div>

                <div className="space-y-4">
                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Can I undo changes in the organizer?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            While the tool is active, you can usually revert specific actions. However, once you click "Download," the changes are permanent. We recommend keeping a backup of your original file if you are unsure.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Is there a limit to the number of pages I can organize?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Our tool handles files of virtually any size. However, documents with hundreds of pages might take a few extra seconds to render the thumbnails initially. Performance depends on your device's memory.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Can I rotate a single page without rotating the whole document?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Yes! This is one of the most common uses for the organizer. Hover over the specific page thumbnail and click the rotate icon to turn just that page 90 degrees.
                        </div>
                    </details>
                </div>
            </section>

            {/* SECTION 5: RELATED TOOLS */}
            <section className="max-w-6xl mx-auto px-4 mt-24 pb-20">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-slate-900">Related PDF Tools</h2>
                    <p className="text-slate-500 mt-1 text-sm">Explore other free tools to finalize your document.</p>
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

// Helper for colors
const getIconColors = (id: string) => {
    const colors: Record<string, string> = {
        merge: "bg-indigo-50 text-indigo-600",
        split: "bg-pink-50 text-pink-600",
        grayscale: "bg-orange-50 text-orange-600",
        delete: "bg-red-50 text-red-600",
    };
    return colors[id] || "bg-slate-100 text-slate-600";
};