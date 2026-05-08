import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import SiteConfig from '@/models/SiteConfig';
import { requireAdminAuth } from '@/lib/money-auth';

export async function GET(request) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();
    const config = await SiteConfig.getSettings();

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('[SiteConfig GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch site config' },
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

    let config = await SiteConfig.findOne({ isActive: true });

    if (!config) {
      config = await SiteConfig.create(body);
    } else {
      config = await SiteConfig.findByIdAndUpdate(
        config._id,
        { $set: body },
        { new: true, runValidators: true }
      );
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('[SiteConfig POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update site config' },
      { status: 500 }
    );
  }
}
