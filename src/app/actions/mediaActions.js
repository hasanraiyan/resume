// src/app/actions/mediaActions.js
'use server';

import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/dbConnect';
import MediaAsset from '@/models/MediaAsset';
import MediaAgentSettings from '@/models/MediaAgentSettings';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { qdrantClient, ensureCollection, mongoIdToUuid } from '@/lib/qdrant';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('=== CLOUDINARY CONFIG DEBUG ===');
console.log('Cloudinary configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET',
  api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET',
});

// --- ACTION 1: UPLOAD AN ASSET ---
export async function uploadAsset(formData) {
  console.log('=== SERVER UPLOAD DEBUG ===');
  console.log('uploadAsset called');

  const file = formData.get('file');
  if (!file) {
    console.log('No file provided');
    return { success: false, error: 'No file provided.' };
  }

  console.log('File received on server:', {
    name: file.name,
    size: file.size,
    sizeMB: Math.round((file.size / (1024 * 1024)) * 100) / 100,
    type: file.type,
  });

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    console.log('File size validation failed:', file.size, '>', maxSize);
    return {
      success: false,
      error: `File size too large. Maximum allowed size is 10MB. Your file is ${Math.round(file.size / (1024 * 1024))}MB.`,
    };
  }

  // Validate file type (basic check for images and common formats)
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    console.log('File type validation failed:', file.type, file.name);
    return {
      success: false,
      error: 'Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP, SVG).',
    };
  }

  console.log('File validation passed, proceeding with upload...');

  // Convert file to a buffer to stream to Cloudinary
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  console.log('File converted to buffer, size:', buffer.length);

  try {
    const uploadResult = await new Promise((resolve, reject) => {
      console.log('Starting Cloudinary upload...');
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'auto', // Automatically detect if it's an image or video
            folder: 'portfolio_assets', // Organize uploads in Cloudinary
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('Cloudinary upload successful:', {
                public_id: result.public_id,
                url: result.url,
                size: result.bytes,
                format: result.format,
              });
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    console.log('Cloudinary upload completed, saving to database...');

    // Save metadata to our MongoDB
    await dbConnect();
    console.log('Database connected');

    const newAsset = new MediaAsset({
      public_id: uploadResult.public_id,
      url: uploadResult.url,
      secure_url: uploadResult.secure_url,
      filename: file.name,
      format: uploadResult.format,
      size: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
    });

    console.log('Asset object created:', newAsset);

    await newAsset.save();
    console.log('Asset saved to database');

    // Trigger background AI processing and indexing
    if (typeof after === 'function') {
      after(async () => {
        try {
          await processAndIndexAsset(newAsset);
        } catch (err) {
          console.error('[Background Indexing] Failed:', err);
        }
      });
    }

    revalidatePath('/admin/media'); // Refresh the media library page
    console.log('Path revalidated');

    return { success: true, asset: JSON.parse(JSON.stringify(newAsset)) };
  } catch (error) {
    console.error('Upload error details:', error);

    // Provide more specific error messages based on error type
    let errorMessage = error.message || 'Upload failed due to unknown error';

    if (error.http_code === 413) {
      errorMessage =
        'File too large for Cloudinary processing. Try a smaller file or compress your image.';
    } else if (error.message?.includes('Invalid image file')) {
      errorMessage = 'Invalid image file. Please ensure the file is not corrupted and try again.';
    } else if (error.message?.includes('authentication')) {
      errorMessage = 'Authentication failed. Please check your Cloudinary credentials.';
    }

    return { success: false, error: errorMessage };
  }
}
// --- ACTION 3: GENERATE MEDIA VIA GEMINI ---
export async function generateMedia({
  prompt,
  aspectRatio = '1:1',
  providerId,
  model = 'gemini-2.0-flash',
}) {
  console.log('=== GENERATE MEDIA DEBUG ===');
  console.log('generateMedia called with:', { prompt, aspectRatio, providerId, model });

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    console.log('Invalid prompt provided');
    return { success: false, error: 'Prompt is required and must be a non-empty string.' };
  }

  try {
    const { default: agentRegistry } = await import('@/lib/agents/AgentRegistry');
    const { AGENT_IDS } = await import('@/lib/constants/agents');

    // Ensure agents are registered
    await import('@/lib/agents');

    const result = await agentRegistry.execute(AGENT_IDS.IMAGE_GENERATOR, {
      prompt: prompt.trim(),
      aspectRatio,
      providerId,
      model,
    });

    const { buffer, mimeType, extension } = result;

    console.log('Agent image generated, uploading to Cloudinary...');

    // Upload the generated image buffer to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'image',
            folder: 'portfolio_assets',
            format: extension,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    console.log('Cloudinary upload successful:', uploadResult.public_id);

    // Save to database
    await dbConnect();
    console.log('Database connected for media generation');

    const newAsset = new MediaAsset({
      public_id: uploadResult.public_id,
      url: uploadResult.url,
      secure_url: uploadResult.secure_url,
      filename: `generated_${prompt.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`,
      format: uploadResult.format,
      size: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      source: 'gemini',
      prompt: prompt.trim(),
    });

    await newAsset.save();
    console.log('Generated asset saved to database');

    // Trigger background indexing
    if (typeof after === 'function') {
      after(async () => {
        try {
          await processAndIndexAsset(newAsset);
        } catch (err) {
          console.error('[Background Indexing] Failed:', err);
        }
      });
    }

    revalidatePath('/admin/media');

    return {
      success: true,
      asset: JSON.parse(JSON.stringify(newAsset)),
    };
  } catch (error) {
    console.error('Media generation error details:', error);
    return { success: false, error: `Generation failed: ${error.message}` };
  }
}

