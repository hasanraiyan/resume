import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import ProviderSettings from '@/models/ProviderSettings';
import { encrypt, decrypt } from '@/lib/crypto';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const providers = await ProviderSettings.find({}).sort({ createdAt: -1 });

    // Send dummy API keys to the frontend for security, or keep them empty
    const sanitizedProviders = providers.map((p) => {
      const pObj = p.toObject();
      pObj.apiKey = pObj.apiKey ? '***************' : '';
      return pObj;
    });

    return NextResponse.json({ providers: sanitizedProviders });
  } catch (error) {
    console.error('Error fetching providers:', error);
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
    const { name, baseUrl, apiKey, isActive, supportsTools } = data;

    if (!name || !baseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Name, baseUrl, and apiKey are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const providerId = `provider-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const encryptedKey = encrypt(apiKey);

    const newProvider = new ProviderSettings({
      providerId,
      name,
      baseUrl,
      apiKey: encryptedKey,
      isActive: isActive ?? true,
      supportsTools: supportsTools ?? true,
    });

    await newProvider.save();

    const sanitized = newProvider.toObject();
    sanitized.apiKey = '***************';

    return NextResponse.json({ provider: sanitized }, { status: 201 });
  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
