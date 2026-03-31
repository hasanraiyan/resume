import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Skill from '@/models/Skill';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const skills = await Skill.find({}).sort({ createdAt: -1 });

    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const {
      name,
      displayName,
      description,
      content,
      category,
      icon,
      color,
      adminOnly,
      isDefault,
      isActive,
      allowedTools,
      metadata,
    } = data;

    if (!name || !displayName || !description) {
      return NextResponse.json(
        { error: 'Name, displayName, and description are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const newSkill = new Skill({
      name,
      displayName,
      description,
      content: content || '',
      category: category || 'general',
      icon: icon || 'Wrench',
      color: color || 'purple-500',
      adminOnly: adminOnly ?? false,
      isDefault: isDefault ?? false,
      isActive: isActive ?? true,
      allowedTools: allowedTools || [],
      metadata: metadata || {},
    });

    await newSkill.save();

    return NextResponse.json({ skill: newSkill }, { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
