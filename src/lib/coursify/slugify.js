import CoursifyCourse from '@/models/CoursifyCourse';

export function toSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function generateUniqueSlug(title, excludeId = null) {
  const base = toSlug(title);
  if (!base) return null;

  let slug = base;
  let counter = 2;

  while (true) {
    const query = { slug, deletedAt: null };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await CoursifyCourse.findOne(query).select('_id').lean();
    if (!exists) return slug;
    slug = `${base}-${counter}`;
    counter++;
  }
}
