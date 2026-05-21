import { NextResponse } from 'next/server';
import { runPocketlyReminder } from '@/lib/apps/pocketly/reminder';

function authorizeCron(request) {
  const expected = process.env.CRON_SECRET || process.env.CRON_API_KEY;
  const authHeader = request.headers.get('authorization');

  if (!expected) {
    return process.env.NODE_ENV !== 'production';
  }

  return authHeader === `Bearer ${expected}`;
}

export async function GET(request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runPocketlyReminder({ request });
    return NextResponse.json(result, { status: result.status || 200 });
  } catch (error) {
    console.error('[PocketlyReminderCron] Failed to run reminder:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to run Pocketly reminder' },
      { status: 500 }
    );
  }
}
