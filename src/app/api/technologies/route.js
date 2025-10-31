import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Technology from '@/models/Technology';

/**
 * GET /api/technologies
 * Retrieves all active technologies sorted by display order
 */
export async function GET() {
  try {
    await dbConnect();

    const technologies = await Technology.find({ isActive: true }).sort({ displayOrder: 1 }).lean();

    return NextResponse.json(technologies);
  } catch (error) {
    console.error('Error fetching technologies:', error);
    return NextResponse.json({ error: 'Failed to fetch technologies' }, { status: 500 });
  }
}

/**
 * POST /api/technologies
 * Creates a new technology (admin use)
 */
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const technology = new Technology(body);
    const savedTechnology = await technology.save();

    return NextResponse.json(savedTechnology, { status: 201 });
  } catch (error) {
    console.error('Error creating technology:', error);
    return NextResponse.json({ error: 'Failed to create technology' }, { status: 500 });
  }
}
