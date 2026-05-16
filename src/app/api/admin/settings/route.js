import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import DynamicSettings from '@/models/DynamicSettings';
import dynamicSettingsManager from '@/lib/DynamicSettingsManager';

/**
 * GET /api/admin/settings
 * Fetch all dynamic settings (values masked for security)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const settings = await DynamicSettings.find({}).sort({ key: 1 });

  // Mask sensitive values
  const sanitized = settings.map((s) => ({
    key: s.key,
    description: s.description,
    isEncrypted: s.isEncrypted,
    value: s.isEncrypted ? '***************' : s.value,
  }));

  return NextResponse.json({ settings: sanitized });
}

/**
 * POST /api/admin/settings
 * Update or create a dynamic setting
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { key, value, description, isEncrypted } = await request.json();

    if (!key || !value) {
      return NextResponse.json({ error: 'Key and Value are required' }, { status: 400 });
    }

    await dynamicSettingsManager.set(key, value, description, isEncrypted);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Settings API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
