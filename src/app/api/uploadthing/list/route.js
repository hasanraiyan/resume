// src/app/api/uploadthing/list/route.js
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
 * Returns a paginated list of UploadThing files and usage details.
 *
 * @async
 * @function GET
 * @param {Request} request - Incoming request with pagination parameters.
 * @returns {Promise<NextResponse>} JSON response containing files and usage data.
 */
export async function GET(request) {
  try {
    const isAuthorized = await isAdmin();

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    const [listResult, usageResult] = await Promise.all([
      utapi.listFiles({ limit, offset }),
      utapi.getUsageInfo(),
    ]);

    const keys = listResult.files.map((file) => file.key);
    const urlsResult = keys.length ? await utapi.getFileUrls(keys) : { data: [] };
    const urlsByKey = new Map(urlsResult.data.map((file) => [file.key, file.url]));

    const filesWithUrls = listResult.files.map((file) => ({
      ...file,
      url: urlsByKey.get(file.key) || null,
    }));

    return NextResponse.json({
      files: filesWithUrls,
      hasMore: listResult.hasMore,
      usage: usageResult,
    });
  } catch (error) {
    console.error('Failed to list UploadThing files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}
