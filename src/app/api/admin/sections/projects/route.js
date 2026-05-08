import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/money-auth';
import dbConnect from '@/lib/dbConnect';
import ProjectSection from '@/models/ProjectSection';

export async function GET(request) {
  try {
    const adminAuth = await requireAdminAuth(request);
    if (adminAuth instanceof NextResponse) return adminAuth;

    await dbConnect();
    const data = await ProjectSection.getSettings();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Projects Section API GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects section data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const adminAuth = await requireAdminAuth(request);
    if (adminAuth instanceof NextResponse) return adminAuth;

    await dbConnect();
    const body = await request.json();

    let data = await ProjectSection.findOne();
    if (data) {
      Object.assign(data, body);
      await data.save();
    } else {
      data = await ProjectSection.create(body);
    }

    revalidatePath('/');

    return NextResponse.json({
      success: true,
      data,
      message: 'Projects section updated successfully',
    });
  } catch (error) {
    console.error('[Projects Section API POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update projects section data' },
      { status: 500 }
    );
  }
}
