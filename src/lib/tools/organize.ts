import { PDFDocument, degrees } from 'pdf-lib';
import { downloadBlob, savePdf, loadPdf } from '../pdf';

// Define and export the shape of a page state
export interface OrganizePageState {
    originalIndex: number; // The original 0-based page number
    rotation: number; // 0, 90, 180, 270
}

/**
 * Reorders and rotates pages based on the provided state array.
 * @param file The original PDF file.
 * @param pages The new order and rotation of pages.
 */
export const organizePdf = async (file: File, pages: OrganizePageState[]) => {
    const sourcePdf = await loadPdf(file);
    const newPdf = await PDFDocument.create();

    // Copy pages in the NEW order using originalIndex
    const copiedPages = await newPdf.copyPages(sourcePdf, pages.map(p => p.originalIndex));

    // Apply rotations
    copiedPages.forEach((page, i) => {
        const rotationAngle = pages[i].rotation;
        if (rotationAngle !== 0) {
            page.setRotation(degrees(rotationAngle));
        }
        newPdf.addPage(page);
    });

    const pdfBlob = await savePdf(newPdf);
    const newName = file.name.replace('.pdf', '_organized.pdf');
    downloadBlob(pdfBlob, newName);
};