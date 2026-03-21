import JSZip from 'jszip';
import { downloadBlob } from '../pdf';
import { parsePageRanges } from '../utils'; // Import our helper

export const pdfToImage = async (
    file: File,
    scale: number = 2,
    format: 'jpeg' | 'png' = 'jpeg',
    pageRange: string = 'all', // New parameter
    onProgress: (progress: number) => void
) => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const total = pdf.numPages;

    // 1. Parse the range
    const indices = parsePageRanges(pageRange, total);

    if (indices.length === 0) throw new Error("No valid pages selected.");

    const zip = new JSZip();
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';

    // 2. Process only selected pages
    let processedCount = 0;

    for (const index of indices) {
        const pageNum = index + 1; // PDF.js uses 1-based
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport, canvas }).promise;

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, mimeType, 0.9)
        );

        if (blob) {
            zip.file(`page_${pageNum}.${ext}`, blob);
        }

        processedCount++;
        onProgress(Math.round((processedCount / indices.length) * 100));
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const newName = file.name.replace('.pdf', `_images.zip`);
    downloadBlob(zipBlob, newName);
};