// src/app/api/compress/route.ts
import { NextRequest } from 'next/server';
import { getPdfEngine } from '@/lib/server/pdfEngine';

// Define the expected input shape
interface CompressRequest {
    key: string;
    quality?: 'low' | 'recommended' | 'extreme';
}

export async function POST(req: NextRequest) {
    try {
        // Cast the JSON result to our interface
        const { key } = await req.json() as CompressRequest;

        if (!key) {
            return new Response('Missing file key', { status: 400 });
        }

        const engine = await getPdfEngine();

        // This runs the heavy lifting
        const resultKey = await engine.compress(key);

        return Response.json({
            success: true,
            resultKey: resultKey
        });
    } catch (e) {
        console.error(e);
        return new Response('Compression Failed', { status: 500 });
    }
}