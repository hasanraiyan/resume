import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MediaAsset from '@/models/MediaAsset';
import MediaAgentSettings from '@/models/MediaAgentSettings';
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

    // Set global processing flag with timestamp
    await MediaAgentSettings.findOneAndUpdate(
      {},
      { isProcessing: true, processingStartedAt: new Date() },
      { upsert: true }
    );

    // Find images lacking AI description - process up to 50 at a time for safety
    const assetsToProcess = await MediaAsset.find({
      $or: [{ aiDescription: { $exists: false } }, { aiDescription: '' }, { aiDescription: null }],
    }).limit(50);

    if (assetsToProcess.length === 0) {
      await MediaAgentSettings.findOneAndUpdate({}, { isProcessing: false });
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

      // Reset global processing flag
      await MediaAgentSettings.findOneAndUpdate({}, { isProcessing: false });

      revalidatePath('/admin/media');
      console.log(`[Background] Image analysis batch complete.`);
    };

    // Use after() if available
    if (typeof after === 'function') {
      after(backgroundTask);
    } else {
      console.warn('[Warning] Running synchronously (after() unavailable).');
      // In local dev, we don't await so the response returns, but it might still hang if the process dies.
      backgroundTask();
    }

    // Respond immediately with 202 Accepted
    return NextResponse.json(
      {
        message: `Background processing started for ${assetsToProcess.length} images. The dashboard will update when finished.`,
        count: assetsToProcess.length,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Error in batch processing:', error);
    await MediaAgentSettings.findOneAndUpdate({}, { isProcessing: false }).catch(() => {});
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
