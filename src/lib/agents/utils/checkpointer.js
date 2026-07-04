/**
 * Shared MongoDB-backed LangGraph checkpointer.
 *
 * Cached per-process (same pattern as `global.mongoose` in dbConnect.js) so we
 * don't reconstruct the saver or re-issue index creation on every request.
 * TTL indexes let idle conversation threads expire on their own via Mongo's
 * background TTL monitor — no cron job needed. Each checkpoint document is a
 * full state snapshot (not a diff), so pruning old ones never corrupts the
 * newest surviving checkpoint; if a whole thread ages out, the next message
 * for that thread_id just starts fresh.
 */

import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';
import mongoose from 'mongoose';

const CHECKPOINT_TTL_SECONDS = 24 * 60 * 60; // 24h

let cachedCheckpointer = null;
let indexesEnsured = false;

async function ensureTtlIndexes(checkpointer) {
  if (indexesEnsured) return;

  await Promise.all([
    checkpointer.db
      .collection(checkpointer.checkpointCollectionName)
      .createIndex({ upserted_at: 1 }, { expireAfterSeconds: CHECKPOINT_TTL_SECONDS }),
    checkpointer.db
      .collection(checkpointer.checkpointWritesCollectionName)
      .createIndex({ upserted_at: 1 }, { expireAfterSeconds: CHECKPOINT_TTL_SECONDS }),
  ]);

  indexesEnsured = true;
}

/**
 * Requires an active mongoose connection (call after `dbConnect()`).
 */
export async function getCheckpointer() {
  if (!cachedCheckpointer) {
    cachedCheckpointer = new MongoDBSaver({
      client: mongoose.connection.getClient(),
      dbName: mongoose.connection.name,
      enableTimestamps: true,
    });
  }

  await ensureTtlIndexes(cachedCheckpointer);

  return cachedCheckpointer;
}
