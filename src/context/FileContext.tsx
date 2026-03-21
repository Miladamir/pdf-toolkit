"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ProcessableFile } from "@/types";

// 1. Define what data and functions are available
interface FileContextType {
    files: ProcessableFile[];
    addFiles: (newFiles: File[]) => void;
    removeFile: (id: string) => void;
    clearFiles: () => void;
}

// 2. Create the Context
const FileContext = createContext<FileContextType | undefined>(undefined);

// 3. Create the Provider Component (The wrapper)
export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [files, setFiles] = useState<ProcessableFile[]>([]);

    // Helper to generate a simple unique ID
    const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const addFiles = (newFiles: File[]) => {
        const processableFiles: ProcessableFile[] = newFiles.map((file) => ({
            id: generateId(),
            file: file,
        }));

        // Append to existing files
        setFiles((prev) => [...prev, ...processableFiles]);
    };

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const clearFiles = () => {
        setFiles([]);
    };

    return (
        <FileContext.Provider value={{ files, addFiles, removeFile, clearFiles }}>
            {children}
        </FileContext.Provider>
    );
};

// 4. Create a custom hook to use the context easily
export const useFiles = () => {
    const context = useContext(FileContext);
    if (!context) {
        throw new Error("useFiles must be used within a FileProvider");
    }
    return context;
};