import { NextRequest } from 'next/server';
import { getPdfEngine } from '@/lib/server/pdfEngine';

export async function POST(req: NextRequest) {
    try {
        const { key } = await req.json();

        const engine = await getPdfEngine();
        return await engine.download(key);

    } catch (e) {
        console.error(e);
        return new Response('Download Failed', { status: 500 });
    }
}