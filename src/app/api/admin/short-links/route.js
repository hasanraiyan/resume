import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import ShortLink from '@/models/ShortLink';
import LinkClick from '@/models/LinkClick';

// --- GET All Short Links ---
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Fetch latest first
    const links = await ShortLink.find({}).sort({ createdAt: -1 }).lean();

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
    const { slug, destination, title, description, tags, expiresAt, isActive } = data;

    if (!slug || !destination) {
      return NextResponse.json({ error: 'Slug and Destination are required' }, { status: 400 });
    }

    if (slug.length > 50) {
      return NextResponse.json({ error: 'Slug cannot exceed 50 characters' }, { status: 400 });
    }

    await dbConnect();

    // Check if slug exists
    const existing = await ShortLink.findOne({ slug: slug.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    const newLink = await ShortLink.create({
      slug: slug.toLowerCase(),
      destination,
      title,
      description,
      tags: Array.isArray(tags) ? tags : [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: session.user.id || null, // Optional tracking of admin
    });

    return NextResponse.json({ success: true, data: newLink }, { status: 201 });
  } catch (error) {
    console.error('Error creating short link:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');
      return NextResponse.json({ error: `Validation Error: ${messages}` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const { id, slug, destination, title, description, tags, expiresAt, isActive } = data;

    if (!id || !destination) {
      return NextResponse.json({ error: 'ID and Destination are required' }, { status: 400 });
    }

    if (slug && slug.length > 50) {
      return NextResponse.json({ error: 'Slug cannot exceed 50 characters' }, { status: 400 });
    }

    await dbConnect();

    // If they changed the slug, check uniqueness
    if (slug) {
      const existing = await ShortLink.findOne({ slug: slug.toLowerCase(), _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: 'New slug already exists' }, { status: 409 });
      }
    }

    const updateData = {
      destination,
      title,
      description,
      tags: Array.isArray(tags) ? tags : [],
      isActive: isActive !== undefined ? isActive : true,
    };

    // Explicitly handle nulling out dates
    updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (slug) updateData.slug = slug.toLowerCase();

    const updatedLink = await ShortLink.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedLink) {
      return NextResponse.json({ error: 'Short link not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedLink });
  } catch (error) {
    console.error('Error updating short link:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');
      return NextResponse.json({ error: `Validation Error: ${messages}` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    await dbConnect();

    const link = await ShortLink.findById(id);
    if (!link) {
      return NextResponse.json({ error: 'Short link not found' }, { status: 404 });
    }

    // Optional: Could cascade delete click analytics to save space
    await LinkClick.deleteMany({ shortLink: id });

    await ShortLink.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Short link deleted' });
  } catch (error) {
    console.error('Error deleting short link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
