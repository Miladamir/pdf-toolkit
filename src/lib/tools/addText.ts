import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { downloadBlob, savePdf, loadPdf } from '../pdf';

interface AddTextOptions {
    text: string;
    size: number;
    color: { r: number; g: number; b: number };
    pageIndex: number;
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
}

export const addTextToPdf = async (file: File, options: AddTextOptions) => {
    const pdfDoc = await loadPdf(file);
    const pages = pdfDoc.getPages();
    const page = pages[options.pageIndex];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageHeight = page.getHeight();
    const pageWidth = page.getWidth();

    // Convert percentages to PDF coordinates
    // X is straightforward %
    const pdfX = (options.x / 100) * pageWidth;

    // Y needs to be inverted (PDF 0 is bottom, UI 0 is top)
    // Also adjust for font baseline so cursor matches text bottom
    const pdfY = pageHeight - ((options.y / 100) * pageHeight) - (options.size * 0.2);

    page.drawText(options.text, {
        x: pdfX,
        y: pdfY,
        size: options.size,
        font,
        color: rgb(options.color.r, options.color.g, options.color.b),
    });

    const pdfBlob = await savePdf(pdfDoc);
    const newName = file.name.replace('.pdf', '_edited.pdf');
    downloadBlob(pdfBlob, newName);
};