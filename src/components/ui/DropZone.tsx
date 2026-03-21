"use client";

import React, { useCallback, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { validateFile } from "@/lib/utils";

interface DropZoneProps {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSizeMB?: number;
}

export const DropZone: React.FC<DropZoneProps> = ({
    onFilesSelected,
    accept = ".pdf",
    multiple = false,
    maxSizeMB = 50,
}) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [displayFileName, setDisplayFileName] = useState<string | null>(null);

    const { showToast } = useToast();

    const processFiles = useCallback((files: File[]) => {
        if (files.length === 0) return;

        const filesToProcess = multiple ? files : [files[0]];

        const validFiles: File[] = [];
        for (const file of filesToProcess) {
            // Pass 'accept' prop to validation
            const validation = validateFile(file, maxSizeMB, accept);
            if (!validation.valid) {
                showToast(validation.error || "Invalid file", "error");
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            setIsSuccess(true);
            setDisplayFileName(validFiles.length > 1
                ? `${validFiles.length} files selected`
                : validFiles[0].name
            );
            onFilesSelected(validFiles);
        }
    }, [multiple, maxSizeMB, onFilesSelected, showToast, accept]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            processFiles(files);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Header Text */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Upload your file</h2>
                <p className="text-slate-500 text-sm mt-1">Drag & drop or click to browse from your computer</p>
            </div>

            {/* Dropzone Wrapper */}
            <div className="relative group">

                {/* Gradient Glow Background */}
                <div
                    className={`
                        absolute inset-0 rounded-[1.25rem] transition-opacity duration-400 -z-10
                        ${isSuccess ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}
                    `}
                    style={{
                        background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe, #e0e7ff)',
                        filter: 'blur(4px)',
                        transform: 'scale(1.02)'
                    }}
                />

                {/* The Actual Dropzone Area */}
                <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        relative w-full min-h-[280px] flex flex-col items-center justify-center p-8 rounded-2xl
                        transition-all duration-300 cursor-pointer overflow-hidden border-2
                        backdrop-blur-xl
                        
                        ${isSuccess
                            ? 'border-green-500 bg-white'
                            : isDragActive
                                ? 'border-brand-600 bg-brand-50/95 scale-[1.01] shadow-2xl'
                                : 'border-dashed border-slate-300 bg-white/80 hover:border-brand-400'
                        }
                    `}
                >
                    <input
                        type="file"
                        accept={accept}
                        multiple={multiple}
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* Content Layer */}
                    <div className={`flex flex-col items-center justify-center text-center transition-opacity duration-300 ${isSuccess ? 'opacity-0 absolute pointer-events-none' : 'opacity-100'}`}>

                        <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-5 border border-brand-100 shadow-sm group-hover:bg-brand-100 transition-colors">
                            <svg
                                className="w-10 h-10 text-brand-500 animate-icon-float"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                        </div>

                        <div className="mb-4">
                            <p className="text-lg font-semibold text-slate-700">
                                {isDragActive ? "Drop it like it's hot!" : "Drop your file(s) here"}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                                or <span className="text-brand-600 font-medium">browse</span> to upload
                            </p>
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                            </svg>
                            Secure Transfer • Max {maxSizeMB}MB
                        </div>
                    </div>

                    {/* Success Layer */}
                    {isSuccess && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-8 animate-fade-in">
                            <div className="w-20 h-20 mb-4 relative">
                                <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                </svg>
                            </div>

                            <div className="text-center">
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Ready to Process</h3>
                                <div className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-md border border-slate-100 truncate max-w-xs file-info">
                                    {displayFileName}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="mt-4 text-xs text-slate-500 hover:text-brand-600 transition flex items-center"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsSuccess(false);
                                    setDisplayFileName(null);
                                }}
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                Choose a different file
                            </button>
                        </div>
                    )}
                </label>
            </div>

            {/* Helper Text Below */}
            <div className="mt-4 flex justify-between items-center text-xs text-slate-400 px-1">
                <span>Maximum file size: {maxSizeMB}MB</span>
                <span>No registration required</span>
            </div>
        </div>
    );
};