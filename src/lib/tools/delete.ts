import { PDFDocument } from 'pdf-lib';
import { downloadBlob, savePdf, loadPdf } from '../pdf';

/**
 * Removes specific pages from a PDF.
 * @param indicesToRemove Array of 0-based page indices to remove.
 */
export const deletePages = async (file: File, indicesToRemove: number[]) => {
    const sourcePdf = await loadPdf(file);
    const totalPages = sourcePdf.getPageCount();

    // Create a new document
    const newPdf = await PDFDocument.create();

    // Determine which pages to KEEP
    // If a page index is NOT in the indicesToRemove array, we copy it.
    const indicesToKeep = Array.from({ length: totalPages }, (_, i) => i)
        .filter(i => !indicesToRemove.includes(i));

    if (indicesToKeep.length === 0) {
        throw new Error("You cannot delete all pages.");
    }

    // Copy the kept pages
    const copiedPages = await newPdf.copyPages(sourcePdf, indicesToKeep);
    copiedPages.forEach((page) => newPdf.addPage(page));

    // Save and Download
    const pdfBlob = await savePdf(newPdf);
    const newName = file.name.replace('.pdf', '_edited.pdf');
    downloadBlob(pdfBlob, newName);
};