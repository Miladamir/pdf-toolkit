import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export const runtime = 'edge'; // Force Edge Runtime

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const password = formData.get('password') as string;

        if (!file || !password) {
            return NextResponse.json({ error: 'File and password required' }, { status: 400 });
        }

        // 1. Read file into buffer
        const arrayBuffer = await file.arrayBuffer();

        // 2. Load PDF with password
        // We cast options to 'any' because TS definitions are missing the password property
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
            password: password,
            ignoreEncryption: true
        } as any);

        // 3. Save without encryption (Unlocking)
        const pdfBytes = await pdfDoc.save();

        // 4. Return the unlocked file
        // Use .buffer to satisfy NextResponse type requirements
        return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="unlocked.pdf"`
            }
        });

    } catch (error: any) {
        console.error('Unlock Error:', error);

        // Check for specific password error
        const message = error.message.includes('password')
            ? 'Incorrect password'
            : 'Failed to unlock PDF';

        return NextResponse.json({ error: message }, { status: 500 });
    }
}