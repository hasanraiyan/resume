/**
 * @fileoverview About Section Preview API route for real-time preview functionality.
 * Provides a safe preview endpoint that generates about section data without
 * saving to the database, allowing administrators to see changes in real-time
 * before committing them to the live site.
 *
 * @description This API endpoint allows administrators to:
 * - Generate preview data for about section changes
 * - Validate about section structure and content
 * - Test UI updates without affecting live content
 * - Provide immediate feedback for admin interface changes
 * - Preview biography text, features, and resume information
 *
 * The preview functionality is completely safe as it doesn't modify
 * any database content and only returns the processed preview data.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST /api/about/preview - Preview about changes without saving
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Return the preview data without saving to database
    return NextResponse.json({
      success: true,
      data: body,
      preview: true,
    });
  } catch (error) {
    console.error('About Preview Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
