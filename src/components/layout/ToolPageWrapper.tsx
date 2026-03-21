"use client";

import { useFiles } from "@/context/FileContext";
import { DropZone } from "@/components/ui/DropZone";
import { ActionBar } from "./ActionBar";
import { Container } from "@/components/ui/Container";
import { motion, AnimatePresence, Variants } from "framer-motion"; // Import Variants

interface ToolPageWrapperProps {
    title: string;
    description: string;
    children: React.ReactNode;
    onProcess: () => void;
    isProcessing?: boolean;
    processButtonText?: string;
    accept?: string;
    multiple?: boolean;
}

// Define Animation Variants
const pageVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

export const ToolPageWrapper: React.FC<ToolPageWrapperProps> = ({
    title,
    description,
    children,
    onProcess,
    isProcessing = false,
    processButtonText = "Process",
    accept = ".pdf",
    multiple = false,
}) => {
    const { files, addFiles } = useFiles();

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            <AnimatePresence mode="wait">
                {/* State 1: No files selected -> Show DropZone */}
                {files.length === 0 ? (
                    <motion.section
                        key="dropzone"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex-1 flex items-center justify-center py-20"
                    >
                        <Container>
                            <div className="max-w-3xl mx-auto text-center space-y-8">
                                <div className="space-y-4">
                                    <h1 className="text-4xl font-bold text-foreground">{title}</h1>
                                    <p className="text-lg text-muted-foreground">{description}</p>
                                </div>
                                <DropZone
                                    onFilesSelected={addFiles}
                                    accept={accept}
                                    multiple={multiple}
                                />
                            </div>
                        </Container>
                    </motion.section>
                ) : (
                    // State 2: Files selected -> Show Workspace
                    <motion.div
                        key="workspace"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex flex-col flex-1"
                    >
                        {/* Workspace Header - Hidden on Mobile to save space */}
                        <div className="hidden sm:block border-b border-border bg-slate-50 py-4">
                            <Container>
                                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                            </Container>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 overflow-auto pb-24">
                            <Container className="py-8">
                                {children}
                            </Container>
                        </div>

                        {/* Sticky Action Bar */}
                        <ActionBar
                            onSubmit={onProcess}
                            isProcessing={isProcessing}
                            buttonText={processButtonText}
                            disabled={files.length === 0}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};