import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AppModel from '@/models/App';
import { requireAdminSession } from '@/lib/auth/admin';

export async function GET(req) {
  try {
    await requireAdminSession();
    await dbConnect();
    const apps = await AppModel.find().sort({ createdAt: -1 }).lean();
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
    await requireAdminSession();
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
