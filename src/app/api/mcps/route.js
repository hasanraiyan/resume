import { NextResponse } from 'next/server';
import { getFrontendSafeMCPs } from '@/lib/mcpConfig';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/mcps
 * Returns the list of available MCPs (IDs, names, descriptions)
 * It strips out the underlying connection URLs to keep API keys secure on the server.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';
    const safeMCPs = await getFrontendSafeMCPs(isAdmin);
    return NextResponse.json(safeMCPs);
  } catch (error) {
    console.error('Error fetching MCPs:', error);
    return NextResponse.json({ error: 'Failed to fetch available tools' }, { status: 500 });
  }
}
