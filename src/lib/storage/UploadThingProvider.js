import { UTApi } from 'uploadthing/server';
import IStorageProvider from './IStorageProvider.js';

export default class UploadThingProvider extends IStorageProvider {
  constructor(credentials) {
    super();
    // Use provided token, or let it fall back to process.env.UPLOADTHING_TOKEN
    const config = credentials?.token ? { token: credentials.token } : {};
    this.utapi = new UTApi(config);
  }

  async upload(buffer, fileName, mimeType) {
    const file = new File([buffer], fileName, { type: mimeType });
    const response = await this.utapi.uploadFiles(file);
    if (response.error) {
      throw new Error(`UploadThing upload error: ${response.error.message}`);
    }
    return {
      url: response.data.url,
      fileKey: response.data.key
    };
  }

  async delete(fileKey) {
    const response = await this.utapi.deleteFiles(fileKey);
    return response.success;
  }

  async getUrl(fileKey) {
    return `https://utfs.io/f/${fileKey}`;
  }

  getCapabilities() {
    return {
      supportsFolders: false,
      supportsSignedUrls: false,
      requiresDirectUpload: true
    };
  }

  async getUploadIntent(fileName, fileSize, fileType) {
    return {
      provider: 'uploadthing',
      config: {}
    };
  }
}
