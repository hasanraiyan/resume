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

    // Redirect the browser directly to the Cloudinary URL.
    // The browser makes the request itself (with proper headers), so Cloudinary
    // serves it without blocking. For raw/upload URLs (new uploads) the browser
    // downloads the original file; for image/upload PDFs (old uploads) the browser
    // opens the PDF viewer.
    return NextResponse.redirect(file.secureUrl, 302);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
