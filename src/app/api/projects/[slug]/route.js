/**
 * @fileoverview Individual Project API route for CRUD operations on specific projects.
 * Handles fetching, updating, and deleting individual projects by slug or MongoDB ObjectId.
 * Supports both slug-based and ID-based project identification for maximum flexibility.
 *
 * @description This API endpoint provides:
 * - GET: Retrieve individual project details by slug or ID
 * - PUT: Update project information (admin only)
 * - DELETE: Remove projects from the database (admin only)
 *
 * The endpoint intelligently handles both slug-based URLs (e.g., /projects/my-project)
 * and MongoDB ObjectId-based URLs for admin operations, providing flexible
 * project identification and comprehensive error handling.
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { slug } = await params;
    console.log('API: Received parameter:', slug);

    let project;

    // Check if it's a MongoDB ObjectId (24 hex characters) or a slug
    if (/^[0-9a-fA-F]{24}$/.test(slug)) {
      console.log('Searching by ObjectId:', slug);
      project = await Project.findById(slug).populate('contributors.contributor').lean();
    } else {
      console.log('Searching by slug:', slug);
      project = await Project.findOne({ slug }).populate('contributors.contributor').lean();
    }

    console.log('Project found:', project ? 'Yes' : 'No');

    if (!project) {
      // For debugging, show some sample projects
      const allProjects = await Project.find({}, '_id title slug').limit(5).lean();
      console.log('Sample projects in database:', allProjects);

      return NextResponse.json(
        { success: false, message: 'Project not found', sampleProjects: allProjects },
        { status: 404 }
      );
    }

    // Sort contributors by order
    if (project.contributors) {
      project.contributors.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // Convert MongoDB _id to string for JSON serialization
    const serializedProject = {
      ...project,
      _id: project._id.toString(),
      id: project._id.toString(),
    };

    return NextResponse.json({
      success: true,
      project: serializedProject,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { slug } = await params;
    const body = await request.json();

    let updatedProject;

    // Check if it's a MongoDB ObjectId or a slug
    if (/^[0-9a-fA-F]{24}$/.test(slug)) {
      updatedProject = await Project.findByIdAndUpdate(slug, body, {
        new: true,
        runValidators: true,
      }).lean();
    } else {
      updatedProject = await Project.findOneAndUpdate({ slug }, body, {
        new: true,
        runValidators: true,
      }).lean();
    }

    if (!updatedProject) {
      return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });
    }

    // Convert MongoDB _id to string for JSON serialization
    const serializedProject = {
      ...updatedProject,
      _id: updatedProject._id.toString(),
      id: updatedProject._id.toString(),
    };

    return NextResponse.json({
      success: true,
      project: serializedProject,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { slug } = await params;
    let deletedProject;

    // Check if it's a MongoDB ObjectId or a slug
    if (/^[0-9a-fA-F]{24}$/.test(slug)) {
      deletedProject = await Project.findByIdAndDelete(slug);
    } else {
      deletedProject = await Project.findOneAndDelete({ slug });
    }

    if (!deletedProject) {
      return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
