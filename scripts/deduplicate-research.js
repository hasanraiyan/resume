#!/usr/bin/env node

import crypto from 'crypto';
import path from 'path';
import dotenv from 'dotenv';
import dbConnect from '../src/lib/dbConnect.js';
import CoursifyResearch from '../src/models/CoursifyResearch.js';
import { QdrantVectorStore } from '@langchain/qdrant';
import { PollinationsEmbeddings } from '../src/lib/coursify/PollinationsEmbeddings.js';

dotenv.config();

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
 * Check article counts in MongoDB and Qdrant
 */
async function checkDatabaseCounts() {
  await dbConnect();

  const mongoCount = await CoursifyResearch.countDocuments({ deletedAt: null });
  console.log(`\n📊 MongoDB: ${mongoCount} active articles`);

  try {
    const qdrantUrl = process.env.QDRANT_URL;
    if (!qdrantUrl) {
      console.log('❌ QDRANT_URL not set, skipping Qdrant check');
      return { mongo: mongoCount, qdrant: 0 };
    }

    const response = await fetch(`${qdrantUrl}/collections/coursify_research/points/scroll`, {
      method: 'POST',
      headers: {
        'api-key': process.env.QDRANT_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 10000,
      }),
    });

    if (!response.ok) {
      console.log(`❌ Failed to fetch Qdrant collection: ${response.status}`);
      return { mongo: mongoCount, qdrant: 0 };
    }

    const data = await response.json();
    const qdrantCount = data.result?.points?.length || 0;
    console.log(`📊 Qdrant: ${qdrantCount} documents in collection`);

    if (mongoCount !== qdrantCount) {
      console.log(
        `⚠️  MISMATCH: MongoDB has ${mongoCount}, Qdrant has ${qdrantCount} (diff: ${Math.abs(mongoCount - qdrantCount)})\n`
      );
    } else {
      console.log(`✅ SYNC: Both databases are in sync\n`);
    }

    return { mongo: mongoCount, qdrant: qdrantCount, points: data.result?.points };
  } catch (err) {
    console.log(`❌ Error checking Qdrant: ${err.message}`);
    return { mongo: mongoCount, qdrant: 0 };
  }
}

/**
 * Find orphaned documents in Qdrant (not in MongoDB)
 */
async function findOrphanedInQdrant() {
  await dbConnect();

  try {
    const qdrantUrl = process.env.QDRANT_URL;
    if (!qdrantUrl) {
      console.log('❌ QDRANT_URL not set');
      return { orphaned: [] };
    }

    const response = await fetch(`${qdrantUrl}/collections/coursify_research/points/scroll`, {
      method: 'POST',
      headers: {
        'api-key': process.env.QDRANT_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 10000,
      }),
    });

    if (!response.ok) {
      console.log(`❌ Failed to fetch Qdrant collection: ${response.status}`);
      return { orphaned: [] };
    }

    const data = await response.json();
    const points = data.result?.points || [];

    console.log(`\n🔍 Checking ${points.length} Qdrant documents against MongoDB...\n`);

    // Get all active slugs from MongoDB first
    const allDocs = await CoursifyResearch.find({ deletedAt: null }, 'slug').lean();
    const mongoSlugs = new Set(allDocs.map((d) => d.slug));

    const orphaned = [];
    for (const point of points) {
      const slug = point.payload?.slug;
      if (!slug) {
        orphaned.push(point);
        continue;
      }

      if (!mongoSlugs.has(slug)) {
        orphaned.push(point);
        console.log(`⚠️  ORPHANED: "${point.payload?.title}" (slug: ${slug})`);
      }
    }

    console.log(`\n📊 Found ${orphaned.length} orphaned documents in Qdrant\n`);
    return { orphaned };
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return { orphaned: [] };
  }
}

/**
 * Delete orphaned documents from Qdrant
 */
