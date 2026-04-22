import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAnalyticsOverview } from '@/lib/apps/snaplinks/service/service';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug'); // Optional: filter by specific link
    const days = parseInt(searchParams.get('days') || '30', 10);

    const stats = await getAnalyticsOverview({ slug, days });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Short link analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
