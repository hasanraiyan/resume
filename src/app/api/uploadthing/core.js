// src/app/api/uploadthing/core.js
import { getServerSession } from 'next-auth/next';
import { createUploadthing } from 'uploadthing/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const uploadBuilder = createUploadthing();

/**
 * UploadThing file router for admin-managed assets.
 *
 * @type {import('uploadthing/types').FileRouter}
 */
export const uploadRouter = {
  mediaUploader: uploadBuilder({
    image: { maxFileSize: '8MB', maxFileCount: 10 },
    video: { maxFileSize: '128MB', maxFileCount: 2 },
    pdf: { maxFileSize: '16MB', maxFileCount: 5 },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);

      if (!session || session.user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      return { uploaderId: session.user?.id || session.user?.email || 'admin' };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      return {
        uploaderId: metadata.uploaderId,
        fileKey: file.key,
      };
    }),
};
