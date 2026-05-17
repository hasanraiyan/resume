#!/usr/bin/env node

const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

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

/**
 * Deduplicate research by title
 */
async function deduplicateResearchByTitle() {
  const dbConnect = require('../src/lib/dbConnect').default;
  await dbConnect();

  const CoursifyResearch = require('../src/models/CoursifyResearch').default;

  const recordsWithoutHash = await CoursifyResearch.find({
    deletedAt: null,
    $or: [{ promptHash: { $exists: false } }, { titleHash: { $exists: false } }],
  });

  console.log(`Found ${recordsWithoutHash.length} records without promptHash or titleHash`);

  if (recordsWithoutHash.length === 0) {
    console.log('✅ All records have promptHash and titleHash');
    return { updated: 0, duplicates: 0 };
  }

  let updated = 0;
  let duplicates = 0;
  const hashMap = new Map();

  for (const doc of recordsWithoutHash) {
    const hashInput = `${normalizePrompt(doc.topic)}|${normalizePrompt(doc.title)}`;
    const newPromptHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    // Also generate titleHash from the generated title
    const titleHashInput = normalizePrompt(doc.title);
    const newTitleHash = crypto.createHash('sha256').update(titleHashInput).digest('hex');

    if (hashMap.has(newPromptHash)) {
      console.log(`⚠️  DUPLICATE FOUND:`);
      console.log(
        `   [1] "${hashMap.get(newPromptHash).title}" (${hashMap.get(newPromptHash)._id})`
      );
      console.log(`   [2] "${doc.title}" (${doc._id})`);
      duplicates++;
      continue;
    }

    hashMap.set(newPromptHash, doc);

    doc.promptHash = newPromptHash;
    doc.titleHash = newTitleHash;
    await doc.save();
    updated++;

    console.log(
      `✅ ${doc.topic.substring(0, 35)}... → promptHash: ${newPromptHash.substring(0, 8)}... titleHash: ${newTitleHash.substring(0, 8)}...`
    );
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Duplicates found: ${duplicates}`);

  return { updated, duplicates };
}

/**
 * Find all research with duplicate titles
 */
async function findDuplicateTitles() {
  const dbConnect = require('../src/lib/dbConnect').default;
  await dbConnect();

  const CoursifyResearch = require('../src/models/CoursifyResearch').default;

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
      'topic title titleHash slug createdAt'
    );
    docs.forEach((d) => {
      console.log(
        `   • Topic: ${d.topic} | TitleHash: ${d.titleHash ? d.titleHash.substring(0, 8) + '...' : 'missing'} | Slug: ${d.slug} | Created: ${d.createdAt}`
      );
    });
    console.log();
  }

  return duplicates;
}

const command = process.argv[2] || 'hash';

(async () => {
  try {
    console.log(`\n📚 Coursify Research Deduplication Tool\n`);

    if (command === 'hash') {
      console.log('Generating promptHash for records without it...\n');
      const result = await deduplicateResearchByTitle();
      console.log(
        `\n✅ Complete! Updated ${result.updated}, Found ${result.duplicates} duplicates\n`
      );
      process.exit(0);
    } else if (command === 'titles') {
      console.log('Scanning for duplicate titles...\n');
      const result = await findDuplicateTitles();
      console.log(`\n✅ Scan complete! Found ${result.length} duplicate title groups\n`);
      process.exit(0);
    } else if (command === 'help') {
      console.log(`Available commands:
  hash     - Generate promptHash for records missing it
  titles   - Find and list duplicate titles
  help     - Show this message\n`);
      process.exit(0);
    } else {
      console.log(`❌ Unknown command: ${command}\n`);
      console.log(`Use: node scripts/deduplicate-research.js hash|titles|help\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
