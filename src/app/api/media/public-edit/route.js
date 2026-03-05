// src/app/api/media/public-edit/route.js
import agentRegistry from '@/lib/agents';
import { NextResponse } from 'next/server';
import { AGENT_IDS } from '@/lib/constants/agents';
import { UTApi, UTFile } from 'uploadthing/server';

// Ensure agents are registered
import '@/lib/agents';

const utapi = new UTApi();

function getImageExtension(mimeType) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'png';
}

async function uploadGeneratedImage({ buffer, mimeType, prefix }) {
  const extension = getImageExtension(mimeType);
  const filename = `${prefix}-${Date.now()}.${extension}`;
  const file = new UTFile([buffer], filename, {
    type: mimeType,
    lastModified: Date.now(),
  });

  const uploadResult = await utapi.uploadFiles(file, {
    acl: 'public-read',
    contentDisposition: 'inline',
  });
  if (uploadResult.error || !uploadResult.data) {
    throw new Error(uploadResult.error?.message || 'Failed to upload edited image.');
  }

  return uploadResult.data;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { image, prompt, aspectRatio = '1:1' } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Original image is required as base64.' },
        { status: 400 }
      );
    }
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Edit prompt is required.' },
        { status: 400 }
      );
    }

    // Use agent ID from constants for tracking
    const agentId = AGENT_IDS.IMAGE_EDITOR;

    console.log('[Public Edit] Executing Agent:', {
      agentId,
      aspectRatio,
    });

    // Ensure the image string is just base64 data (strip prefix if exists)
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;

    // Use agentRegistry to edit the image
    // We let the Agent handle its own configuration (provider, model) from DB/Registry
    const { buffer, mimeType } = await agentRegistry.execute(agentId, {
      base64Images: [base64Data],
      editPrompt: prompt.trim(),
      aspectRatio,
    });

    const uploadedFile = await uploadGeneratedImage({
      buffer,
      mimeType,
      prefix: 'ai-edit',
    });

    console.log('[Public Edit] Success, returning UploadThing URL...');

    return NextResponse.json({
      success: true,
      image: uploadedFile.ufsUrl,
      fileKey: uploadedFile.key,
      mimeType,
      agentId,
    });
  } catch (error) {
    console.error('[Public Edit] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Image editing failed.',
      },
      { status: 500 }
    );
  }
}
