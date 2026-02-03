// src/app/api/uploadthing/route.js
import { createRouteHandler } from 'uploadthing/next';
import { uploadRouter } from '@/app/api/uploadthing/core';

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});
