import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Skill from '@/models/Skill';

/**
 * GET /api/skills/[id] - Get a single skill
 */
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const skill = await Skill.findById(id);

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json(skill);
  } catch (error) {
    console.error('Error fetching skill:', error);
    return NextResponse.json({ error: 'Failed to fetch skill' }, { status: 500 });
  }
}

/**
 * PUT /api/skills/[id] - Update a skill
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const updatedSkill = await Skill.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSkill);
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

/**
 * DELETE /api/skills/[id] - Delete a skill
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const deletedSkill = await Skill.findByIdAndDelete(id);

    if (!deletedSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}
