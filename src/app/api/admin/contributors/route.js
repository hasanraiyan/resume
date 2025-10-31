/**
 * @fileoverview API route for managing contributors in admin panel.
 * Provides CRUD operations for contributor profiles with authentication.
 *
 * Supports:
 * - GET: List all contributors with pagination and search
 * - POST: Create new contributor
 *
 * @requires Authentication: Admin access required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Contributor from '@/models/Contributor';

/**
 * GET /api/admin/contributors
 * List all contributors with optional search and pagination
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (search) {
      query = {
        $text: { $search: search },
      };
    }

    // Get contributors with pagination
    const contributors = await Contributor.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Contributor.countDocuments(query);

    return NextResponse.json({
      contributors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching contributors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/contributors
 * Create a new contributor
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { name, avatar, bio, socialLinks } = body;

    // Validate required fields
    if (!name || !avatar) {
      return NextResponse.json({ error: 'Name and avatar are required' }, { status: 400 });
    }

    // Create contributor
    const contributor = new Contributor({
      name: name.trim(),
      avatar,
      bio: bio?.trim(),
      socialLinks,
    });

    await contributor.save();

    return NextResponse.json(contributor, { status: 201 });
  } catch (error) {
    console.error('Error creating contributor:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Contributor with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
