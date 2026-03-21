"use client";

import { Button } from "@/components/ui/Button";

interface ActionBarProps {
    onSubmit: () => void;
    processingLabel?: string;
    isProcessing?: boolean;
    disabled?: boolean;
    buttonText?: string;
}

export const ActionBar: React.FC<ActionBarProps> = ({
    onSubmit,
    processingLabel = "Processing...",
    isProcessing = false,
    disabled = false,
    buttonText = "Download PDF",
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <p className="text-sm text-muted-foreground hidden sm:block">
                    Files are processed locally in your browser.
                </p>
                <div className="flex gap-4 ml-auto">
                    <Button
                        variant="primary"
                        onClick={onSubmit}
                        disabled={disabled || isProcessing}
                        className="min-w-[200px]"
                    >
                        {isProcessing ? processingLabel : buttonText}
                    </Button>
                </div>
            </div>
        </div>
    );
};