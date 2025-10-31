import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Skill from '@/models/Skill';

/**
 * GET /api/skills
 * Retrieves all active skills sorted by display order
 */
export async function GET() {
  try {
    await dbConnect();

    const skills = await Skill.find({ isActive: true }).sort({ displayOrder: 1 }).lean();

    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

/**
 * POST /api/skills
 * Creates a new skill (admin use)
 */
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const skill = new Skill(body);
    const savedSkill = await skill.save();

    return NextResponse.json(savedSkill, { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
