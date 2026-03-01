import { NextResponse } from 'next/server';
import { getFrontendSafeMCPs } from '@/lib/mcpConfig';

/**
 * GET /api/mcps
 * Returns the list of available MCPs (IDs, names, descriptions)
 * It strips out the underlying connection URLs to keep API keys secure on the server.
 */
export async function GET() {
  try {
    const safeMCPs = await getFrontendSafeMCPs();
    return NextResponse.json(safeMCPs);
  } catch (error) {
    console.error('Error fetching MCPs:', error);
    return NextResponse.json({ error: 'Failed to fetch available tools' }, { status: 500 });
  }
}
