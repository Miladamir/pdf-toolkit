// src/lib/useServerTool.ts
import { useState } from 'react';
import { useToast } from '@/context/ToastContext';

// Define response shapes
interface UploadResponse {
    success: boolean;
    key: string;
}

interface ProcessResponse {
    success: boolean;
    resultKey: string;
}

export const useServerTool = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { showToast } = useToast();

    const processFile = async (
        file: File,
        apiEndpoint: string
    ) => {
        setIsProcessing(true);
        try {
            // Step 1: Upload
            showToast("Uploading file...", "info");
            const uploadForm = new FormData();
            uploadForm.append('file', file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: uploadForm,
            });

            // Cast response
            const uploadData = await uploadRes.json() as UploadResponse;
            if (!uploadData.key) throw new Error("Upload failed");

            // Step 2: Process
            showToast("Processing on secure server...", "info");
            const processRes = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: uploadData.key }),
            });

            // Cast response
            const processData = await processRes.json() as ProcessResponse;
            if (!processData.resultKey) throw new Error("Processing failed");

            // Step 3: Download
            showToast("Preparing download...", "success");
            const downloadRes = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: processData.resultKey }),
            });

            // Trigger Browser Download
            const blob = await downloadRes.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name.replace('.pdf', `_${apiEndpoint.split('/')[2]}.pdf`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error(err);
            showToast("Operation failed", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    return { processFile, isProcessing };
};