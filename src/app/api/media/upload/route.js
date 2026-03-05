// src/app/api/media/upload/route.js
import { mediaService } from '@/lib/services/MediaService';

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

    console.log('File validation passed in API route, uploading to Cloudinary via MediaService...');

    const result = await mediaService.uploadFileToCloudinary(file);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    const { asset } = result;

    return Response.json({
      success: true,
      asset: {
        _id: asset._id,
        public_id: asset.public_id,
        url: asset.url,
        secure_url: asset.secure_url,
        filename: asset.filename,
        format: asset.format,
        size: asset.size,
        width: asset.width,
        height: asset.height,
        createdAt: asset.createdAt,
      },
    });
  } catch (error) {
    console.error('API upload error details:', error);

    return Response.json(
      {
        success: false,
        error: error.message || 'Upload failed due to unknown error',
      },
      { status: 500 }
    );
  }
}
