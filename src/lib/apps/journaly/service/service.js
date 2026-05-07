import dbConnect from '@/lib/dbConnect';
import JournalyEntry from '@/models/JournalyEntry';
import { EntryCreateSchema, EntryUpdateSchema, isValidObjectId } from './validators';
import { qdrantClient, mongoIdToUuid, ensureCollection } from '@/lib/qdrant';
import agentRegistry from '@/lib/agents/AgentRegistry';
import { AGENT_IDS } from '@/lib/constants/agents';

const COLLECTION_NAME = 'journaly_entries';
const VECTOR_SIZE = 3072; // default for text-embedding-3-large

export async function ensureDb() {
  await dbConnect();
}

export function serializeEntry(entry) {
  if (!entry) return null;
  const obj = entry.toObject ? entry.toObject() : entry;
  return {
    ...obj,
    _id: obj._id.toString(),
    createdAt: obj.createdAt?.toISOString(),
    updatedAt: obj.updatedAt?.toISOString(),
    embeddedAt: obj.embeddedAt?.toISOString(),
    deletedAt: obj.deletedAt?.toISOString(),
  };
}

async function getEmbedding(text) {
  const result = await agentRegistry.execute(AGENT_IDS.IMAGE_EMBEDDER, {
    text,
    action: 'embed',
  });
  return result.embedding;
}

async function syncToQdrant(entry) {
  await ensureCollection(COLLECTION_NAME, VECTOR_SIZE);

  const textToEmbed = `${entry.title}\n\n${entry.body}`.trim();
  const embedding = await getEmbedding(textToEmbed);

  const uuid = mongoIdToUuid(entry._id.toString());

  await qdrantClient.upsert(COLLECTION_NAME, {
    wait: true,
    points: [
      {
        id: uuid,
        vector: embedding,
        payload: {
          entryId: entry._id.toString(),
          title: entry.title,
          bodyExcerpt: entry.body.substring(0, 500),
          mood: entry.mood,
          tags: entry.tags,
          createdAt: entry.createdAt.toISOString(),
        },
      },
    ],
  });

  await JournalyEntry.findByIdAndUpdate(entry._id, {
    qdrantId: uuid,
    embeddedAt: new Date(),
  });
}

export async function getEntries({ tag, mood, startDate, endDate, limit = 50, skip = 0 } = {}) {
  await ensureDb();
  const query = { deletedAt: null };

  if (tag) query.tags = tag.toLowerCase();
  if (mood) query.mood = mood;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const entries = await JournalyEntry.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return entries.map(serializeEntry);
}

export async function getEntryById(id) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid entry ID');
  const entry = await JournalyEntry.findOne({ _id: id, deletedAt: null }).lean();
  return serializeEntry(entry);
}

export async function createEntry(payload) {
  await ensureDb();
  const validated = EntryCreateSchema.parse(payload);

  const wordCount = validated.body.trim().split(/\s+/).length;
  const entry = new JournalyEntry({
    ...validated,
    wordCount,
  });

  await entry.save();

  // Background sync (though criteria said synchronous, we want to return fast to UI)
  // For v1 as per criteria: "Embedding is synchronous on save in v1"
  await syncToQdrant(entry);

  const updatedEntry = await JournalyEntry.findById(entry._id).lean();
  return serializeEntry(updatedEntry);
}

export async function updateEntry(id, patch) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid entry ID');

  const validated = EntryUpdateSchema.parse(patch);
  const existing = await JournalyEntry.findOne({ _id: id, deletedAt: null });
  if (!existing) throw new Error('Entry not found');

  const bodyChanged = validated.body !== undefined && validated.body !== existing.body;
  const titleChanged = validated.title !== undefined && validated.title !== existing.title;

  Object.assign(existing, validated);
  if (bodyChanged) {
    existing.wordCount = existing.body.trim().split(/\s+/).length;
  }
  existing.syncVersion += 1;

  await existing.save();

  if (bodyChanged || titleChanged) {
    await syncToQdrant(existing);
  } else {
    // Just update payload if tags or mood changed
    const uuid = mongoIdToUuid(existing._id.toString());
    await qdrantClient.setPayload(COLLECTION_NAME, {
      payload: {
        mood: existing.mood,
        tags: existing.tags,
        title: existing.title,
        bodyExcerpt: existing.body.substring(0, 500),
      },
      points: [uuid],
    });
  }

  return serializeEntry(existing);
}

