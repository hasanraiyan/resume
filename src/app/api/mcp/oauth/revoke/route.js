import { NextResponse } from 'next/server';
import { revokeAccessToken } from '@/lib/mcp/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const form = await request.formData();
  const token = form.get('token');

  if (token) {
    await revokeAccessToken(token);
  }

  return new NextResponse(null, { status: 200 });
}
