import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AppModel from '@/models/App';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    // Exclude content from the list view payload to save bandwidth
    const apps = await AppModel.find().select('-content').sort({ createdAt: -1 }).lean();
    return NextResponse.json({ apps });
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to fetch apps:', error);
    return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const body = await req.json();

    const app = await AppModel.create({
      name: body.name,
      description: body.description,
      content: body.content,
      type: body.type || 'manual',
      designSchema: body.designSchema || 'modern',
      icon: body.icon || 'Layout',
      isActive: true,
    });

    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to create app:', error);
    return NextResponse.json({ error: 'Failed to create app' }, { status: 500 });
  }
}
