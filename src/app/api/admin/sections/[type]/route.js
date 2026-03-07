import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Import all section models
import AboutSection from '@/models/AboutSection';
import SkillsSection from '@/models/SkillsSection';
import ServiceSection from '@/models/ServiceSection';
import StatsSection from '@/models/StatsSection';
import TestimonialSection from '@/models/TestimonialSection';
import ProjectSection from '@/models/ProjectSection';
import AchievementSection from '@/models/AchievementSection';
import ToolTeaserSection from '@/models/ToolTeaserSection';

const modelMap = {
  about: AboutSection,
  skills: SkillsSection,
  services: ServiceSection,
  stats: StatsSection,
  testimonials: TestimonialSection,
  projects: ProjectSection,
  achievements: AchievementSection,
  'tool-teaser': ToolTeaserSection,
};

export async function GET(request, { params }) {
  try {
    const { type } = await params;
    const Model = modelMap[type];

    if (!Model) {
      return NextResponse.json({ success: false, error: 'Invalid section type' }, { status: 400 });
    }

    await dbConnect();
    const data = await Model.getSettings();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(`[Sections API GET] Error for ${params.type}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch section data' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await params;
    const Model = modelMap[type];

    if (!Model) {
      return NextResponse.json({ success: false, error: 'Invalid section type' }, { status: 400 });
    }

    await dbConnect();
    const body = await request.json();

    let data = await Model.findOne();
    if (data) {
      Object.assign(data, body);
      await data.save();
    } else {
      data = await Model.create(body);
    }

    return NextResponse.json({
      success: true,
      data,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} section updated successfully`,
    });
  } catch (error) {
    console.error(`[Sections API PUT] Error for ${params.type}:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to update section data' },
      { status: 500 }
    );
  }
}
