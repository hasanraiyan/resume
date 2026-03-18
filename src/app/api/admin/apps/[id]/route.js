import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AppModel from '@/models/App';
import { requireAdminSession } from '@/lib/auth/admin';

export async function GET(req, { params }) {
  try {
    await requireAdminSession();
    await dbConnect();
    const { id } = await params;

    const app = await AppModel.findById(id).lean();
    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json({ app });
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to fetch app:', error);
    return NextResponse.json({ error: 'Failed to fetch app' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await requireAdminSession();
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const app = await AppModel.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          description: body.description,
          content: body.content,
          icon: body.icon,
          designSchema: body.designSchema,
        },
      },
      { new: true, runValidators: true }
    );

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json({ app });
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to update app:', error);
    return NextResponse.json({ error: 'Failed to update app' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await requireAdminSession();
    await dbConnect();
    const { id } = await params;

    const app = await AppModel.findByIdAndDelete(id);
    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'App deleted successfully' });
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to delete app:', error);
    return NextResponse.json({ error: 'Failed to delete app' }, { status: 500 });
  }
}
