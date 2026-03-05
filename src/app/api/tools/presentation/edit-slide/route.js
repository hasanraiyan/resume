import { NextResponse } from 'next/server';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(base64Image) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Image,
      {
        folder: 'presentation_assets',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
  });
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';

    const body = await req.json();
    const { imageUrl, prompt, aspectRatio = '16:9' } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Original image is required' }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Edit prompt is required' }, { status: 400 });
    }

    await dbConnect();

    // Use Image Editor Agent
    const imageEditorAgent = agentRegistry.get(AGENT_IDS.IMAGE_EDITOR);

    // Ensure the image string is just base64 data (strip prefix if exists)
    // Sometimes imageUrl might be a URL (like cloudinary). We need to fetch it as base64.
    let base64Data = imageUrl;

    if (imageUrl.startsWith('http')) {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'image/png';
        base64Data = buffer.toString('base64');
    } else if (imageUrl.includes('base64,')) {
        base64Data = imageUrl.split('base64,')[1];
    }

    const { buffer, mimeType } = await imageEditorAgent.execute({
      base64Images: [base64Data],
      editPrompt: prompt.trim(),
      aspectRatio,
    });

    let finalImageUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    if (isAdmin && finalImageUrl) {
      try {
        finalImageUrl = await uploadToCloudinary(finalImageUrl);
      } catch (cloudErr) {
        console.error('Cloudinary upload failed for edited slide:', cloudErr);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
    });
  } catch (error) {
    console.error('Slide Edit Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to edit slide' },
      { status: 500 }
    );
  }
}
