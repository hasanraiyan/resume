// src/app/api/analytics/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Analytics from '@/lib/models/Analytics';

// List of known bot user agents to filter out
const BOT_USER_AGENTS = [
  'bot',
  'spider',
  'crawler',
  'scraper',
  'monitoring',
  'check',
  'wget',
  'curl',
  'python-requests',
  'go-http-client',
  'java',
  'okhttp',
  'axios',
  'node-fetch',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
];

function isBot(userAgent) {
  if (!userAgent) return false;

  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}

function hashIP(ip) {
  // Simple hash for geographical analysis without storing full IP
  if (!ip) return null;

  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Debug logging - log the entire request body
    console.log('=== ANALYTICS DEBUG ===');
    console.log('Full request body:', JSON.stringify(body, null, 2));
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));

    // Handle both single event objects and arrays of events
    const events = Array.isArray(body) ? body : [body];

    console.log(`Processing ${events.length} event(s)`);

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      console.log(`Processing event ${i + 1}:`, JSON.stringify(event, null, 2));

      // Validate required fields
      const { eventType, path, sessionId, userAgent, referrer, properties = {} } = event;

      console.log(`Event ${i + 1} extracted fields:`, {
        eventType,
        path,
        sessionId,
        userAgent: userAgent ? userAgent.substring(0, 100) + '...' : 'undefined',
        referrer,
        properties,
      });

      if (!eventType || !path || !sessionId) {
        console.log(`Event ${i + 1} validation failed - missing required fields:`, {
          hasEventType: !!eventType,
          hasPath: !!path,
          hasSessionId: !!sessionId,
        });
        return NextResponse.json(
          { error: `Missing required fields in event ${i + 1}: eventType, path, sessionId` },
          { status: 400 }
        );
      }

      // Filter out bot traffic
      if (isBot(userAgent)) {
        console.log(`Event ${i + 1} filtered - bot detected:`, userAgent?.substring(0, 100));
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

      console.log(`Event ${i + 1} client info:`, {
        clientIP: clientIP?.substring(0, 20) + '...',
        userAgentLength: userAgent?.length || 0,
      });

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

      console.log(`Event ${i + 1} parsed device info:`, deviceInfo);

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
        timestamp: new Date(),
      };

      // Only add eventName if it's provided (for custom events)
      if (properties.eventName) {
        analyticsData.eventName = properties.eventName;
      }

      console.log(`Event ${i + 1} analytics data to save:`, JSON.stringify(analyticsData, null, 2));

      const analytics = new Analytics(analyticsData);
      await analytics.save();

      console.log(`Event ${i + 1} saved successfully`);
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

// Handle OPTIONS requests for CORS
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