async function deleteOrphanedFromQdrant() {
  try {
    const qdrantUrl = process.env.QDRANT_URL;
    if (!qdrantUrl) {
      console.log('❌ QDRANT_URL not set');
      return { deleted: 0 };
    }

    const { orphaned } = await findOrphanedInQdrant();

    if (orphaned.length === 0) {
      console.log('✅ No orphaned documents to delete\n');
      return { deleted: 0 };
    }

    console.log(`🗑️  Deleting ${orphaned.length} orphaned documents from Qdrant...\n`);

    const orphanedIds = orphaned.map((p) => p.id);

    // Delete points from Qdrant
    const deleteResponse = await fetch(`${qdrantUrl}/collections/coursify_research/points/delete`, {
      method: 'POST',
      headers: {
        'api-key': process.env.QDRANT_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        points_selector: {
          points: orphanedIds,
        },
      }),
    });

    if (!deleteResponse.ok) {
      console.log(`❌ Failed to delete from Qdrant: ${deleteResponse.status}`);
      return { deleted: 0 };
    }

    console.log(`✅ Deleted ${orphaned.length} orphaned documents from Qdrant\n`);
    return { deleted: orphaned.length };
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return { deleted: 0 };
  }
}

/**
 * Delete from both MongoDB and Qdrant
 */
async function deleteFromQdrant(slug) {
  try {
    const qdrantUrl = process.env.QDRANT_URL;
    if (!qdrantUrl) {
      return { deleted: 0 };
    }

    const response = await fetch(`${qdrantUrl}/collections/coursify_research/points/scroll`, {
      method: 'POST',
      headers: {
        'api-key': process.env.QDRANT_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 10000,
      }),
    });

    if (!response.ok) return { deleted: 0 };

    const data = await response.json();
    const points = data.result?.points || [];
    const toDelete = points.filter((p) => p.payload?.slug === slug);

    if (toDelete.length === 0) return { deleted: 0 };

    const deleteResponse = await fetch(`${qdrantUrl}/collections/coursify_research/points/delete`, {
      method: 'POST',
      headers: {
        'api-key': process.env.QDRANT_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        points_selector: {
          points: toDelete.map((p) => p.id),
        },
      }),
    });

    return deleteResponse.ok ? { deleted: toDelete.length } : { deleted: 0 };
  } catch (err) {
    console.log(`   ⚠️  Could not delete from Qdrant: ${err.message}`);
    return { deleted: 0 };
  }
}

/**
 * Delete research by title keyword (from both MongoDB and Qdrant)
 */
async function deleteByTitleKeyword(keyword) {
  await dbConnect();

  const regex = new RegExp(keyword, 'i');
  const matching = await CoursifyResearch.find({
    deletedAt: null,
    title: { $regex: regex },
  });

  console.log(`\n🔍 Found ${matching.length} articles with "${keyword}" in title\n`);

  if (matching.length === 0) {
    console.log('No articles found');
    return { deleted: 0, deletedFromQdrant: 0 };
  }

  let deletedFromQdrant = 0;

  for (const doc of matching) {
    console.log(`🗑️  Deleting: "${doc.title}" (${doc.slug})`);
    doc.deletedAt = new Date();
    await doc.save();

    // Also delete from Qdrant
    const result = await deleteFromQdrant(doc.slug);
    if (result.deleted > 0) {
      console.log(`   ✓ Removed from Qdrant`);
      deletedFromQdrant++;
    }
  }

  console.log(
    `\n✅ Deleted ${matching.length} articles from MongoDB, ${deletedFromQdrant} from Qdrant\n`
  );
  return { deleted: matching.length, deletedFromQdrant };
}

/**
 * Find research by title keyword
 */
async function findByTitleKeyword(keyword) {
  await dbConnect();

  const regex = new RegExp(keyword, 'i');
  const matching = await CoursifyResearch.find({
    deletedAt: null,
    title: { $regex: regex },
  }).select('title slug topic');

  console.log(`\n🔍 Found ${matching.length} articles with "${keyword}" in title\n`);

  if (matching.length === 0) {
    console.log('No articles found');
    return { count: 0 };
  }

  matching.forEach((doc) => {
    console.log(`📌 "${doc.title}" | ${doc.slug} | Topic: ${doc.topic}`);
  });

  console.log();
  return { count: matching.length };
}

