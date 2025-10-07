import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    let query = {};

    if (featured === 'true') {
      query.featured = true;
    }

    if (category) {
      query.category = category;
    }

    let projectQuery = Project.find(query).sort({ createdAt: -1 });

    if (limit) {
      projectQuery = projectQuery.limit(parseInt(limit));
    }

    const projects = await projectQuery.lean();

    // Convert MongoDB _id to string for JSON serialization
    const serializedProjects = projects.map((project) => ({
      ...project,
      _id: project._id.toString(),
      id: project._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      projects: serializedProjects,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
