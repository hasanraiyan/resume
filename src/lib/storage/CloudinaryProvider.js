import { v2 as cloudinary } from 'cloudinary';
import IStorageProvider from './IStorageProvider.js';

export default class CloudinaryProvider extends IStorageProvider {
  constructor(credentials) {
    super();
    if (!credentials || !credentials.token) {
      throw new Error('Cloudinary requires a CLOUDINARY_URL in the token field.');
    }

    // The token is expected to be a Cloudinary URL:
    // cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    const url = new URL(credentials.token);
    if (url.protocol !== 'cloudinary:') {
      throw new Error('Invalid CLOUDINARY_URL format.');
    }

    this.config = {
      cloud_name: url.hostname,
      api_key: url.username,
      api_secret: url.password,
    };

    // We configure a separate instance for this provider
    // Cloudinary v2 does not easily support multiple instances with different configs
    // without using the config method globally, but we can pass the config object
    // to the methods directly.
  }

  async upload(buffer, fileName, mimeType) {
    return new Promise((resolve, reject) => {
      const options = {
        ...this.config,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            return reject(new Error(`Cloudinary upload error: ${error.message}`));
          }
          resolve({
            url: result.secure_url,
            fileKey: result.public_id,
          });
        }
      );

      // Write buffer to stream
      uploadStream.end(buffer);
    });
  }

  async delete(fileKey) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        fileKey,
        this.config,
        (error, result) => {
          if (error) {
            console.error('Cloudinary delete error:', error);
            // Return false instead of rejecting to keep it consistent with the interface
            return resolve(false);
          }
          resolve(result.result === 'ok');
        }
      );
    });
  }

  async getUrl(fileKey) {
    return cloudinary.url(fileKey, this.config);
  }

  async getFile(fileKey) {
    return new Promise((resolve) => {
      cloudinary.api.resource(
        fileKey,
        this.config,
        (error, result) => {
          if (error) {
            resolve({ exists: false, data: null });
          } else {
            resolve({ exists: true, data: result });
          }
        }
      );
    });
  }

  getCapabilities() {
    return {
      supportsFolders: true,
      supportsSignedUrls: true,
      requiresDirectUpload: false, // we handle buffer upload via the server API endpoint
    };
  }

  async getUploadIntent(fileName, fileSize, fileType) {
    // Basic upload intent for Cloudinary
    return {
      provider: 'cloudinary',
      config: {
        cloudName: this.config.cloud_name,
        apiKey: this.config.api_key,
      },
    };
  }
}
