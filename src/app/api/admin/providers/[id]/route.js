import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import ProviderSettings from '@/models/ProviderSettings';
import { encrypt } from '@/lib/crypto';
import { invalidateProviderModelCache } from '@/lib/providers/modelListCache';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const updates = await request.json();

    await dbConnect();

    if (updates.apiKey && updates.apiKey !== '***************') {
      updates.apiKey = encrypt(updates.apiKey);
    } else {
      delete updates.apiKey;
    }

    const updatedProvider = await ProviderSettings.findOneAndUpdate(
      { providerId: id },
      { $set: updates },
      { new: true }
    );

    if (!updatedProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    invalidateProviderModelCache(id);

    const sanitized = updatedProvider.toObject();
    sanitized.apiKey = sanitized.apiKey ? '***************' : '';

    return NextResponse.json({ provider: sanitized });
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();

    const deletedProvider = await ProviderSettings.findOneAndDelete({ providerId: id });
    if (!deletedProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    invalidateProviderModelCache(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
