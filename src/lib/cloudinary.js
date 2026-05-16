import { v2 as cloudinary } from 'cloudinary';
import dynamicSettingsManager from '@/lib/DynamicSettingsManager';

/**
 * Configure and return Cloudinary instance
 * Fetches credentials from database with environment fallbacks
 */
export const getCloudinary = async () => {
  const cloud_name = await dynamicSettingsManager.get(
    'CLOUDINARY_CLOUD_NAME',
    process.env.CLOUDINARY_CLOUD_NAME
  );
  const api_key = await dynamicSettingsManager.get(
    'CLOUDINARY_API_KEY',
    process.env.CLOUDINARY_API_KEY
  );
  const api_secret = await dynamicSettingsManager.get(
    'CLOUDINARY_API_SECRET',
    process.env.CLOUDINARY_API_SECRET
  );

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });

  return cloudinary;
};

export default cloudinary;
