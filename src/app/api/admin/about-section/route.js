import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/dbConnect';
import AboutSection from '@/models/AboutSection';

export async function GET() {
  await dbConnect();
  try {
    const aboutData = await AboutSection.getSettings();
    return NextResponse.json(aboutData);
  } catch (error) {
    console.error('Error fetching about section:', error);
    return NextResponse.json({ error: 'Failed to fetch about section' }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.sectionTitle) {
      return NextResponse.json({ error: 'Section title is required' }, { status: 400 });
    }

    // Find existing about section or create new one
    let aboutSection = await AboutSection.findOne({ isActive: true });

    if (aboutSection) {
      // Update existing
      aboutSection.sectionTitle = data.sectionTitle;
      aboutSection.bio = data.bio || { paragraphs: [''] };
      aboutSection.resume = data.resume || { text: 'Download Resume', url: '#' };
      aboutSection.features = data.features || [];
      aboutSection.isActive = data.isActive !== false;

      await aboutSection.save();
    } else {
      // Create new
      aboutSection = await AboutSection.create({
        sectionTitle: data.sectionTitle,
        bio: data.bio || { paragraphs: [''] },
        resume: data.resume || { text: 'Download Resume', url: '#' },
        features: data.features || [],
        isActive: data.isActive !== false,
      });
    }

    revalidatePath('/');

    return NextResponse.json({
      success: true,
      message: 'About section saved successfully',
      data: aboutSection,
    });
  } catch (error) {
    console.error('Error saving about section:', error);
    return NextResponse.json({ error: 'Failed to save about section' }, { status: 500 });
  }
}

export async function DELETE() {
  await dbConnect();
  try {
    // Soft delete by setting isActive to false
    const aboutSection = await AboutSection.findOne({ isActive: true });

    if (aboutSection) {
      aboutSection.isActive = false;
      await aboutSection.save();
    }

    revalidatePath('/');

    return NextResponse.json({
      success: true,
      message: 'About section deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting about section:', error);
    return NextResponse.json({ error: 'Failed to delete about section' }, { status: 500 });
  }
}
