"use client";

import { useState, useEffect } from "react";
import { useFiles } from "@/context/FileContext";
import { splitPdf } from "@/lib/tools/split";
import { getPdfPageCount, renderPagesInBatch } from "@/lib/pdf";
import { DropZone } from "@/components/ui/DropZone";
import { JsonLd } from "@/components/seo/JsonLd";
import { allTools } from "@/lib/toolsConfig";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";

export default function SplitPdfPage() {
    const { files, addFiles, clearFiles } = useFiles();
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageCount, setPageCount] = useState(0);
    const [pageUrls, setPageUrls] = useState<Map<number, string>>(new Map());
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const { showToast } = useToast();

    // Load Page Info and Thumbnails
    useEffect(() => {
        const loadPages = async () => {
            if (files.length > 0) {
                const file = files[0].file;
                const count = await getPdfPageCount(file);
                setPageCount(count);

                // Render thumbnails (batch of first 30 for speed, or all if small)
                const end = Math.min(count, 30);
                const urls = await renderPagesInBatch(file, 1, end);
                setPageUrls(urls);

                // Reset selection
                setSelectedPages(new Set());
            }
        };
        loadPages();
    }, [files]);

    const togglePage = (index: number) => {
        const newSet = new Set(selectedPages);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedPages(newSet);
    };

    const selectAll = () => {
        const all = new Set(Array.from({ length: pageCount }, (_, i) => i));
        setSelectedPages(all);
    };

    const deselectAll = () => {
        setSelectedPages(new Set());
    };

    const handleSplit = async (mode: 'selected' | 'all') => {
        if (files.length === 0) return;

        let rangeString = "";
        if (mode === 'all') {
            rangeString = "all";
        } else {
            if (selectedPages.size === 0) {
                showToast("Please select at least one page.", "error");
                return;
            }
            // Convert Set to string like "1,3,5"
            rangeString = Array.from(selectedPages).sort((a, b) => a - b).map(i => i + 1).join(',');
        }

        setIsProcessing(true);
        try {
            await splitPdf(files[0].file, rangeString);
            showToast("PDF Split Successfully!", "success");
        } catch (error) {
            console.error(error);
            showToast("Error splitting PDF.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper for related tools
    const relatedTools = allTools.filter(t => ['merge', 'grayscale', 'organize', 'delete'].includes(t.id));

    // SEO Schema
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Split PDF Files",
        "step": [
            { "@type": "HowToStep", "name": "Upload PDF", "text": "Select the PDF file you wish to split." },
            { "@type": "HowToStep", "name": "Select Pages", "text": "Choose specific pages by clicking on them." },
            { "@type": "HowToStep", "name": "Download", "text": "Download your extracted pages." }
        ]
    };

    return (
        <main className="bg-slate-50 text-slate-800 antialiased pt-16">
            <JsonLd data={howToSchema} />

            {/* SECTION 1: HERO & TOOL INTERFACE */}
            <section className="max-w-4xl mx-auto px-4 py-12">

                {/* Tool Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-pink-100 text-pink-700 border border-pink-200 mb-4">
                        <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-1.5 animate-pulse"></span>
                        Extract Pages Instantly
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Split PDF Files
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Extract specific pages from a PDF or split the entire document into individual files.
                    </p>
                </div>

                {/* Workspace Container */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 relative overflow-hidden">

                    {/* Decorative Background */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="relative bg-slate-50 rounded-2xl p-6">

                        {files.length === 0 ? (
                            <DropZone onFilesSelected={addFiles} accept=".pdf" multiple={false} />
                        ) : (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600 font-bold text-sm">
                                            PDF
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-900 truncate max-w-xs">{files[0].file.name}</h3>
                                            <p className="text-xs text-slate-500">{pageCount} Pages</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={clearFiles}
                                        className="text-xs text-slate-500 hover:text-red-600 transition font-medium"
                                    >
                                        Clear
                                    </button>
                                </div>

                                {/* Page Selection Grid */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-slate-700">
                                            Selected: <span className="text-pink-600">{selectedPages.size}</span> / {pageCount}
                                        </h3>
                                        <div className="flex space-x-2">
                                            <button onClick={selectAll} className="px-3 py-1 text-xs font-medium bg-slate-100 rounded hover:bg-slate-200 transition">Select All</button>
                                            <button onClick={deselectAll} className="px-3 py-1 text-xs font-medium bg-slate-100 rounded hover:bg-slate-200 transition">Deselect</button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-80 overflow-y-auto p-2 bg-slate-50 rounded-lg border">
                                        {Array.from({ length: pageCount }, (_, i) => (
                                            <div
                                                key={i}
                                                onClick={() => togglePage(i)}
                                                className={`
                          relative border-2 rounded-lg p-1 cursor-pointer transition-all
                          ${selectedPages.has(i)
                                                        ? 'border-pink-500 bg-pink-50 shadow-sm'
                                                        : 'border-transparent hover:border-slate-300 bg-white'
                                                    }
                        `}
                                            >
                                                <div className="w-full aspect-[8/11] bg-slate-200 rounded overflow-hidden mb-1 relative">
                                                    {pageUrls.get(i + 1) ? (
                                                        <img src={pageUrls.get(i + 1)} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-slate-400 text-xs">Loading...</div>
                                                    )}
                                                </div>
                                                <span className={`block text-center text-xs font-bold ${selectedPages.has(i) ? 'text-pink-600' : 'text-slate-500'}`}>
                                                    {i + 1}
                                                </span>
                                                {selectedPages.has(i) && (
                                                    <div className="absolute top-1 right-1 w-4 h-4 bg-pink-600 rounded-full flex items-center justify-center text-white">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row justify-center gap-3">
                                    <button
                                        onClick={() => handleSplit('all')}
                                        disabled={isProcessing}
                                        className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                                    >
                                        Split All Pages
                                    </button>
                                    <button
                                        onClick={() => handleSplit('selected')}
                                        disabled={isProcessing || selectedPages.size === 0}
                                        className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition disabled:opacity-50"
                                    >
                                        {isProcessing ? "Processing..." : "Extract Selected"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Secure Processing</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>All Platforms</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>No Quality Loss</div>
                </div>
            </section>

            {/* SECTION 2: HOW TO */}
            <section className="max-w-6xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">How to Split a PDF</h2>
                    <p className="text-slate-500 mt-2 max-w-xl mx-auto">Easily separate pages from a scanned document or a large report.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-lg transition">
                        <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload Your File</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Select the PDF document you want to split. You can drag and drop or click to upload.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-lg transition">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Select Pages</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">View thumbnails of your pages. Click to select specific pages or choose a page range to extract.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-lg transition">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Download Results</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Download your extracted pages as a new PDF or as separate individual files.</p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: WHY SPLIT */}
            <section className="mt-24 bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Visual Mockup */}
                        <div className="relative hidden md:block">
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative z-10">
                                <div className="flex justify-center items-end space-x-4">
                                    <div className="w-20 h-28 bg-slate-200 rounded shadow-md flex items-center justify-center text-slate-400 font-bold text-xs">Old PDF</div>
                                    <div className="text-2xl text-pink-500 mb-8">→</div>
                                    <div className="flex flex-col space-y-2">
                                        <div className="w-16 h-20 bg-pink-100 border border-pink-200 rounded shadow-sm text-pink-600 flex items-center justify-center font-bold text-xs">Page 1</div>
                                        <div className="w-16 h-20 bg-pink-100 border border-pink-200 rounded shadow-sm text-pink-600 flex items-center justify-center font-bold text-xs">Page 2</div>
                                        <div className="w-16 h-20 bg-pink-100 border border-pink-200 rounded shadow-sm text-pink-600 flex items-center justify-center font-bold text-xs">Page 3</div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-pink-100 rounded-full blur-xl opacity-60 z-0"></div>
                        </div>

                        {/* Content */}
                        <div>
                            <span className="text-sm font-bold text-pink-600 uppercase tracking-wider">Flexible Extraction</span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Split Pages, Save Time</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Dealing with large PDF files can be cumbersome. Our Split PDF tool allows you to extract just the pages you need, making it easier to share specific information without sending entire documents.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Reduce Email Attachment Size</h4>
                                        <p className="text-sm text-slate-500">Only send the relevant pages to colleagues or clients.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Remove Sensitive Information</h4>
                                        <p className="text-sm text-slate-500">Easily separate pages containing private data from shareable content.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 4: FAQ */}
            <section className="max-w-4xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-4">
                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>What does splitting a PDF mean?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Splitting a PDF means breaking a single document into multiple smaller documents. You can extract specific pages or split every page into its own file.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Is splitting PDFs safe for confidential documents?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Absolutely. Our splitting tool runs entirely in your browser (client-side). Your files are never uploaded to a server.
                        </div>
                    </details>
                </div>
            </section>

            {/* SECTION 5: RELATED TOOLS */}
            <section className="max-w-6xl mx-auto px-4 mt-24 pb-20">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-slate-900">Related PDF Tools</h2>
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
        grayscale: "bg-orange-50 text-orange-600",
        organize: "bg-violet-50 text-violet-600",
        delete: "bg-red-50 text-red-600",
    };
    return colors[id] || "bg-slate-100 text-slate-600";
};