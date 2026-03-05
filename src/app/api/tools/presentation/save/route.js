import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Presentation from '@/models/Presentation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        const isAdmin = session?.user?.role === 'admin';

        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required to save to database.' }, { status: 403 });
        }

        const body = await req.json();
        const { presentationId, slides } = body;

        if (!presentationId || !slides || !Array.isArray(slides)) {
            return NextResponse.json({ error: 'Invalid payload: presentationId and an array of slides are required.' }, { status: 400 });
        }

        await dbConnect();

        const presentation = await Presentation.findById(presentationId);

        if (!presentation) {
            return NextResponse.json({ error: 'Presentation draft not found.' }, { status: 404 });
        }

        // Update the presentation draft with final slides
        presentation.slides = slides;
        presentation.status = 'completed';

        await presentation.save();

        return NextResponse.json({
            success: true,
            message: 'Presentation successfully saved to database.',
            presentationId: presentation._id
        });

    } catch (error) {
        console.error('Presentation Save Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to save presentation' }, { status: 500 });
    }
}
