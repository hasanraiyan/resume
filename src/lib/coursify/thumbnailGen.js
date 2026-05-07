import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import DrivelyFile from '@/models/DrivelyFile';
import DrivelyActivity from '@/models/DrivelyActivity';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function buildPrompt(title, description) {
  const desc = description?.trim() ? ` Topic: ${description.trim().slice(0, 200)}.` : '';
  return (
    `Professional online course thumbnail for "${title}".${desc} ` +
    `Modern, sleek design, bold typography, abstract tech and education visuals, ` +
    `vibrant gradient background, high quality, 16:9 aspect ratio, ` +
    `suitable for a learning management system. No text overlays.`
  );
}

export async function generateCourseThumbnail(courseId, title, description) {
  try {
    await dbConnect();

    // Dynamic import keeps the agent registry out of the MCP server's cold-start path
    const { default: agentRegistry, AGENT_IDS } = await import('@/lib/agents/index.js');

    const { buffer } = await agentRegistry.execute(AGENT_IDS.COURSIFY_THUMBNAIL_GENERATOR, {
      prompt: buildPrompt(title, description),
      size: '1792x1024',
    });

    const publicId = `coursify/thumbnail_${courseId}`;
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'image',
            folder: 'drively',
            public_id: publicId,
            overwrite: true,
            format: 'webp',
            transformation: [{ width: 1280, height: 720, crop: 'fill', quality: 'auto' }],
          },
          (err, result) => (err ? reject(err) : resolve(result))
        )
        .end(buffer);
    });

    const filename = `${title} - Thumbnail.webp`;

    await DrivelyFile.findOneAndUpdate(
      { cloudinaryPublicId: uploadResult.public_id },
      {
        filename,
        mimeType: 'image/webp',
        size: buffer.length,
        cloudinaryPublicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        resourceType: 'image',
      },
      { upsert: true, new: true }
    );

    await DrivelyActivity.create({ action: 'upload', itemType: 'file', itemName: filename });

    await CoursifyCourse.findByIdAndUpdate(courseId, {
      $set: { thumbnail: uploadResult.secure_url },
    });

    console.log(`[Coursify] Thumbnail ready for course ${courseId}: ${uploadResult.secure_url}`);
  } catch (err) {
    console.error(`[Coursify] Thumbnail generation failed for course ${courseId}:`, err.message);
  }
}
