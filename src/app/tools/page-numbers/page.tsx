"use client";

import { useState, useEffect } from "react";
import { useFiles } from "@/context/FileContext";
import { DropZone } from "@/components/ui/DropZone";
import { JsonLd } from "@/components/seo/JsonLd";
import { allTools } from "@/lib/toolsConfig";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { getPdfPageCount, renderPageToUrl } from "@/lib/pdf";
import { downloadBlob } from "@/lib/utils";
import { addPageNumbers } from "@/lib/tools/pageNumbers";

export default function PageNumbersPage() {
    const { files, addFiles, clearFiles } = useFiles();
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(0);

    // Settings State
    const [format, setFormat] = useState<'number' | 'page_of_total'>('page_of_total');
    const [position, setPosition] = useState<'bottom-center' | 'top-right' | 'bottom-right'>('bottom-center');
    const [fontSize, setFontSize] = useState(12);

    const { showToast } = useToast();

    // Load PDF Preview
    useEffect(() => {
        const loadPreview = async () => {
            if (files.length > 0) {
                setIsProcessing(true);
                try {
                    const count = await getPdfPageCount(files[0].file);
                    setTotalPages(count);
                    const url = await renderPageToUrl(files[0].file, 1);
                    setPageImageUrl(url);
                } catch (error) {
                    console.error(error);
                    showToast("Failed to load PDF", "error");
                } finally {
                    setIsProcessing(false);
                }
            }
        };
        loadPreview();
    }, [files]);

    // Process Logic
    const handleProcess = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        showToast("Adding page numbers...", "info");

        try {
            // Call the tool which now returns a Blob
            const resultBlob = await addPageNumbers(files[0].file, {
                format,
                position,
                size: fontSize,
            });

            downloadBlob(resultBlob, `${files[0].file.name.replace('.pdf', '')}_numbered.pdf`);
            showToast("Success! Download started.", "success");
        } catch (error) {
            console.error(error);
            showToast("Failed to process PDF", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper for Preview Text
    const getPreviewText = () => {
        if (format === 'page_of_total') return `Page 1 of ${totalPages || 10}`;
        return "1";
    };

    // Helper for Preview Position Classes
    const getPositionClasses = () => {
        switch (position) {
            case 'top-right': return 'top-4 right-4';
            case 'bottom-right': return 'bottom-4 right-4';
            case 'bottom-center':
            default: return 'bottom-4 left-1/2 -translate-x-1/2';
        }
    };

    // Related Tools
    const relatedTools = allTools.filter(t => ['organize', 'merge', 'delete', 'edit'].includes(t.id));

    // Schema
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Add Page Numbers to PDF",
        "step": [
            { "@type": "HowToStep", "name": "Upload", "text": "Upload the PDF document you want to number." },
            { "@type": "HowToStep", "name": "Configure", "text": "Choose position, font size, and format." },
            { "@type": "HowToStep", "name": "Download", "text": "Download your numbered PDF file." }
        ]
    };

    return (
        <main className="bg-slate-50 text-slate-800 antialiased pt-16">
            <JsonLd data={howToSchema} />

            {/* SECTION 1: HERO & TOOL INTERFACE */}
            <section className="max-w-4xl mx-auto px-4 py-12">

                {/* Tool Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700 border border-cyan-200 mb-4">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-1.5 animate-pulse"></span>
                        Automatic Pagination
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Add Page Numbers to PDF
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Insert page numbers into your PDF documents. Choose position, style, and format.
                    </p>
                </div>

                {/* Workspace Container */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="relative bg-slate-50 rounded-2xl p-6">

                        {files.length === 0 ? (
                            <DropZone onFilesSelected={addFiles} accept=".pdf" multiple={false} />
                        ) : (
                            <div className="space-y-6">
                                {/* Header Bar */}
                                <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-cyan-100 rounded flex items-center justify-center text-cyan-500">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{files[0].file.name}</span>
                                        <span className="text-xs text-slate-400">({totalPages} pages)</span>
                                    </div>
                                    <button onClick={clearFiles} className="text-xs text-slate-500 hover:text-rose-600 font-medium">Clear</button>
                                </div>

                                {/* IMPROVED: Settings Toolbar */}
                                <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm gap-4">

                                    {/* Format Selector */}
                                    <div className="flex items-center space-x-2 w-full md:w-auto">
                                        <label className="text-xs text-slate-500 whitespace-nowrap">Format:</label>
                                        <select
                                            value={format}
                                            onChange={(e) => setFormat(e.target.value as any)}
                                            className="flex-1 text-sm border border-slate-200 rounded-lg p-2 bg-slate-50 cursor-pointer"
                                        >
                                            <option value="page_of_total">Page 1 of 10</option>
                                            <option value="number">1</option>
                                        </select>
                                    </div>

                                    {/* Position Selector */}
                                    <div className="flex items-center space-x-2 w-full md:w-auto">
                                        <label className="text-xs text-slate-500 whitespace-nowrap">Position:</label>
                                        <select
                                            value={position}
                                            onChange={(e) => setPosition(e.target.value as any)}
                                            className="flex-1 text-sm border border-slate-200 rounded-lg p-2 bg-slate-50 cursor-pointer"
                                        >
                                            <option value="bottom-center">Bottom Center</option>
                                            <option value="bottom-right">Bottom Right</option>
                                            <option value="top-right">Top Right</option>
                                        </select>
                                    </div>

                                    {/* Size Slider */}
                                    <div className="flex items-center space-x-2 w-full md:w-auto">
                                        <label className="text-xs text-slate-500">Size:</label>
                                        <input
                                            type="range"
                                            min="8"
                                            max="24"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(Number(e.target.value))}
                                            className="w-24"
                                        />
                                        <span className="text-xs text-slate-600 w-6">{fontSize}</span>
                                    </div>
                                </div>

                                {/* Processing Indicator */}
                                {isProcessing && !pageImageUrl && (
                                    <div className="text-center py-10">
                                        <div className="w-12 h-12 border-4 border-slate-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm text-slate-500">Loading Preview...</p>
                                    </div>
                                )}

                                {/* IMPROVED: Preview Canvas with Dynamic Overlay */}
                                {pageImageUrl && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[400px] relative shadow-inner mx-auto overflow-hidden" style={{ aspectRatio: '8.5/11', maxHeight: '600px' }}>
                                        {/* Rendered PDF Page */}
                                        <img src={pageImageUrl} alt="PDF Preview" className="w-full h-full object-contain pointer-events-none" />

                                        {/* Dynamic Page Number Overlay */}
                                        <div
                                            className={`absolute ${getPositionClasses()} text-cyan-600 font-semibold bg-white/80 px-2 py-1 rounded border border-cyan-100 shadow-sm`}
                                            style={{ fontSize: `${fontSize}px` }}
                                        >
                                            {getPreviewText()}
                                        </div>
                                    </div>
                                )}

                                {/* Action Footer */}
                                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                                    <button
                                        onClick={handleProcess}
                                        disabled={isProcessing}
                                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        {isProcessing ? "Processing..." : "Download Numbered PDF"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Custom Positioning</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Font Selection</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Instant Process</div>
                </div>
            </section>

            {/* SECTION 2: HOW TO */}
            <section className="max-w-6xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">How to Add Page Numbers</h2>
                    <p className="text-slate-500 mt-2 max-w-xl mx-auto">Paginate your PDF documents in three simple steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Select the PDF document you want to number.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Select Layout</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Choose position (header/footer), font size, and alignment.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Save</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Download your paginated PDF file.</p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: WHY USE THIS TOOL */}
            <section className="mt-24 bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="relative hidden md:block">
                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative z-10">
                                <div className="flex justify-center items-center space-x-6">
                                    <div className="w-32 h-44 bg-white border border-slate-300 rounded shadow-sm relative p-2">
                                        <div className="h-2 bg-slate-100 rounded w-full mb-2"></div>
                                        <div className="h-2 bg-slate-100 rounded w-3/4 mb-2"></div>
                                        <div className="h-2 bg-slate-100 rounded w-5/6 mb-4"></div>
                                        <div className="absolute bottom-4 right-4 w-6 h-3 border-b border-r border-cyan-300 flex items-center justify-end">
                                            <span className="text-[6px] text-cyan-400 font-bold">1</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-500 mt-6 font-medium">Professional citation-ready formatting</p>
                            </div>
                        </div>

                        <div>
                            <span className="text-sm font-bold text-cyan-600 uppercase tracking-wider">Document Organization</span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Why Add Page Numbers?</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Page numbers are essential for professional documents, academic papers, and legal files. They make it easy to reference specific sections, create a table of contents, and keep printed documents in order.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Easy Citation</h4>
                                        <p className="text-sm text-slate-500">Allows readers to cite specific pages accurately.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Table of Contents</h4>
                                        <p className="text-sm text-slate-500">Create navigable indexes and appendices.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Print Management</h4>
                                        <p className="text-sm text-slate-500">Keep track of pages if a printed document is dropped or mixed.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 4: WHY CHOOSE US (Brand UVP) */}
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
                            <p className="text-slate-400 text-sm">We preserve the original layout and resolution of your documents.</p>
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
                    <p className="text-slate-500 mt-2">Common questions about paginating PDFs.</p>
                </div>

                <div className="space-y-4">
                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Can I change the font size of the numbers?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Yes. Our tool allows you to customize the font size, style, and margin to ensure the numbers fit perfectly within your document's layout.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Does it support different number formats?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Currently, we support standard decimal numbers (1, 2, 3). We also support adding prefixes or suffixes like "Page 1" or "- 1 -".
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Will page numbers cover my existing text?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            The numbers are placed in the margin areas (header or footer). We recommend selecting a position that has whitespace on your document to avoid overlapping.
                        </div>
                    </details>
                </div>
            </section>

            {/* SECTION 6: RELATED TOOLS */}
            <section className="max-w-6xl mx-auto px-4 mt-24 pb-20">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-slate-900">Related PDF Tools</h2>
                    <p className="text-slate-500 mt-1 text-sm">Explore other free tools to organize your documents.</p>
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
        organize: "bg-violet-50 text-violet-600",
        merge: "bg-indigo-50 text-indigo-600",
        delete: "bg-rose-50 text-rose-600",
        edit: "bg-purple-50 text-purple-600",
    };
    return colors[id] || "bg-slate-100 text-slate-600";
};