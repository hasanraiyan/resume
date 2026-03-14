/**
 * @fileoverview Analytics API route for tracking user interactions and events.
 * Provides privacy-focused analytics with bot filtering, IP anonymization,
 * and support for both single events and batch event processing.
 *
 * Features:
 * - Bot traffic filtering using comprehensive user agent patterns
 * - IP address hashing for privacy compliance
 * - Device and browser detection from user agent strings
 * - Batch event processing for improved performance
 * - CORS support for cross-origin requests
 * - Graceful error handling that doesn't break client applications
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Analytics from '@/models/Analytics';
import { isBot, hashIP } from '@/utils/analytics-helpers';

/**
 * Handles POST requests for analytics event tracking.
 * Processes both single events and arrays of events with comprehensive validation,
 * bot filtering, and privacy-compliant data collection.
 *
 * Features:
 * - Batch event processing for improved performance
 * - Comprehensive bot detection and filtering
 * - Privacy-compliant IP hashing for geographical analysis
 * - Device and browser detection from user agent strings
 * - Graceful error handling that doesn't break client applications
 * - Detailed logging for debugging and monitoring
 *
 * @async
 * @function POST
 * @param {Request} request - Next.js request object containing analytics events
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 *
 * @example
 * ```js
 * // Single event tracking
 * POST /api/analytics
 * {
 *   "eventType": "page_view",
 *   "path": "/projects",
 *   "sessionId": "abc123",
 *   "userAgent": "Mozilla/5.0...",
 *   "referrer": "https://google.com",
 *   "properties": {
 *     "eventName": "project_page_view",
 *     "projectId": "123"
 *   }
 * }
 *
 * // Batch event tracking
 * POST /api/analytics
 * [
 *   {
 *     "eventType": "page_view",
 *     "path": "/projects",
 *     "sessionId": "abc123"
 *   },
 *   {
 *     "eventType": "click",
 *     "path": "/projects",
 *     "sessionId": "abc123",
 *     "properties": {
 *       "element": "project-card",
 *       "projectId": "456"
 *     }
 *   }
 * ]
 * ```
 *
 * @requestBody {Object|Array} events - Single event object or array of event objects
 * @requestBody {string} events[].eventType - Required: Type of event (page_view, click, etc.)
 * @requestBody {string} events[].path - Required: Page path where event occurred
 * @requestBody {string} events[].sessionId - Required: Unique session identifier
 * @requestBody {string} [events[].userAgent] - User agent string for bot detection
 * @requestBody {string} [events[].referrer] - Referring URL
 * @requestBody {Object} [events[].properties={}] - Additional event properties
 * @requestBody {string} [events[].properties.eventName] - Custom event name
 *
 * @response {Object} Success response
 * @response {boolean} success - Always true for successful processing
 * @response {string} message - Success message
 * @response {number} processed - Number of events processed
 *
 * @response {Object} Error response
 * @response {string} error - Error message describing what went wrong
 *
 * @error {400} Bad Request - Missing required fields in event data
 * @error {500} Internal Server Error - Database or server error
 *
 * @privacy
 * - IP addresses are hashed for anonymization
 * - No personally identifiable information is stored
 * - Bot traffic is automatically filtered out
 * - User agents are stored for analytics but not used for identification
 *
 * @performance
 * - Database connection is established once for batch processing
 * - Events are processed sequentially to avoid race conditions
 * - Validation errors return 200 to avoid breaking client applications
 */
export async function POST(request) {
  try {
    const body = await request.json();
    // Handle both single event objects and arrays of events
    const events = Array.isArray(body) ? body : [body];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      // Validate required fields
      const { eventType, path, sessionId, userAgent, referrer, properties = {}, userRole } = event;

      if (!eventType || !path || !sessionId) {
        return NextResponse.json(
          { error: `Missing required fields in event ${i + 1}: eventType, path, sessionId` },
          { status: 400 }
        );
      }

      // Filter out bot traffic
      if (isBot(userAgent)) {
        continue; // Skip this event but continue processing others
      }

      // Connect to database (only once for all events)
      if (i === 0) {
        await dbConnect();
      }

      // Get client IP (for geographical analysis, not stored as PII)
      const forwarded = request.headers.get('x-forwarded-for');
      const realIP = request.headers.get('x-real-ip');
      const clientIP = forwarded ? forwarded.split(',')[0] : realIP || request.ip || 'unknown';

      // Parse device info from user agent (simplified)
      const deviceInfo = {
        userAgent,
        // In a production environment, you might want to use a proper UA parser
        browser: userAgent?.includes('Chrome')
          ? 'Chrome'
          : userAgent?.includes('Firefox')
            ? 'Firefox'
            : userAgent?.includes('Safari')
              ? 'Safari'
              : 'Other',
        os: userAgent?.includes('Windows')
          ? 'Windows'
          : userAgent?.includes('Mac')
            ? 'macOS'
            : userAgent?.includes('Linux')
              ? 'Linux'
              : 'Other',
        device: userAgent?.includes('Mobile')
          ? 'Mobile'
          : userAgent?.includes('Tablet')
            ? 'Tablet'
            : 'Desktop',
      };

      // Create analytics record
      const analyticsData = {
        eventType,
        path,
        sessionId,
        userAgent,
        referrer,
        properties,
        ipHash: hashIP(clientIP),
        deviceInfo,
        userRole, // Add user role to the database record
        timestamp: new Date(),
      };

      // Only add eventName if it's provided (for custom events)
      if (properties.eventName) {
        analyticsData.eventName = properties.eventName;
      }

      const analytics = new Analytics(analyticsData);
      await analytics.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Events tracked successfully',
      processed: events.length,
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);

    // Return 200 for client errors to avoid breaking the site
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: true, message: 'Event received but not saved' },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handles OPTIONS requests for CORS preflight checks.
 * Enables cross-origin requests from any domain for analytics tracking.
 * Supports the POST method and Content-Type headers for JSON payloads.
 *
 * @async
 * @function OPTIONS
 * @returns {NextResponse} Response with CORS headers for preflight requests
 *
 * @cors
 * - Allows requests from any origin (*)
 * - Permits POST and OPTIONS methods
 * - Accepts Content-Type headers for JSON payloads
 * - No response body (status 200 with null body)
 *
 * @example
 * ```http
 * OPTIONS /api/analytics
 * Access-Control-Request-Method: POST
 * Access-Control-Request-Headers: Content-Type
 *
 * Response:
 * HTTP 200 OK
 * Access-Control-Allow-Origin: *
 * Access-Control-Allow-Methods: POST, OPTIONS
 * Access-Control-Allow-Headers: Content-Type
 * ```
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