/**
 * Deduplicate research by title
 */
async function deduplicateResearchByTitle() {
  await dbConnect();

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
 * Clean up duplicates: keep 1 random, soft-delete the rest
 */
async function cleanupDuplicates() {
  await dbConnect();

  // Find all duplicate groups (same promptHash)
  const duplicatesByPromptHash = await CoursifyResearch.aggregate([
    { $match: { deletedAt: null, promptHash: { $exists: true } } },
    { $group: { _id: '$promptHash', ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  console.log(`\n🧹 Found ${duplicatesByPromptHash.length} duplicate groups by promptHash\n`);

  let totalDeleted = 0;

  for (const group of duplicatesByPromptHash) {
    // Pick 1 random record to keep
    const keepIdx = Math.floor(Math.random() * group.ids.length);
    const keepId = group.ids[keepIdx];
    const toDelete = group.ids.filter((_, idx) => idx !== keepIdx);

    const kept = await CoursifyResearch.findById(keepId).select('title slug');
    console.log(`📌 Group with hash ${group._id.substring(0, 8)}...`);
    console.log(`   ✅ Keeping (random): "${kept.title}" (${kept.slug})`);

    // Soft-delete the rest
    for (const id of toDelete) {
      const doc = await CoursifyResearch.findById(id);
      doc.deletedAt = new Date();
      await doc.save();
      console.log(`   🗑️  Deleting: "${doc.title}" (${doc.slug})`);
      totalDeleted++;
    }
    console.log();
  }

  console.log(`📊 Summary:`);
  console.log(`   Total deleted: ${totalDeleted}`);
  console.log(`   Groups consolidated: ${duplicatesByPromptHash.length}\n`);

  return { deleted: totalDeleted, groups: duplicatesByPromptHash.length };
}

/**
 * Clean up duplicates by title: keep the latest record per normalized title,
 * soft-delete older ones from MongoDB and delete from Qdrant
 */
async function cleanupByTitle() {
  await dbConnect();

  // Get all active records
  const allDocs = await CoursifyResearch.find({ deletedAt: null }).sort({ createdAt: -1 });
  console.log(`\n📊 Found ${allDocs.length} active articles`);

  // Group by normalized title
  const titleGroups = new Map();
  for (const doc of allDocs) {
    const normalizedTitle = normalizePrompt(doc.title);
    if (!titleGroups.has(normalizedTitle)) {
      titleGroups.set(normalizedTitle, []);
    }
    titleGroups.get(normalizedTitle).push(doc);
  }

  // Filter to only groups with duplicates
  const duplicateGroups = [...titleGroups.entries()].filter(([, docs]) => docs.length > 1);
  console.log(`🔍 Found ${duplicateGroups.length} duplicate title groups\n`);

  if (duplicateGroups.length === 0) {
    console.log('✅ No duplicate titles found\n');
    return { deleted: 0, deletedFromQdrant: 0 };
  }

  let totalDeletedMongo = 0;
  let totalDeletedQdrant = 0;

  for (const [normalizedTitle, docs] of duplicateGroups) {
    // docs are already sorted by createdAt desc (from query)
    const keep = docs[0]; // Latest
    const toDelete = docs.slice(1); // Older duplicates

    console.log(`📌 Group: "${keep.title}"`);
    console.log(
      `   ✅ Keeping (latest): "${keep.title}" (${keep.slug}) — Created: ${keep.createdAt}`
    );

    for (const doc of toDelete) {
      console.log(`   🗑️  Deleting: "${doc.title}" (${doc.slug}) — Created: ${doc.createdAt}`);

      // Soft-delete in MongoDB
      doc.deletedAt = new Date();
      await doc.save();
      totalDeletedMongo++;

      // Delete from Qdrant
      const qdrantResult = await deleteFromQdrant(doc.slug);
      if (qdrantResult.deleted > 0) {
        console.log(`      ✓ Removed from Qdrant`);
        totalDeletedQdrant += qdrantResult.deleted;
      }
    }
    console.log();
  }

  console.log(`📊 Summary:`);
  console.log(`   Total deleted from MongoDB: ${totalDeletedMongo}`);
  console.log(`   Total deleted from Qdrant: ${totalDeletedQdrant}`);
  console.log(`   Groups consolidated: ${duplicateGroups.length}\n`);

  return { deleted: totalDeletedMongo, deletedFromQdrant: totalDeletedQdrant };
}

/**
 * Find all research with duplicate titles
 */
async function findDuplicateTitles() {
  await dbConnect();

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

/**
 * Deduplicate by similarity using Qdrant embeddings: find semantically similar articles,
 * keep the latest, soft-delete the rest from MongoDB and delete from Qdrant
 */
async function deduplicateBySimilarity() {
  await dbConnect();

  const qdrantUrl = process.env.QDRANT_URL;
  if (!qdrantUrl) {
    console.log('❌ QDRANT_URL not set');
    return { deleted: 0, deletedFromQdrant: 0 };
  }

  const SIMILARITY_THRESHOLD = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.85'); // 85% similarity

  console.log(
    `\n🔍 Finding semantically similar articles (threshold: ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}%)\n`
  );

  // Fetch all active records
  const allDocs = await CoursifyResearch.find({ deletedAt: null }).sort({ createdAt: -1 });
  console.log(`📊 Found ${allDocs.length} active articles to compare\n`);

  if (allDocs.length === 0) {
    console.log('✅ No articles to compare\n');
    return { deleted: 0, deletedFromQdrant: 0 };
  }

  try {
    const embeddings = new PollinationsEmbeddings();
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: qdrantUrl,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: 'coursify_research',
    });

    const deletedSlugs = new Set(); // Track already-deleted slugs to avoid re-processing
    let totalDeletedMongo = 0;
    let totalDeletedQdrant = 0;
    let groupsFound = 0;

    for (const doc of allDocs) {
      // Skip if already deleted
      if (deletedSlugs.has(doc.slug)) continue;

      // Search for similar documents (include current doc)
      const results = await vectorStore.similaritySearchWithScore(
        `${doc.title}\n${doc.topic}`,
        Math.min(10, allDocs.length) // Search top 10 or less
      );

      // Filter to only high-similarity matches that are different docs
      const similarDocs = results
        .filter(([resultDoc, score]) => {
          const otherSlug = resultDoc.metadata?.slug;
          return (
            otherSlug &&
            otherSlug !== doc.slug &&
            score >= SIMILARITY_THRESHOLD &&
            !deletedSlugs.has(otherSlug)
          );
        })
        .map(([resultDoc, score]) => ({ slug: resultDoc.metadata.slug, score }));

      if (similarDocs.length === 0) continue;

      groupsFound++;
      console.log(`📌 Similarity Group ${groupsFound}: "${doc.title}" (${doc.slug})`);
      console.log(`   ✅ Keeping (latest): "${doc.title}" — Created: ${doc.createdAt}`);

      for (const { slug, score } of similarDocs) {
        // Find the MongoDB doc
        const similarDoc = await CoursifyResearch.findOne({ slug, deletedAt: null });
        if (!similarDoc) continue;

        console.log(
          `   🗑️  Deleting: "${similarDoc.title}" (${slug}) — Similarity: ${(score * 100).toFixed(1)}% — Created: ${similarDoc.createdAt}`
        );

        // Soft-delete in MongoDB
        similarDoc.deletedAt = new Date();
        await similarDoc.save();
        totalDeletedMongo++;
        deletedSlugs.add(slug);

        // Delete from Qdrant
        const qdrantResult = await deleteFromQdrant(slug);
        if (qdrantResult.deleted > 0) {
          console.log(`      ✓ Removed from Qdrant`);
          totalDeletedQdrant += qdrantResult.deleted;
        }
      }
      console.log();
    }

    console.log(`📊 Summary:`);
    console.log(`   Similarity groups found: ${groupsFound}`);
    console.log(`   Total deleted from MongoDB: ${totalDeletedMongo}`);
    console.log(`   Total deleted from Qdrant: ${totalDeletedQdrant}\n`);

    return { deleted: totalDeletedMongo, deletedFromQdrant: totalDeletedQdrant };
  } catch (err) {
    console.log(`❌ Error during similarity deduplication: ${err.message}`);
    throw err;
  }
}

const command = process.argv[2] || 'hash';
const keyword = process.argv[3];

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
    } else if (command === 'cleanup') {
      console.log('Cleaning up duplicates (keeping 1 random per group)...\n');
      const result = await cleanupDuplicates();
      console.log(
        `\n✅ Cleanup complete! Deleted ${result.deleted} duplicates across ${result.groups} groups\n`
      );
      process.exit(0);
    } else if (command === 'cleanup-by-title') {
      console.log('Cleaning up duplicates by title (keeping latest per title)...\n');
      const result = await cleanupByTitle();
      console.log(
        `\n✅ Cleanup complete! Deleted ${result.deleted} from MongoDB, ${result.deletedFromQdrant} from Qdrant\n`
      );
      process.exit(0);
    } else if (command === 'dedup-by-similarity') {
      console.log('Deduplicating by semantic similarity (keeping latest per group)...\n');
      const result = await deduplicateBySimilarity();
      console.log(
        `\n✅ Dedup complete! Deleted ${result.deleted} from MongoDB, ${result.deletedFromQdrant} from Qdrant\n`
      );
      process.exit(0);
    } else if (command === 'count') {
      console.log('Checking article counts in MongoDB and Qdrant...');
      const result = await checkDatabaseCounts();
      process.exit(0);
    } else if (command === 'orphaned') {
      console.log('Finding orphaned documents in Qdrant...');
      const result = await findOrphanedInQdrant();
      process.exit(0);
    } else if (command === 'cleanup-orphaned') {
      console.log('Deleting orphaned documents from Qdrant...');
      const result = await deleteOrphanedFromQdrant();
      console.log(`✅ Cleanup complete! Deleted ${result.deleted} orphaned documents\n`);
      process.exit(0);
    } else if (command === 'find') {
      if (!keyword) {
        console.log('❌ Keyword required\n');
        console.log('Usage: node scripts/deduplicate-research.js find <keyword>\n');
        process.exit(1);
      }
      console.log(`Searching for articles with "${keyword}" in title...\n`);
      const result = await findByTitleKeyword(keyword);
      console.log(`✅ Found ${result.count} articles\n`);
      process.exit(0);
    } else if (command === 'delete') {
      if (!keyword) {
        console.log('❌ Keyword required\n');
        console.log('Usage: node scripts/deduplicate-research.js delete <keyword>\n');
        process.exit(1);
      }
      console.log(`Deleting articles with "${keyword}" in title...\n`);
      const result = await deleteByTitleKeyword(keyword);
      console.log(
        `✅ Deleted ${result.deleted} articles from MongoDB, ${result.deletedFromQdrant} from Qdrant\n`
      );
      process.exit(0);
    } else if (command === 'help') {
      console.log(`Available commands:
  hash              - Generate promptHash for records missing it
  titles            - Find and list duplicate titles
  cleanup           - Keep 1 random per group, soft-delete duplicates
  cleanup-by-title  - Group by normalized title, keep latest, delete rest (MongoDB + Qdrant)
  dedup-by-similarity - Find semantically similar articles via Qdrant, keep latest, delete rest
  count             - Check article counts in MongoDB and Qdrant
  orphaned          - Find orphaned documents in Qdrant (not in MongoDB)
  cleanup-orphaned  - Delete orphaned documents from Qdrant
  find <keyword>    - Find articles with keyword in title
  delete <keyword>  - Delete articles with keyword in title (from both DBs)
  help              - Show this message

Environment Variables:
  SIMILARITY_THRESHOLD - Cosine similarity threshold for dedup-by-similarity (default: 0.85)\n`);
      process.exit(0);
    } else {
      console.log(`❌ Unknown command: ${command}\n`);
      console.log(
        `Use: node scripts/deduplicate-research.js hash|titles|cleanup|cleanup-by-title|dedup-by-similarity|count|orphaned|cleanup-orphaned|find|delete|help\n`
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
