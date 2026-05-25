import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

/**
 * Common request parser for Coursify generate routes.
 * Handles rate limiting and JSON body parsing once (to avoid "Body has already been read" errors).
 *
 * @param {Request} request
 * @returns {Promise<{
 *   body: any,
 *   topic: string,
 *   isReferenceEnabled: boolean,
 *   agent: string | null,
 *   errorResponse?: Response
 * }>}
 */
export async function parseGenerateRequest(request) {
  // Rate limiting (shared across generate routes)
  const rateLimitResponse = rateLimit(request, 5, 60000);
  if (rateLimitResponse) {
    return { errorResponse: rateLimitResponse };
  }

  try {
    const body = await request.json();
    const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';

    return {
      body, // full parsed body (so callers don't need to read the request again)
      topic,
      isReferenceEnabled: !!body.isReferenceEnabled,
      agent: body.agent || null, // used for dev agent picker (openai / antigravity)
      // Individual routes should validate their own required fields (topic, sectionName, etc.)
    };
  } catch (e) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }
}
