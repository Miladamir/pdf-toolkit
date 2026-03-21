import { PDFDocument } from 'pdf-lib';
import { downloadBlob, savePdf } from '../pdf';

export const convertToGrayscale = async (
    file: File,
    scale: number = 2,
    onProgress: (progress: number) => void
) => {
    // 1. Dynamic Import to prevent "DOMMatrix is not defined" error
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();

    // 2. Read original PDF
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const newPdfDoc = await PDFDocument.create();
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        // 3. Render to Canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Apply Grayscale Filter before drawing
        if (context) {
            context.filter = 'grayscale(100%)';
        }

        await page.render({ canvasContext: context!, viewport, canvas }).promise;

        // 4. Convert Canvas to Image Bytes
        const imgBytes = await new Promise<Uint8Array>((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const array = new Uint8Array(reader.result as ArrayBuffer);
                        resolve(array);
                    };
                    reader.readAsArrayBuffer(blob);
                }
            }, 'image/jpeg', 0.9);
        });

        // 5. Embed Image in new PDF
        const img = await newPdfDoc.embedJpg(imgBytes);
        const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
        newPage.drawImage(img, {
            x: 0,
            y: 0,
            width: viewport.width,
            height: viewport.height,
        });

        onProgress(Math.round((i / totalPages) * 100));
    }

    // 6. Save
    const pdfBlob = await savePdf(newPdfDoc);
    const newName = file.name.replace('.pdf', '_grayscale.pdf');
    downloadBlob(pdfBlob, newName);
};