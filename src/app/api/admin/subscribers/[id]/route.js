import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Subscriber from '@/models/Subscriber';

/**
 * GET /api/admin/subscribers - Get all subscribers (admin only)
 * Returns paginated list of subscribers with optional filtering
 */
export async function GET(request) {
  try {
    // TODO: Add authentication check for admin access
    // For now, we'll assume admin access

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const source = searchParams.get('source') || 'all';

    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    if (source !== 'all') {
      query.source = source;
    }

    const subscribers = await Subscriber.find(query)
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Subscriber.countDocuments(query);

    // Serialize subscribers
    const serializedSubscribers = subscribers.map((subscriber) => ({
      id: subscriber._id.toString(),
      email: subscriber.email,
      name: subscriber.name,
      isActive: subscriber.isActive,
      source: subscriber.source,
      subscribedAt: subscriber.subscribedAt,
      unsubscribedAt: subscriber.unsubscribedAt,
      metadata: subscriber.metadata,
    }));

    return NextResponse.json({
      success: true,
      subscribers: serializedSubscribers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/subscribers/[id] - Delete a subscriber (admin only)
 * Removes a subscriber from the database
 */
export async function DELETE(request, { params }) {
  try {
    // TODO: Add authentication check for admin access

    await dbConnect();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Subscriber ID is required' },
        { status: 400 }
      );
    }

    const subscriber = await Subscriber.findByIdAndDelete(id);

    if (!subscriber) {
      return NextResponse.json({ success: false, error: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscriber deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/subscribers/[id] - Update subscriber status (admin only)
 * Updates subscriber's active status
 */
export async function PATCH(request, { params }) {
  try {
    // TODO: Add authentication check for admin access

    await dbConnect();

    const { id } = await params;
    const { isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Subscriber ID is required' },
        { status: 400 }
      );
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    const updateData = { isActive, updatedAt: new Date() }; // Add updatedAt timestamp

    if (!isActive) {
      updateData.unsubscribedAt = new Date();
    } else {
      // When reactivating, clear the unsubscribedAt field
      updateData.$unset = { unsubscribedAt: 1 };
    }

    const subscriber = await Subscriber.findByIdAndUpdate(id, updateData, { new: true });

    if (!subscriber) {
      return NextResponse.json({ success: false, error: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      subscriber: {
        id: subscriber._id.toString(),
        email: subscriber.email,
        name: subscriber.name,
        isActive: subscriber.isActive,
        source: subscriber.source,
        subscribedAt: subscriber.subscribedAt,
        unsubscribedAt: subscriber.unsubscribedAt,
      },
    });
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
