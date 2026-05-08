import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import dbConnect from '@/lib/dbConnect';
import TestimonialSection from '@/models/TestimonialSection';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  await dbConnect();

  try {
    const settings = await TestimonialSection.getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('[Testimonials API GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonials data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  await dbConnect();

  const body = await request.json();
  const { title, description } = body;

  const settings = await TestimonialSection.getSettings();

  if (title !== undefined) settings.title = title;
  if (description !== undefined) settings.description = description;

  await settings.save();

  return NextResponse.json({ message: 'Testimonials section updated successfully' });
}
