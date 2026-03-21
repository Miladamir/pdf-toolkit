import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { downloadBlob, savePdf, loadPdf } from '../pdf';

interface WatermarkOptions {
    text: string;
    color: { r: number; g: number; b: number };
    opacity: number;
    size: number;
}

export const addWatermark = async (file: File, options: WatermarkOptions) => {
    const pdfDoc = await loadPdf(file);
    const pages = pdfDoc.getPages();

    // Embed standard font (Helvetica)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const page of pages) {
        const { width, height } = page.getSize();

        // Calculate text dimensions to center it
        const textWidth = font.widthOfTextAtSize(options.text, options.size);

        // Draw the watermark
        page.drawText(options.text, {
            x: width / 2 - textWidth / 2, // Center horizontally
            y: height / 2, // Center vertically
            size: options.size,
            font: font,
            color: rgb(options.color.r, options.color.g, options.color.b),
            opacity: options.opacity,
            rotate: degrees(-45), // Diagonal rotation
        });
    }

    const pdfBlob = await savePdf(pdfDoc);
    const newName = file.name.replace('.pdf', '_watermarked.pdf');
    downloadBlob(pdfBlob, newName);
};