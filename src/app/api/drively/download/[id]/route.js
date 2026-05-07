import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DrivelyFile from '@/models/DrivelyFile';

export async function GET(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;
    const file = await DrivelyFile.findById(id);

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const cloudinaryRes = await fetch(file.secureUrl);
    if (!cloudinaryRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch file from storage' }, { status: 502 });
    }

    const filename = encodeURIComponent(file.filename);
    return new NextResponse(cloudinaryRes.body, {
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
