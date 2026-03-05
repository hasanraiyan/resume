import { v2 as cloudinary } from 'cloudinary';
import { UTApi, UTFile } from 'uploadthing/server';
import dbConnect from '@/lib/dbConnect';
import MediaAsset from '@/models/MediaAsset';
import { after } from 'next/server';
import { processAndIndexAsset } from '@/app/actions/mediaActions';

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize UploadThing
const utapi = new UTApi();

/**
 * Unified MediaService for handling all media uploads and processing.
 * Implements Single Responsibility Principle by encapsulating:
 * - Cloudinary uploads (buffers and files)
 * - UploadThing uploads (buffers)
 * - MediaAsset database creation
 * - Background AI processing triggering
 */
class MediaService {
  /**
   * Uploads a Buffer to Cloudinary and saves to MediaAsset DB.
   *
   * @param {Object} params
   * @param {Buffer} params.buffer The file buffer to upload.
   * @param {string} params.filename The desired filename.
   * @param {string} params.extension The file extension/format.
   * @param {string} [params.folder='portfolio_assets'] Cloudinary folder.
   * @param {string} [params.source='uploaded'] Source system (e.g., 'gemini', 'blog_writer').
   * @param {string} [params.prompt=''] The prompt used to generate the image (if applicable).
   * @param {Array<string>} [params.parentAssetIds=[]] Array of parent asset IDs if edited from existing.
   * @returns {Promise<Object>} Result object with { success, asset, error }
   */
  async uploadBufferToCloudinary({
    buffer,
    filename,
    extension,
    folder = 'portfolio_assets',
    source = 'uploaded',
    prompt = '',
    parentAssetIds = [],
  }) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return { success: false, error: 'Valid buffer is required.' };
    }

    try {
      // 1. Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'auto',
              folder,
              format: extension,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });

      // 2. Save to Database
      await dbConnect();
      const newAsset = new MediaAsset({
        public_id: uploadResult.public_id,
        url: uploadResult.url,
        secure_url: uploadResult.secure_url,
        filename,
        format: uploadResult.format,
        size: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        source,
        prompt,
      });

      if (parentAssetIds && parentAssetIds.length > 0) {
        newAsset.parentAssetIds = parentAssetIds;
      }

      await newAsset.save();

      // 3. Trigger Background Processing
      this._triggerBackgroundProcessing(newAsset);

      return {
        success: true,
        asset: JSON.parse(JSON.stringify(newAsset)),
      };
    } catch (error) {
      console.error('MediaService.uploadBufferToCloudinary error:', error);
      return { success: false, error: this._formatCloudinaryError(error) };
    }
  }

  /**
   * Uploads a File/FormData object to Cloudinary and saves to MediaAsset DB.
   *
   * @param {File} file The native File object from FormData.
   * @param {string} [folder='portfolio_assets'] Cloudinary folder.
   * @returns {Promise<Object>} Result object with { success, asset, error }
   */
  async uploadFileToCloudinary(file, folder = 'portfolio_assets') {
    if (!file) {
      return { success: false, error: 'No file provided.' };
    }

    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      return await this.uploadBufferToCloudinary({
        buffer,
        filename: file.name,
        extension: undefined, // Cloudinary auto-detects
        folder,
        source: 'uploaded',
      });
    } catch (error) {
      console.error('MediaService.uploadFileToCloudinary error:', error);
      return { success: false, error: 'Failed to process file buffer.' };
    }
  }

  /**
   * Uploads a Buffer to UploadThing (Used for public generation without DB save).
   *
   * @param {Object} params
   * @param {Buffer} params.buffer The file buffer.
   * @param {string} params.mimeType The MIME type of the file.
   * @param {string} params.prefix The prefix for the filename.
   * @returns {Promise<Object>} Result object with the uploaded file data.
   */
  async uploadBufferToUploadThing({ buffer, mimeType, prefix = 'ai-generate' }) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Valid buffer is required.');
    }

    const extension = this._getImageExtension(mimeType);
    const filename = `${prefix}-${Date.now()}.${extension}`;
    const file = new UTFile([buffer], filename, {
      type: mimeType,
      lastModified: Date.now(),
    });

    try {
      const uploadResult = await utapi.uploadFiles(file, {
        acl: 'public-read',
        contentDisposition: 'inline',
      });

      if (uploadResult.error || !uploadResult.data) {
        throw new Error(uploadResult.error?.message || 'Failed to upload generated image.');
      }

      return uploadResult.data;
    } catch (error) {
      console.error('MediaService.uploadBufferToUploadThing error:', error);
      throw error;
    }
  }

  /**
   * Triggers background processing and indexing of a new MediaAsset.
   *
   * @param {Object} asset The MediaAsset database document.
   * @private
   */
  _triggerBackgroundProcessing(asset) {
    if (typeof after === 'function') {
      after(async () => {
        try {
          await processAndIndexAsset(asset);
        } catch (err) {
          console.error('[Background Indexing] Failed:', err);
        }
      });
    }
  }

  /**
   * Centralizes error formatting for Cloudinary uploads.
   *
   * @param {Object} error The error object.
   * @returns {string} Formatted error message.
   * @private
   */
  _formatCloudinaryError(error) {
    let errorMessage = error.message || 'Upload failed due to unknown error';

    if (error.http_code === 413) {
      errorMessage = 'File too large for Cloudinary processing. Try a smaller file or compress your image.';
    } else if (error.message?.includes('Invalid image file')) {
      errorMessage = 'Invalid image file. Please ensure the file is not corrupted and try again.';
    } else if (error.message?.includes('authentication')) {
      errorMessage = 'Authentication failed. Please check your Cloudinary credentials.';
    }

    return errorMessage;
  }

  /**
   * Extracts extension from MIME type.
   *
   * @param {string} mimeType
   * @returns {string} File extension.
   * @private
   */
  _getImageExtension(mimeType) {
    if (mimeType === 'image/jpeg') return 'jpg';
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    return 'png';
  }
}

export const mediaService = new MediaService();
