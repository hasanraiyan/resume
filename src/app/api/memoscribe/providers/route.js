import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import ProviderSettings from '@/models/ProviderSettings';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    // Only return IDs and Names of active providers for non-admin selection
    const providers = await ProviderSettings.find({ isActive: true })
      .select('providerId name')
      .lean();

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error in GET /api/memoscribe/providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
