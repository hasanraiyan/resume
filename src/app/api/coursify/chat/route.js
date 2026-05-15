import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import mongoose from 'mongoose';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';

import '@/lib/agents';

function encodeEvent(obj) {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n');
}

function isObjectId(value) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

export async function POST(request) {
  const rateLimitResponse = rateLimit(request, 15, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      console.error('[CoursifyChat] Body parse failed:', e.message);
      return NextResponse.json({ error: 'Invalid or empty JSON body' }, { status: 400 });
    }

    const {
      userMessage,
      chatHistory = [],
      courseSlug = '',
      currentSectionId = '',
      currentSectionTitle = '',
      currentSectionSummary = '',
    } = body;

    if (!userMessage)
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });

    let courseId = null;
    let courseTitle = '';

    // Resolve course if a slug was provided (course reader pages)
    if (courseSlug) {
      await dbConnect();
      const query = isObjectId(courseSlug)
        ? { _id: courseSlug, deletedAt: null, status: 'published' }
        : { slug: courseSlug, deletedAt: null, status: 'published' };

      const course = await CoursifyCourse.findOne(query).select('_id title').lean();
      if (course) {
        courseId = course._id.toString();
        courseTitle = course.title;
      }
    }

    const inputParams = {
      userMessage,
      chatHistory,
      courseId,
      courseTitle,
      currentSectionId,
      currentSectionTitle,
      currentSectionSummary,
    };

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const events = agentRegistry.streamExecute(AGENT_IDS.COURSIFY_CHAT, inputParams);
          for await (const event of events) {
            controller.enqueue(encodeEvent(event));
          }
          controller.close();
        } catch (error) {
          console.error('[CoursifyChat] Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('[CoursifyChat] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
