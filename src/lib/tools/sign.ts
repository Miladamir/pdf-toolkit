import { PDFDocument } from 'pdf-lib';

export const signPdf = async (
    file: File,
    options: {
        signatureDataUrl: string;
        pageIndex: number;
        x: number; // Percentage 0-100
        y: number; // Percentage 0-100
        width: number; // Width in points
    }
): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const page = pages[options.pageIndex];

    // Embed the signature image (assumes PNG data URL)
    const pngImage = await pdfDoc.embedPng(options.signatureDataUrl);

    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Calculate dimensions
    const imgWidth = options.width;
    const imgHeight = pngImage.height * (imgWidth / pngImage.width);

    // Calculate position (Center alignment based on percentages)
    // X: 0% is left, 100% is right
    const centerX = (options.x / 100) * pageWidth;
    const finalX = centerX - (imgWidth / 2);

    // Y: 0% is top, 100% is bottom (UI convention)
    // PDF Y starts from bottom. 
    const centerY = pageHeight - ((options.y / 100) * pageHeight);
    const finalY = centerY - (imgHeight / 2);

    // Draw the image
    page.drawImage(pngImage, {
        x: finalX,
        y: finalY,
        width: imgWidth,
        height: imgHeight,
    });

    const pdfBytes = await pdfDoc.save();

    // Return Blob for UI to handle download
    return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
};