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
import { PDFDocument } from 'pdf-lib';

export default function GrayscalePdfPage() {
    const { files, addFiles, clearFiles } = useFiles();
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalPreview, setOriginalPreview] = useState<string | null>(null);
    const [grayscalePreview, setGrayscalePreview] = useState<string | null>(null);
    const [pageCount, setPageCount] = useState(0);

    // Control Settings State
    const [quality, setQuality] = useState<'high' | 'standard'>('high');
    const [mode, setMode] = useState<'grayscale' | 'bw'>('grayscale');

    const { showToast } = useToast();

    // Process PDF when file is selected
    useEffect(() => {
        const generatePreview = async () => {
            if (files.length > 0) {
                setIsProcessing(true);
                setOriginalPreview(null);
                setGrayscalePreview(null);

                const file = files[0].file;

                try {
                    const count = await getPdfPageCount(file);
                    setPageCount(count);

                    // Render Original Color Preview (Always color)
                    const colorUrl = await renderPageToUrl(file, 1);
                    setOriginalPreview(colorUrl);

                    // Render Processed Preview (Grayscale or B&W)
                    // We pass the mode state to the renderer
                    const processedUrl = await renderPageToUrl(file, 1, mode);
                    setGrayscalePreview(processedUrl);

                } catch (error) {
                    console.error(error);
                    showToast("Failed to read PDF", "error");
                } finally {
                    setIsProcessing(false);
                }
            }
        };

        generatePreview();
    }, [files, mode]); // Re-render preview if mode changes

    // Convert Logic
    const handleProcess = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        showToast(`Converting to ${mode === 'bw' ? 'Black & White' : 'Grayscale'}...`, "info");

        try {
            const file = files[0].file;

            // Calculate scale based on quality setting
            const scale = quality === 'high' ? 2.0 : 1.0;

            // Create new PDF
            const newPdfDoc = await PDFDocument.create();

            for (let i = 1; i <= pageCount; i++) {
                // Render page with current settings
                const imgUrl = await renderPageToUrl(file, i, mode, scale);
                const imgBytes = await fetch(imgUrl).then(res => res.arrayBuffer());
                const img = await newPdfDoc.embedJpg(imgBytes);

                const page = newPdfDoc.addPage([img.width, img.height]);
                page.drawImage(img, {
                    x: 0,
                    y: 0,
                    width: img.width,
                    height: img.height,
                });
            }

            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

            downloadBlob(blob, `${files[0].file.name.replace('.pdf', '')}_${mode}.pdf`);
            showToast("Success! Download started.", "success");
        } catch (error) {
            console.error(error);
            showToast("Failed to convert PDF", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Related Tools
    const relatedTools = allTools.filter(t => ['compress', 'merge', 'split', 'rotate'].includes(t.id));

    // Schema
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Convert PDF to Grayscale",
        "step": [
            { "@type": "HowToStep", "name": "Upload", "text": "Upload your color PDF document." },
            { "@type": "HowToStep", "name": "Configure", "text": "Choose quality and color mode." },
            { "@type": "HowToStep", "name": "Download", "text": "Download your processed PDF." }
        ]
    };

    return (
        <main className="bg-slate-50 text-slate-800 antialiased pt-16">
            <JsonLd data={howToSchema} />

            {/* SECTION 1: HERO & TOOL INTERFACE */}
            <section className="max-w-4xl mx-auto px-4 py-12">

                {/* Tool Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-4">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-1.5 animate-pulse"></span>
                        Print Ready Optimization
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Convert PDF to Grayscale
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Transform your PDF into black and white to reduce file size and save ink when printing.
                    </p>
                </div>

                {/* Workspace Container */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 relative overflow-hidden">

                    {/* Decorative Background */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-slate-100 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="relative bg-slate-50 rounded-2xl p-6">

                        {files.length === 0 ? (
                            <DropZone onFilesSelected={addFiles} accept=".pdf" multiple={false} />
                        ) : (
                            <div className="space-y-6">
                                {/* Header Bar */}
                                <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{files[0].file.name}</span>
                                        <span className="text-xs text-slate-400">({pageCount} pages)</span>
                                    </div>
                                    <button onClick={clearFiles} className="text-xs text-slate-500 hover:text-rose-600 font-medium">Clear</button>
                                </div>

                                {/* RESTORED: Settings Bar */}
                                <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm gap-4">
                                    <div className="flex items-center space-x-6 w-full sm:w-auto">
                                        {/* Mode Toggle */}
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-medium text-slate-500">Mode:</span>
                                            <button
                                                onClick={() => setMode('grayscale')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md shadow-sm transition ${mode === 'grayscale' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                Grayscale
                                            </button>
                                            <button
                                                onClick={() => setMode('bw')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md shadow-sm transition ${mode === 'bw' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                B&W
                                            </button>
                                        </div>

                                        {/* Quality Toggle */}
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-medium text-slate-500">Quality:</span>
                                            <button
                                                onClick={() => setQuality('standard')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md shadow-sm transition ${quality === 'standard' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                Standard
                                            </button>
                                            <button
                                                onClick={() => setQuality('high')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md shadow-sm transition ${quality === 'high' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                High
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Processing Indicator */}
                                {isProcessing && (
                                    <div className="text-center py-10">
                                        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm text-slate-500">Processing...</p>
                                    </div>
                                )}

                                {/* Before/After Preview */}
                                {!isProcessing && originalPreview && grayscalePreview && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                                        <div className="grid grid-cols-2 gap-6">
                                            {/* Before */}
                                            <div className="text-center">
                                                <div className="aspect-[8/11] bg-slate-100 rounded-lg mb-2 shadow-sm overflow-hidden relative group">
                                                    <img src={originalPreview} alt="Original" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">Original (Color)</span>
                                            </div>
                                            {/* After */}
                                            <div className="text-center">
                                                <div className="aspect-[8/11] bg-slate-200 rounded-lg mb-2 shadow-sm overflow-hidden relative group">
                                                    <img src={grayscalePreview} alt="Processed" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-xs text-slate-700 font-bold">{mode === 'bw' ? 'Black & White' : 'Grayscale'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action */}
                                <div className="flex flex-col sm:flex-row justify-center gap-3">
                                    <button
                                        onClick={handleProcess}
                                        disabled={isProcessing}
                                        className="w-full sm:w-auto px-8 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 transition flex items-center justify-center disabled:opacity-50"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        Download Processed PDF
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Save Ink & Toner</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Smaller File Size</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Print Optimized</div>
                </div>
            </section>

            {/* SECTION 2: HOW TO */}
            <section className="max-w-6xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">How to Grayscale a PDF</h2>
                    <p className="text-slate-500 mt-2 max-w-xl mx-auto">Prepare your documents for professional printing.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload PDF</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Select the color PDF document you wish to convert.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Configure</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Choose between Grayscale or Black & White mode.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Download</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Save your new black and white PDF ready for print.</p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: WHY USE THIS TOOL */}
            <section className="mt-24 bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Left: Content */}
                        <div>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Printing Optimization</span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Why Convert to Grayscale?</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Color ink is expensive, and many official documents don't require it. Converting your PDFs to grayscale (black and white) is the smartest way to reduce printing costs and ensure compatibility with professional monochrome printers.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Save Ink & Money</h4>
                                        <p className="text-sm text-slate-500">Color toner cartridges are costly. Grayscale printing uses black ink only.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Reduce File Size</h4>
                                        <p className="text-sm text-slate-500">Grayscale images often have smaller file sizes than their color counterparts.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Official Submissions</h4>
                                        <p className="text-sm text-slate-500">Many government and legal forms require black and white submissions.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Right: Visual */}
                        <div className="relative hidden md:block">
                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative z-10 overflow-hidden">
                                <div className="flex justify-center items-center space-x-6">
                                    <div className="w-24 h-32 bg-white border border-slate-200 rounded shadow-sm relative overflow-hidden">
                                        <div className="absolute top-2 left-2 w-6 h-6 bg-red-400 rounded"></div>
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-400 rounded"></div>
                                        <div className="absolute bottom-2 left-2 w-6 h-6 bg-yellow-400 rounded"></div>
                                        <span className="absolute bottom-1 right-1 text-[8px] font-bold text-slate-300">COLOR</span>
                                    </div>

                                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>

                                    <div className="w-24 h-32 bg-white border border-slate-300 rounded shadow-md relative overflow-hidden">
                                        <div className="absolute top-2 left-2 w-6 h-6 bg-gray-400 rounded"></div>
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-gray-600 rounded"></div>
                                        <div className="absolute bottom-2 left-2 w-6 h-6 bg-gray-300 rounded"></div>
                                        <span className="absolute bottom-1 right-1 text-[8px] font-bold text-slate-500">B&W</span>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-500 mt-6 font-medium">Switch to cost-effective printing</p>
                            </div>
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
                    <p className="text-slate-500 mt-2">Common questions about converting PDF to Grayscale.</p>
                </div>

                <div className="space-y-4">
                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Is Grayscale the same as Black and White?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Not exactly. "Black and White" typically means only pure black and pure white (1-bit), which can look jagged. "Grayscale" includes shades of gray, making images look smooth and professional, similar to a black & white photograph.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Will this reduce my file size?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Yes. Converting color images to grayscale typically reduces the amount of data stored, resulting in a smaller file size, which is perfect for archiving or emailing.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Is this suitable for professional printing?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Absolutely. Many professional printers prefer grayscale documents to avoid color matching issues and color ink surcharges.
                        </div>
                    </details>
                </div>
            </section>

            {/* SECTION 6: RELATED TOOLS */}
            <section className="max-w-6xl mx-auto px-4 mt-24 pb-20">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-slate-900">Related PDF Tools</h2>
                    <p className="text-slate-500 mt-1 text-sm">Explore other free tools to optimize your documents.</p>
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
        compress: "bg-orange-50 text-orange-600",
        merge: "bg-indigo-50 text-indigo-600",
        split: "bg-pink-50 text-pink-600",
        rotate: "bg-green-50 text-green-600",
    };
    return colors[id] || "bg-slate-100 text-slate-600";
};