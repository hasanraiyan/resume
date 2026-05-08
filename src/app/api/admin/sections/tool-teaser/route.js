import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import dbConnect from '@/lib/dbConnect';
import ToolTeaserSection from '@/models/ToolTeaserSection';

export async function GET(request) {
  const authResult = await requireAdminAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();

  try {
    const settings = await ToolTeaserSection.getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('[Tool Teaser API GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tool teaser settings' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const authResult = await requireAdminAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();

  const body = await request.json();
  const {
    imageAiTitle,
    imageAiDescription,
    imageAiPlaceholder,
    imageAiButtonText,
    imageAiButtonLink,
  } = body;

  const existing = await ToolTeaserSection.findOne();

  if (existing) {
    existing.imageAiTitle = imageAiTitle;
    existing.imageAiDescription = imageAiDescription;
    existing.imageAiPlaceholder = imageAiPlaceholder;
    existing.imageAiButtonText = imageAiButtonText;
    existing.imageAiButtonLink = imageAiButtonLink;
    await existing.save();
  } else {
    await ToolTeaserSection.create({
      imageAiTitle,
      imageAiDescription,
      imageAiPlaceholder,
      imageAiButtonText,
      imageAiButtonLink,
    });
  }

  return NextResponse.json({ message: 'Settings saved successfully' });
}
