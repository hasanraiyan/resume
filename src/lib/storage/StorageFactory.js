import UploadThingProvider from './UploadThingProvider.js';
import CloudinaryProvider from './CloudinaryProvider.js';

export default class StorageFactory {
  static getProvider(type, credentials) {
    switch (type) {
      case 'uploadthing':
        return new UploadThingProvider(credentials);
      case 'cloudinary':
        return new CloudinaryProvider(credentials);
      case 's3':
        throw new Error(`Provider ${type} is not yet implemented.`);
      default:
        throw new Error(`Unknown storage provider type: ${type}`);
    }
  }
}
