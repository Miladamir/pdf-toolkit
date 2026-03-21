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
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default function EditPdfPage() {
    const { files, addFiles, clearFiles } = useFiles();
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Text & Settings State
    const [text, setText] = useState("Type here");
    const [fontColor, setFontColor] = useState('#000000');
    const [fontSize, setFontSize] = useState(18);
    const [fontFamily, setFontFamily] = useState('Helvetica');

    // Drag State
    const [position, setPosition] = useState({ x: 50, y: 50 }); // Percentage based
    const [isDragging, setIsDragging] = useState(false);

    const { showToast } = useToast();

    // 1. Load PDF Meta & Preview
    useEffect(() => {
        const loadPdf = async () => {
            if (files.length > 0) {
                setIsProcessing(true);
                try {
                    const count = await getPdfPageCount(files[0].file);
                    setTotalPages(count);
                    // Render current page
                    const url = await renderPageToUrl(files[0].file, currentPage);
                    setPageImageUrl(url);
                    // Reset position on page change
                    setPosition({ x: 50, y: 50 });
                } catch (error) {
                    console.error(error);
                    showToast("Failed to load PDF", "error");
                } finally {
                    setIsProcessing(false);
                }
            }
        };
        loadPdf();
    }, [files, currentPage]);

    // 2. Drag Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent text selection
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Clamp values
        setPosition({
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 3. Process & Download
    const handleProcess = async () => {
        if (files.length === 0 || !text) return;
        setIsProcessing(true);
        showToast("Applying edits...", "info");

        try {
            const file = files[0].file;
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const page = pages[currentPage - 1]; // 0-based index

            // Embed Font
            let font;
            if (fontFamily === 'Courier') font = await pdfDoc.embedFont(StandardFonts.Courier);
            else if (fontFamily === 'Times-Roman') font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            else font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            const { width, height } = page.getSize();

            // Convert % position to PDF coordinates
            const x = (position.x / 100) * width;
            const y = height - (position.y / 100) * height; // Invert Y

            // Parse Color
            const hex = fontColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;

            page.drawText(text, {
                x: x,
                y: y,
                size: fontSize,
                font: font,
                color: rgb(r, g, b),
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
            downloadBlob(blob, `${files[0].file.name.replace('.pdf', '')}_edited.pdf`);
            showToast("Success! Download started.", "success");
        } catch (error) {
            console.error(error);
            showToast("Failed to edit PDF", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Related Tools
    const relatedTools = allTools.filter(t => ['delete', 'protect', 'merge', 'compress'].includes(t.id));

    // Schema
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Add Text to PDF",
        "step": [
            { "@type": "HowToStep", "name": "Upload", "text": "Upload the PDF file you want to edit." },
            { "@type": "HowToStep", "name": "Edit", "text": "Type text, choose style, and drag to position." },
            { "@type": "HowToStep", "name": "Download", "text": "Save your edited PDF file." }
        ]
    };

    return (
        <main className="bg-slate-50 text-slate-800 antialiased pt-16">
            <JsonLd data={howToSchema} />

            {/* SECTION 1: HERO & TOOL INTERFACE */}
            <section className="max-w-4xl mx-auto px-4 py-12">

                {/* Tool Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 mb-4">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5 animate-pulse"></span>
                        Simple Text Editing
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Edit PDF Files
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Add text, comments, or fill out forms directly in your browser.
                    </p>
                </div>

                {/* Workspace Container */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="relative bg-slate-50 rounded-2xl p-6">

                        {files.length === 0 ? (
                            <DropZone onFilesSelected={addFiles} accept=".pdf" multiple={false} />
                        ) : (
                            <div className="space-y-6">
                                {/* Header Bar */}
                                <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center text-purple-500">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{files[0].file.name}</span>
                                    </div>
                                    <button onClick={clearFiles} className="text-xs text-slate-500 hover:text-rose-600 font-medium">Clear</button>
                                </div>

                                {/* IMPROVED: Comprehensive Settings Toolbar */}
                                <div className="flex flex-wrap justify-between items-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm gap-3">
                                    {/* Text Input */}
                                    <div className="flex-grow min-w-[200px]">
                                        <input
                                            type="text"
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder="Enter text..."
                                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Page Selector */}
                                    <div className="flex items-center space-x-2 border-l border-r border-slate-200 px-4">
                                        <label className="text-xs text-slate-500">Page:</label>
                                        <select
                                            value={currentPage}
                                            onChange={(e) => setCurrentPage(Number(e.target.value))}
                                            className="text-sm border border-slate-200 rounded-lg p-2 bg-slate-50 cursor-pointer"
                                        >
                                            {Array.from({ length: totalPages }, (_, i) => (
                                                <option key={i} value={i + 1}>{i + 1}</option>
                                            ))}
                                        </select>
                                        <span className="text-xs text-slate-400">/ {totalPages}</span>
                                    </div>

                                    {/* Style Controls */}
                                    <div className="flex items-center space-x-3">
                                        {/* Font Family */}
                                        <select
                                            value={fontFamily}
                                            onChange={(e) => setFontFamily(e.target.value)}
                                            className="text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 cursor-pointer"
                                        >
                                            <option>Helvetica</option>
                                            <option>Courier</option>
                                            <option>Times-Roman</option>
                                        </select>

                                        {/* Font Size */}
                                        <input
                                            type="number"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(Number(e.target.value))}
                                            className="w-14 text-xs border border-slate-200 rounded-lg p-2 text-center"
                                        />

                                        {/* Color Picker */}
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={fontColor}
                                                onChange={(e) => setFontColor(e.target.value)}
                                                className="w-8 h-8 rounded cursor-pointer border border-slate-200 bg-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <button
                                        onClick={handleProcess}
                                        disabled={isProcessing || !text}
                                        className="px-4 py-2 text-sm font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
                                    >
                                        {isProcessing ? "Saving..." : "Download"}
                                    </button>
                                </div>

                                {/* Processing Indicator */}
                                {isProcessing && !pageImageUrl && (
                                    <div className="text-center py-10">
                                        <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm text-slate-500">Loading Page...</p>
                                    </div>
                                )}

                                {/* IMPROVED: Draggable Canvas */}
                                {pageImageUrl && (
                                    <div
                                        ref={containerRef}
                                        className="relative bg-slate-200 rounded-xl shadow-inner overflow-hidden mx-auto select-none"
                                        style={{ aspectRatio: '8.5/11', maxHeight: '600px' }}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp}
                                    >
                                        {/* PDF Image */}
                                        <img src={pageImageUrl} alt="PDF Preview" className="w-full h-full object-contain pointer-events-none" />

                                        {/* Draggable Text Overlay */}
                                        <div
                                            className="absolute cursor-move border border-dashed border-purple-400 px-2 py-1 rounded bg-white/50 backdrop-blur-sm"
                                            style={{
                                                left: `${position.x}%`,
                                                top: `${position.y}%`,
                                                transform: 'translate(-50%, -50%)',
                                                fontSize: `${fontSize}px`,
                                                fontFamily: fontFamily,
                                                color: fontColor,
                                                fontWeight: 'bold',
                                                whiteSpace: 'nowrap',
                                            }}
                                            onMouseDown={handleMouseDown}
                                        >
                                            {text || "Text"}
                                        </div>
                                    </div>
                                )}

                                {/* Hint */}
                                <p className="text-center text-xs text-slate-400 mt-2">Drag the text to position it on the page.</p>

                            </div>
                        )}

                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Fill Forms</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Add Comments</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>No Installation</div>
                </div>
            </section>

            {/* SECTION 2: HOW TO */}
            <section className="max-w-6xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">How to Add Text to PDF</h2>
                    <p className="text-slate-500 mt-2 max-w-xl mx-auto">Write on your PDF documents in just a few clicks.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Select the PDF file you want to write on.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Edit</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Type text, choose font, and drag to position.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Download</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Save your edited document to your device.</p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: WHY USE THIS TOOL */}
            <section className="mt-24 bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-sm font-bold text-purple-600 uppercase tracking-wider">Quick Modifications</span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Why Edit PDFs Online?</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Need to fill out a form, sign a document, or correct a typo? Our editor allows you to add text to PDFs without needing expensive software like Adobe Acrobat. It's perfect for quick changes and form filling.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Fill Forms Instantly</h4>
                                        <p className="text-sm text-slate-500">Type directly into form fields or anywhere on the document.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">No Registration</h4>
                                        <p className="text-sm text-slate-500">Start editing immediately. No email or account required.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Format Support</h4>
                                        <p className="text-sm text-slate-500">Change font size, style, and color to match your document.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="relative hidden md:block">
                            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative overflow-hidden">
                                <div className="flex justify-center items-start space-x-4">
                                    <div className="w-40 h-52 bg-white border border-slate-200 rounded shadow-sm relative p-2">
                                        <div className="h-2 bg-slate-100 rounded w-full mb-2"></div>
                                        <div className="h-2 bg-slate-100 rounded w-3/4 mb-2"></div>
                                        <div className="h-2 bg-slate-100 rounded w-5/6 mb-4"></div>
                                        <div className="h-2 bg-purple-100 rounded w-1/2 mb-2 animate-pulse"></div>
                                        <div className="absolute bottom-4 right-4 text-purple-400 text-[8px] font-mono">typing...</div>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-500 mt-6 font-medium">Add text without altering original layout</p>
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
                            <p className="text-slate-400 text-sm">We preserve the original layout and resolution of your documents.</p>
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
                    <p className="text-slate-500 mt-2">Common questions about editing PDFs.</p>
                </div>

                <div className="space-y-4">
                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Can I edit existing text in a PDF?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Currently, this tool supports adding new text (great for filling forms or adding comments). To modify existing text from the original source, the PDF would need to be converted back to an editable format like Word.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Will the text stay in place?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Yes. When you drag the text on the screen, the position is calculated precisely. It will remain there when you save and print the file.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Is my edited document secure?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Yes. Since our editor runs locally in your browser, your data is never transmitted to an external server. Once you close the tab, the data is gone.
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
        delete: "bg-rose-50 text-rose-600",
        protect: "bg-blue-50 text-blue-600",
        merge: "bg-indigo-50 text-indigo-600",
        compress: "bg-orange-50 text-orange-600",
    };
    return colors[id] || "bg-slate-100 text-slate-600";
};