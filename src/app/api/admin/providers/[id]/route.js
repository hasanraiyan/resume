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
      const newEncrypted = encrypt(updates.apiKey);

      if (updates.appendKeys) {
        const existing = await ProviderSettings.findOne({ providerId: id });
        if (existing && existing.apiKey) {
          const oldKeys = Array.isArray(existing.apiKey) ? existing.apiKey : [existing.apiKey];
          const addedKeys = Array.isArray(newEncrypted) ? newEncrypted : [newEncrypted];
          // Merge old (already encrypted) with new (now encrypted)
          updates.apiKey = [...oldKeys, ...addedKeys];
        } else {
          updates.apiKey = newEncrypted;
        }
      } else {
        updates.apiKey = newEncrypted;
      }
    } else {
      delete updates.apiKey;
    }

    // Clean up internal flags before saving to DB
    delete updates.appendKeys;

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
    if (Array.isArray(sanitized.apiKey)) {
      sanitized.apiKey = `${sanitized.apiKey.length} Keys (Pooled)`;
    } else {
      sanitized.apiKey = sanitized.apiKey ? '***************' : '';
    }

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
