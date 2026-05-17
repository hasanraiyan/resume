import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';

/**
 * Deduplicate research by title
 * Finds records without promptHash and generates one using topic+title combo
 */
export async function deduplicateResearchByTitle() {
  await dbConnect();
  const CoursifyResearch = (await import('@/models/CoursifyResearch')).default;

  // Find all research WITHOUT promptHash
  const recordsWithoutHash = await CoursifyResearch.find({
    deletedAt: null,
    promptHash: { $exists: false },
  });

  console.log(`Found ${recordsWithoutHash.length} records without promptHash`);

  if (recordsWithoutHash.length === 0) {
    console.log('✅ All records have promptHash');
    return { updated: 0, duplicates: 0 };
  }

  // Generate hash for each and check for duplicates
  let updated = 0;
  let duplicates = 0;
  const hashMap = new Map();

  for (const doc of recordsWithoutHash) {
    // Generate hash from topic + title combo for better uniqueness
    const hashInput = `${normalizePrompt(doc.topic)}|${normalizePrompt(doc.title)}`;
    const newHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    // Check if another record has this hash
    if (hashMap.has(newHash)) {
      console.log(`⚠️  DUPLICATE FOUND:`);
      console.log(`   [1] "${hashMap.get(newHash).title}" (${hashMap.get(newHash)._id})`);
      console.log(`   [2] "${doc.title}" (${doc._id})`);
      duplicates++;
      continue;
    }

    hashMap.set(newHash, doc);

    // Update record with new hash
    doc.promptHash = newHash;
    await doc.save();
    updated++;

    console.log(`✅ ${doc.topic.substring(0, 40)}... → ${newHash.substring(0, 8)}...`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Duplicates found: ${duplicates}`);

  return { updated, duplicates };
}

/**
 * Find all research with duplicate titles (different topics)
 */
export async function findDuplicateTitles() {
  await dbConnect();
  const CoursifyResearch = (await import('@/models/CoursifyResearch')).default;

  const duplicates = await CoursifyResearch.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$title', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log(`\n🔍 Found ${duplicates.length} duplicate titles:\n`);

  for (const dup of duplicates) {
    console.log(`📌 "${dup._id}" (${dup.count} records)`);
    const docs = await CoursifyResearch.find({ _id: { $in: dup.ids } }).select(
      'topic title slug createdAt'
    );
    docs.forEach((d) => {
      console.log(`   • Topic: ${d.topic} | Slug: ${d.slug} | Created: ${d.createdAt}`);
    });
    console.log();
  }

  return duplicates;
}

/**
 * Generate hash from title only (for searching)
 */
export function hashTitle(title) {
  const normalized = normalizePrompt(title);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Normalize text for hashing
 */
function normalizePrompt(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

export default { deduplicateResearchByTitle, findDuplicateTitles, hashTitle };
