import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import IntegrationSettings from '@/models/IntegrationSettings';
import { encrypt, decrypt } from '@/lib/crypto';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const integrations = await IntegrationSettings.find({}).sort({ createdAt: -1 });

    // Sanitize credentials
    const sensitiveFields = ['botToken', 'accessToken', 'phoneNumberId', 'verifyToken'];
    const sanitizedIntegrations = integrations.map((i) => {
      const iObj = i.toObject();
      if (iObj.credentials) {
        // Only redact sensitive values
        for (let key in iObj.credentials) {
          if (sensitiveFields.includes(key)) {
            iObj.credentials[key] = '***************';
          }
        }
      }
      return iObj;
    });

    return NextResponse.json({ integrations: sanitizedIntegrations });
  } catch (error) {
    console.error('Error fetching integrations:', error);
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
    const { platform, name, credentials, agentId, isActive } = data;

    if (!platform || !name || !credentials || !agentId) {
      return NextResponse.json(
        { error: 'Platform, name, credentials, and agentId are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const integrationId = `integration-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Encrypt sensitive credential values
    const encryptedCredentials = {};
    const sensitiveFields = ['botToken', 'accessToken', 'phoneNumberId', 'verifyToken'];
    for (const [key, value] of Object.entries(credentials)) {
      if (value) {
        encryptedCredentials[key] = sensitiveFields.includes(key) ? encrypt(value) : value;
      }
    }

    const newIntegration = new IntegrationSettings({
      integrationId,
      platform,
      name,
      credentials: encryptedCredentials,
      agentId,
      isActive: isActive ?? true,
    });

    await newIntegration.save();

    const sanitized = newIntegration.toObject();
    if (sanitized.credentials) {
      const sensitiveFields = ['botToken', 'accessToken', 'phoneNumberId', 'verifyToken'];
      for (let key in sanitized.credentials) {
        if (sensitiveFields.includes(key)) {
          sanitized.credentials[key] = '***************';
        }
      }
    }

    return NextResponse.json({ integration: sanitized }, { status: 201 });
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
