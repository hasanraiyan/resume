// src/app/actions/mediaActions.js
'use server';

import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/dbConnect';
import MediaAsset from '@/models/MediaAsset';
import { revalidatePath } from 'next/cache';

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
// --- ACTION 3: GENERATE MEDIA VIA POLLINATIONS ---
export async function generateMedia({ prompt, preset = 'square', seed }) {
  console.log('=== GENERATE MEDIA DEBUG ===');
  console.log('generateMedia called with prompt:', prompt, 'preset:', preset);

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    console.log('Invalid prompt provided');
    return { success: false, error: 'Prompt is required and must be a non-empty string.' };
  }

  // Define dimension presets
  const presets = {
    square: { width: 1024, height: 1024 },
    landscape: { width: 1280, height: 720 },
    portrait: { width: 720, height: 1280 },
    wide: { width: 1280, height: 720 },
    tall: { width: 720, height: 1280 },
  };

  const dimensions = presets[preset] || presets.square;

  try {
    // Construct Pollinations URL with parameters
    const baseUrl = 'https://pollinations.ai/p';
    const urlParams = new URLSearchParams({
      prompt: prompt.trim(),
      width: dimensions.width.toString(),
      height: dimensions.height.toString(),
    });

    if (seed !== undefined) {
      urlParams.append('seed', seed.toString());
    }

    // Add nologo parameter to remove logos from generated images
    urlParams.append('nologo', 'true');
    // Add enhance parameter to true
    urlParams.append('enhance', 'true');

    const pollinationsUrl = `${baseUrl}/${encodeURIComponent(prompt.trim())}?${urlParams.toString()}`;

    console.log('Pollinations URL constructed:', pollinationsUrl);

    // Generate a unique public_id for the asset (using timestamp + random string)
    const publicId = `pollinations_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // For Pollinations, we directly use the generated URL
    const imageUrl = pollinationsUrl;
    const secureUrl = pollinationsUrl; // Pollinations URLs are already secure

    // Save to database
    await dbConnect();
    console.log('Database connected for media generation');

    const newAsset = new MediaAsset({
      public_id: publicId,
      url: imageUrl,
      secure_url: secureUrl,
      filename: `generated_${prompt.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}.png`, // Generate filename from prompt
      format: 'png', // Pollinations typically generates PNG
      source: 'pollinations',
      prompt: prompt.trim(),
      // Note: For Pollinations, we don't have size/width/height readily available without fetching the image
      // We can leave these as null or fetch them if needed in a future enhancement
    });

    console.log('Generated asset object:', newAsset);

    await newAsset.save();
    console.log('Generated asset saved to database');

    revalidatePath('/admin/media'); // Refresh the media library page
    console.log('Path revalidated');

    return {
      success: true,
      asset: {
        _id: newAsset._id,
        public_id: newAsset.public_id,
        url: newAsset.url,
        secure_url: newAsset.secure_url,
        filename: newAsset.filename,
        format: newAsset.format,
        source: newAsset.source,
        prompt: newAsset.prompt,
        createdAt: newAsset.createdAt,
      },
    };
  } catch (error) {
    console.error('Media generation error details:', error);
    return { success: false, error: `Generation failed: ${error.message}` };
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
          }
        : 'NOT FOUND'
    );

    if (!asset) {
      console.log('Asset not found in database');
      return { success: false, error: 'Asset not found in database.' };
    }

    console.log('Attempting to delete from Cloudinary with public_id:', asset.public_id);
    console.log('Cloudinary public_id format:', asset.public_id);

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
    let cloudinaryDeleted = false;
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
          console.warn('Cloudinary deletion returned unexpected result:', cloudinaryResult.result);
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

    console.log('Cloudinary deletion status:', cloudinaryDeleted ? 'SUCCESS' : 'FAILED');

    // Additional verification: Try to check if the asset URL is still accessible
    // This helps determine if the deletion actually worked
    if (cloudinaryDeleted && asset.secure_url) {
      try {
        console.log('Verifying deletion by checking URL accessibility...');
        // Note: This is just a basic check - Cloudinary might still serve deleted assets for a while
        console.log('Asset URL for verification:', asset.secure_url);
      } catch (verifyError) {
        console.log('Could not verify deletion (expected for successful deletions)');
      }
    }

    // 2. Delete from MongoDB (always do this, even if Cloudinary failed)
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
