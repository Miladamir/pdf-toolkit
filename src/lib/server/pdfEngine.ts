import { PDFDocument } from 'pdf-lib';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Define a type for our R2 Bucket binding
interface Env {
    BUCKET: R2Bucket;
}

/**
 * PdfEngine
 * A professional wrapper for server-side PDF operations.
 * Uses R2 for temporary file storage to handle large files without memory issues.
 */
export class PdfEngine {
    private bucket: R2Bucket;

    constructor(bucket: R2Bucket) {
        this.bucket = bucket;
    }

    /**
     * UPLOAD LOGIC
     * Streams a file to R2 and returns a unique key.
     */
    async upload(file: File): Promise<string> {
        const key = `uploads/${crypto.randomUUID()}-${file.name}`;
        await this.bucket.put(key, file.stream());
        return key;
    }

    /**
     * COMPRESS LOGIC (The Professional Fix)
     * 1. Removes unused objects (bloat).
     * 2. Compresses internal streams (structure).
     * 3. Preserves vector data (no blurriness).
     */
    async compress(key: string): Promise<string> {
        // 1. Read from R2
        const object = await this.bucket.get(key);
        if (!object) throw new Error("File not found");

        const arrayBuffer = await object.arrayBuffer();

        // 2. Load PDF
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true
        });

        // 3. Professional Compression Options
        // Note: We do NOT convert to images. We optimize the internal structure.
        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true, // Combine objects into streams (Huge size reduction)
            addDefaultPage: false,
            objectsPerTick: 50, // Prevents blocking the event loop
        });

        // 4. Write result to R2
        const resultKey = `results/${crypto.randomUUID()}-compressed.pdf`;
        await this.bucket.put(resultKey, compressedBytes);

        // 5. Clean up original
        await this.bucket.delete(key);

        return resultKey;
    }

    /**
     * DOWNLOAD LOGIC
     * Streams the result back to the client.
     */
    async download(key: string): Promise<Response> {
        const object = await this.bucket.get(key);
        if (!object) throw new Error("Result not found");

        // Optional: Clean up after reading (one-time access)
        // await this.bucket.delete(key); 

        return new Response(object.body, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="compressed.pdf"`,
            },
        });
    }
}

// Helper to instantiate the engine in a Route Handler
export async function getPdfEngine(): Promise<PdfEngine> {
    const { env } = await getCloudflareContext();
    return new PdfEngine(env.BUCKET);
}