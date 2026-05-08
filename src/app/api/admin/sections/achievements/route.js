import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/money-auth';
import dbConnect from '@/lib/dbConnect';
import AchievementSection from '@/models/AchievementSection';

export async function GET(request) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await dbConnect();
    const data = await AchievementSection.getSettings();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Achievements API GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch achievements data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await dbConnect();
    const body = await request.json();

    let data = await AchievementSection.findOne();
    if (data) {
      Object.assign(data, body);
      await data.save();
    } else {
      data = await AchievementSection.create(body);
    }

    revalidatePath('/');

    return NextResponse.json({
      success: true,
      data,
      message: 'Achievements section updated successfully',
    });
  } catch (error) {
    console.error('[Achievements API POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update achievements data' },
      { status: 500 }
    );
  }
}
