import { PDFDocument } from 'pdf-lib';
import { downloadBlob, savePdf, loadPdf } from '../pdf';

/**
 * Extracts specific pages from a PDF.
 * @param file The source PDF file.
 * @param pageRanges A string like "1-3, 5, 8" or "all".
 */
export const splitPdf = async (file: File, pageRanges: string) => {
    const sourcePdf = await loadPdf(file);
    const totalPages = sourcePdf.getPageCount();

    // Create a new document for the extracted pages
    const newPdf = await PDFDocument.create();

    // Parse the page ranges
    // Supports formats: "1-3", "5", "all"
    const indices = parsePageRanges(pageRanges, totalPages);

    if (indices.length === 0) {
        throw new Error("No valid pages selected.");
    }

    // Copy pages
    const copiedPages = await newPdf.copyPages(sourcePdf, indices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    // Save and Download
    const pdfBlob = await savePdf(newPdf);
    const newName = file.name.replace('.pdf', `_split_${pageRanges.replace(/,/g, '_')}.pdf`);
    downloadBlob(pdfBlob, newName);
};

/**
 * Helper to parse string ranges like "1-3, 5" into an array of indices [0, 1, 2, 4].
 * Note: Users think in 1-based indexing (Page 1), pdf-lib uses 0-based.
 */
const parsePageRanges = (input: string, maxPages: number): number[] => {
    if (input.toLowerCase() === 'all') {
        return Array.from({ length: maxPages }, (_, i) => i);
    }

    const indices = new Set<number>();
    const parts = input.split(',');

    parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    if (i > 0 && i <= maxPages) indices.add(i - 1); // Convert to 0-based
                }
            }
        } else {
            const pageNum = parseInt(trimmed, 10);
            if (!isNaN(pageNum) && pageNum > 0 && pageNum <= maxPages) {
                indices.add(pageNum - 1); // Convert to 0-based
            }
        }
    });

    return Array.from(indices).sort((a, b) => a - b);
};