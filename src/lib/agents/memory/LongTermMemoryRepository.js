import AgentMemoryEntry from '@/models/AgentMemoryEntry';
import AgentMemoryProfile from '@/models/AgentMemoryProfile';

function buildTextSearchQuery(userMessage = '') {
  return String(userMessage)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3)
    .filter((token) => !COMMON_STOP_WORDS.has(token))
    .slice(0, 10)
    .join(' ');
}

const COMMON_STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'because',
  'before',
  'being',
  'could',
  'from',
  'have',
  'just',
  'like',
  'more',
  'need',
  'some',
  'that',
  'them',
  'there',
  'they',
  'this',
  'want',
  'with',
  'would',
  'your',
]);

class LongTermMemoryRepository {
  async getProfile(namespaceKey) {
    return await AgentMemoryProfile.findOne({ namespaceKey }).lean();
  }

  async upsertProfile(namespaceKey, memoryContext, profile) {
    const now = new Date();
    return await AgentMemoryProfile.findOneAndUpdate(
      { namespaceKey },
      {
        $set: {
          namespaceKey,
          platform: memoryContext.platform,
          integrationId: memoryContext.integrationId,
          userId: memoryContext.userId || memoryContext.chatId,
          chatId: memoryContext.chatId,
          chatType: memoryContext.chatType || 'private',
          username: memoryContext.username || '',
          summary: profile.summary || '',
          facts: profile.facts || [],
          preferences: profile.preferences || [],
          goals: profile.goals || [],
          constraints: profile.constraints || [],
          topics: profile.topics || [],
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    ).lean();
  }

  async markProfileRecalled(namespaceKey) {
    await AgentMemoryProfile.updateOne({ namespaceKey }, { $set: { lastRecalledAt: new Date() } });
  }

  async searchEntries(namespaceKey, userMessage, limit) {
    const searchQuery = buildTextSearchQuery(userMessage);
    if (!searchQuery) {
      return [];
    }

    return await AgentMemoryEntry.find(
      {
        namespaceKey,
        $text: { $search: searchQuery },
      },
      {
        score: { $meta: 'textScore' },
      }
    )
      .select({
        category: 1,
        content: 1,
        keywords: 1,
        salience: 1,
        mentionCount: 1,
        lastObservedAt: 1,
        lastRecalledAt: 1,
        score: { $meta: 'textScore' },
      })
      .sort({
        score: { $meta: 'textScore' },
        salience: -1,
        lastObservedAt: -1,
      })
      .limit(limit)
      .lean();
  }

  async listTopEntries(namespaceKey, limit) {
    return await AgentMemoryEntry.find({ namespaceKey })
      .sort({ salience: -1, lastObservedAt: -1 })
      .limit(limit)
      .lean();
  }

  async listAllEntries(namespaceKey) {
    return await AgentMemoryEntry.find({ namespaceKey })
      .sort({ salience: -1, lastObservedAt: -1 })
      .lean();
  }

  async deleteNamespace(namespaceKey) {
    const [profileResult, entryResult] = await Promise.all([
      AgentMemoryProfile.deleteOne({ namespaceKey }),
      AgentMemoryEntry.deleteMany({ namespaceKey }),
    ]);

    return {
      deletedProfile: (profileResult?.deletedCount || 0) > 0,
      deletedEntries: entryResult?.deletedCount || 0,
    };
  }

  async markEntriesRecalled(entryIds = []) {
    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return;
    }

    await AgentMemoryEntry.updateMany(
      { _id: { $in: entryIds } },
      { $set: { lastRecalledAt: new Date() } }
    );
  }

  async upsertEntry(namespaceKey, memoryContext, entry) {
    const now = new Date();
    const existing = await AgentMemoryEntry.findOne({
      namespaceKey,
      category: entry.category,
      normalizedContent: entry.normalizedContent,
    });

    if (existing) {
      const mergedKeywords = Array.from(
        new Set([...(existing.keywords || []), ...(entry.keywords || [])])
      ).slice(0, 12);

      existing.content = entry.content;
      existing.keywords = mergedKeywords;
      existing.salience = Math.max(existing.salience || 0, entry.salience || 0);
      existing.mentionCount = (existing.mentionCount || 1) + 1;
      existing.lastObservedAt = now;
      existing.username = memoryContext.username || existing.username || '';
      existing.chatId = memoryContext.chatId;
      existing.userId = memoryContext.userId || memoryContext.chatId;
      existing.chatType = memoryContext.chatType || existing.chatType || 'private';
      await existing.save();
      return existing.toObject();
    }

    const created = await AgentMemoryEntry.create({
      namespaceKey,
      platform: memoryContext.platform,
      integrationId: memoryContext.integrationId,
      userId: memoryContext.userId || memoryContext.chatId,
      chatId: memoryContext.chatId,
      chatType: memoryContext.chatType || 'private',
      username: memoryContext.username || '',
      category: entry.category,
      content: entry.content,
      normalizedContent: entry.normalizedContent,
      keywords: entry.keywords || [],
      salience: entry.salience,
      mentionCount: 1,
      firstObservedAt: now,
      lastObservedAt: now,
    });

    return created.toObject();
  }

  async countEntries(namespaceKey) {
    return await AgentMemoryEntry.countDocuments({ namespaceKey });
  }

  async pruneEntries(namespaceKey, maxEntriesPerUser) {
    const totalEntries = await this.countEntries(namespaceKey);
    const overflowCount = totalEntries - maxEntriesPerUser;
    if (overflowCount <= 0) {
      return 0;
    }

    const pruneCandidates = await AgentMemoryEntry.find({ namespaceKey })
      .sort({ salience: 1, lastObservedAt: 1, firstObservedAt: 1 })
      .limit(overflowCount)
      .select({ _id: 1 })
      .lean();

    const idsToDelete = pruneCandidates.map((entry) => entry._id);
    if (idsToDelete.length === 0) {
      return 0;
    }

    await AgentMemoryEntry.deleteMany({ _id: { $in: idsToDelete } });
    return idsToDelete.length;
  }
}

export default LongTermMemoryRepository;
