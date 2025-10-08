import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    await dbConnect();

    // Check if slug exists (case-insensitive)
    const existingProject = await Project.findOne({
      slug: { $regex: `^${slug}$`, $options: 'i' },
    });

    return NextResponse.json({
      available: !existingProject,
      slug: slug,
    });
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
