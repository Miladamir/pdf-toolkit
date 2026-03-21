import { PDFDocument } from 'pdf-lib';
import { downloadBlob, savePdf } from '../pdf';

/**
 * Merges multiple PDF files into a single PDF and triggers a download.
 */
export const mergePdfs = async (files: File[], outputName: string = "merged.pdf") => {
    if (files.length === 0) return;

    // 1. Create a new PDF document to hold the merged content
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        // 2. Load each file into a PDFDocument
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);

        // 3. Copy all pages from the source PDF to the merged PDF
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

        // 4. Add each page to the new document
        copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
        });
    }

    // 5. Save the merged PDF to a Blob
    const pdfBlob = await savePdf(mergedPdf);

    // 6. Trigger the download
    downloadBlob(pdfBlob, outputName);
};