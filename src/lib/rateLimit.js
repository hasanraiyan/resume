import { NextResponse } from 'next/server';

// Simple in-memory rate limiting (for development)
// In production, you'd want to use Redis or a database
const rateLimitMap = new Map();

/**
 * Rate limiting middleware for API routes
 * @param {Request} request - The incoming request
 * @param {number} maxRequests - Maximum requests allowed per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {NextResponse|null} Rate limit response if exceeded, null if allowed
 */
export function rateLimit(request, maxRequests = 5, windowMs = 60000) {
  // 5 requests per minute default
  const clientIP = getClientIP(request);
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get or create rate limit entry for this IP
  const rateLimitKey = `${clientIP}_${request.url}`;
  let rateLimitData = rateLimitMap.get(rateLimitKey);

  if (!rateLimitData) {
    rateLimitData = {
      requests: [],
      blocked: false,
      blockUntil: 0,
    };
    rateLimitMap.set(rateLimitKey, rateLimitData);
  }

  // Clean old requests outside the window
  rateLimitData.requests = rateLimitData.requests.filter((timestamp) => timestamp > windowStart);

  // Check if currently blocked
  if (rateLimitData.blocked && now < rateLimitData.blockUntil) {
    const remainingTime = Math.ceil((rateLimitData.blockUntil - now) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        retryAfter: remainingTime,
      },
      {
        status: 429,
        headers: {
          'Retry-After': remainingTime.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitData.blockUntil.toString(),
        },
      }
    );
  }

  // Check if over limit
  if (rateLimitData.requests.length >= maxRequests) {
    // Block for 5 minutes
    rateLimitData.blocked = true;
    rateLimitData.blockUntil = now + 5 * 60 * 1000; // 5 minutes

    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: 300,
      },
      {
        status: 429,
        headers: {
          'Retry-After': '300',
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitData.blockUntil.toString(),
        },
      }
    );
  }

  // Add current request timestamp
  rateLimitData.requests.push(now);

  // Clean up old entries periodically (every 100 requests)
  if (rateLimitMap.size > 1000) {
    for (const [key, data] of rateLimitMap.entries()) {
      if (data.requests.length === 0 && !data.blocked) {
        rateLimitMap.delete(key);
      }
    }
  }

  return null; // Allow request
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