// --- ACTION 3B: UPLOAD GENERATED IMAGE BUFFER (for blog writer agent) ---
// This function uploads an already-generated image buffer and saves it to the media library
// Used by agents that generate images internally (like blog-writer-agent)
export async function uploadGeneratedImage({
  buffer,
  mimeType,
  filename,
  prompt,
  source = 'blog_writer',
}) {
  console.log('=== UPLOAD GENERATED IMAGE DEBUG ===');
  console.log('uploadGeneratedImage called with:', { mimeType, filename, prompt, source });

  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { success: false, error: 'Valid buffer is required.' };
  }

  if (!mimeType || !mimeType.startsWith('image/')) {
    return { success: false, error: 'Valid image mime type is required.' };
  }

  try {
    const extension = mimeType.split('/')[1] || 'png';

    // Upload the generated image buffer to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'image',
            folder: 'blog_assets',
            format: extension,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    console.log('Cloudinary upload successful:', uploadResult.public_id);

    // Save to database
    await dbConnect();
    console.log('Database connected for generated image upload');

    const assetFilename = filename || `generated_${Date.now()}.${extension}`;

    const newAsset = new MediaAsset({
      public_id: uploadResult.public_id,
      url: uploadResult.url,
      secure_url: uploadResult.secure_url,
      filename: assetFilename,
      format: uploadResult.format,
      size: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      source: source,
      prompt: prompt || '',
    });

    await newAsset.save();
    console.log('Generated image asset saved to database:', newAsset._id);

    // Trigger background indexing
    if (typeof after === 'function') {
      after(async () => {
        try {
          await processAndIndexAsset(newAsset);
        } catch (err) {
          console.error('[Background Indexing] Failed:', err);
        }
      });
    }

    revalidatePath('/admin/media');

    return {
      success: true,
      asset: JSON.parse(JSON.stringify(newAsset)),
    };
  } catch (error) {
    console.error('Upload generated image error details:', error);
    return { success: false, error: `Upload failed: ${error.message}` };
  }
}
export async function deleteAsset(assetId) {
  console.log('=== DELETE ASSET DEBUG ===');
  console.log('deleteAsset called with assetId:', assetId);

  try {
    await dbConnect();
    console.log('Database connected for delete operation');

    const asset = await MediaAsset.findById(assetId);
    console.log(
      'Asset found in database:',
      asset
        ? {
            id: asset._id,
            public_id: asset.public_id,
            filename: asset.filename,
            url: asset.url,
            secure_url: asset.secure_url,
            source: asset.source,
          }
        : 'NOT FOUND'
    );

    if (!asset) {
      console.log('Asset not found in database');
      return { success: false, error: 'Asset not found in database.' };
    }

    // Check if this is a legacy Pollinations image (not stored in Cloudinary)
    const isAIGenerated = asset.source === 'pollinations';

    console.log('Asset source:', asset.source, '- AI Generated:', isAIGenerated);

    let cloudinaryDeleted = false;

    if (isAIGenerated) {
      // AI-generated images are not stored in Cloudinary, so skip deletion
      console.log('Skipping Cloudinary deletion for AI-generated image');
      cloudinaryDeleted = true; // Consider it successful since there's nothing to delete
    } else {
      // Only attempt Cloudinary deletion for uploaded images
      console.log('Attempting to delete from Cloudinary with public_id:', asset.public_id);

      // Test Cloudinary configuration
      try {
        console.log('Testing Cloudinary configuration...');
        const config = cloudinary.config();
        console.log('Cloudinary config test:', {
          cloud_name: config.cloud_name ? 'SET' : 'NOT SET',
          api_key: config.api_key ? 'SET' : 'NOT SET',
          api_secret: config.api_secret ? 'SET' : 'NOT SET',
        });
      } catch (configError) {
        console.error('Cloudinary configuration test failed:', configError);
      }

      // 1. Try to delete from Cloudinary first
      try {
        const cloudinaryResult = await cloudinary.uploader.destroy(asset.public_id);
        console.log('Cloudinary deletion result:', cloudinaryResult);

        // Check if Cloudinary deletion was successful
        // Cloudinary can return: { result: 'ok' } or { result: 'not found' } or throw an error
        if (cloudinaryResult) {
          if (cloudinaryResult.result === 'ok') {
            cloudinaryDeleted = true;
            console.log('Cloudinary deletion successful');
          } else if (cloudinaryResult.result === 'not found') {
            console.warn('Asset not found in Cloudinary, but continuing with database deletion');
            cloudinaryDeleted = true; // Consider it successful since it doesn't exist
          } else {
            console.warn(
              'Cloudinary deletion returned unexpected result:',
              cloudinaryResult.result
            );
          }
        } else {
          console.warn('Cloudinary deletion returned null/undefined result');
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion failed:', cloudinaryError);
        console.error('Error details:', {
          message: cloudinaryError.message,
          code: cloudinaryError.http_code,
          public_id: asset.public_id,
        });

        // Check if it's a "not found" error - this might mean it was already deleted
        if (cloudinaryError.message && cloudinaryError.message.includes('not found')) {
          console.log('Asset not found in Cloudinary - considering as successfully deleted');
          cloudinaryDeleted = true;
        } else {
          // For other errors, log but continue with database deletion
          console.warn(
            'Cloudinary deletion failed, but continuing with database deletion for manual cleanup'
          );
        }
      }
    }

    console.log('Cloudinary deletion status:', cloudinaryDeleted ? 'SUCCESS' : 'FAILED');

    // 1.5. Delete from Qdrant (for semantic search)
    try {
      const settings = await MediaAgentSettings.findOne({});
      const collectionName = settings?.qdrantCollection || 'media_assets';

      console.log(
        `[Qdrant] Attempting to delete vector from collection: ${collectionName} for ID: ${assetId}`
      );

      // Points in Qdrant are identified by the same ID as MongoDB (converted to UUID)
      await qdrantClient.delete(collectionName, {
        wait: true,
        points: [mongoIdToUuid(assetId)],
      });
      console.log('[Qdrant] Vector deletion successful');
    } catch (qdrantError) {
      console.error('[Qdrant] Deletion failed or point not found:', qdrantError.message);
      // We continue since Qdrant is additive/non-critical for existence of original file
    }

    // 2. Delete from MongoDB (always do this, even if Cloudinary or Qdrant failed)
    try {
      await MediaAsset.findByIdAndDelete(assetId);
      console.log('Database deletion successful');
    } catch (dbError) {
      console.error('Database deletion failed:', dbError);
      return { success: false, error: `Failed to delete from database: ${dbError.message}` };
    }

    console.log('Revalidating path /admin/media');
    revalidatePath('/admin/media');

    // Return success but warn if Cloudinary deletion failed
    if (!cloudinaryDeleted) {
      console.warn('WARNING: Asset deleted from database but Cloudinary deletion failed');
      return {
        success: true,
        warning:
          'Asset deleted from database but failed to delete from Cloudinary. You may need to manually remove it from Cloudinary.',
      };
    }

    console.log('Delete operation completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Delete operation error details:', error);
    return { success: false, error: `Delete operation failed: ${error.message}` };
  }
}

/**
 * Shared utility to handle AI analysis and Qdrant indexing in the background
 */
export async function processAndIndexAsset(asset) {
  try {
    console.log(`[Background Indexing] Starting process for: ${asset.filename}`);

    await dbConnect();
    const settings = await MediaAgentSettings.findOne({});
    const collectionName = settings?.qdrantCollection || 'media_assets';

    // 1. Fetch image content
    const imageResponse = await fetch(asset.secure_url || asset.url);
    if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // 2. Analyze image for description
    const description = await agentRegistry.execute(
      AGENT_IDS.IMAGE_ANALYZER,
      {
        base64Data,
        mimeType,
        action: 'analyze',
      },
      { bypassRateLimit: true }
    );

    // 3. Generate embedding
    const embeddingResult = await agentRegistry.execute(
      AGENT_IDS.IMAGE_EMBEDDER,
      {
        text: description,
        action: 'embed',
      },
      { bypassRateLimit: true }
    );
    const vector = embeddingResult.embedding;

    // 4. Index in Qdrant
    const isQdrantReady = await ensureCollection(collectionName, vector.length);
    if (isQdrantReady) {
      await qdrantClient.upsert(collectionName, {
        points: [
          {
            id: mongoIdToUuid(asset._id),
            vector: vector,
            payload: {
              id: asset._id.toString(),
              filename: asset.filename,
              description: description,
              url: asset.secure_url || asset.url,
            },
          },
        ],
      });

      // 5. Update Database
      await MediaAsset.findByIdAndUpdate(asset._id, {
        aiDescription: description,
        isIndexed: true,
      });

      console.log(`[Background Indexing] Successfully indexed: ${asset.filename}`);
      revalidatePath('/admin/media');
    }
  } catch (error) {
    console.error('[Background Indexing] Error details:', error);
    throw error;
  }
}
/**
 * Resets the entire Media AI system
 * 1. Deletes and recreates the Qdrant collection
 * 2. Resets all assets to unindexed state in MongoDB
 */
export async function resetMediaAI() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    await dbConnect();
    const settings = await MediaAgentSettings.findOne({});
    const collectionName = settings?.qdrantCollection || 'media_assets';

    console.log(`[Reset AI] Starting full reset for collection: ${collectionName}`);

    // 1. Reset Qdrant (Delete collection if it exists)
    try {
      const collections = await qdrantClient.getCollections();
      const exists = collections.collections.some((c) => c.name === collectionName);

      if (exists) {
        await qdrantClient.deleteCollection(collectionName);
        console.log(`[Reset AI] Deleted Qdrant collection: ${collectionName}`);
      }
    } catch (qdrantError) {
      console.warn(
        '[Reset AI] Qdrant collection deletion failed (might not exist):',
        qdrantError.message
      );
    }

    // 2. Reset MongoDB Assets
    const result = await MediaAsset.updateMany(
      {},
      {
        $set: {
          isIndexed: false,
          aiDescription: '', // Reset descriptions too to force re-analysis
        },
      }
    );

    console.log(`[Reset AI] Reset ${result.modifiedCount} assets in MongoDB`);

    revalidatePath('/admin/media');

    return {
      success: true,
      message: `System reset successful. ${result.modifiedCount} assets are ready for re-indexing. Qdrant collection ${collectionName} has been cleared.`,
    };
  } catch (error) {
    console.error('[Reset AI] Error during system reset:', error);
    return { success: false, error: error.message };
  }
}
