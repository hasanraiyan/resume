import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MediaAgentSettings from '@/models/MediaAgentSettings';
import ChatbotSettings from '@/models/ChatbotSettings';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    let settings = await MediaAgentSettings.findOne({});
    if (!settings) {
      settings = new MediaAgentSettings({});
      await settings.save();
    }

    // Self-healing: If stuck in processing for more than 10 minutes, reset it.
    if (settings.isProcessing && settings.processingStartedAt) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (settings.processingStartedAt < tenMinutesAgo) {
        console.log('[Self-Healing] Detected stuck processing state. Resetting...');
        settings.isProcessing = false;
        await settings.save();
      }
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching media agent settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await dbConnect();

    let settings = await MediaAgentSettings.findOne({});
    if (settings) {
      settings.set(body);
      await settings.save();
    } else {
      settings = new MediaAgentSettings(body);
      await settings.save();
    }

    return NextResponse.json({ message: 'Settings saved successfully', settings });
  } catch (error) {
    console.error('Error saving media agent settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
