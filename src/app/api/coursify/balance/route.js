import { NextResponse } from 'next/server';
import { getPollinationsBalance } from '@/lib/pollinations-balance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const balanceData = await getPollinationsBalance();
    return NextResponse.json(balanceData);
  } catch (error) {
    console.error('[CoursifyBalanceAPI] Error:', error);
    return NextResponse.json(
      { balance: 0, status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
