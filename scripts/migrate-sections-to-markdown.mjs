import 'dotenv/config';
import mongoose from 'mongoose';
import dbConnect from '../src/lib/dbConnect.js';
import CoursifySection from '../src/models/CoursifySection.js';
import { generateMarkdownFromBlocks } from '../src/lib/mcp/coursify/utils.js';

/**
 * Migration Script: Sections to Markdown Content
 * 
 * This script backfills the 'content' field for all Coursify sections
 * by generating it from the existing structured 'blocks' data.
 */
async function migrate() {
  console.log('🚀 Starting migration: Sections to Markdown Content...');
  
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB.');

    // Find sections that have blocks but no content
    const sections = await CoursifySection.find({
      $or: [
        { content: { $exists: false } },
        { content: '' }
      ],
      blocks: { $exists: true, $not: { $size: 0 } }
    });

    if (sections.length === 0) {
      console.log('ℹ️ No sections found requiring migration.');
      return;
    }

    console.log(`📊 Found ${sections.length} sections to migrate.`);

    let migrated = 0;
    let failed = 0;

    for (const section of sections) {
      try {
        const content = generateMarkdownFromBlocks(section.blocks);
        
        if (content) {
          await CoursifySection.updateOne(
            { _id: section._id },
            { $set: { content } }
          );
          migrated++;
        } else {
          console.warn(`⚠️ Empty content generated for section: ${section.title} (${section._id})`);
        }

        if (migrated % 10 === 0 && migrated > 0) {
          console.log(`⏳ Migrated ${migrated}/${sections.length}...`);
        }
      } catch (err) {
        console.error(`❌ Failed to migrate section ${section._id}: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Successfully migrated: ${migrated}`);
    if (failed > 0) console.log(`❌ Failed: ${failed}`);

  } catch (err) {
    console.error('💥 Migration failed with fatal error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 DB connection closed.');
    process.exit(0);
  }
}

migrate();
