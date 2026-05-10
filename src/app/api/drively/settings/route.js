import { requireAdminAuth } from '@/lib/money-auth';
import { getDrivelySettings, updateDrivelySettings } from '@/lib/apps/drively/service/service';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = await getDrivelySettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const settings = await updateDrivelySettings(body);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
