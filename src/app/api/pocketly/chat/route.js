import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { requireAdminAuth } from '@/lib/money-auth';
import { createFinanceChatAGUIResponse } from '@/lib/finance-chat/aguiRoute';

import '@/lib/agents';

export async function POST(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  const rateLimitResponse = rateLimit(request, 10, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    return await createFinanceChatAGUIResponse(request, 'Finance Chat');
  } catch (error) {
    console.error('[Finance Chat] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
