import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import crypto from 'node:crypto';
import ShortLink from '@/models/ShortLink';
import LinkClick from '@/models/LinkClick';
import { isBot, hashIP } from '@/utils/analytics-helpers';
import { UAParser } from 'ua-parser-js';

// Simple in-memory rate limiter to prevent analytics spam from a single IP.
// Limit: max 10 clicks per minute per hashed IP.
// Structure: Map<ipHash, { count: number, resetAt: number }>
const rateLimitCache = new Map();
const RATE_LIMIT_MAX_CLICKS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/**
 * Clean up old entries from the rate limit cache.
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, value] of rateLimitCache.entries()) {
    if (now > value.resetAt) {
      rateLimitCache.delete(key);
    }
  }
}

/**
 * Checks if a given IP hash is currently rate-limited.
 * Also performs periodic cleanup of the cache.
 *
 * @param {string} ipHash - The anonymized IP hash
 * @returns {boolean} True if the IP has exceeded limits, false otherwise
 */
function isRateLimited(ipHash) {
  if (!ipHash) return false;

  const now = Date.now();

  // Occasionally clean up the cache
  if (Math.random() < 0.1) cleanupRateLimits();

  let record = rateLimitCache.get(ipHash);
  if (!record || now > record.resetAt) {
    // New or expired record
    record = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitCache.set(ipHash, record);
    return false;
  }

  // Active record
  record.count += 1;
  return record.count > RATE_LIMIT_MAX_CLICKS;
}

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.redirect(new URL('/404', request.url));
  }

  try {
    await dbConnect();

    // 1. Find the short link
    const link = await ShortLink.findOne({ slug: slug.toLowerCase() }).exec();

    // 2. Validate availability
    if (!link || !link.isActive) {
      // Could redirect to a specific "Link inactive" page in the future
      return NextResponse.redirect(new URL('/404', request.url));
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      // Auto-deactivate logic could go here or in a cron, but for now just fail gracefully
      return NextResponse.redirect(new URL('/404', request.url));
    }

    // 3. Extract tracking data
    const userAgentStr = request.headers.get('user-agent') || '';

    // Perform bot detection and rate limiting check before logging analytics
    const isBotTraffic = isBot(userAgentStr);

    // Get real IP for hashing
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    // We avoid '127.0.0.1' as a fallback to prevent all missing-IP traffic
    // from being rate-limited together or counted as a single unique visitor.
    // Instead we use a random string or 'unknown' (hashIP returns null for falsy values).
    const clientIP = forwarded
      ? forwarded.split(',')[0]
      : realIP || request.ip || `unknown-${Date.now()}-${crypto.randomUUID()}`;
    const ipHash = hashIP(clientIP);

    const isSpam = isRateLimited(ipHash);

    // If human and not rate limited, log the click
    if (!isBotTraffic && !isSpam) {
      try {
        const country = request.headers.get('x-vercel-ip-country') || 'Unknown';
        const referrerHeader = request.headers.get('referer') || '';

        // Clean referrer string (e.g., extracting just the host if it's too long or full of params)
        let referrer = 'Direct';
        if (referrerHeader) {
          try {
            const url = new URL(referrerHeader);
            referrer = url.hostname;
          } catch {
            referrer = referrerHeader;
          }
        }

        // Parse UA
        const parser = new UAParser(userAgentStr);
        const browser = parser.getBrowser().name || 'Unknown';
        const os = parser.getOS().name || 'Unknown';
        const deviceType = parser.getDevice().type;
        const device =
          deviceType === 'mobile' ? 'Mobile' : deviceType === 'tablet' ? 'Tablet' : 'Desktop';

        // Perform DB updates in parallel (not awaiting them to speed up redirect)
        // Note: Edge functions on Vercel kill background promises once the response is sent unless
        // context.waitUntil is used, but since Next.js App Router API Routes run on Node by default
        // (unless `export const runtime = 'edge'` is set), background promises usually complete.
        // For absolute safety and to guarantee consistency, we will await them here.
        // Create the LinkClick first, if it succeeds, then increment the counter on the ShortLink.
        // This ensures the counter stays in sync with the actual click documents.
        // Doing this sequentially avoids metric drift from partial parallel execution failures.
        await LinkClick.create({
          shortLink: link._id,
          slug: link.slug,
          referrer,
          country,
          device,
          browser,
          os,
          ipHash,
        });

        // Only increment if creation of the log succeeded
        await ShortLink.updateOne({ _id: link._id }, { $inc: { totalClicks: 1 } });
      } catch (logError) {
        console.error('Failed to log short link click:', logError);
        // We still proceed to redirect even if logging fails
      }
    }

    // 4. Redirect
    // Use 302 Found or 307 Temporary Redirect so browsers don't cache the redirect heavily
    // (We want to track every click, so 301 Permanent is bad here)
    return NextResponse.redirect(link.destination, { status: 302 });
  } catch (error) {
    console.error('Short link redirect error:', error);
    // On unexpected errors, just go home or 404
    return NextResponse.redirect(new URL('/', request.url));
  }
}
