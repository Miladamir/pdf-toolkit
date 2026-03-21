"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useFiles } from "@/context/FileContext";
import { DropZone } from "@/components/ui/DropZone";
import { JsonLd } from "@/components/seo/JsonLd";
import { allTools } from "@/lib/toolsConfig";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { getPdfPageCount, renderPageToUrl } from "@/lib/pdf";
import { downloadBlob } from "@/lib/utils";
import { signPdf } from "@/lib/tools/sign";

export default function SignPdfPage() {
    const { files, addFiles, clearFiles } = useFiles();
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Signature State
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [position, setPosition] = useState({ x: 75, y: 85 }); // Percentage based (bottom right default)
    const [isDragging, setIsDragging] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'draw' | 'type' | 'upload'>('draw');
    const [typedName, setTypedName] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    const { showToast } = useToast();

    // Load PDF Preview
    useEffect(() => {
        const loadPreview = async () => {
            if (files.length > 0) {
                setIsProcessing(true);
                try {
                    const count = await getPdfPageCount(files[0].file);
                    setTotalPages(count);
                    const url = await renderPageToUrl(files[0].file, currentPage);
                    setPageImageUrl(url);
                    // Reset position when page changes
                    setPosition({ x: 75, y: 85 });
                } catch (error) {
                    console.error(error);
                    showToast("Failed to load PDF", "error");
                } finally {
                    setIsProcessing(false);
                }
            }
        };
        loadPreview();
    }, [files, currentPage]);

    // --- Drag Logic ---
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    };

    const handleMouseUp = () => setIsDragging(false);

    // --- Drawing Logic ---
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = '#1e3a8a'; // Blue-900
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    };

    // --- Modal Actions ---
    const handleSaveSignature = () => {
        let dataUrl: string | null = null;

        if (modalMode === 'draw' && canvasRef.current) {
            dataUrl = canvasRef.current.toDataURL('image/png');
        } else if (modalMode === 'type' && typedName) {
            // Create image from text
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 400, 100);
                ctx.font = "italic 40px 'Brush Script MT', cursive";
                ctx.fillStyle = '#1e3a8a';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(typedName, 200, 50);
                dataUrl = canvas.toDataURL('image/png');
            }
        } else if (modalMode === 'upload' && uploadedImage) {
            dataUrl = uploadedImage;
        }

        if (dataUrl) {
            setSignatureUrl(dataUrl);
            setShowModal(false);
            // Reset modal state
            clearCanvas();
            setTypedName("");
            setUploadedImage(null);
        } else {
            showToast("Please create or upload a signature first", "error");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    // --- Process Logic ---
    const handleProcess = async () => {
        if (!signatureUrl) return showToast("Please add a signature first", "error");
        if (files.length === 0) return;

        setIsProcessing(true);
        showToast("Signing document...", "info");

        try {
            const resultBlob = await signPdf(files[0].file, {
                signatureDataUrl: signatureUrl,
                pageIndex: currentPage - 1,
                x: position.x,
                y: position.y,
                width: 150,
            });

            downloadBlob(resultBlob, `${files[0].file.name.replace('.pdf', '')}_signed.pdf`);
            showToast("Success! Document signed.", "success");
        } catch (error) {
            console.error(error);
            showToast("Failed to sign PDF", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Related Tools
    const relatedTools = allTools.filter(t => ['edit', 'watermark', 'protect', 'page-numbers'].includes(t.id));

    // Schema
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Sign a PDF",
        "step": [
            { "@type": "HowToStep", "name": "Upload", "text": "Upload the PDF document you need to sign." },
            { "@type": "HowToStep", "name": "Create Signature", "text": "Draw, type, or upload an image of your signature." },
            { "@type": "HowToStep", "name": "Place & Download", "text": "Drag the signature to the correct spot and download." }
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
                        Legally Binding e-Signature
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Sign PDF Online
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Create your signature and sign documents instantly. No printing needed.
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
                                    </div>
                                    <button onClick={clearFiles} className="text-xs text-slate-500 hover:text-rose-600 font-medium">Clear</button>
                                </div>

                                {/* IMPROVED: Settings Toolbar */}
                                <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm gap-4">

                                    {/* Page Selector (New Feature) */}
                                    <div className="flex items-center space-x-2 w-full md:w-auto">
                                        <label className="text-xs text-slate-500 whitespace-nowrap">Sign Page:</label>
                                        <select
                                            value={currentPage}
                                            onChange={(e) => setCurrentPage(Number(e.target.value))}
                                            className="flex-1 md:w-24 text-sm border border-slate-200 rounded-lg p-2 bg-slate-50 cursor-pointer"
                                        >
                                            {Array.from({ length: totalPages }, (_, i) => (
                                                <option key={i} value={i + 1}>Page {i + 1}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-700 transition"
                                        >
                                            {signatureUrl ? "Change Signature" : "Add Signature"}
                                        </button>

                                        {signatureUrl && (
                                            <span className="text-xs text-green-600 hidden sm:block">✓ Ready</span>
                                        )}
                                    </div>
                                </div>

                                {/* Processing Indicator */}
                                {isProcessing && !pageImageUrl && (
                                    <div className="text-center py-10">
                                        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm text-slate-500">Loading Page...</p>
                                    </div>
                                )}

                                {/* IMPROVED: Preview Canvas with Draggable Signature */}
                                {pageImageUrl && (
                                    <div
                                        ref={containerRef}
                                        className="bg-white rounded-xl border border-slate-200 p-6 min-h-[400px] relative shadow-inner select-none"
                                        style={{ aspectRatio: '8.5/11', maxHeight: '600px' }}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp}
                                    >
                                        {/* Rendered PDF Page */}
                                        <img src={pageImageUrl} alt="PDF Preview" className="w-full h-full object-contain pointer-events-none" />

                                        {/* Draggable Signature Overlay */}
                                        {signatureUrl && (
                                            <img
                                                src={signatureUrl}
                                                alt="Signature"
                                                className="absolute w-40 h-auto cursor-move border border-dashed border-blue-400 bg-white/80 p-1 rounded shadow-sm"
                                                style={{
                                                    left: `${position.x}%`,
                                                    top: `${position.y}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                }}
                                                onMouseDown={handleMouseDown}
                                            />
                                        )}

                                        {!signatureUrl && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="text-slate-300 border-2 border-dashed border-slate-200 px-4 py-2 rounded bg-white/50">
                                                    Click "Add Signature" to start
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Footer */}
                                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                                    <button
                                        onClick={handleProcess}
                                        disabled={isProcessing || !signatureUrl}
                                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        {isProcessing ? "Processing..." : "Finish & Download"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Legally Binding</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Multiple Methods</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Secure Storage</div>
                </div>
            </section>

            {/* SECTION 2: HOW TO */}
            <section className="max-w-6xl mx-auto px-4 mt-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">How to Sign a PDF</h2>
                    <p className="text-slate-500 mt-2 max-w-xl mx-auto">Sign your documents electronically in three simple steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Upload the PDF document you need to sign.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Create Signature</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Draw your signature using mouse, stylus, or upload an image.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center transition-transform hover:scale-105">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Download</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Place the signature and download your signed PDF.</p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: WHY USE THIS TOOL */}
            <section className="mt-24 bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">Paperless Workflow</span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">Why Sign PDFs Electronically?</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Electronic signatures are legally recognized in most countries. They save time, reduce paper waste, and allow you to sign contracts from anywhere in the world without a printer or scanner.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Legally Binding</h4>
                                        <p className="text-sm text-slate-500">Compliant with eIDAS, ESIGN Act, and UETA regulations.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Save Time & Money</h4>
                                        <p className="text-sm text-slate-500">Sign contracts in seconds instead of mailing paper documents.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Multiple Methods</h4>
                                        <p className="text-sm text-slate-500">Type your name, draw with a mouse, or upload a photo of your signature.</p>
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
                                        <div className="absolute bottom-6 right-2 border-2 border-red-300 bg-red-50/30 p-1 rounded transform rotate-[-2deg]">
                                            <span className="font-signature text-red-600 text-lg">Approved</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-500 mt-6 font-medium">Quick, official, and secure approvals</p>
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
                    <p className="text-slate-500 mt-2">Common questions about signing PDFs.</p>
                </div>

                <div className="space-y-4">
                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Are electronic signatures legally binding?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Yes. Electronic signatures are legally recognized in most countries, including the US (ESIGN Act), EU (eIDAS), and many others. They carry the same legal weight as handwritten signatures.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Can I sign without a stylus?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Absolutely. You can use your mouse to draw a signature, type your name and choose a font style, or upload a photo of your handwritten signature taken with your phone.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Is my signature stored on your servers?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            No. Our tool runs entirely in your browser. Neither your PDF nor your signature is uploaded to our servers.
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

            {/* SIGNATURE CREATION MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b border-slate-200">
                            <h3 className="font-bold text-slate-800">Create Signature</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b border-slate-100">
                            {['draw', 'type', 'upload'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => { setModalMode(m as any); clearCanvas(); setTypedName(""); setUploadedImage(null); }}
                                    className={`flex-1 py-3 text-xs font-semibold transition ${modalMode === m ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    {m === 'draw' ? 'Draw' : m === 'type' ? 'Type' : 'Upload'}
                                </button>
                            ))}
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {modalMode === 'draw' && (
                                <div className="relative bg-white border border-slate-200 rounded-lg">
                                    <canvas
                                        ref={canvasRef}
                                        width={400}
                                        height={150}
                                        className="w-full cursor-crosshair"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseOut={stopDrawing}
                                    ></canvas>
                                    <button onClick={clearCanvas} className="absolute top-2 right-2 text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">Clear</button>
                                </div>
                            )}

                            {modalMode === 'type' && (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={typedName}
                                        onChange={(e) => setTypedName(e.target.value)}
                                        placeholder="Type your name..."
                                        className="w-full text-lg border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                                    />
                                    {typedName && (
                                        <div className="p-4 bg-slate-50 rounded-lg text-center border border-slate-100">
                                            <span className="text-3xl text-blue-900" style={{ fontFamily: "'Brush Script MT', cursive" }}>{typedName}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {modalMode === 'upload' && (
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                                    <input type="file" accept="image/*" className="hidden" id="sigUpload" onChange={handleFileUpload} />
                                    <label htmlFor="sigUpload" className="cursor-pointer">
                                        {uploadedImage ? (
                                            <img src={uploadedImage} alt="Uploaded" className="max-h-24 mx-auto" />
                                        ) : (
                                            <div className="text-slate-400">
                                                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                Click to upload image
                                            </div>
                                        )}
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={handleSaveSignature} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Signature</button>
                        </div>
                    </div>
                </div>
            )}

        </main>
    );
}

const getIconColors = (id: string) => {
    const colors: Record<string, string> = {
        edit: "bg-purple-50 text-purple-600",
        watermark: "bg-indigo-50 text-indigo-600",
        protect: "bg-blue-50 text-blue-600",
        "page-numbers": "bg-cyan-50 text-cyan-600",
    };
    return colors[id] || "bg-slate-100 text-slate-600";
};