import { NextResponse } from 'next/server';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import Presentation from '@/models/Presentation';
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
    const { presentationId, outline } = body;

    // outline is now an object with { presentationTheme, slides }
    if (!presentationId || !outline || !outline.slides || !Array.isArray(outline.slides)) {
      return NextResponse.json(
        { error: 'Valid presentation ID and outline are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find presentation
    const presentation = await Presentation.findById(presentationId);
    if (!presentation) {
      return NextResponse.json({ error: 'Presentation draft not found' }, { status: 404 });
    }

    // Update with approved outline
    presentation.outline = outline;
    await presentation.save();

    // Use Presentation Agent
    const presentationAgent = agentRegistry.get(AGENT_IDS.PRESENTATION_SYNTHESIZER);

    // Generate Visuals (returns array with base64 images)
    const rawSlides = await presentationAgent.execute({
      action: 'generate_visuals',
      outlineData: outline,
    });

    // Process slides
    let processedSlides = [];

    for (const slide of rawSlides) {
      if (slide.error || !slide.imageUrl) {
        processedSlides.push({
          imageUrl: 'error',
          prompt: slide.prompt,
          fallbackText: slide.fallbackText,
        });
        continue;
      }

      if (isAdmin) {
        // Admin: upload to Cloudinary for permanent storage
        try {
          const cloudUrl = await uploadToCloudinary(slide.imageUrl);
          processedSlides.push({
            imageUrl: cloudUrl,
            prompt: slide.prompt,
            fallbackText: slide.fallbackText,
          });
        } catch (cloudErr) {
          console.error('Cloudinary upload failed for slide:', cloudErr);
          processedSlides.push({
            imageUrl: slide.imageUrl,
            prompt: slide.prompt,
            fallbackText: slide.fallbackText,
          });
        }
      } else {
        // Guest: just return the base64 directly for display — no upload needed
        processedSlides.push({
          imageUrl: slide.imageUrl,
          prompt: slide.prompt,
          fallbackText: slide.fallbackText,
        });
      }
    }

    // Only persist to DB for admin users (guests get ephemeral base64 slides)
    if (isAdmin) {
      presentation.slides = processedSlides;
      presentation.status = 'completed';
      await presentation.save();
    }

    return NextResponse.json({
      success: true,
      presentationId: presentation._id,
      slides: processedSlides,
    });
  } catch (error) {
    console.error('Presentation Generate Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate presentation slides' },
      { status: 500 }
    );
  }
}
