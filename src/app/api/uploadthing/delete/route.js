// src/app/api/uploadthing/delete/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { UTApi } from 'uploadthing/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const utapi = new UTApi();

/**
 * Verifies that the current session belongs to an admin user.
 *
 * @async
 * @function isAdmin
 * @returns {Promise<boolean>} Whether the user is authenticated as an admin.
 */
async function isAdmin() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return false;
    }

    return session.user.role === 'admin';
  } catch (error) {
    console.error('UploadThing admin check failed:', error);
    return false;
  }
}

/**
 * Deletes one or more files from UploadThing storage.
 *
 * @async
 * @function POST
 * @param {Request} request - Incoming request with file keys to delete.
 * @returns {Promise<NextResponse>} JSON response with deletion status.
 */
export async function POST(request) {
  try {
    const isAuthorized = await isAdmin();

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const fileKeys = Array.isArray(payload?.fileKeys)
      ? payload.fileKeys
      : payload?.fileKey
        ? [payload.fileKey]
        : [];

    if (!fileKeys.length) {
      return NextResponse.json({ error: 'Missing file keys' }, { status: 400 });
    }

    const result = await utapi.deleteFiles(fileKeys);

    return NextResponse.json({ success: result.success, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Failed to delete UploadThing files:', error);
    return NextResponse.json({ error: 'Failed to delete files' }, { status: 500 });
  }
}
