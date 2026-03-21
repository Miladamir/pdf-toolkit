"use client";

import { useState, useEffect } from "react";
import { useFiles } from "@/context/FileContext";
import { DropZone } from "@/components/ui/DropZone";
import { JsonLd } from "@/components/seo/JsonLd";
import { allTools } from "@/lib/toolsConfig";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { getPdfPageCount, renderPagesInBatch } from "@/lib/pdf";
import { downloadBlob } from "@/lib/utils";
import { PDFDocument } from 'pdf-lib';

export default function DeletePagesPage() {
    const { files, addFiles, clearFiles } = useFiles();
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageUrls, setPageUrls] = useState<Map<number, string>>(new Map());
    const [deletedPages, setDeletedPages] = useState<Set<number>>(new Set());
    const [pageCount, setPageCount] = useState(0);
    const { showToast } = useToast();

    // Process PDF when file is selected
    useEffect(() => {
        const processPdf = async () => {
            if (files.length > 0) {
                setIsProcessing(true);
                setDeletedPages(new Set());
                setPageUrls(new Map());

                const file = files[0].file;

                try {
                    const count = await getPdfPageCount(file);
                    setPageCount(count);
                    const urls = await renderPagesInBatch(file, 1, count);
                    setPageUrls(urls);
                } catch (error) {
                    console.error(error);
                    showToast("Failed to read PDF", "error");
                } finally {
                    setIsProcessing(false);
                }
            }
        };

        processPdf();
    }, [files]);

    // Toggle page deletion state
    const togglePage = (index: number) => {
        setDeletedPages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // Apply Deletion and Download
    // Apply Deletion and Download
    const handleApplyChanges = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        showToast("Processing PDF...", "info");

        try {
            const file = files[0].file;
            const arrayBuffer = await file.arrayBuffer();
            const srcDoc = await PDFDocument.load(arrayBuffer);
            const newDoc = await PDFDocument.create();

            // Create an array [0, 1, 2, ... pageCount-1] and filter out deleted indices
            const indicesToKeep = Array.from({ length: pageCount }, (_, i) => i)
                .filter(i => !deletedPages.has(i));

            if (indicesToKeep.length === 0) {
                showToast("Cannot delete all pages!", "error");
                setIsProcessing(false);
                return;
            }

            const copiedPages = await newDoc.copyPages(srcDoc, indicesToKeep);
            copiedPages.forEach(page => newDoc.addPage(page));

            const pdfBytes = await newDoc.save();

            // FIX: Cast buffer to ArrayBuffer to satisfy TypeScript BlobPart requirement
            // This handles the 'SharedArrayBuffer' incompatibility with Blob constructor
            const blob = new Blob(
                [pdfBytes.buffer as ArrayBuffer],
                { type: 'application/pdf' }
            );

            downloadBlob(blob, `${files[0].file.name.replace('.pdf', '')}_cleaned.pdf`);
            showToast("Success! Download started.", "success");
        } catch (error) {
            console.error(error);
            showToast("Failed to process PDF", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Related Tools
    const relatedTools = allTools.filter(t => ['organize', 'split', 'rotate', 'merge'].includes(t.id));

    // Schema
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Delete PDF Pages",
        "step": [
            { "@type": "HowToStep", "name": "Upload PDF", "text": "Select the PDF file from which you want to remove pages." },
            { "@type": "HowToStep", "name": "Select Pages", "text": "Click on the page thumbnails you wish to delete." },
            { "@type": "HowToStep", "name": "Download", "text": "Confirm deletion and download your clean PDF file." }
        ]
    };

    return (
        <main className="bg-slate-50 text-slate-800 antialiased pt-16">
            <JsonLd data={howToSchema} />

            {/* SECTION 1: HERO & TOOL INTERFACE */}
            <section className="max-w-4xl mx-auto px-4 py-12">

                {/* Tool Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200 mb-4">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5 animate-pulse"></span>
                        Remove Pages Instantly
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Delete PDF Pages
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Remove unwanted, blank, or sensitive pages from your document in seconds.
                    </p>
                </div>

                {/* Workspace Container */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 relative overflow-hidden">

                    {/* Decorative Background */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="relative bg-slate-50 rounded-2xl p-6">

                        {files.length === 0 ? (
                            <DropZone
                                onFilesSelected={addFiles}
                                accept=".pdf"
                                multiple={false}
                            />
                        ) : (
                            <div className="space-y-6">
                                {/* Header Bar */}
                                <div className="flex justify-between items-center mb-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-rose-100 rounded flex items-center justify-center text-rose-500">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{files[0].file.name}</span>
                                    </div>
                                    <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded">
                                        {deletedPages.size} Selected
                                    </span>
                                </div>

                                {/* Processing Indicator */}
                                {isProcessing && (
                                    <div className="text-center py-10">
                                        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm text-slate-500">Processing...</p>
                                    </div>
                                )}

                                {/* Editor Grid */}
                                {!isProcessing && pageUrls.size > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                        {Array.from(pageUrls.entries()).map(([pageNum, url]) => {
                                            const isDeleted = deletedPages.has(pageNum - 1);

                                            return (
                                                <div
                                                    key={pageNum}
                                                    onClick={() => togglePage(pageNum - 1)}
                                                    className={`
                                        relative bg-white p-1 rounded-xl border-2 shadow-sm cursor-pointer transition-all
                                        ${isDeleted
                                                            ? 'border-rose-500 bg-rose-50 opacity-60 scale-95'
                                                            : 'border-slate-200 hover:border-rose-300 hover:shadow-md'
                                                        }
                                    `}
                                                >
                                                    <div className="w-full aspect-[8/11] bg-slate-100 rounded mb-1 overflow-hidden relative group">
                                                        <img src={url} alt={`Page ${pageNum}`} className="w-full h-full object-cover" />

                                                        {isDeleted && (
                                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                                <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                                </svg>
                                                            </div>
                                                        )}

                                                        {!isDeleted && (
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                                <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-rose-500">
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className={`text-xs font-medium ${isDeleted ? 'text-rose-400 line-through' : 'text-slate-600'}`}>
                                                            Page {pageNum}
                                                        </span>
                                                        {isDeleted && <span className="text-[10px] text-rose-500 font-bold">GONE</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Action Footer */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                                    <button onClick={clearFiles} className="text-sm text-slate-500 hover:text-rose-600 font-medium">
                                        Cancel & Clear
                                    </button>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleApplyChanges}
                                            disabled={isProcessing || deletedPages.size === pageCount}
                                            className="w-full sm:w-auto px-8 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isProcessing ? "Processing..." : `Delete ${deletedPages.size} Pages`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Secure Removal</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>No Quality Loss</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Easy Selection</div>
                </div>
            </section>

            {/* SECTION 2: HOW TO */}
            <section className="max-w-6xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">How to Delete Pages from a PDF</h2>
                    <p className="text-slate-500 mt-2 max-w-xl mx-auto">Clean up your documents in three simple steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Select the PDF file containing pages you want to remove.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Select Pages</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Click on the pages you wish to delete. Selected pages will turn red.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Save & Download</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Confirm deletion and download your clean, updated PDF file.</p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: WHY USE DELETE PAGES */}
            <section className="mt-24 bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="relative hidden md:block">
                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative z-10">
                                <div className="flex justify-center items-center space-x-4">
                                    <div className="w-24 h-32 bg-white border border-slate-200 rounded shadow-sm relative">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-slate-300 font-bold text-xs">P1</span>
                                        </div>
                                    </div>

                                    <div className="w-20 h-28 bg-rose-100 border border-rose-300 rounded shadow-sm relative transform rotate-6">
                                        <div className="absolute inset-0 flex items-center justify-center text-rose-400">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </div>
                                    </div>

                                    <div className="w-24 h-32 bg-white border border-slate-200 rounded shadow-sm relative">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-slate-300 font-bold text-xs">P3</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-400 mt-6 font-medium">Remove irrelevant pages instantly</p>
                            </div>
                        </div>

                        <div>
                            <span className="text-sm font-bold text-rose-600 uppercase tracking-wider">Clean Up Documents</span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Why Delete PDF Pages?</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Sometimes a PDF contains more information than you need to share. Our tool allows you to surgically remove specific pages without altering the rest of the document, ensuring your file is concise and relevant.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Privacy Protection</h4>
                                        <p className="text-sm text-slate-500">Remove pages with sensitive data like SSNs or salaries before sharing.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Remove Blank Pages</h4>
                                        <p className="text-sm text-slate-500">Clean up double-sided scans that resulted in empty intermediate pages.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Reduce File Size</h4>
                                        <p className="text-sm text-slate-500">Deleting unnecessary pages is the easiest way to shrink a PDF file size.</p>
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
                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Total Privacy</h3>
                            <p className="text-slate-400 text-sm">We never upload your files to a remote server. Everything stays in your browser.</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Blazing Fast</h3>
                            <p className="text-slate-400 text-sm">No upload queues. Local processing means instant results every time.</p>
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

                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 mb-4">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No Watermarks</h3>
                            <p className="text-slate-400 text-sm">We never brand your documents. Your files belong to you.</p>
                        </div>

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
                    <p className="text-slate-500 mt-2">Common questions about removing pages from PDFs.</p>
                </div>

                <div className="space-y-4">
                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Is the deletion permanent?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            The original file on your computer remains unchanged. We process a copy of the file. However, once you download the new version, the pages you removed are gone from that specific file.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Can I delete multiple pages at once?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Yes. Simply click on all the page thumbnails you want to remove. They will be marked for deletion, and you can confirm the action with a single click.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Will deleting pages affect the quality?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            No. We do not re-compress or alter the remaining pages. They retain their original resolution and quality.
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
        split: "bg-pink-50 text-pink-600",
        rotate: "bg-green-50 text-green-600",
        merge: "bg-indigo-50 text-indigo-600",
    };
    return colors[id] || "bg-slate-100 text-slate-600";
};