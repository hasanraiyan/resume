import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import dbConnect from '@/lib/dbConnect';
import SkillsSection from '@/models/SkillsSection';

export async function GET(request) {
  const authResult = await requireAdminAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();

  try {
    const settings = await SkillsSection.getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills settings' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const authResult = await requireAdminAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();

  try {
    const body = await request.json();
    const { title, description } = body;

    const settings = await SkillsSection.getSettings();

    if (title !== undefined) settings.title = title;
    if (description !== undefined) settings.description = description;

    await settings.save();

    return NextResponse.json({ message: 'Skills settings saved successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to save skills settings' }, { status: 500 });
  }
}
