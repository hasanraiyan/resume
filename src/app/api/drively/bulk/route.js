import { requireAdminAuth } from '@/lib/money-auth';
import { executeBulkAction } from '@/lib/apps/drively/service/service';
import { BulkActionSchema } from '@/lib/apps/drively/service/validators';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validated = BulkActionSchema.parse(body);
    await executeBulkAction(validated);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
