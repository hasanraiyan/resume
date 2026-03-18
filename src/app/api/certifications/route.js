import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Certification from '@/models/Certification';
import { requireAdminSession } from '@/lib/auth/admin';

/**
 * GET /api/certifications
 * Retrieves all active certifications sorted by display order
 */
export async function GET() {
  try {
    await dbConnect();

    const certifications = await Certification.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    return NextResponse.json(certifications);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }
}

/**
 * POST /api/certifications
 * Creates a new certification (admin use)
 */
export async function POST(request) {
  try {
    const adminSession = await requireAdminSession();
    if (adminSession instanceof NextResponse) return adminSession;

    await dbConnect();

    const body = await request.json();
    const certification = new Certification(body);
    const savedCertification = await certification.save();

    return NextResponse.json(savedCertification, { status: 201 });
  } catch (error) {
    console.error('Error creating certification:', error);
    return NextResponse.json({ error: 'Failed to create certification' }, { status: 500 });
  }
}
