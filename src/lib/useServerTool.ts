import { useState } from 'react';
import { useToast } from '@/context/ToastContext';

export const useServerTool = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { showToast } = useToast();

    const processFile = async (
        file: File,
        apiEndpoint: string // e.g. '/api/compress'
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

            const { key } = await uploadRes.json();
            if (!key) throw new Error("Upload failed");

            // Step 2: Process (Server-Side)
            showToast("Processing on secure server...", "info");
            const processRes = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key }),
            });

            const { resultKey } = await processRes.json();
            if (!resultKey) throw new Error("Processing failed");

            // Step 3: Download
            showToast("Preparing download...", "success");
            const downloadRes = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: resultKey }),
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