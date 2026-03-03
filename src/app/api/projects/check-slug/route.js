/**
 * API route: GET /api/projects/check-slug
 * Checks whether a project slug is available.
 *
 * Query params:
 * - slug (required): slug to validate
 * - excludeId (optional): project id to exclude during edit mode
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug')?.trim().toLowerCase();
    const excludeId = searchParams.get('excludeId')?.trim();

    if (!slug) {
      return NextResponse.json({ success: false, message: 'Slug is required' }, { status: 400 });
    }

    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingProject = await Project.exists(query);

    return NextResponse.json({
      success: true,
      slug,
      available: !Boolean(existingProject),
    });
  } catch (error) {
    console.error('Error checking project slug availability:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check slug availability' },
      { status: 500 }
    );
  }
}
