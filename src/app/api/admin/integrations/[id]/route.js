import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import IntegrationSettings from '@/models/IntegrationSettings';
import { encrypt } from '@/lib/crypto';

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

    // Sanitize credentials
    if (integration.credentials) {
      for (let key in integration.credentials) {
        integration.credentials[key] = '***************';
      }
    }

    return NextResponse.json({ integration });
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
    const { name, credentials, agentId, isActive } = data;

    await dbConnect();

    const integration = await IntegrationSettings.findOne({ integrationId });
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (name) integration.name = name;
    if (agentId) integration.agentId = agentId;
    if (typeof isActive !== 'undefined') integration.isActive = isActive;

    if (credentials) {
      // Correct way to update Mongoose Map to avoid casting errors
      for (const [key, value] of Object.entries(credentials)) {
        if (value && value !== '***************') {
          integration.credentials.set(key, encrypt(value));
        }
      }
    }

    await integration.save();

    const sanitized = integration.toObject();
    if (sanitized.credentials) {
      for (let key in sanitized.credentials) {
        sanitized.credentials[key] = '***************';
      }
    }

    return NextResponse.json({ integration: sanitized });
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
