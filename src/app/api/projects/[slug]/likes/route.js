import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Engagement from '@/models/Engagement';

// PATCH /api/projects/[slug]/likes - Increment likes for a project
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;
    const { action, type } = await request.json();

    console.log('PATCH request received for project:', { slug, action, type });

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
      contentType: 'project',
      contentSlug: slug,
      engagementType: type,
      clientIP: clientIP,
      expiresAt: { $gt: new Date() },
    });

    if (existingEngagement && action === 'increment') {
      console.log('User has already engaged with this project:', { slug, type, clientIP });
      return NextResponse.json(
        { success: false, error: 'Already engaged with this content', alreadyEngaged: true },
        { status: 409 }
      );
    }

    const updateField = type === 'like' ? 'likes' : 'claps';
    const incrementValue = action === 'increment' ? 1 : -1;

    console.log('Attempting to update project:', { slug, updateField, incrementValue });

    // First, ensure the field exists with default value
    await Project.findOneAndUpdate(
      { slug },
      { $setOnInsert: { [updateField]: 0 } },
      { upsert: true }
    );

    // Then increment the field
    const project = await Project.findOneAndUpdate(
      { slug },
      { $inc: { [updateField]: incrementValue } },
      { new: true }
    );

    if (!project) {
      console.log('Project not found for slug:', slug);
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Record the engagement for future prevention (only for increment actions)
    if (action === 'increment') {
      await Engagement.create({
        contentType: 'project',
        contentSlug: slug,
        engagementType: type,
        clientIP: clientIP,
        userAgent: request.headers.get('user-agent')?.substring(0, 100),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    } else if (action === 'decrement') {
      // Remove the engagement record when user unlikes/unclaps
      await Engagement.deleteOne({
        contentType: 'project',
        contentSlug: slug,
        engagementType: type,
        clientIP: clientIP,
      });
    }

    console.log('Project updated successfully:', { [updateField]: project[updateField] });

    return NextResponse.json({
      success: true,
      [updateField]: project[updateField],
    });
  } catch (error) {
    console.error('Error updating project engagement:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/projects/[slug]/likes - Get current likes and claps count
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { slug } = await params;

    console.log('GET request received for project slug:', slug);

    // Get client IP for engagement state check
    const clientIP = getClientIP(request);

    const project = await Project.findOne({ slug }, 'likes claps');

    if (!project) {
      console.log('Project not found for slug:', slug);
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    console.log('Project found:', { likes: project.likes, claps: project.claps });

    // Check engagement state for current IP
    const likeEngagement = await Engagement.findOne({
      contentType: 'project',
      contentSlug: slug,
      engagementType: 'like',
      clientIP: clientIP,
      expiresAt: { $gt: new Date() },
    });

    const clapEngagement = await Engagement.findOne({
      contentType: 'project',
      contentSlug: slug,
      engagementType: 'clap',
      clientIP: clientIP,
      expiresAt: { $gt: new Date() },
    });

    return NextResponse.json({
      success: true,
      likes: project.likes,
      claps: project.claps,
      userEngagement: {
        liked: !!likeEngagement,
        clapped: !!clapEngagement,
      },
    });
  } catch (error) {
    console.error('Error fetching project engagement:', error);
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
