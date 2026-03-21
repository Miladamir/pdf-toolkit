import { NextRequest } from 'next/server';
import { getPdfEngine } from '@/lib/server/pdfEngine';

// Define expected input
interface UnlockRequest {
    key: string;
    password: string;
}

export async function POST(req: NextRequest) {
    try {
        const { key, password } = await req.json() as UnlockRequest;

        if (!key || !password) {
            return new Response('Missing key or password', { status: 400 });
        }

        const engine = await getPdfEngine();
        const resultKey = await engine.unlock(key, password);

        return Response.json({
            success: true,
            resultKey: resultKey
        });
    } catch (e: any) {
        console.error(e);
        // Detect incorrect password errors specifically if possible
        if (e.message.includes('password')) {
            return new Response(JSON.stringify({ error: 'Incorrect Password' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return new Response('Unlock Failed', { status: 500 });
    }
}