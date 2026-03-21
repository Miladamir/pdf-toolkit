import { NextRequest } from 'next/server';
import { getPdfEngine } from '@/lib/server/pdfEngine';

export async function POST(req: NextRequest) {
    try {
        const { key } = await req.json();

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