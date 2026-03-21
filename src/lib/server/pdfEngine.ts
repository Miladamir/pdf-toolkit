import { PDFDocument } from 'pdf-lib';
import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * PdfEngine
 * A professional wrapper for server-side PDF operations.
 */
export class PdfEngine {
    private bucket: R2Bucket;

    constructor(bucket: R2Bucket) {
        this.bucket = bucket;
    }

    async upload(file: File): Promise<string> {
        const key = `uploads/${crypto.randomUUID()}-${file.name}`;
        await this.bucket.put(key, file.stream());
        return key;
    }

    async compress(key: string): Promise<string> {
        const object = await this.bucket.get(key);
        if (!object) throw new Error("File not found");

        const arrayBuffer = await object.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

        // Professional Compression: Use Object Streams
        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 50,
        });

        const resultKey = `results/${crypto.randomUUID()}-compressed.pdf`;
        await this.bucket.put(resultKey, compressedBytes);
        await this.bucket.delete(key); // Clean up original

        return resultKey;
    }

    async download(key: string): Promise<Response> {
        const object = await this.bucket.get(key);
        if (!object) throw new Error("Result not found");

        return new Response(object.body, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="result.pdf"`,
            },
        });
    }
    // ... existing methods (upload, compress, download) ...

    /**
     * UNLOCK LOGIC
     * Removes encryption/password from a PDF.
     */
    async unlock(key: string, password: string): Promise<string> {
        // 1. Read from R2
        const object = await this.bucket.get(key);
        if (!object) throw new Error("File not found");

        const arrayBuffer = await object.arrayBuffer();

        // 2. Load with password
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
            password: password,
            ignoreEncryption: false
        } as any); // 'as any' used here to bypass strict typing if needed in pdf-lib

        // 3. Save without encryption
        const pdfBytes = await pdfDoc.save();

        // 4. Write result to R2
        const resultKey = `results/${crypto.randomUUID()}-unlocked.pdf`;
        await this.bucket.put(resultKey, pdfBytes);

        // 5. Clean up original
        await this.bucket.delete(key);

        return resultKey;
    }
}

// Define the interface locally to ensure type safety without external dependencies
interface Env {
    BUCKET: R2Bucket;
}

export async function getPdfEngine(): Promise<PdfEngine> {
    const { env } = await getCloudflareContext();

    // Cast to our local Env interface
    // This is the "Concrete" way to handle bindings not known by the base library
    const typedEnv = env as unknown as Env;

    if (!typedEnv.BUCKET) {
        throw new Error("R2 Bucket binding 'BUCKET' is missing. Check wrangler.toml.");
    }

    return new PdfEngine(typedEnv.BUCKET);
}

