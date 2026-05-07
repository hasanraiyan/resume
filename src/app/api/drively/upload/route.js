import { requireAdminAuth } from '@/lib/money-auth';
import { uploadFile } from '@/lib/apps/drively/service/service';
import { rateLimit } from '@/lib/rateLimit';
import { NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Rate limit: 20 uploads per minute
  const rl = rateLimit(request, 20, 60000);
  if (rl) return rl;

  try {
    const formData = await request.formData();
    const files = formData.getAll('file');
    const folderId = formData.get('folderId');

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
    }

    const results = [];
    for (const file of files) {
      // Basic size validation
      if (file.size > 50 * 1024 * 1024) {
        throw new Error(`File ${file.name} exceeds 50MB limit`);
      }
      const uploaded = await uploadFile(file, folderId);
      results.push(uploaded);
    }

    return NextResponse.json({ success: true, files: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
