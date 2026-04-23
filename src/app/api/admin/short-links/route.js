import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  listLinks,
  createLink,
  updateLink,
  deleteLink,
} from '@/lib/apps/snaplinks/service/service';

// --- GET All Short Links ---
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const links = await listLinks();

    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    console.error('Error fetching short links:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// --- POST Create New Short Link ---
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Add createdBy from session
    const payload = {
      ...data,
      createdBy: session.user.id || null,
    };

    const newLink = await createLink(payload);

    return NextResponse.json({ success: true, data: newLink }, { status: 201 });
  } catch (error) {
    console.error('Error creating short link:', error);
    if (error.name === 'ZodError') {
      const messages = error.errors.map((err) => err.message).join(', ');
      return NextResponse.json({ error: `Validation Error: ${messages}` }, { status: 400 });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');
      return NextResponse.json({ error: `Validation Error: ${messages}` }, { status: 400 });
    }
    if (error.message === 'Slug already exists') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      {
        status:
          error.message?.includes('exceed') || error.message?.includes('Invalid slug') ? 400 : 500,
      }
    );
  }
}

// --- PUT Update Existing Short Link ---
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updatedLink = await updateLink(id, data);

    return NextResponse.json({ success: true, data: updatedLink });
  } catch (error) {
    console.error('Error updating short link:', error);
    if (error.name === 'ZodError') {
      const messages = error.errors.map((err) => err.message).join(', ');
      return NextResponse.json({ error: `Validation Error: ${messages}` }, { status: 400 });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');
      return NextResponse.json({ error: `Validation Error: ${messages}` }, { status: 400 });
    }
    if (error.message === 'New slug already exists') {
      return NextResponse.json({ error: 'New slug already exists' }, { status: 409 });
    }
    if (error.message === 'Short link not found') {
      return NextResponse.json({ error: 'Short link not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// --- DELETE Short Link ---
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await deleteLink(id);

    return NextResponse.json({ success: true, message: 'Short link deleted' });
  } catch (error) {
    console.error('Error deleting short link:', error);
    if (error.message === 'Short link not found') {
      return NextResponse.json({ error: 'Short link not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
