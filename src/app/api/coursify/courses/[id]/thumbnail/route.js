import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';

export async function POST(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'image',
            folder: 'drively',
            public_id: `coursify/thumbnail_${id}`,
            overwrite: true,
            format: 'webp',
            transformation: [{ width: 1280, height: 720, crop: 'fill', quality: 'auto' }],
          },
          (err, result) => (err ? reject(err) : resolve(result))
        )
        .end(buffer);
    });

    await dbConnect();
    const course = await CoursifyCourse.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { thumbnail: uploadResult.secure_url, thumbnailGenerating: false } },
      { new: true }
    ).lean();

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, thumbnail: uploadResult.secure_url });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
