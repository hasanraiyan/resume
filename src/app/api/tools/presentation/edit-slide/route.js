import { NextResponse } from 'next/server';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = session?.user?.role === 'admin';

        const body = await req.json();
        const { slideImageBase64, editPrompt } = body;

        if (!slideImageBase64 || !editPrompt) {
            return NextResponse.json({ error: 'slideImageBase64 and editPrompt are required' }, { status: 400 });
        }

        await dbConnect();

        let rawBase64 = slideImageBase64;

        // If it's a URL (like from Cloudinary), fetch it and convert to base64
        if (slideImageBase64.startsWith('http')) {
            try {
                const response = await fetch(slideImageBase64);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                rawBase64 = buffer.toString('base64');
            } catch (fetchErr) {
                console.error('Failed to fetch image URL for editing:', fetchErr);
                return NextResponse.json({ error: 'Failed to process the input image URL' }, { status: 400 });
            }
        } else {
            // The image editor agent takes raw base64 (without the data:image/png;base64, prefix)
            rawBase64 = slideImageBase64.includes('base64,') ? slideImageBase64.split('base64,')[1] : slideImageBase64;
        }

        const imageEditorAgent = agentRegistry.get(AGENT_IDS.IMAGE_EDITOR);

        // The image editor expects { base64Images: [...], editPrompt, aspectRatio }
        const result = await imageEditorAgent.execute({
            base64Images: [rawBase64],
            editPrompt,
            aspectRatio: '16:9'
        });

        let finalImageUrl = `data:${result.mimeType};base64,${result.buffer.toString('base64')}`;

        return NextResponse.json({
            success: true,
            slide: {
                imageUrl: finalImageUrl,
                editPrompt
            },
        });
    } catch (error) {
        console.error('Slide Edit Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to edit slide' },
            { status: 500 }
        );
    }
}
