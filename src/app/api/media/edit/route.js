// src/app/api/media/edit/route.js
import { editMedia } from '@/app/actions/mediaActions';

export async function POST(request) {
  try {
    const body = await request.json();
    const { assetIds, assetId, editPrompt, aspectRatio, providerId, model } = body;

    console.log('API edit request:', {
      assetIds,
      assetId,
      editPrompt,
      aspectRatio,
      providerId,
      model,
    });

    const result = await editMedia({
      assetIds: assetIds || (assetId ? [assetId] : undefined),
      editPrompt,
      aspectRatio,
      providerId,
      model,
    });

    if (result.success) {
      return Response.json({ success: true, asset: result.asset });
    } else {
      return Response.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error('API editing error:', error);
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
