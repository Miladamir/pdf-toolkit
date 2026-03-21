"use client";

import { useState, useEffect } from "react";
import { useFiles } from "@/context/FileContext";
import { DropZone } from "@/components/ui/DropZone";
import { JsonLd } from "@/components/seo/JsonLd";
import { allTools } from "@/lib/toolsConfig";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { downloadBlob } from "@/lib/utils";

export default function CompressPdfPage() {
    const { files, addFiles, clearFiles } = useFiles();
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // State
    const [quality, setQuality] = useState<'low' | 'recommended' | 'extreme'>('recommended');
    const [originalSize, setOriginalSize] = useState(0);
    const [compressedSize, setCompressed] = useState<number | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { showToast } = useToast();

    // Load Meta
    useEffect(() => {
        if (files.length > 0) {
            setOriginalSize(files[0].file.size);
            setCompressed(null);
            setPreviewUrl(null);
            setProgress(0);

            // Generate a quick preview of the first page (optional visual)
            const generatePreview = async () => {
                const { renderPageToUrl } = await import('@/lib/pdf');
                const url = await renderPageToUrl(files[0].file, 1);
                setPreviewUrl(url);
            };
            generatePreview();
        }
    }, [files]);

    const handleProcess = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setProgress(0);
        showToast("Uploading file to secure server...", "info");

        try {
            // --- STEP 1: UPLOAD ---
            const uploadForm = new FormData();
            uploadForm.append('file', files[0].file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: uploadForm,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");
            const { key } = await uploadRes.json();

            // --- STEP 2: PROCESS (COMPRESS) ---
            setProgress(50);
            showToast("Compressing PDF...", "info");

            const processRes = await fetch('/api/compress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, quality }), // Sending quality setting too
            });

            if (!processRes.ok) throw new Error("Compression failed");
            const { resultKey } = await processRes.json();

            // --- STEP 3: DOWNLOAD ---
            setProgress(90);
            showToast("Preparing download...", "info");

            const downloadRes = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: resultKey }),
            });

            if (!downloadRes.ok) throw new Error("Download failed");

            const blob = await downloadRes.blob();

            // Update UI with stats
            setCompressed(blob.size);
            setProgress(100);
            showToast("Success! Download started.", "success");

            // Trigger Browser Download
            downloadBlob(blob, `${files[0].file.name.replace('.pdf', '')}_compressed.pdf`);

        } catch (error) {
            console.error(error);
            showToast((error as Error).message || "Operation failed", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Helpers
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getReduction = () => {
        if (!compressedSize) return "0%";
        const reduction = ((originalSize - compressedSize) / originalSize) * 100;
        return `-${Math.round(reduction)}%`;
    };

    // Related Tools
    const relatedTools = allTools.filter(t => ['merge', 'rotate', 'grayscale', 'pdf-to-jpg'].includes(t.id));

    // Schema
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Compress a PDF",
        "step": [
            { "@type": "HowToStep", "name": "Upload", "text": "Select the large PDF file you want to compress." },
            { "@type": "HowToStep", "name": "Choose Quality", "text": "Select your desired compression level." },
            { "@type": "HowToStep", "name": "Download", "text": "Download your smaller, optimized PDF." }
        ]
    };

    return (
        <main className="bg-slate-50 text-slate-800 antialiased pt-16">
            <JsonLd data={howToSchema} />

            {/* SECTION 1: HERO & TOOL INTERFACE */}
            <section className="max-w-4xl mx-auto px-4 py-12">

                {/* Tool Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 mb-4">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5 animate-pulse"></span>
                        Optimize File Size
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Compress PDF
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Reduce file size while keeping quality. Perfect for email and web.
                    </p>
                </div>

                {/* Workspace Container */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="relative bg-slate-50 rounded-2xl p-6">

                        {files.length === 0 ? (
                            <DropZone onFilesSelected={addFiles} accept=".pdf" multiple={false} />
                        ) : (
                            <div className="space-y-6">
                                {/* Header Bar */}
                                <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center text-orange-500">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">{files[0].file.name}</span>
                                            <div className="text-xs text-slate-400">{formatBytes(originalSize)}</div>
                                        </div>
                                    </div>
                                    <button onClick={clearFiles} className="text-xs text-slate-500 hover:text-rose-600 font-medium">Clear</button>
                                </div>

                                {/* IMPROVED: Settings Toolbar */}
                                <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm gap-4">
                                    <span className="text-xs font-semibold text-slate-700 uppercase self-start md:self-center">Compression Level:</span>
                                    <div className="flex items-center space-x-2 w-full md:w-auto justify-center flex-wrap">
                                        <button
                                            onClick={() => setQuality('low')}
                                            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${quality === 'low' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            Low
                                        </button>
                                        <button
                                            onClick={() => setQuality('recommended')}
                                            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${quality === 'recommended' ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            Recommended
                                        </button>
                                        <button
                                            onClick={() => setQuality('extreme')}
                                            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${quality === 'extreme' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            Extreme
                                        </button>
                                    </div>
                                </div>

                                {/* Processing Indicator */}
                                {isProcessing && (
                                    <div className="text-center py-6 bg-white rounded-xl border border-slate-200 shadow-inner">
                                        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4 max-w-xs mx-auto">
                                            <div className="bg-orange-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium">Processing... {progress}%</p>
                                    </div>
                                )}

                                {/* IMPROVED: Preview / Result Canvas */}
                                {!isProcessing && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[300px] relative shadow-inner flex flex-col items-center justify-center">

                                        {compressedSize ? (
                                            // Success State
                                            <div className="text-center animate-fade-in">
                                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-1">Compression Complete!</h3>
                                                <p className="text-slate-500 text-sm mb-4">
                                                    Your file size reduced by <span className="font-bold text-green-600">{getReduction()}</span>
                                                </p>

                                                <div className="flex justify-center items-center space-x-8">
                                                    <div>
                                                        <p className="text-xs text-slate-400">Original</p>
                                                        <p className="text-lg font-bold text-slate-600">{formatBytes(originalSize)}</p>
                                                    </div>
                                                    <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                                    <div>
                                                        <p className="text-xs text-slate-400">Compressed</p>
                                                        <p className="text-lg font-bold text-green-600">{formatBytes(compressedSize)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Preview State
                                            <>
                                                {/* Before/After Mockup */}
                                                <div className="flex items-center justify-center space-x-6 mb-4">
                                                    {/* Original */}
                                                    <div className="text-center">
                                                        <div className="w-20 h-28 bg-slate-100 border border-slate-300 rounded shadow-sm flex items-center justify-center relative">
                                                            {previewUrl ? (
                                                                <img src={previewUrl} alt="Original" className="w-full h-full object-cover rounded" />
                                                            ) : (
                                                                <span className="text-2xl font-bold text-slate-300">PDF</span>
                                                            )}
                                                        </div>
                                                        <p className="mt-2 text-xs text-slate-500 font-medium">Original</p>
                                                        <p className="text-sm font-bold text-slate-700">{formatBytes(originalSize)}</p>
                                                    </div>

                                                    {/* Arrow */}
                                                    <div className="flex flex-col items-center animate-pulse-scale">
                                                        <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                                        <span className="text-[10px] text-orange-600 font-bold mt-1 bg-orange-50 px-1 rounded">-{quality === 'extreme' ? '85' : quality === 'recommended' ? '60' : '30'}%</span>
                                                    </div>

                                                    {/* Compressed */}
                                                    <div className="text-center">
                                                        <div className="w-16 h-22 bg-white border border-orange-200 rounded shadow-md flex items-center justify-center transform scale-90">
                                                            {previewUrl ? (
                                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded opacity-80" />
                                                            ) : (
                                                                <span className="text-xl font-bold text-orange-200">PDF</span>
                                                            )}
                                                        </div>
                                                        <p className="mt-2 text-xs text-slate-500 font-medium">Estimated</p>
                                                        <p className="text-sm font-bold text-green-600">Smaller</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-400">Estimation based on selected quality.</p>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Action Footer */}
                                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                                    <button
                                        onClick={handleProcess}
                                        disabled={isProcessing}
                                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        {isProcessing ? "Processing..." : "Compress PDF"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Reduce Size</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Keep Quality</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Email Ready</div>
                </div>
            </section>

            {/* SECTION 2: HOW TO */}
            <section className="max-w-6xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">How to Compress a PDF</h2>
                    <p className="text-slate-500 mt-2 max-w-xl mx-auto">Reduce your file size in three simple steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Select the large PDF file you want to compress.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Select Quality</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Choose "Recommended" for the best balance of size and quality.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Download</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Save your optimized, smaller PDF file.</p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: WHY USE THIS TOOL */}
            <section className="mt-24 bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-sm font-bold text-orange-600 uppercase tracking-wider">File Optimization</span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Why Compress PDF Files?</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Large PDF files are difficult to email, slow to upload, and take up valuable storage space. Compressing reduces the file size by optimizing images and removing redundant data, making your documents easier to share.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Email Attachments</h4>
                                        <p className="text-sm text-slate-500">Most email servers have a 20MB limit. Compress files to send them instantly.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Website Speed</h4>
                                        <p className="text-sm text-slate-500">Smaller PDFs load faster on websites, improving user experience.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Save Storage</h4>
                                        <p className="text-sm text-slate-500">Free up disk space on your computer or cloud drive.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="relative hidden md:block">
                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative overflow-hidden">
                                <div className="flex justify-center items-center space-x-6">
                                    <div className="relative">
                                        <div className="w-32 h-40 bg-slate-100 rounded shadow-sm flex items-center justify-center opacity-40 absolute -top-2 -left-2 z-0"></div>
                                        <div className="w-28 h-36 bg-white border border-slate-300 rounded shadow-md flex items-center justify-center z-10 relative">
                                            <span className="text-slate-300 font-bold text-xs">OLD</span>
                                        </div>
                                    </div>

                                    <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>

                                    <div className="w-20 h-28 bg-white border border-orange-200 rounded shadow-lg flex items-center justify-center transform scale-90">
                                        <span className="text-orange-400 font-bold text-xs">NEW</span>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-500 mt-6 font-medium">Significant size reduction, same content</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 4: WHY CHOOSE US */}
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
                            <p className="text-slate-400 text-sm">We preserve resolution. No blurry text or pixelated images.</p>
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
                    <p className="text-slate-500 mt-2">Common questions about compressing PDF files.</p>
                </div>

                <div className="space-y-4">
                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Will compressing a PDF make it blurry?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Our "Recommended" setting keeps text crisp and clear. "Extreme" compression may slightly reduce image quality, but text remains readable. You can choose the level that fits your needs.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Is there a file size limit?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Because we process files locally in your browser, the limit depends on your device's memory (RAM). Most modern computers can handle files up to 500MB easily.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>What does compressing actually do?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            It optimizes images inside the PDF (downsampling), removes unused elements, and compresses the internal data structure. It does not remove text or pages.
                        </div>
                    </details>
                </div>
            </section>

            {/* SECTION 6: RELATED TOOLS */}
            <section className="max-w-6xl mx-auto px-4 mt-24 pb-20">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-slate-900">Related PDF Tools</h2>
                    <p className="text-slate-500 mt-1 text-sm">Explore other free tools to manage your documents.</p>
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
        merge: "bg-indigo-50 text-indigo-600",
        rotate: "bg-amber-50 text-amber-600",
        grayscale: "bg-slate-100 text-slate-600",
        "pdf-to-jpg": "bg-cyan-50 text-cyan-600",
    };
    return colors[id] || "bg-slate-100 text-slate-600";
};