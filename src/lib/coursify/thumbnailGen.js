import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import DrivelyFile from '@/models/DrivelyFile';
import DrivelyFolder from '@/models/DrivelyFolder';
import DrivelyActivity from '@/models/DrivelyActivity';

async function getOrCreateThumbnailFolder() {
  const existing = await DrivelyFolder.findOne({ name: 'Coursify Thumbnails', deletedAt: null });
  if (existing) return existing._id;
  const folder = await DrivelyFolder.create({
    name: 'Coursify Thumbnails',
    parentId: null,
    path: '',
  });
  return folder._id;
}

// Cloudinary is already configured globally by the Drively service on first import.
// Re-configuring here would clobber the shared singleton with stale env values.
if (!cloudinary.config().cloud_name) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function buildPrompt(title, description) {
  const desc = description?.trim() ? ` Topic: ${description.trim().slice(0, 200)}.` : '';
  return (
    `Professional online course thumbnail for "${title}".${desc} ` +
    `Modern, sleek design, bold typography, abstract tech and education visuals, ` +
    `vibrant gradient background, high quality, 16:9 aspect ratio, ` +
    `suitable for a learning management system. No text overlays.`
  );
}

const tag = (courseId) => `[Coursify:thumbnail:${courseId}]`;

export async function generateCourseThumbnail(courseId, title, description) {
  const t = tag(courseId);
  const t0 = Date.now();
  const elapsed = () => `+${Date.now() - t0}ms`;

  try {
    console.log(`${t} START course="${title}"`);

    await dbConnect();
    console.log(`${t} [1/5] DB connected (${elapsed()})`);

    const { default: agentRegistry, AGENT_IDS } = await import('@/lib/agents/index.js');
    const prompt = buildPrompt(title, description);
    console.log(
      `${t} [2/5] Sending to image agent — prompt length=${prompt.length} (${elapsed()})`
    );

    const { buffer, url: generatedUrl } = await agentRegistry.execute(
      AGENT_IDS.COURSIFY_THUMBNAIL_GENERATOR,
      { prompt, size: '1792x1024' }
    );
    console.log(
      `${t} [3/5] Image generated — buffer=${(buffer.length / 1024).toFixed(1)}KB generatedUrl=${generatedUrl ?? 'none'} (${elapsed()})`
    );

    const publicId = `coursify/thumbnail_${courseId}`;
    console.log(`${t} [4/5] Uploading to Cloudinary — publicId=drively/${publicId} (${elapsed()})`);
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
    console.log(
      `${t} [4/5] Cloudinary upload done — url=${uploadResult.secure_url} bytes=${uploadResult.bytes} (${elapsed()})`
    );

    const filename = `${title} - Thumbnail.webp`;
    console.log(`${t} [5/5] Saving DrivelyFile + updating course record (${elapsed()})`);

    const folderId = await getOrCreateThumbnailFolder();

    await DrivelyFile.findOneAndUpdate(
      { cloudinaryPublicId: uploadResult.public_id },
      {
        filename,
        mimeType: 'image/webp',
        size: buffer.length,
        cloudinaryPublicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        resourceType: 'image',
        folderId,
      },
      { upsert: true, new: true }
    );

    await DrivelyActivity.create({ action: 'upload', itemType: 'file', itemName: filename });

    await CoursifyCourse.findByIdAndUpdate(courseId, {
      $set: { thumbnail: uploadResult.secure_url },
    });

    console.log(`${t} DONE total=${elapsed()} url=${uploadResult.secure_url}`);
  } catch (err) {
    console.error(`${t} FAILED at ${elapsed()} — ${err.message}`, err.stack ?? '');
  }
}
