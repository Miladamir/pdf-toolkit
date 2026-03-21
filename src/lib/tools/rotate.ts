import { PDFDocument, degrees } from 'pdf-lib';

/**
 * Rotates pages of a PDF based on provided angles.
 * @param file The input PDF file.
 * @param rotations An array of objects { pageIndex: number, angle: number }.
 *                  Angle should be 0, 90, 180, or 270.
 * @returns A Blob of the modified PDF.
 */
export const rotatePdf = async (
    file: File,
    rotations: { pageIndex: number; angle: number }[]
): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();

    rotations.forEach(({ pageIndex, angle }) => {
        if (pageIndex >= 0 && pageIndex < pages.length) {
            const page = pages[pageIndex];

            // Get current rotation (default to 0 if undefined)
            const currentRotation = page.getRotation().angle;

            // Set new absolute rotation
            page.setRotation(degrees((currentRotation + angle) % 360));
        }
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
};