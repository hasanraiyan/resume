import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Article from '@/models/Article';
import Engagement from '@/models/Engagement';
import { rateLimit } from '@/lib/rateLimit';

// PATCH /api/articles/[slug]/likes - Increment likes for an article
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    const { action, type } = await request.json();

    console.log('PATCH request received:', { slug, action, type });

    if (!action || !type || !['like', 'clap'].includes(type)) {
      console.log('Invalid action or type:', { action, type });
      return NextResponse.json(
        { success: false, error: 'Invalid action or type' },
        { status: 400 }
      );
    }

    // Get client IP for tracking
    const clientIP = getClientIP(request);

    // Check if user has already engaged with this content recently
    const existingEngagement = await Engagement.findOne({
      contentType: 'article',
      contentSlug: slug,
      engagementType: type,
      clientIP: clientIP,
      expiresAt: { $gt: new Date() },
    });

    if (existingEngagement && action === 'increment') {
      console.log('User has already engaged with this article:', { slug, type, clientIP });
      return NextResponse.json(
        { success: false, error: 'Already engaged with this content', alreadyEngaged: true },
        { status: 409 }
      );
    }

    const updateField = type === 'like' ? 'likes' : 'claps';
    const incrementValue = action === 'increment' ? 1 : -1;

    console.log('Attempting to update:', { slug, updateField, incrementValue });

    // First, ensure the field exists with default value
    await Article.findOneAndUpdate(
      { slug },
      { $setOnInsert: { [updateField]: 0 } },
      { upsert: true }
    );

    // Then increment the field
    const article = await Article.findOneAndUpdate(
      { slug },
      { $inc: { [updateField]: incrementValue } },
      { new: true }
    );

    if (!article) {
      console.log('Article not found for slug:', slug);
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    // Record the engagement for future prevention (only for increment actions)
    if (action === 'increment') {
      await Engagement.create({
        contentType: 'article',
        contentSlug: slug,
        engagementType: type,
        clientIP: clientIP,
        userAgent: request.headers.get('user-agent')?.substring(0, 100),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    } else if (action === 'decrement') {
      // Remove the engagement record when user unlikes/unclaps
      await Engagement.deleteOne({
        contentType: 'article',
        contentSlug: slug,
        engagementType: type,
        clientIP: clientIP,
      });
    }

    console.log('Article updated successfully:', { [updateField]: article[updateField] });

    return NextResponse.json({
      success: true,
      [updateField]: article[updateField],
    });
  } catch (error) {
    console.error('Error updating article engagement:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/articles/[slug]/likes - Get current likes and claps count
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;

    console.log('GET request received for slug:', slug);

    // Get client IP for engagement state check
    const clientIP = getClientIP(request);

    const article = await Article.findOne({ slug }, 'likes claps');

    if (!article) {
      console.log('Article not found for slug:', slug);
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    console.log('Article found:', { likes: article.likes, claps: article.claps });

    // Check engagement state for current IP
    const likeEngagement = await Engagement.findOne({
      contentType: 'article',
      contentSlug: slug,
      engagementType: 'like',
      clientIP: clientIP,
      expiresAt: { $gt: new Date() },
    });

    const clapEngagement = await Engagement.findOne({
      contentType: 'article',
      contentSlug: slug,
      engagementType: 'clap',
      clientIP: clientIP,
      expiresAt: { $gt: new Date() },
    });

    return NextResponse.json({
      success: true,
      likes: article.likes,
      claps: article.claps,
      userEngagement: {
        liked: !!likeEngagement,
        clapped: !!clapEngagement,
      },
    });
  } catch (error) {
    console.error('Error fetching article engagement:', error);
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
