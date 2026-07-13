"use client";

import { useState, useEffect, useCallback } from "react";
import { useFiles } from "@/context/FileContext";
import { DropZone } from "@/components/ui/DropZone";
import { JsonLd } from "@/components/seo/JsonLd";
import { allTools } from "@/lib/toolsConfig";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { getPdfPageCount, renderPagesSequentially } from "@/lib/pdf";
import { downloadBlob } from "@/lib/utils";
import JSZip from "jszip";

export default function PdfToImagePage() {
    const { files, addFiles, clearFiles } = useFiles();
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [pageUrls, setPageUrls] = useState<Map<number, string>>(new Map());
    const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
    const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('high');
    const [pageCount, setPageCount] = useState(0);
    const { showToast } = useToast();

    // Map UI quality to pdf.js scale (1.0 scale = 72 DPI)
    const scaleMap = {
        standard: 2.0, // ~144 DPI (Good for web/screens)
        high: 3.0,     // ~216 DPI (Great quality, balanced size)
        ultra: 4.5     // ~324 DPI (Print quality)
    };

    // Cleanup object URLs on unmount or re-render to prevent memory leaks
    const clearUrls = useCallback(() => {
        setPageUrls(prev => {
            prev.forEach(url => URL.revokeObjectURL(url));
            return new Map();
        });
    }, []);

    // Process PDF when file or settings change
    useEffect(() => {
        const processPdf = async () => {
            if (files.length > 0) {
                setIsProcessing(true);
                setProgress(0);
                clearUrls(); // Clean up previous renders

                const file = files[0].file;

                try {
                    const count = await getPdfPageCount(file);
                    setPageCount(count);

                    const urls = new Map<number, string>();

                    await renderPagesSequentially(file, 1, count, {
                        scale: scaleMap[quality],
                        format: format,
                        quality: 0.92, // 92% JPEG quality is visually lossless but keeps size down
                        onPageRendered: (pageNum, url) => {
                            urls.set(pageNum, url);
                            setPageUrls(new Map(urls)); // Update UI as each page finishes
                            setProgress(Math.round((pageNum / count) * 100));
                        }
                    });

                } catch (error) {
                    console.error(error);
                    showToast("Failed to read PDF", "error");
                } finally {
                    setIsProcessing(false);
                }
            } else {
                clearUrls();
                setPageCount(0);
            }
        };

        processPdf();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files, format, quality]);

    // Clear files and URLs
    const handleClear = () => {
        clearUrls();
        clearFiles();
    };

    // Download Single Image
    const handleDownloadSingle = async (url: string, pageNum: number) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const ext = format === 'jpeg' ? 'jpg' : 'png';
            downloadBlob(blob, `page_${pageNum}.${ext}`);
        } catch (error) {
            console.error("Download failed", error);
            showToast("Download failed", "error");
        }
    };

    // Download All as ZIP
    const handleDownloadAll = async () => {
        if (pageUrls.size === 0) return;

        setIsProcessing(true);
        showToast("Preparing ZIP file...", "info");

        try {
            const zip = new JSZip();
            const ext = format === 'jpeg' ? 'jpg' : 'png';

            for (const [pageNum, url] of pageUrls) {
                const response = await fetch(url);
                const blob = await response.blob();
                zip.file(`page_${pageNum}.${ext}`, blob);
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            downloadBlob(zipBlob, "converted_images.zip");
            showToast("Download started!", "success");
        } catch (error) {
            console.error(error);
            showToast("Failed to create ZIP", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Related Tools
    const relatedTools = allTools.filter(t => ['image-to-pdf', 'merge', 'split', 'edit'].includes(t.id));

    // Schema
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Convert PDF to JPG",
        "step": [
            { "@type": "HowToStep", "name": "Upload PDF", "text": "Select the PDF file you want to convert." },
            { "@type": "HowToStep", "name": "Choose Format", "text": "Select JPG or PNG format." },
            { "@type": "HowToStep", "name": "Download", "text": "Download images individually or as ZIP." }
        ]
    };

    return (
        <main className="bg-slate-50 text-slate-800 antialiased pt-16">
            <JsonLd data={howToSchema} />

            {/* SECTION 1: HERO & TOOL INTERFACE */}
            <section className="max-w-4xl mx-auto px-4 py-12">

                {/* Tool Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 mb-4">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse"></span>
                        High Quality Output
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                        PDF to JPG Converter
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Convert your PDF pages into high-resolution JPG or PNG images instantly.
                    </p>
                </div>

                {/* Workspace Container */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 relative overflow-hidden">

                    {/* Decorative Background */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="relative bg-slate-50 rounded-2xl p-6">

                        {files.length === 0 ? (
                            <DropZone
                                onFilesSelected={addFiles}
                                accept=".pdf"
                                multiple={false}
                            />
                        ) : (
                            <div className="space-y-6">
                                {/* Settings Bar */}
                                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm gap-4">
                                    <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-4 gap-2 sm:gap-0">
                                        {/* Format Toggle */}
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-medium text-slate-500">Format:</span>
                                            <button
                                                onClick={() => setFormat('jpeg')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md shadow-sm transition ${format === 'jpeg' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                JPG
                                            </button>
                                            <button
                                                onClick={() => setFormat('png')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md shadow-sm transition ${format === 'png' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                PNG
                                            </button>
                                        </div>

                                        <div className="hidden sm:block h-4 w-px bg-slate-200"></div>

                                        {/* Quality Toggle */}
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-medium text-slate-500">Quality:</span>
                                            <select 
                                                value={quality} 
                                                onChange={(e) => setQuality(e.target.value as 'standard' | 'high' | 'ultra')}
                                                className="text-xs font-bold rounded-md shadow-sm bg-slate-100 text-slate-600 px-2 py-1 border-0 focus:ring-2 focus:ring-amber-500 outline-none"
                                            >
                                                <option value="standard">Standard (144 DPI)</option>
                                                <option value="high">High (216 DPI)</option>
                                                <option value="ultra">Ultra (324 DPI)</option>
                                            </select>
                                        </div>

                                        <div className="hidden sm:block h-4 w-px bg-slate-200"></div>
                                        
                                        {/* Info */}
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-medium text-slate-500">Pages:</span>
                                            <span className="text-xs font-bold text-slate-700">{pageCount}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={handleClear}
                                            className="px-4 py-2 text-slate-500 hover:text-red-600 text-sm font-medium transition"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={handleDownloadAll}
                                            disabled={isProcessing || pageUrls.size === 0}
                                            className="w-full sm:w-auto px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg shadow hover:bg-amber-600 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                            Download All (ZIP)
                                        </button>
                                    </div>
                                </div>

                                {/* Processing Indicator */}
                                {isProcessing && (
                                    <div className="text-center py-10">
                                        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm text-slate-500 font-medium">
                                            Rendering page {pageUrls.size} of {pageCount}...
                                        </p>
                                        <div className="w-full bg-slate-200 rounded-full h-2 mt-4 max-w-xs mx-auto overflow-hidden">
                                            <div 
                                                className="bg-amber-500 h-full rounded-full transition-all duration-300 ease-out" 
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Image Grid */}
                                {!isProcessing && pageUrls.size > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {Array.from(pageUrls.entries()).map(([pageNum, url]) => (
                                            <div key={pageNum} className="image-card bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="w-full aspect-[8/11] bg-slate-100 rounded-lg mb-2 overflow-hidden flex items-center justify-center relative group">
                                                    <img src={url} alt={`Page ${pageNum}`} className="w-full h-full object-cover" />
                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                        <button
                                                            onClick={() => handleDownloadSingle(url, pageNum)}
                                                            className="px-3 py-1.5 bg-white rounded text-xs font-semibold text-slate-700 shadow hover:bg-slate-50"
                                                        >
                                                            Download
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-xs font-medium text-slate-600">Page {pageNum}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase">{format}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>High Resolution</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>JPG & PNG Support</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>No Watermarks</div>
                </div>
            </section>

            {/* SECTION 2: HOW TO */}
            <section className="max-w-6xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">How to Convert PDF to Image</h2>
                    <p className="text-slate-500 mt-2 max-w-xl mx-auto">Extract high-quality images from your PDF in three easy steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload PDF</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Select the PDF file you wish to convert into image format.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Choose Settings</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Select JPG or PNG format and set your preferred resolution quality.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Download Images</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Download individual images or all pages as a ZIP archive.</p>
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
                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Total Privacy</h3>
                            <p className="text-slate-400 text-sm">We never upload your files to a remote server. Everything stays in your browser.</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">High Quality</h3>
                            <p className="text-slate-400 text-sm">We preserve the original resolution of your images. No blurry documents.</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-400 mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">100% Free</h3>
                            <p className="text-slate-400 text-sm">No hidden fees, no forced accounts. Just free tools for everyone.</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

const getIconColors = (id: string) => {
    const colors: Record<string, string> = {
        "image-to-pdf": "bg-green-50 text-green-600",
        merge: "bg-indigo-50 text-indigo-600",
        split: "bg-pink-50 text-pink-600",
        edit: "bg-rose-50 text-rose-600",
    };
    return colors[id] || "bg-slate-100 text-slate-600";
};