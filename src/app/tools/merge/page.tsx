"use client";

import { useState, useEffect } from "react";
import { useFiles } from "@/context/FileContext";
import { mergePdfs } from "@/lib/tools/merge";
import { getPdfPageCount } from "@/lib/pdf";
import { DropZone } from "@/components/ui/DropZone";
import { JsonLd } from "@/components/seo/JsonLd";
import { allTools } from "@/lib/toolsConfig";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export default function MergePdfPage() {
    const { files, addFiles, removeFile, clearFiles } = useFiles();
    const [isProcessing, setIsProcessing] = useState(false);
    const [pageCounts, setPageCounts] = useState<Record<string, number>>({});
    const router = useRouter();
    const { showToast } = useToast();

    // Fetch page counts for thumbnails/info
    useEffect(() => {
        const fetchCounts = async () => {
            const counts: Record<string, number> = {};
            for (const file of files) {
                if (!pageCounts[file.id]) {
                    const count = await getPdfPageCount(file.file);
                    counts[file.id] = count;
                }
            }
            if (Object.keys(counts).length > 0) {
                setPageCounts(prev => ({ ...prev, ...counts }));
            }
        };
        if (files.length > 0) fetchCounts();
    }, [files]);

    const handleMerge = async () => {
        if (files.length < 1) {
            showToast("Please select at least one file.", "error");
            return;
        }

        setIsProcessing(true);
        try {
            const rawFiles = files.map((f) => f.file);
            await mergePdfs(rawFiles, "merged-document.pdf");
            showToast("PDF Merged Successfully!", "success");
            // Optional: clearFiles(); 
        } catch (error) {
            console.error("Merge failed:", error);
            showToast("An error occurred while merging.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Tool Cards for Related Tools section
    const relatedTools = allTools.filter(t => ['split', 'compress', 'image-to-pdf', 'watermark'].includes(t.id));

    // Schema for SEO
    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Merge PDF Files",
        "step": [
            {
                "@type": "HowToStep",
                "name": "Upload Files",
                "text": "Drag and drop your PDF files into the upload area or click to browse."
            },
            {
                "@type": "HowToStep",
                "name": "Reorder Files",
                "text": "Arrange the pages or files in the desired order by dragging them."
            },
            {
                "@type": "HowToStep",
                "name": "Merge and Download",
                "text": "Click the 'Merge PDF' button and download your combined file."
            }
        ]
    };

    return (
        <main className="bg-slate-50 text-slate-800 antialiased pt-16">
            <JsonLd data={howToSchema} />

            {/* SECTION 1: HERO & TOOL INTERFACE */}
            <section className="max-w-4xl mx-auto px-4 py-12">

                {/* Tool Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 mb-4">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                        100% Secure Local Processing
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
                        Merge PDF Files
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Combine multiple PDFs into a single document effortlessly. Drag to reorder pages.
                    </p>
                </div>

                {/* Workspace Container */}
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 relative overflow-hidden">

                    {/* Decorative Background Elements */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                    <div className="relative bg-slate-50 rounded-2xl p-6">

                        {/* Conditional UI: Show Dropzone or File List */}
                        {files.length === 0 ? (
                            <DropZone
                                onFilesSelected={addFiles}
                                accept=".pdf"
                                multiple
                            />
                        ) : (
                            <div className="space-y-6">
                                {/* File List Header */}
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-900">{files.length} Files Selected</h3>
                                    <button
                                        onClick={clearFiles}
                                        className="text-sm text-slate-500 hover:text-red-600 transition flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        Clear All
                                    </button>
                                </div>

                                {/* File Items */}
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {files.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition"
                                        >
                                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{item.file.name}</p>
                                                <p className="text-xs text-slate-400">
                                                    {(item.file.size / 1024 / 1024).toFixed(2)} MB {pageCounts[item.id] ? `• ${pageCounts[item.id]} pages` : ''}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeFile(item.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add More Files Button */}
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-brand-400 transition cursor-pointer text-center">
                                    <label className="cursor-pointer">
                                        <span className="text-sm text-slate-600 font-medium">+ Add more files</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf"
                                            multiple
                                            onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
                                        />
                                    </label>
                                </div>

                                {/* Merge Button */}
                                <div className="pt-4">
                                    <button
                                        onClick={handleMerge}
                                        disabled={isProcessing}
                                        className="w-full px-10 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>Merge Files Now</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Trust Badges */}
                <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 mt-8 text-xs text-slate-500">
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>No Registration</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>No Watermarks</div>
                    <div className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>Unlimited Files</div>
                </div>

            </section>

            {/* SECTION 2: DETAILED INFO & SEO CONTENT */}
            <section className="max-w-6xl mx-auto px-4 mt-24">

                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">How to Merge PDF Files Online</h2>
                    <p className="text-slate-500 mt-2 max-w-xl mx-auto">Follow these simple steps to combine your documents into a single, organized PDF file.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Step 1 */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-lg transition">
                        <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">1. Upload PDFs</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Drag and drop your files into the area above. You can add as many files as you need.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-lg transition">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">2. Reorder Pages</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Drag the thumbnails to arrange the files in the exact order you want them to appear.</p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-lg transition">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-5 shadow-sm">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">3. Download Result</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Click "Merge". We process your files instantly, and you can download your new PDF.</p>
                    </div>
                </div>
            </section>

            {/* SECTION 3: WHY CHOOSE US & FEATURES */}
            <section className="mt-24 bg-white border-y border-slate-100 py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Left: Content */}
                        <div>
                            <span className="text-sm font-bold text-brand-600 uppercase tracking-wider">Why PDF Toolkit</span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-6">The Smartest Way to Combine PDFs</h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                Merging PDF files has never been easier. Whether you are compiling reports, organizing invoices, or creating a portfolio, PDF Toolkit provides a seamless experience right in your browser. Unlike other tools, we prioritize your privacy and speed above all else.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Lossless Quality</h4>
                                        <p className="text-sm text-slate-500">Your merged PDF retains the original quality of the source files. No compression.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Instant Processing</h4>
                                        <p className="text-sm text-slate-500">Local processing means your files are ready in milliseconds.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 mr-3 mt-0.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800">Works on All Devices</h4>
                                        <p className="text-sm text-slate-500">Merge PDFs on your phone, tablet, or desktop. No software installation required.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Right: Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-brand-200 transition">
                                <div className="text-3xl font-bold text-brand-600 mb-1">100%</div>
                                <div className="text-sm text-slate-500 font-medium">Free to Use</div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-brand-200 transition">
                                <div className="text-3xl font-bold text-brand-600 mb-1">0%</div>
                                <div className="text-sm text-slate-500 font-medium">Upload Required</div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-brand-200 transition col-span-2">
                                <div className="text-3xl font-bold text-brand-600 mb-1">256-bit</div>
                                <div className="text-sm text-slate-500 font-medium">SSL Encryption & Local Security</div>
                            </div>
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
                            <span>Is it safe to merge PDF files online?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            Yes, absolutely. Our "Merge PDF" tool uses client-side processing technology. This means your files are processed directly in your web browser and are never uploaded to any external server.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Is there a limit to how many PDFs I can merge?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            There is no hard limit on the number of files. However, since processing happens on your device, merging a very large number of files might slow down your browser depending on your computer's memory.
                        </div>
                    </details>

                    <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
                        <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                            <span>Will the merged PDF have watermarks?</span>
                            <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-brand-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </span>
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                            No. We do not add any watermarks, branding, or footers to your documents. The output file is a clean, professional merge of your original files.
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

// Helper to duplicate color logic without importing full ToolCard logic
const getIconColors = (id: string) => {
    const colors: Record<string, string> = {
        split: "bg-pink-50 text-pink-600",
        grayscale: "bg-orange-50 text-orange-600",
        "image-to-pdf": "bg-green-50 text-green-600",
        watermark: "bg-cyan-50 text-cyan-600",
    };
    return colors[id] || "bg-slate-100 text-slate-600";
};