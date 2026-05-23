import { NextResponse } from 'next/server';
import dynamicSettingsManager from '@/lib/DynamicSettingsManager';

export async function GET() {
  const totpSecret = await dynamicSettingsManager.get('TOTP_SECRET', process.env.TOTP_SECRET);
  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return NextResponse.json({
    totpEnabled: !!totpSecret,
    googleEnabled,
  });
}
