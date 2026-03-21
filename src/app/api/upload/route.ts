import { NextRequest } from 'next/server';
import { getPdfEngine } from '@/lib/server/pdfEngine';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new Response('No file uploaded', { status: 400 });
        }

        const engine = await getPdfEngine();
        const key = await engine.upload(file);

        return Response.json({
            success: true,
            key: key // Send the key back to the client
        });
    } catch (e) {
        console.error(e);
        return new Response('Upload Failed', { status: 500 });
    }
}