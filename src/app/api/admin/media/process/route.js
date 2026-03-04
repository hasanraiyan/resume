import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MediaAsset from '@/models/MediaAsset';
import MediaAgentSettings from '@/models/MediaAgentSettings';
import agentRegistry from '@/lib/agents/AgentRegistry';
import { AGENT_IDS } from '@/lib/constants/agents';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { qdrantClient, ensureCollection, mongoIdToUuid } from '@/lib/qdrant';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch settings to know collection name and embedding config
    const settings = await MediaAgentSettings.findOne({});
    const collectionName = settings?.qdrantCollection || 'media_assets';

    // Set global processing flag with timestamp
    await MediaAgentSettings.findOneAndUpdate(
      {},
      { isProcessing: true, processingStartedAt: new Date() },
      { upsert: true }
    );

    // Find images lacking AI description OR not indexed - process up to 50 at a time for safety
    const assetsToProcess = await MediaAsset.find({
      $or: [
        { aiDescription: { $exists: false } },
        { aiDescription: '' },
        { aiDescription: null },
        { isIndexed: { $ne: true } },
      ],
    }).limit(50);

    if (assetsToProcess.length === 0) {
      await MediaAgentSettings.findOneAndUpdate({}, { isProcessing: false });
      return NextResponse.json({ message: 'No images found that require processing.' });
    }

    // Define a safe execution wrapper for after() to handle local environments
    const backgroundTask = async () => {
      console.log(
        `[Background] Starting analysis/indexing for ${assetsToProcess.length} images...`
      );

      for (const asset of assetsToProcess) {
        try {
          console.log(`[Background] Processing asset: ${asset.filename} (${asset._id})`);

          let description = asset.aiDescription;

          // 1. Analyze image for description IF missing
          if (!description) {
            console.log(`[Background] Generating description for: ${asset.filename}`);
            const imageResponse = await fetch(asset.secure_url || asset.url);
            if (!imageResponse.ok) {
              throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
            }

            const arrayBuffer = await imageResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');
            const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

            description = await agentRegistry.execute(AGENT_IDS.IMAGE_ANALYZER, {
              base64Image: base64Data,
              mimeType,
            });
          } else {
            console.log(
              `[Background] Re-using existing description for indexing: ${asset.filename}`
            );
          }

          // 2. Generate embedding for semantic search
          let vector = null;
          let indexedInQdrant = false;
          try {
            const embeddingResult = await agentRegistry.execute(AGENT_IDS.IMAGE_ANALYZER, {
              text: description,
              taskType: 'embedding',
            });
            vector = embeddingResult.embedding;

            // 3. Ensure Qdrant collection and upsert
            const isQdrantReady = await ensureCollection(collectionName, vector.length);
            if (isQdrantReady) {
              await qdrantClient.upsert(collectionName, {
                points: [
                  {
                    id: mongoIdToUuid(asset._id),
                    vector: vector,
                    payload: {
                      id: asset._id.toString(), // Keep string ID in payload for easier lookup if needed
                      filename: asset.filename,
                      description: description,
                      url: asset.secure_url || asset.url,
                    },
                  },
                ],
              });
              console.log(`[Background] Indexed in Qdrant: ${asset.filename}`);
              indexedInQdrant = true;
            }
          } catch (qdrantError) {
            console.error(
              `[Background] Qdrant/Embedding error for ${asset._id}:`,
              qdrantError.message || qdrantError
            );
            if (qdrantError.data) {
              console.error(
                '[Background] Qdrant Error Data:',
                JSON.stringify(qdrantError.data, null, 2)
              );
            }
          }

          // Update database
          asset.aiDescription = description;
          asset.isIndexed = indexedInQdrant;
          await asset.save();

          console.log(`[Background] Successfully processed: ${asset.filename}`);
        } catch (error) {
          console.error(`[Background] Error processing asset ${asset._id}:`, error);
        }
      }

      // Reset global processing flag
      await MediaAgentSettings.findOneAndUpdate({}, { isProcessing: false });

      revalidatePath('/admin/media');
      console.log(`[Background] Image analysis and indexing batch complete.`);
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
