import { getShareByToken } from '@/lib/apps/drively/service/service';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { token } = await params;

  try {
    const share = await getShareByToken(token);

    if (!share) {
      return new NextResponse('Link expired or invalid', { status: 404 });
    }

    return NextResponse.redirect(share.fileId.secureUrl, 302);
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