export async function deleteEntry(id) {
  await ensureDb();
  if (!isValidObjectId(id)) throw new Error('Invalid entry ID');

  const entry = await JournalyEntry.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } },
    { new: true }
  );

  if (entry) {
    const uuid = mongoIdToUuid(id);
    try {
      await qdrantClient.delete(COLLECTION_NAME, {
        points: [uuid],
      });
    } catch (err) {
      console.error('Failed to delete from Qdrant:', err);
    }
  }

  return !!entry;
}

export async function searchEntries(query, limit = 10) {
  await ensureDb();
  await ensureCollection(COLLECTION_NAME, VECTOR_SIZE);

  const embedding = await getEmbedding(query);

  const hits = await qdrantClient.search(COLLECTION_NAME, {
    vector: embedding,
    limit,
    with_payload: true,
    score_threshold: 0.4,
  });

  const entryIds = hits.map((hit) => hit.payload.entryId);
  const entries = await JournalyEntry.find({ _id: { $in: entryIds }, deletedAt: null }).lean();

  return hits
    .map((hit) => {
      const entry = entries.find((e) => e._id.toString() === hit.payload.entryId);
      if (!entry) return null;
      return {
        ...serializeEntry(entry),
        score: hit.score,
      };
    })
    .filter(Boolean);
}

export async function getJournalStats() {
  await ensureDb();
  const activeEntries = await JournalyEntry.find({ deletedAt: null })
    .sort({ createdAt: 1 })
    .lean();

  const totalEntries = activeEntries.length;

  // Streak calculation
  let currentStreak = 0;
  let longestStreak = 0;
  if (totalEntries > 0) {
    const dates = [
      ...new Set(activeEntries.map((e) => new Date(e.createdAt).toDateString())),
    ].map((d) => new Date(d));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkDate = new Date(today);
    let i = dates.length - 1;

    // Check if wrote today or yesterday
    const lastEntryDate = dates[i];
    const diffDays = Math.floor((today - lastEntryDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      // Calculate current streak
      let tempCheck = new Date(lastEntryDate);
      while (i >= 0) {
        const d = dates[i];
        const gap = Math.floor((tempCheck - d) / (1000 * 60 * 60 * 24));

        if (gap === 0) {
          currentStreak++;
          tempCheck.setDate(tempCheck.getDate() - 1);
          i--;
        } else if (gap === 1) {
          // handled by tempCheck.setDate(-1)
          continue;
        } else {
          break;
        }
      }
    }

    // Longest streak
    let tempLongest = 0;
    let tempCurrent = 0;
    let lastDate = null;

    dates.forEach((d) => {
      if (!lastDate) {
        tempCurrent = 1;
      } else {
        const gap = Math.floor((d - lastDate) / (1000 * 60 * 60 * 24));
        if (gap === 1) {
          tempCurrent++;
        } else if (gap > 1) {
          tempCurrent = 1;
        }
      }
      tempLongest = Math.max(tempLongest, tempCurrent);
      lastDate = d;
    });
    longestStreak = tempLongest;
  }

  // Mood distribution
  const moodDist = [0, 0, 0, 0, 0];
  activeEntries.forEach((e) => {
    if (e.mood >= 1 && e.mood <= 5) {
      moodDist[e.mood - 1]++;
    }
  });

  // Top tags
  const tagCounts = {};
  activeEntries.forEach((e) => {
    e.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Avg length
  const avgLength =
    totalEntries > 0
      ? Math.round(activeEntries.reduce((sum, e) => sum + e.wordCount, 0) / totalEntries)
      : 0;

  return {
    totalEntries,
    currentStreak,
    longestStreak,
    moodDistribution: moodDist,
    topTags,
    avgLength,
  };
}

export async function getAllTags() {
  await ensureDb();
  const tags = await JournalyEntry.distinct('tags', { deletedAt: null });
  return tags.sort();
}
