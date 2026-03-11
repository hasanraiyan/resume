import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import IntegrationSettings from '@/models/IntegrationSettings';
import {
  REDACTED_CREDENTIAL_VALUE,
  decryptSensitiveIntegrationCredentials,
  encryptSensitiveIntegrationCredentials,
  generateTelegramAuthCode,
  integrationMapToObject,
  integrationMetadataToObject,
  normalizeTelegramAuthorizedChats,
  sanitizeIntegrationForAdmin,
} from '@/lib/integrations/credentials';

function normalizeIntegrationMetadata(metadata = {}) {
  return {
    ...metadata,
    authorizedChats: normalizeTelegramAuthorizedChats(metadata.authorizedChats),
  };
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: integrationId } = await params;
    await dbConnect();

    const integration = await IntegrationSettings.findOne({ integrationId }).lean();
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ integration: sanitizeIntegrationForAdmin(integration) });
  } catch (error) {
    console.error('Error fetching integration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: integrationId } = await params;
    const data = await request.json();
    const { name, credentials, agentId, isActive, metadata, regenerateTelegramAuthToken } = data;

    await dbConnect();

    const integration = await IntegrationSettings.findOne({ integrationId });
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (name) integration.name = name;
    if (agentId) integration.agentId = agentId;
    if (typeof isActive !== 'undefined') integration.isActive = isActive;

    const existingCredentials = integrationMapToObject(integration.credentials);
    const decryptedExistingCredentials =
      decryptSensitiveIntegrationCredentials(existingCredentials);
    const requestedCredentials = integrationMapToObject(credentials);
    const nextMetadata = normalizeIntegrationMetadata(
      metadata !== undefined ? metadata : integrationMetadataToObject(integration.metadata)
    );

    const shouldGenerateTelegramAuthToken =
      integration.platform === 'telegram' &&
      (regenerateTelegramAuthToken ||
        (!decryptedExistingCredentials.telegramAuthToken &&
          !requestedCredentials.telegramAuthToken));

    if (credentials || shouldGenerateTelegramAuthToken) {
      if (shouldGenerateTelegramAuthToken) {
        requestedCredentials.telegramAuthToken = generateTelegramAuthCode();
      }

      const encryptedCredentials = encryptSensitiveIntegrationCredentials(
        Object.fromEntries(
          Object.entries(requestedCredentials).filter(
            ([, value]) => value && value !== REDACTED_CREDENTIAL_VALUE
          )
        )
      );

      if (!integration.credentials?.set) {
        integration.credentials = existingCredentials;
      }

      for (const [key, value] of Object.entries(encryptedCredentials)) {
        if (integration.credentials?.set) {
          integration.credentials.set(key, value);
        } else {
          integration.credentials[key] = value;
        }
      }

      const nextTelegramAuthToken = requestedCredentials.telegramAuthToken;
      if (
        integration.platform === 'telegram' &&
        nextTelegramAuthToken &&
        nextTelegramAuthToken !== REDACTED_CREDENTIAL_VALUE &&
        nextTelegramAuthToken !== decryptedExistingCredentials.telegramAuthToken
      ) {
        nextMetadata.authorizedChats = [];
      }
    }

    integration.metadata = nextMetadata;
    await integration.save();

    return NextResponse.json({ integration: sanitizeIntegrationForAdmin(integration) });
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: integrationId } = await params;

    await dbConnect();

    const deletedIntegration = await IntegrationSettings.findOneAndDelete({ integrationId });

    if (!deletedIntegration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Integration deleted successfully' });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
