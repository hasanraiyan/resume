// src/app/api/media/upload/route.js
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/dbConnect';
import MediaAsset from '@/models/MediaAsset';
import { processAndIndexAsset } from '@/app/actions/mediaActions';
import { after } from 'next/server';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  console.log('=== API UPLOAD DEBUG ===');
  console.log('Direct API upload route called');

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      console.log('No file provided in API route');
      return Response.json({ success: false, error: 'No file provided.' }, { status: 400 });
    }

    console.log('File received via API route:', {
      name: file.name,
      size: file.size,
      sizeMB: Math.round((file.size / (1024 * 1024)) * 100) / 100,
      type: file.type,
    });

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log('File size validation failed in API route');
      return Response.json(
        {
          success: false,
          error: `File size too large. Maximum allowed size is 10MB. Your file is ${Math.round(file.size / (1024 * 1024))}MB.`,
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      console.log('File type validation failed in API route');
      return Response.json(
        {
          success: false,
          error: 'Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP, SVG).',
        },
        { status: 400 }
      );
    }

    console.log('File validation passed in API route, uploading to Cloudinary...');

    // Convert file to buffer for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'auto',
            folder: 'portfolio_assets',
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error in API route:', error);
              reject(error);
            } else {
              console.log('Cloudinary upload successful in API route:', {
                public_id: result.public_id,
                url: result.url,
                size: result.bytes,
              });
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    console.log('Cloudinary upload completed, saving to database...');

    // Save to database
    await dbConnect();
    console.log('Database connected in API route');

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

    console.log('Asset object created in API route:', newAsset);

    await newAsset.save();
    console.log('Asset saved to database in API route');

    // Trigger background AI processing and indexing
    if (typeof after === 'function') {
      after(async () => {
        try {
          await processAndIndexAsset(newAsset);
        } catch (err) {
          console.error('[Background Indexing] Failed in API route:', err);
        }
      });
    }

    return Response.json({
      success: true,
      asset: {
        _id: newAsset._id,
        public_id: newAsset.public_id,
        url: newAsset.url,
        secure_url: newAsset.secure_url,
        filename: newAsset.filename,
        format: newAsset.format,
        size: newAsset.size,
        width: newAsset.width,
        height: newAsset.height,
        createdAt: newAsset.createdAt,
      },
    });
  } catch (error) {
    console.error('API upload error details:', error);

    let errorMessage = error.message || 'Upload failed due to unknown error';

    if (error.http_code === 413) {
      errorMessage = 'File too large for Cloudinary processing.';
    } else if (error.message?.includes('Invalid image file')) {
      errorMessage = 'Invalid image file. Please ensure the file is not corrupted.';
    } else if (error.message?.includes('authentication')) {
      errorMessage = 'Authentication failed. Please check your Cloudinary credentials.';
    }

    return Response.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
