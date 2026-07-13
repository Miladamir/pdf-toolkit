
import { PDFDocument } from 'pdf-lib';

/**
 * Loads a PDF file and returns a PDFDocument instance (pdf-lib).
 */
export const loadPdf = async (file: File): Promise<PDFDocument> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc;
};

/**
 * Gets the number of pages in a PDF.
 */
export const getPdfPageCount = async (file: File): Promise<number> => {
    try {
        const pdfDoc = await loadPdf(file);
        return pdfDoc.getPageCount();
    } catch (error) {
        console.error("Error reading PDF page count:", error);
        return 0;
    }
};

/**
 * Saves a PDFDocument object back to a downloadable Blob.
 */
export const savePdf = async (pdfDoc: PDFDocument): Promise<Blob> => {
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    return blob;
};

/**
 * Helper to trigger a download of a Blob in the browser.
 */
export const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Renders a specific page of a PDF to an Image URL (Blob).
 * Uses dynamic import to avoid SSR issues in Next.js.
 */
export const renderPageToImage = async (file: File, pageNum: number = 1, scale: number = 0.8): Promise<string | null> => {
    try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(pageNum);

        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) return null;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
        }).promise;

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    resolve(url);
                } else {
                    resolve(null);
                }
            }, 'image/jpeg', 0.8);
        });

    } catch (error) {
        console.error("Error rendering PDF page:", error);
        return null;
    }
};

/**
 * Renders a page to a URL with optional filter and scale.
 * Used by the Grayscale tool.
 */
export const renderPageToUrl = async (
    file: File,
    pageNum: number = 1,
    filter?: 'grayscale' | 'bw',
    scale: number = 1.5
): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(pageNum);

    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Apply CSS filter if requested
    if (filter === 'bw') {
        // High contrast grayscale simulates B&W (Threshold effect)
        context.filter = 'grayscale(100%) contrast(1.5) brightness(1.1)';
    } else if (filter === 'grayscale') {
        context.filter = 'grayscale(100%)';
    }

    await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
    }).promise;

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(URL.createObjectURL(blob));
            } else {
                reject(new Error('Failed to create blob'));
            }
        }, 'image/jpeg', 0.9);
    });
};

/**
 * Renders pages sequentially (page-by-page) to prevent memory spikes.
 * Updates UI via callback as each page finishes.
 */
export const renderPagesSequentially = async (
    file: File,
    start: number,
    end: number,
    options: {
        scale: number;
        format: 'jpeg' | 'png';
        quality: number;
        onPageRendered: (pageNum: number, url: string) => void;
    }
): Promise<void> => {
    const { scale, format, quality, onPageRendered } = options;

    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

    // Load the document once
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Process strictly page-by-page (like poppler) to avoid memory crashes
    for (let i = start; i <= end; i++) {
        try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) continue;

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport, canvas }).promise;

            const url = await new Promise<string | null>((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(URL.createObjectURL(blob));
                    else resolve(null);
                }, `image/${format}`, format === 'jpeg' ? quality : undefined);
            });

            if (url) {
                onPageRendered(i, url);
            }

            // Cleanup canvas memory immediately to help garbage collector
            canvas.width = 0;
            canvas.height = 0;
            
            // Cleanup pdf.js page resources
            page.cleanup();
            
        } catch (e) {
            console.error(`Error rendering page ${i}`, e);
        }
    }

    // Destroy the main pdf document object to free memory
    await pdf.destroy();
};