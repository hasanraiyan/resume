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

    if (!presentationId || !outline || !Array.isArray(outline)) {
      return NextResponse.json({ error: 'Valid presentation ID and outline are required' }, { status: 400 });
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
    const rawSlides = await presentationAgent.execute({ action: 'generate_visuals', outline });

    // Handle Media (Admin -> Cloudinary)
    // For guests, we return the base64 so the frontend can upload them via UploadThing
    let processedSlides = [];

    for (const slide of rawSlides) {
        if (slide.error || !slide.imageUrl) {
            processedSlides.push({
                imageUrl: 'error',
                prompt: slide.prompt,
                fallbackText: slide.fallbackText
            });
            continue;
        }

        if (isAdmin) {
             try {
                const cloudUrl = await uploadToCloudinary(slide.imageUrl);
                processedSlides.push({
                    imageUrl: cloudUrl,
                    prompt: slide.prompt,
                    fallbackText: slide.fallbackText
                });
             } catch (cloudErr) {
                 console.error('Cloudinary upload failed for slide:', cloudErr);
                 processedSlides.push({
                    imageUrl: slide.imageUrl, // Keep base64 as fallback, but ideally flag it
                    prompt: slide.prompt,
                    fallbackText: slide.fallbackText
                });
             }
        } else {
             // For guests, we will let the frontend handle the upload to UploadThing
             // to avoid the server proxying massive file uploads if possible,
             // OR we just keep base64 and the frontend saves it.
             // Given the requirements "Upload images using UploadThing", the frontend will take these base64s,
             // convert to files, and upload via UploadThing, then update the DB.
             // So here we just return the raw base64.
             processedSlides.push({
                imageUrl: slide.imageUrl,
                prompt: slide.prompt,
                fallbackText: slide.fallbackText,
                needsUpload: true // flag for frontend
             });
        }
    }

    // If Admin, save final DB record now.
    // If Guest, we DO NOT save the massive base64 strings to the DB (which could exceed the 16MB limit).
    // Instead, we just wait for the frontend to upload them and send the light URLs back via the PUT endpoint.

    if (isAdmin) {
        presentation.slides = processedSlides;
        presentation.status = 'completed';
        await presentation.save();
    }

    return NextResponse.json({
       success: true,
       presentationId: presentation._id,
       slides: processedSlides
    });

  } catch (error) {
    console.error('Presentation Generate Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate presentation slides' }, { status: 500 });
  }
}

export async function PUT(req) {
    // Endpoint for guests to finalize their presentations after UploadThing uploads
    try {
        const body = await req.json();
        const { presentationId, slides } = body;

        if (!presentationId || !slides) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        await dbConnect();
        const presentation = await Presentation.findById(presentationId);
        if (!presentation) {
            return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
        }

        presentation.slides = slides;
        presentation.status = 'completed';
        await presentation.save();

        return NextResponse.json({ success: true, presentation });

    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
