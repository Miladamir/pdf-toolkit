import { PDFDocument } from 'pdf-lib';
import { downloadBlob, savePdf } from '../pdf';

/**
 * Converts a list of image files into a single PDF.
 */
export const imageToPdf = async (files: File[]) => {
    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let image;

        // Determine image type and embed
        if (file.type === 'image/png') {
            image = await pdfDoc.embedPng(arrayBuffer);
        } else if (file.type === 'image/jpeg') {
            image = await pdfDoc.embedJpg(arrayBuffer);
        } else {
            // Skip unsupported formats
            console.warn(`Skipping unsupported file type: ${file.name}`);
            continue;
        }

        // Create a page with the same dimensions as the image
        const page = pdfDoc.addPage([image.width, image.height]);

        // Draw the image on the page
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });
    }

    const pdfBlob = await savePdf(pdfDoc);
    downloadBlob(pdfBlob, "converted-images.pdf");
};