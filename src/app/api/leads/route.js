import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Lead from '@/models/Lead';
import { rateLimit } from '@/lib/rateLimit';

/**
 * @fileoverview Public API for capturing leads and waitlist responses.
 * Designed to be generic and reusable for any form type.
 */

export async function POST(request) {
  try {
    // Apply rate limiting: 5 requests per 5 minutes per IP
    const rateLimitResult = rateLimit(request, 5, 300000);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    await dbConnect();

    const body = await request.json();
    const { type, email, name, data = {} } = body;

    // Validation
    if (!type) {
      return NextResponse.json({ success: false, error: 'Form type is required' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Get client metadata
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent')?.substring(0, 200);
    const referrer = request.headers.get('referer')?.substring(0, 200);
    const path = new URL(request.url).pathname;

    try {
      const lead = new Lead({
        type,
        email: email.toLowerCase(),
        name: name?.trim(),
        data,
        metadata: {
          ipAddress: clientIP,
          userAgent,
          referrer,
          path,
        },
      });

      await lead.save();

      return NextResponse.json({
        success: true,
        message: 'Your response has been recorded. We will get back to you soon!',
      });
    } catch (saveError) {
      // Handle duplicate (type, email)
      if (saveError.code === 11000) {
        return NextResponse.json({
          success: true,
          message: 'You have already joined this waitlist. Stay tuned!',
          alreadyExists: true,
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Error capturing lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}

/**
 * Extract client IP address from request headers.
 */
function getClientIP(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
