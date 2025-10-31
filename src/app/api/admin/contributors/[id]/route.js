'use server';
/**
 * @fileoverview API route for managing individual contributors in admin panel.
 * Provides CRUD operations for specific contributor profiles.
 *
 * Supports:
 * - GET: Get contributor by ID
 * - PUT: Update contributor
 * - DELETE: Delete contributor
 *
 * @requires Authentication: Admin access required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Contributor from '@/models/Contributor';
import Project from '@/models/Project';

/**
 * GET /api/admin/contributors/[id]
 * Get a specific contributor by ID
 */
export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const contributor = await Contributor.findById(params.id);

    if (!contributor) {
      return NextResponse.json({ error: 'Contributor not found' }, { status: 404 });
    }

    return NextResponse.json(contributor);
  } catch (error) {
    console.error('Error fetching contributor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/contributors/[id]
 * Update a specific contributor
 */
export async function PUT(request, { params }) {
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

    const contributor = await Contributor.findByIdAndUpdate(
      params.id,
      {
        name: name.trim(),
        avatar,
        bio: bio?.trim(),
        socialLinks,
      },
      { new: true, runValidators: true }
    );

    if (!contributor) {
      return NextResponse.json({ error: 'Contributor not found' }, { status: 404 });
    }

    return NextResponse.json(contributor);
  } catch (error) {
    console.error('Error updating contributor:', error);

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

/**
 * DELETE /api/admin/contributors/[id]
 * Delete a specific contributor
 */
export async function DELETE(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Check if contributor is used in any projects
    const projectsUsingContributor = await Project.countDocuments({
      'contributors.contributor': params.id,
    });

    if (projectsUsingContributor > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete contributor that is assigned to projects',
          projectsCount: projectsUsingContributor,
        },
        { status: 409 }
      );
    }

    const contributor = await Contributor.findByIdAndDelete(params.id);

    if (!contributor) {
      return NextResponse.json({ error: 'Contributor not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Contributor deleted successfully' });
  } catch (error) {
    console.error('Error deleting contributor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
