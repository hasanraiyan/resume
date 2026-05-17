#!/usr/bin/env node

require('dotenv').config();

/**
 * Generate embeddings for all CoursifyResearch records without embeddings
 */
async function generateMissingEmbeddings() {
  const dbConnect = require('../src/lib/dbConnect').default;
  await dbConnect();

  const CoursifyResearch = require('../src/models/CoursifyResearch').default;

  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) {
    throw new Error('POLLINATIONS_API_KEY not set in .env');
  }

  // Find all records without embeddings
  const recordsWithoutEmbedding = await CoursifyResearch.find({
    deletedAt: null,
    embedding: { $exists: false },
  });

  console.log(`\n📚 Found ${recordsWithoutEmbedding.length} records without embeddings\n`);

  if (recordsWithoutEmbedding.length === 0) {
    console.log('✅ All records have embeddings');
    return { updated: 0, failed: 0 };
  }

  let updated = 0;
  let failed = 0;

  const generateEmbedding = async (text) => {
    const response = await fetch('https://gen.pollinations.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai-3-small',
        input: text,
        dimensions: 1536,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Embedding API error: ${error.detail || response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  };

  for (let i = 0; i < recordsWithoutEmbedding.length; i++) {
    const doc = recordsWithoutEmbedding[i];

    try {
      // Generate embedding from title + content
      const textToEmbed = `${doc.title}\n${doc.content}`;
      console.log(
        `[${i + 1}/${recordsWithoutEmbedding.length}] Embedding: "${doc.title.substring(0, 50)}..."`
      );

      const embedding = await generateEmbedding(textToEmbed);

      // Store embedding
      doc.embedding = embedding;
      await doc.save();
      updated++;

      console.log(`   ✅ Generated embedding (${embedding.length} dimensions)`);
    } catch (err) {
      failed++;
      console.error(`   ❌ Failed: "${doc.title}": ${err.message}`);
    }

    // Small delay to avoid rate limits
    if (i < recordsWithoutEmbedding.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Generated: ${updated}`);
  console.log(`   Failed: ${failed}\n`);

  return { updated, failed };
}

/**
 * Show embedding statistics
 */
async function showEmbeddingStats() {
  const dbConnect = require('../src/lib/dbConnect').default;
  await dbConnect();

  const CoursifyResearch = require('../src/models/CoursifyResearch').default;

  const stats = await CoursifyResearch.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        withEmbedding: {
          $sum: { $cond: [{ $ne: ['$embedding', null] }, 1, 0] },
        },
        withoutEmbedding: {
          $sum: { $cond: [{ $eq: ['$embedding', null] }, 1, 0] },
        },
      },
    },
  ]);

  if (stats.length === 0) {
    console.log('\n📊 No records found');
    return;
  }

  const { totalRecords, withEmbedding, withoutEmbedding } = stats[0];
  const coverage = totalRecords > 0 ? Math.round((withEmbedding / totalRecords) * 100) : 0;

  console.log(`\n📊 Embedding Coverage:`);
  console.log(`   Total records: ${totalRecords}`);
  console.log(`   With embedding: ${withEmbedding} (${coverage}%)`);
  console.log(`   Without embedding: ${withoutEmbedding}\n`);

  return stats[0];
}

const command = process.argv[2] || 'generate';

(async () => {
  try {
    console.log(`\n🔢 Coursify Embeddings Generator\n`);

    if (command === 'generate') {
      console.log('Generating embeddings for records without them...\n');
      const result = await generateMissingEmbeddings();
      console.log(`✅ Complete! Generated ${result.updated}, Failed ${result.failed}\n`);
      process.exit(0);
    } else if (command === 'stats') {
      console.log('Fetching embedding statistics...');
      await showEmbeddingStats();
      process.exit(0);
    } else if (command === 'help') {
      console.log(`Available commands:
  generate - Generate embeddings for records without them
  stats    - Show embedding coverage statistics
  help     - Show this message\n`);
      process.exit(0);
    } else {
      console.log(`❌ Unknown command: ${command}\n`);
      console.log(`Use: node scripts/generate-embeddings.js generate|stats|help\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
