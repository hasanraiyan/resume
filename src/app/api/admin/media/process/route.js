import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MediaAsset from '@/models/MediaAsset';
import { aiImageAgent } from '@/lib/ai/ai-image-agent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find images lacking AI description
    const assetsToProcess = await MediaAsset.find({
      $or: [{ aiDescription: { $exists: false } }, { aiDescription: '' }, { aiDescription: null }],
    }).limit(10); // Limit to 10 at a time for safety/timeout

    if (assetsToProcess.length === 0) {
      return NextResponse.json({ message: 'No images found that require processing.' });
    }

    // Define a safe execution wrapper for after() to handle local environments
    const backgroundTask = async () => {
      console.log(`[Background] Starting analysis for ${assetsToProcess.length} images...`);

      for (const asset of assetsToProcess) {
        try {
          console.log(`[Background] Processing asset: ${asset.filename} (${asset._id})`);

          // Fetch image content
          const imageResponse = await fetch(asset.secure_url || asset.url);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
          }

          const arrayBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Data = buffer.toString('base64');
          const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

          // Analyze image
          const description = await aiImageAgent.analyzeImage(base64Data, mimeType);

          // Update database
          asset.aiDescription = description;
          await asset.save();

          console.log(`[Background] Successfully analyzed: ${asset.filename}`);
        } catch (error) {
          console.error(`[Background] Error processing asset ${asset._id}:`, error);
        }
      }

      revalidatePath('/admin/media');
      console.log(`[Background] Image analysis complete.`);
    };

    // If after() is available (Next.js 15+ / Vercel), use it.
    // Otherwise, run it immediately (which may delay the response locally but ensures completion)
    if (typeof after === 'function') {
      after(backgroundTask);
    } else {
      console.warn('[Warning] next/server: after() is not a function. Running synchronously.');
      backgroundTask();
    }

    // Respond immediately with 202 Accepted
    return NextResponse.json(
      {
        message: `Background processing started for ${assetsToProcess.length} images. You can continue using the dashboard.`,
        count: assetsToProcess.length,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Error in batch processing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
