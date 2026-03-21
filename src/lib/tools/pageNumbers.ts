import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const addPageNumbers = async (
    file: File,
    options: {
        format: 'number' | 'page_of_total';
        position: 'bottom-center' | 'top-right' | 'bottom-right';
        size: number;
    }
): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        const pageNum = i + 1;
        const text = options.format === 'page_of_total'
            ? `Page ${pageNum} of ${pages.length}`
            : `${pageNum}`;

        const textSize = options.size;
        const textWidth = font.widthOfTextAtSize(text, textSize);

        const margin = 30;
        let x: number;
        let y: number;

        switch (options.position) {
            case 'top-right':
                x = width - textWidth - margin;
                y = height - margin;
                break;
            case 'bottom-right':
                x = width - textWidth - margin;
                y = margin;
                break;
            case 'bottom-center':
            default:
                x = (width - textWidth) / 2;
                y = margin;
                break;
        }

        page.drawText(text, {
            x,
            y,
            size: textSize,
            font,
            color: rgb(0, 0, 0),
        });
    }

    const pdfBytes = await pdfDoc.save();

    // FIX: Cast buffer to ArrayBuffer to satisfy TypeScript BlobPart requirement
    // This handles the 'ArrayBufferLike' vs 'ArrayBuffer' incompatibility
    return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
};