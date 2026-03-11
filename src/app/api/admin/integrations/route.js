import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import IntegrationSettings from '@/models/IntegrationSettings';
import crypto from 'crypto';
import {
  generateTelegramAuthCode,
  encryptSensitiveIntegrationCredentials,
  normalizeTelegramAuthorizedChats,
  sanitizeIntegrationForAdmin,
} from '@/lib/integrations/credentials';

function normalizeIntegrationMetadata(metadata = {}) {
  return {
    ...metadata,
    authorizedChats: normalizeTelegramAuthorizedChats(metadata.authorizedChats),
  };
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const integrations = await IntegrationSettings.find({}).sort({ createdAt: -1 });
    const sanitizedIntegrations = integrations.map((integration) =>
      sanitizeIntegrationForAdmin(integration)
    );

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
    const { platform, name, credentials, agentId, isActive, metadata } = data;

    if (!platform || !name || !credentials || !agentId) {
      return NextResponse.json(
        { error: 'Platform, name, credentials, and agentId are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const integrationId = `integration-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const nextCredentials = { ...credentials };

    if (platform === 'telegram' && !nextCredentials.telegramAuthToken) {
      nextCredentials.telegramAuthToken = generateTelegramAuthCode();
    }

    const newIntegration = new IntegrationSettings({
      integrationId,
      platform,
      name,
      credentials: encryptSensitiveIntegrationCredentials(nextCredentials),
      agentId,
      isActive: isActive ?? true,
      metadata: normalizeIntegrationMetadata(metadata || {}),
    });

    await newIntegration.save();
    return NextResponse.json(
      { integration: sanitizeIntegrationForAdmin(newIntegration) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
