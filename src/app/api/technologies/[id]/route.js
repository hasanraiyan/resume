import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Technology from '@/models/Technology';

/**
 * GET /api/technologies/[id] - Get a single technology
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const technology = await Technology.findById(id);

    if (!technology) {
      return NextResponse.json({ error: 'Technology not found' }, { status: 404 });
    }

    return NextResponse.json(technology);
  } catch (error) {
    console.error('Error fetching technology:', error);
    return NextResponse.json({ error: 'Failed to fetch technology' }, { status: 500 });
  }
}

/**
 * PUT /api/technologies/[id] - Update a technology
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const updatedTechnology = await Technology.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedTechnology) {
      return NextResponse.json({ error: 'Technology not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTechnology);
  } catch (error) {
    console.error('Error updating technology:', error);
    return NextResponse.json({ error: 'Failed to update technology' }, { status: 500 });
  }
}

/**
 * DELETE /api/technologies/[id] - Delete a technology
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const deletedTechnology = await Technology.findByIdAndDelete(id);

    if (!deletedTechnology) {
      return NextResponse.json({ error: 'Technology not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Technology deleted successfully' });
  } catch (error) {
    console.error('Error deleting technology:', error);
    return NextResponse.json({ error: 'Failed to delete technology' }, { status: 500 });
  }
}
