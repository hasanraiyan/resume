// scripts/migrate-analytics-roles.js
require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const Analytics = require('../src/models/Analytics').default; // Adjust path if needed
const dbConnect = require('../src/lib/dbConnect').default; // Adjust path if needed

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected.');

    // 1. Find all session IDs that have accessed an admin page
    console.log('Finding admin sessions...');
    const adminSessionIds = await Analytics.distinct('sessionId', {
      userRole: { $exists: false }, // Only process records that haven't been migrated
      path: /^\/admin/, // Regex to find any path starting with /admin
    });

    if (adminSessionIds.length === 0) {
      console.log('No old admin sessions found to migrate.');
    } else {
      console.log(`Found ${adminSessionIds.length} admin session(s).`);
      // 2. Update all events from those sessions to have userRole: 'admin'
      console.log('Updating admin events...');
      const adminUpdateResult = await Analytics.updateMany(
        {
          sessionId: { $in: adminSessionIds },
          userRole: { $exists: false },
        },
        { $set: { userRole: 'admin' } }
      );
      console.log(`Tagged ${adminUpdateResult.modifiedCount} events as 'admin'.`);
    }

    // 3. Update all remaining unprocessed events to userRole: 'visitor'
    console.log('Updating remaining visitor events...');
    const visitorUpdateResult = await Analytics.updateMany(
      {
        userRole: { $exists: false }, // Target only the records we haven't touched
      },
      { $set: { userRole: 'visitor' } }
    );
    console.log(`Tagged ${visitorUpdateResult.modifiedCount} events as 'visitor'.`);

    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

runMigration();
