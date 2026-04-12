import UploadThingProvider from './UploadThingProvider.js';

export default class StorageFactory {
  static getProvider(type, credentials) {
    switch (type) {
      case 'uploadthing':
        return new UploadThingProvider(credentials);
      // S3 and Cloudinary would be added here
      case 's3':
      case 'cloudinary':
        throw new Error(`Provider ${type} is not yet implemented.`);
      default:
        throw new Error(`Unknown storage provider type: ${type}`);
    }
  }
}
