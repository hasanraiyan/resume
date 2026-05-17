#!/usr/bin/env node

import dotenv from 'dotenv';
import dbConnect from '../src/lib/dbConnect.js';
import CoursifyResearch from '../src/models/CoursifyResearch.js';
import { QdrantVectorStore } from '@langchain/qdrant';
import { PollinationsEmbeddings } from '../src/lib/coursify/PollinationsEmbeddings.js';
import { Document } from '@langchain/core/documents';
import fetch from 'node-fetch';

dotenv.config();

async function uploadEmbeddingsToQdrant() {
  await dbConnect();

  const qdrantUrl = process.env.QDRANT_URL;

  if (!qdrantUrl) {
    throw new Error('QDRANT_URL required');
  }

  // Fetch all active research from MongoDB
  const research = await CoursifyResearch.find({
    deletedAt: null,
  });

  console.log(`\n📚 Found ${research.length} research records\n`);

  if (research.length === 0) {
    console.log('No research to upload');
    return { uploaded: 0 };
  }

  try {
    const embeddings = new PollinationsEmbeddings();

    // Create documents from research
    const documents = research.map(
      (doc) =>
        new Document({
          pageContent: `${doc.title}\n${doc.topic}`,
          metadata: {
            slug: doc.slug,
            title: doc.title,
            topic: doc.topic,
            createdAt: doc.createdAt?.toISOString(),
          },
        })
    );

    console.log(`🔄 Creating Qdrant collection and uploading ${documents.length} documents...\n`);

    // Upload documents to Qdrant (generates embeddings)
    const vectorStore = await QdrantVectorStore.fromDocuments(documents, embeddings, {
      url: qdrantUrl,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: 'coursify_research',
    });

    console.log(`✅ Successfully uploaded ${documents.length} research to Qdrant\n`);

    // Now fetch the points to get their IDs and update MongoDB
    console.log(`🔄 Fetching Qdrant point IDs to sync with MongoDB...\n`);

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
      console.log(`⚠️  Could not fetch point IDs: ${response.status}`);
      return { uploaded: documents.length, synced: 0 };
    }

    const data = await response.json();
    const points = data.result?.points || [];

    console.log(`📝 Syncing ${points.length} point IDs with MongoDB...\n`);

    let synced = 0;
    for (const point of points) {
      const slug = point.payload?.slug;
      if (!slug) continue;

      const doc = await CoursifyResearch.findOne({ slug, deletedAt: null });
      if (doc) {
        doc.qdrantId = point.id;
        await doc.save();
        synced++;
      }
    }

    console.log(`✅ Synced ${synced} documents with qdrantId\n`);
    return { uploaded: documents.length, synced };
  } catch (error) {
    console.error('❌ Error uploading to Qdrant:', error.message);
    throw error;
  }
}

/**
 * Search Qdrant collection
 */
async function searchQdrant(query, limit = 5) {
  const qdrantUrl = process.env.QDRANT_URL;

  if (!qdrantUrl) {
    throw new Error('QDRANT_URL required');
  }

  try {
    const embeddings = new PollinationsEmbeddings();

    // Connect to existing collection
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: qdrantUrl,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: 'coursify_research',
    });

    console.log(`\n🔍 Searching for: "${query}"\n`);

    // Perform similarity search
    const results = await vectorStore.similaritySearchWithScore(query, limit);

    if (results.length === 0) {
      console.log('❌ No results found\n');
      return { count: 0 };
    }

    console.log(`✅ Found ${results.length} results:\n`);

    results.forEach((result, idx) => {
      const [doc, score] = result;
      console.log(`${idx + 1}. ${doc.metadata.title}`);
      console.log(`   Topic: ${doc.metadata.topic}`);
      console.log(`   Slug: ${doc.metadata.slug}`);
      console.log(`   Similarity: ${(score * 100).toFixed(2)}%\n`);
    });

    return { count: results.length, results };
  } catch (err) {
    console.log(`\n❌ Search failed: ${err.message}\n`);
    throw err;
  }
}

/**
 * Show stats about Qdrant collection
 */
async function showQdrantStats() {
  const qdrantUrl = process.env.QDRANT_URL;

  if (!qdrantUrl) {
    throw new Error('QDRANT_URL required');
  }

  try {
    const embeddings = new PollinationsEmbeddings();

    // Connect to existing collection
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: qdrantUrl,
      apiKey: process.env.QDRANT_API_KEY,
      collectionName: 'coursify_research',
    });

    console.log(`\n📊 Qdrant Collection Stats:\n`);
    console.log(`   Collection: coursify_research`);
    console.log(`   Status: ✅ Connected\n`);
  } catch (err) {
    console.log(`\n❌ Collection "coursify_research" not found or not accessible\n`);
    console.error(`   Error: ${err.message}\n`);
  }
}

const command = process.argv[2] || 'upload';
const searchQuery = process.argv[3];

(async () => {
  try {
    console.log(`\n🔢 Coursify → Qdrant Embeddings Manager\n`);

    if (command === 'upload') {
      console.log('Fetching embeddings from MongoDB and uploading to Qdrant...\n');
      const result = await uploadEmbeddingsToQdrant();
      console.log(
        `✅ Complete! Uploaded ${result.uploaded} embeddings, synced ${result.synced} qdrantIds\n`
      );
      process.exit(0);
    } else if (command === 'search') {
      if (!searchQuery) {
        console.log('❌ Query required\n');
        console.log('Usage: node scripts/upload-to-qdrant.js search <query>\n');
        console.log('Example: node scripts/upload-to-qdrant.js search "mongodb database"\n');
        process.exit(1);
      }
      const result = await searchQdrant(searchQuery, 5);
      console.log(`✅ Search complete! Found ${result.count} results\n`);
      process.exit(0);
    } else if (command === 'stats') {
      console.log('Checking Qdrant collection...');
      await showQdrantStats();
      process.exit(0);
    } else if (command === 'help') {
      console.log(`Available commands:
  upload          - Fetch embeddings from MongoDB and upload to Qdrant
  search <query>  - Search for similar research by query
  stats           - Check Qdrant collection status
  help            - Show this message

Examples:
  node scripts/upload-to-qdrant.js upload
  node scripts/upload-to-qdrant.js search "machine learning"
  node scripts/upload-to-qdrant.js stats\n`);
      process.exit(0);
    } else {
      console.log(`❌ Unknown command: ${command}\n`);
      console.log(`Use: node scripts/upload-to-qdrant.js upload|search|stats|help\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
