// src/app/api/media/generate/route.js
import { generateMedia } from '@/app/actions/mediaActions';

export async function POST(request) {
  console.log('=== API GENERATE MEDIA DEBUG ===');
  console.log('API route for media generation called');

  try {
    const body = await request.json();
    const { prompt, preset, seed } = body;

    console.log('Request body:', { prompt, preset, seed });

    // Call the server action
    const result = await generateMedia({ prompt, preset, seed });

    console.log('Generation result:', result);

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
