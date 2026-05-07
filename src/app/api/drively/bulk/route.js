import { requireAdminAuth } from '@/lib/money-auth';
import { executeBulkAction, ensureDb } from '@/lib/apps/drively/service/service';
import { BulkActionSchema } from '@/lib/apps/drively/service/validators';
import { NextResponse } from 'next/server';
import archiver from 'archiver';
import DrivelyFile from '@/models/DrivelyFile';

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const validated = BulkActionSchema.parse(body);

    if (validated.action === 'download') {
      await ensureDb();
      const files = await DrivelyFile.find({ _id: { $in: validated.fileIds } }).lean();

      if (files.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No files to download' },
          { status: 400 }
        );
      }

      // Cap at 20 files and 200MB
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      if (files.length > 20 || totalSize > 200 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Bulk download limit exceeded (20 files or 200MB)' },
          { status: 400 }
        );
      }

      const archive = archiver('zip', { zlib: { level: 9 } });
      const stream = new ReadableStream({
        async start(controller) {
          archive.on('data', (chunk) => controller.enqueue(chunk));
          archive.on('end', () => controller.close());
          archive.on('error', (err) => controller.error(err));

          for (const file of files) {
            try {
              const fileRes = await fetch(file.secureUrl);
              const buffer = await fileRes.arrayBuffer();
              archive.append(Buffer.from(buffer), { name: file.filename });
            } catch (err) {
              console.error(`Failed to fetch file ${file.filename}:`, err);
            }
          }
          archive.finalize();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="drively-export.zip"',
        },
      });
    }

    await executeBulkAction(validated);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
