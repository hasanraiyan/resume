import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import StatsSection from '@/models/StatsSection';
import { requireAdminAuth } from '@/lib/money-auth';

export async function GET(request) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();
    const settings = await StatsSection.getSettings();

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('[StatsSection GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats section' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();
    const body = await request.json();

    let settings = await StatsSection.findOne({ isActive: true });

    if (!settings) {
      settings = await StatsSection.create(body);
    } else {
      settings = await StatsSection.findByIdAndUpdate(
        settings._id,
        { $set: body },
        { new: true, runValidators: true }
      );
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('[StatsSection POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update stats section' },
      { status: 500 }
    );
  }
}
