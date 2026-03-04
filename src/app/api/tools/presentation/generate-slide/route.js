import { NextResponse } from 'next/server';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v2 as cloudinary } from 'cloudinary';
import { rateLimit } from '@/lib/rateLimit';

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
  // Allow more requests for generate-slide because multiple slides are generated per presentation
  const limitResponse = rateLimit(req, 30, 3600000);
  if (limitResponse) return limitResponse;

  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';

    const body = await req.json();
    const { slide, presentationTheme } = body;

    if (!slide || !presentationTheme) {
      return NextResponse.json(
        { error: 'Slide data and presentation theme are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Use Presentation Agent
    const presentationAgent = agentRegistry.get(AGENT_IDS.PRESENTATION_SYNTHESIZER);

    // Generate single slide visual
    const result = await presentationAgent.generateSlideImage(slide, presentationTheme);

    let finalImageUrl = result.imageUrl;

    if (isAdmin && finalImageUrl && finalImageUrl !== 'error') {
      try {
        finalImageUrl = await uploadToCloudinary(finalImageUrl);
      } catch (cloudErr) {
        console.error('Cloudinary upload failed for incremental slide:', cloudErr);
      }
    }

    return NextResponse.json({
      success: true,
      slide: {
        ...result,
        imageUrl: finalImageUrl,
      },
    });
  } catch (error) {
    console.error('Slide Generate Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate slide' },
      { status: 500 }
    );
  }
}
