// src/app/api/download/route.ts
import { NextRequest } from 'next/server';
import { getPdfEngine } from '@/lib/server/pdfEngine';

// Define the expected input shape
interface DownloadRequest {
    key: string;
}

export async function POST(req: NextRequest) {
    try {
        // Cast the JSON result
        const { key } = await req.json() as DownloadRequest;

        const engine = await getPdfEngine();
        return await engine.download(key);

    } catch (e) {
        console.error(e);
        return new Response('Download Failed', { status: 500 });
    }
}