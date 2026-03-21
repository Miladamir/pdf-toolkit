"use client";

import { useState, useEffect, useRef } from "react";
import { useFiles } from "@/context/FileContext";
import { DropZone } from "@/components/ui/DropZone";
import { JsonLd } from "@/components/seo/JsonLd";
import { allTools } from "@/lib/toolsConfig";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { getPdfPageCount, renderPageToUrl } from "@/lib/pdf";
import { downloadBlob } from "@/lib/utils";
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export default function AddWatermarkPage() {
    const { files, addFiles, clearFiles } = useFiles();
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(0);

    // Watermark Settings
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const [text, setText] = useState("CONFIDENTIAL");
    const [opacity, setOpacity] = useState(0.2); // 0.0 to 1.0
    const [rotation, setRotation] = useState(-45); // Degrees
    const [fontSize, setFontSize] = useState(48);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

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

    // Load Image Preview
    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setImageUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setImageUrl(null);
        }
    }, [imageFile]);

    // Process Logic
    const handleProcess = async () => {
        if (files.length === 0) return;
        if (mode === 'text' && !text) return showToast("Please enter watermark text", "error");
        if (mode === 'image' && !imageFile) return showToast("Please upload an image", "error");

        setIsProcessing(true);
        showToast("Applying watermark...", "info");

        try {
            const file = files[0].file;
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            let imageEmbed = null;
            if (mode === 'image' && imageFile) {
                const imageBytes = await imageFile.arrayBuffer();
                if (imageFile.type === 'image/png') {
                    imageEmbed = await pdfDoc.embedPng(imageBytes);
                } else {
                    imageEmbed = await pdfDoc.embedJpg(imageBytes);
                }
            }

            for (const page of pages) {
                const { width, height } = page.getSize();

                // Calculate center
                const centerX = width / 2;
                const centerY = height / 2;

                if (mode === 'text') {
                    const textWidth = font.widthOfTextAtSize(text, fontSize);
                    const textHeight = fontSize;

                    page.drawText(text, {
                        x: centerX - textWidth / 2,
                        y: centerY - textHeight / 2,
                        size: fontSize,
                        font: font,
                        color: rgb(0.5, 0.5, 0.5), // Gray color
                        opacity: opacity,
                        rotate: degrees(rotation),
                    });
                } else if (mode === 'image' && imageEmbed) {
                    const imgDims = imageEmbed.scale(fontSize / 100); // Scale factor logic
                    const imgWidth = imgDims.width;
                    const imgHeight = imgDims.height;

                    page.drawImage(imageEmbed, {
                        x: centerX - imgWidth / 2,
                        y: centerY - imgHeight / 2,
                        width: imgWidth,
                        height: imgHeight,
                        opacity: opacity,
                        rotate: degrees(rotation),
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
            downloadBlob(blob, `${files[0].file.name.replace('.pdf', '')}_watermarked.pdf`);
            showToast("Success! Download started.", "success");
        } catch (error) {
            console.error(error);
            showToast("Failed to process PDF", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Related Tools
    const relatedTools = allTools.filter(t => ['protect', 'edit', 'page-numbers', 'delete'].includes(t.id));

    // Schema
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Add Watermark to PDF",
        "step": [
            { "@type": "HowToStep", "name": "Upload", "text": "Upload the PDF document you want to protect." },
            { "@type": "HowToStep", "name": "Configure", "text": "Add your text or logo and set transparency." },
            { "@type": "HowToStep", "name": "Download", "text": "Download your stamped PDF file." }
        ]
    };

    return (
        <main className="bg-slate-50 text-slate-800 antialiased pt-16">
            <JsonLd data={howToSchema} />

            {/* SECTION 1: HERO & TOOL INTERFACE */}
            <section className="max-w-4xl mx-auto px-4 py-12">

                {/* Tool Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 mb-4">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 animate-pulse"></span>
                        Brand & Protect
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Add Watermark to PDF
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Stamp your documents with "CONFIDENTIAL", "DRAFT", or your logo.
                    </p>
                </div>

                {/* Workspace Container */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="relative bg-slate-50 rounded-2xl p-6">

                        {files.length === 0 ? (
                            <DropZone onFilesSelected={addFiles} accept=".pdf" multiple={false} />
                        ) : (
                            <div className="space-y-6">
                                {/* Header Bar */}
                                <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-500">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{files[0].file.name}</span>
                                        <span className="text-xs text-slate-400">({totalPages} pages)</span>
                                    </div>
                                    <button onClick={clearFiles} className="text-xs text-slate-500 hover:text-rose-600 font-medium">Clear</button>
                                </div>

                                {/* IMPROVED: Settings Toolbar */}
                                <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm gap-4">

                                    {/* Mode Toggle */}
                                    <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 p-1 rounded-lg">
                                        <button
                                            onClick={() => setMode('text')}
                                            className={`px-3 py-1.5 rounded transition ${mode === 'text' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-100'}`}
                                        >
                                            Text
                                        </button>
                                        <button
                                            onClick={() => setMode('image')}
                                            className={`px-3 py-1.5 rounded transition ${mode === 'image' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-100'}`}
                                        >
                                            Image
                                        </button>
                                    </div>

                                    {/* Dynamic Controls */}
                                    {mode === 'text' ? (
                                        <input
                                            type="text"
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            className="flex-1 md:max-w-xs text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. CONFIDENTIAL"
                                        />
                                    ) : (
                                        <label className="flex-1 md:max-w-xs cursor-pointer">
                                            <div className="flex items-center justify-center w-full text-sm border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 text-slate-600">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                {imageFile ? imageFile.name : "Upload Logo"}
                                            </div>
                                            <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                                        </label>
                                    )}

                                    {/* Opacity & Rotation */}
                                    <div className="flex items-center space-x-4 text-xs">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-slate-500">Opacity:</span>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={opacity * 100}
                                                onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                                                className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span className="font-medium text-slate-700 w-8">{Math.round(opacity * 100)}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Processing Indicator */}
                                {isProcessing && !pageImageUrl && (
                                    <div className="text-center py-10">
                                        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm text-slate-500">Loading Preview...</p>
                                    </div>
                                )}

                                {/* IMPROVED: Preview Canvas with Live Watermark */}
                                {pageImageUrl && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[400px] relative shadow-inner mx-auto overflow-hidden" style={{ aspectRatio: '8.5/11', maxHeight: '600px' }}>
                                        {/* Rendered PDF Page */}
                                        <img src={pageImageUrl} alt="PDF Preview" className="w-full h-full object-contain pointer-events-none" />

                                        {/* Live Watermark Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                                            <div
                                                className="text-gray-400 font-bold tracking-widest whitespace-nowrap"
                                                style={{
                                                    fontSize: `${fontSize}px`,
                                                    opacity: opacity,
                                                    transform: `rotate(${rotation}deg)`,
                                                    color: '#64748b' // Slate-500
                                                }}
                                            >
                                                {mode === 'text' ? text : (
                                                    imageUrl && <img src={imageUrl} alt="Watermark" className="max-w-xs max-h-32 object-contain" style={{ opacity }} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Footer */}
                                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                                    <button
                                        onClick={handleProcess}
                                        disabled={isProcessing}
                                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        {isProcessing ? "Processing..." : "Download Watermarked PDF"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Custom Transparency</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Image Support</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Angle Rotation</div>
                </div>
            </section>

            {/* SECTION 2: HOW TO */}
            <section className="max-w-6xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">How to Watermark a PDF</h2>
                    <p className="text-slate-500 mt-2 max-w-xl mx-auto">Protect your documents in three simple steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Select the PDF file you wish to watermark.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Design</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Type your text or upload a logo. Set transparency and rotation.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Download</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Save your stamped PDF, ready to share.</p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: WHY USE THIS TOOL */}
            <section className="mt-24 bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">Document Protection</span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Why Watermark Your PDFs?</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Watermarking is the standard for marking document status (DRAFT, CONFIDENTIAL) and protecting intellectual property. It adds a layer of authenticity and prevents unauthorized reuse of your content.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Brand Recognition</h4>
                                        <p className="text-sm text-slate-500">Add your company logo to every page for professional branding.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Mark Document Status</h4>
                                        <p className="text-sm text-slate-500">Clearly label drafts or confidential files to prevent misuse.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Copyright Protection</h4>
                                        <p className="text-sm text-slate-500">Deter unauthorized copying with a transparent copyright notice.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="relative hidden md:block">
                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative overflow-hidden">
                                <div className="flex justify-center items-center space-x-6">
                                    <div className="w-40 h-52 bg-white border border-slate-200 rounded shadow-sm relative p-2 overflow-hidden">
                                        <div className="h-2 bg-slate-100 rounded w-full mb-2"></div>
                                        <div className="h-2 bg-slate-100 rounded w-3/4 mb-2"></div>
                                        <div className="h-2 bg-slate-100 rounded w-5/6 mb-4"></div>
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                                            <span className="text-xl font-bold text-blue-200 opacity-80 rotate-[-30deg]">DRAFT</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-500 mt-6 font-medium">Apply text or logos with adjustable opacity</p>
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
                    <p className="text-slate-500 mt-2">Common questions about adding watermarks.</p>
                </div>

                <div className="space-y-4">
                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Can I use my logo as a watermark?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Yes. You can upload any image (PNG, JPG) to use as a watermark. We recommend using a PNG with a transparent background for the best results.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Will the watermark obstruct the text?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            You control the transparency (opacity). Most users set it between 10-20% so the text remains readable while the watermark is visible.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Is the watermark permanent?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Yes, once you download the file, the watermark becomes part of the PDF content layer. It cannot be easily removed by others.
                        </div>
                    </details>
                </div>
            </section>

            {/* SECTION 6: RELATED TOOLS */}
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

const getIconColors = (id: string) => {
    const colors: Record<string, string> = {
        protect: "bg-blue-50 text-blue-600",
        edit: "bg-purple-50 text-purple-600",
        "page-numbers": "bg-cyan-50 text-cyan-600",
        delete: "bg-rose-50 text-rose-600",
    };
    return colors[id] || "bg-slate-100 text-slate-600";
};