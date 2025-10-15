import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Subscriber from '@/models/Subscriber';
import { rateLimit } from '@/lib/rateLimit';

/**
 * POST /api/subscribe - Subscribe to newsletter
 * Handles newsletter subscription requests with validation and duplicate prevention
 */
export async function POST(request) {
  try {
    // Apply rate limiting to prevent spam
    const rateLimitResult = rateLimit(request, 10, 60000); // 10 requests per minute
    if (rateLimitResult) {
      return rateLimitResult;
    }

    await dbConnect();

    const { email, name, source = 'footer' } = await request.json();

    console.log('Newsletter subscription request:', { email, name, source });

    // Validate required fields
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Get client information for metadata
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent')?.substring(0, 200);
    const referrer = request.headers.get('referer')?.substring(0, 200);

    // Check if email already exists
    const existingSubscriber = await Subscriber.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    if (existingSubscriber) {
      console.log('Email already subscribed:', email);
      return NextResponse.json(
        {
          success: true,
          message: 'You are already subscribed to our newsletter!',
          alreadySubscribed: true,
        },
        { status: 200 }
      );
    }

    // Create new subscriber
    const subscriber = new Subscriber({
      email: email.toLowerCase(),
      name: name?.trim() || undefined,
      source,
      metadata: {
        ipAddress: clientIP,
        userAgent,
        referrer,
      },
    });

    await subscriber.save();

    console.log('New subscriber created:', { email, source });

    // TODO: Integrate with Mailchimp or other email service
    // For now, we'll just save to database
    // Uncomment and configure when ready to integrate with email service:
    /*
    try {
      await addToMailchimp(email, name, source);
    } catch (emailError) {
      console.error('Failed to add to email service:', emailError);
      // Don't fail the subscription if email service fails
    }
    */

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to our newsletter!',
      subscriber: {
        email: subscriber.email,
        name: subscriber.name,
        subscribedAt: subscriber.subscribedAt,
      },
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);

    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: true,
          message: 'You are already subscribed to our newsletter!',
          alreadySubscribed: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/subscribe - Get subscription status for email
 * Useful for checking if an email is already subscribed
 */
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const subscriber = await Subscriber.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      isSubscribed: !!subscriber,
      subscribedAt: subscriber?.subscribedAt,
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Extract client IP address from request
 * @param {Request} request - The incoming request
 * @returns {string} Client IP address
 */
function getClientIP(request) {
  // Try various headers for IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (clientIP) {
    return clientIP;
  }

  // Fallback for development
  return '127.0.0.1';
}

/**
 * Add subscriber to Mailchimp (placeholder for future implementation)
 * @param {string} email - Subscriber email
 * @param {string} name - Subscriber name
 * @param {string} source - Subscription source
 */
async function addToMailchimp(email, name, source) {
  // TODO: Implement Mailchimp integration
  // This would use @mailchimp/mailchimp_marketing package
  // const mailchimp = require('@mailchimp/mailchimp_marketing');

  console.log('Would add to Mailchimp:', { email, name, source });

  // Example implementation:
  /*
  mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX,
  });

  await mailchimp.lists.addListMember(process.env.MAILCHIMP_AUDIENCE_ID, {
    email_address: email,
    status: 'subscribed',
    merge_fields: {
      NAME: name,
      SOURCE: source,
    },
  });
  */
}
