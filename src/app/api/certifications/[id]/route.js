import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Certification from '@/models/Certification';

/**
 * GET /api/certifications/[id] - Get a single certification
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const certification = await Certification.findById(id);

    if (!certification) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    return NextResponse.json(certification);
  } catch (error) {
    console.error('Error fetching certification:', error);
    return NextResponse.json({ error: 'Failed to fetch certification' }, { status: 500 });
  }
}

/**
 * PUT /api/certifications/[id] - Update a certification
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const updatedCertification = await Certification.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedCertification) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCertification);
  } catch (error) {
    console.error('Error updating certification:', error);
    return NextResponse.json({ error: 'Failed to update certification' }, { status: 500 });
  }
}

/**
 * DELETE /api/certifications/[id] - Delete a certification
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const deletedCertification = await Certification.findByIdAndDelete(id);

    if (!deletedCertification) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    console.error('Error deleting certification:', error);
    return NextResponse.json({ error: 'Failed to delete certification' }, { status: 500 });
  }
}
