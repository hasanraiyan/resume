// src/app/api/media/generate/route.js
import { generateMedia } from '@/app/actions/mediaActions';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, aspectRatio, providerId, model } = body;

    console.log('API generate request:', { prompt, aspectRatio, providerId, model });

    const result = await generateMedia({ prompt, aspectRatio, providerId, model });

    if (result.success) {
      return Response.json({ success: true, asset: result.asset });
    } else {
      return Response.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error('API generation error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
