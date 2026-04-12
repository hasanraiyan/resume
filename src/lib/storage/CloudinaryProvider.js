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
    // We don't know the resource_type of the file we're deleting, and destroy defaults to 'image'.
    // If it's a 'raw' or 'video' file, deleting it as an 'image' will fail (not found).
    // The safest approach is to attempt to get its metadata first to find its true type,
    // or try multiple destroy calls. Getting the file is safer and we already have getFile.
    try {
      const fileInfo = await this.getFile(fileKey);
      const resourceType = fileInfo.exists ? fileInfo.data.resource_type : 'image';

      return new Promise((resolve) => {
        cloudinary.uploader.destroy(
          fileKey,
          { ...this.config, invalidate: true, resource_type: resourceType },
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
    } catch (error) {
      console.error('Cloudinary delete prep error:', error);
      return false;
    }
  }

  async getUrl(fileKey) {
    return cloudinary.url(fileKey, this.config);
  }

  async getFile(fileKey) {
    // Cloudinary's api.resource does not support resource_type: 'auto'.
    // We must try 'image', then 'video', then 'raw'.
    const types = ['image', 'video', 'raw'];

    for (const type of types) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.api.resource(
            fileKey,
            { ...this.config, resource_type: type },
            (error, res) => {
              if (error) {
                reject(error);
              } else {
                resolve(res);
              }
            }
          );
        });
        return { exists: true, data: result };
      } catch (error) {
        // If it's a 404 (not found), we continue to the next type.
        // If it's another error (like auth failure), it will still fail, but we'll return exists: false below.
      }
    }

    return { exists: false, data: null };
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
