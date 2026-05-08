import dbConnect from '@/lib/dbConnect';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import LongTermMemoryRepository from './LongTermMemoryRepository';
import {
  buildTelegramMemoryNamespaceKey,
  getLongTermMemoryConfig,
  isPrivateTelegramMemoryContext,
  normalizeMemoryContext,
} from './longTermMemoryConfig';

const ALLOWED_ENTRY_CATEGORIES = new Set([
  'identity',
  'preference',
  'goal',
  'constraint',
  'project',
  'task',
  'context',
]);

class LongTermMemoryService {
  constructor({ logger } = {}) {
    this.logger = logger || console;
    this.repository = new LongTermMemoryRepository();
  }

  getConfig(metadata = {}) {
    return getLongTermMemoryConfig(metadata);
  }

  isEnabled(metadata = {}, memoryContext = {}) {
    const config = this.getConfig(metadata);
    return config.enabled && isPrivateTelegramMemoryContext(memoryContext);
  }

  async recall({ metadata = {}, memoryContext = {}, userMessage = '' }) {
    const config = this.getConfig(metadata);
    const normalizedContext = normalizeMemoryContext(memoryContext);

    if (!this.isEnabled(metadata, normalizedContext)) {
      return {
        enabled: false,
        config,
        namespaceKey: '',
        profile: null,
        entries: [],
      };
    }

    const namespaceKey = buildTelegramMemoryNamespaceKey(normalizedContext);
    if (!namespaceKey) {
      return {
        enabled: false,
        config,
        namespaceKey: '',
        profile: null,
        entries: [],
      };
    }

    await dbConnect();

    const profile = await this.repository.getProfile(namespaceKey);
    let entries = [];

    try {
      entries = await this.repository.searchEntries(
        namespaceKey,
        userMessage,
        config.retrievalLimit
      );
    } catch (error) {
      this.logger.warn?.('Long-term memory text search failed, falling back to recency.', error);
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      entries = await this.repository.listTopEntries(namespaceKey, config.retrievalLimit);
    }

    if (profile) {
      await this.repository
        .markProfileRecalled(namespaceKey)
        .catch((error) =>
          this.logger.warn?.('Failed to update long-term profile recall timestamp.', error)
        );
    }

    if (entries.length > 0) {
      await this.repository
        .markEntriesRecalled(entries.map((entry) => entry._id))
        .catch((error) =>
          this.logger.warn?.('Failed to update long-term entry recall timestamps.', error)
        );
    }

    return {
      enabled: true,
      config,
      namespaceKey,
      profile: normalizeProfile(profile),
      entries: entries.map(normalizeEntry).filter(Boolean),
    };
  }

  async getDebugSnapshot({ metadata = {}, memoryContext = {} }) {
    const config = this.getConfig(metadata);
    const normalizedContext = normalizeMemoryContext(memoryContext);
    const namespaceKey = buildTelegramMemoryNamespaceKey(normalizedContext);

    if (!isPrivateTelegramMemoryContext(normalizedContext) || !namespaceKey) {
      return {
        enabled: false,
        config,
        namespaceKey: '',
        profile: null,
        entries: [],
      };
    }

    await dbConnect();

    const profile = await this.repository.getProfile(namespaceKey);
    const entries = await this.repository.listAllEntries(namespaceKey);

    return {
      enabled: config.enabled,
      config,
      namespaceKey,
      profile: normalizeProfile(profile),
      entries: entries.map(normalizeEntry).filter(Boolean),
    };
  }

  async resetMemory({ metadata = {}, memoryContext = {} }) {
    const config = this.getConfig(metadata);
    const normalizedContext = normalizeMemoryContext(memoryContext);
    const namespaceKey = buildTelegramMemoryNamespaceKey(normalizedContext);

    if (!isPrivateTelegramMemoryContext(normalizedContext) || !namespaceKey) {
      return {
        enabled: config.enabled,
        namespaceKey: '',
        deletedProfile: false,
        deletedEntries: 0,
      };
    }

    await dbConnect();

    const result = await this.repository.deleteNamespace(namespaceKey);
    return {
      enabled: config.enabled,
      namespaceKey,
      deletedProfile: result.deletedProfile,
      deletedEntries: result.deletedEntries,
    };
  }

  formatForPrompt(recalledMemory) {
    if (!recalledMemory?.enabled) {
      return '';
    }

    const sections = [];
    const profile = normalizeProfile(recalledMemory.profile);
    const entries = Array.isArray(recalledMemory.entries) ? recalledMemory.entries : [];

    if (profile.summary) {
      sections.push(`User profile summary:\n- ${profile.summary}`);
    }

    const profileLists = [
      ['Known facts', profile.facts],
      ['Preferences', profile.preferences],
      ['Goals', profile.goals],
      ['Constraints', profile.constraints],
      ['Recurring topics', profile.topics],
    ];

    for (const [label, values] of profileLists) {
      if (Array.isArray(values) && values.length > 0) {
        sections.push(`${label}:\n${values.map((value) => `- ${value}`).join('\n')}`);
      }
    }

    if (entries.length > 0) {
      sections.push(
        `Relevant long-term memory:\n${entries
          .map((entry) => `- [${entry.category}] ${entry.content}`)
          .join('\n')}`
      );
    }

    if (sections.length === 0) {
      return '';
    }

    return `Long-term memory for this Telegram user:\n${sections.join('\n\n')}`;
  }

  async extractAndPersist({
    metadata = {},
    memoryContext = {},
    userMessage = '',
    assistantMessage = '',
    threadSummary = '',
    llm,
  }) {
    const config = this.getConfig(metadata);
    const normalizedContext = normalizeMemoryContext(memoryContext);

    if (!this.isEnabled(metadata, normalizedContext) || !assistantMessage?.trim() || !llm) {
      return { enabled: false, profileUpdated: false, entriesUpserted: 0, entriesPruned: 0 };
    }

    const namespaceKey = buildTelegramMemoryNamespaceKey(normalizedContext);
    if (!namespaceKey) {
      return { enabled: false, profileUpdated: false, entriesUpserted: 0, entriesPruned: 0 };
    }

    await dbConnect();

    const existingProfile = normalizeProfile(await this.repository.getProfile(namespaceKey));
    const extraction = await this._extractMemoryPayload({
      llm,
      existingProfile,
      userMessage,
      assistantMessage,
      threadSummary,
    });

    if (!extraction) {
      return { enabled: true, profileUpdated: false, entriesUpserted: 0, entriesPruned: 0 };
    }

    const mergedProfile = mergeProfiles(existingProfile, extraction.profile);
    let profileUpdated = false;
    let entriesUpserted = 0;

    if (hasProfileContent(mergedProfile)) {
      await this.repository.upsertProfile(namespaceKey, normalizedContext, mergedProfile);
      profileUpdated = true;
    }

    const entriesToPersist = (extraction.entries || []).filter(
      (entry) => entry.salience >= config.minSalienceToStore
    );

    for (const entry of entriesToPersist) {
      await this.repository.upsertEntry(namespaceKey, normalizedContext, entry);
      entriesUpserted += 1;
    }

    const entriesPruned = await this.repository.pruneEntries(
      namespaceKey,
      config.maxEntriesPerUser
    );

    return {
      enabled: true,
      profileUpdated,
      entriesUpserted,
      entriesPruned,
    };
  }

  async _extractMemoryPayload({
    llm,
    existingProfile,
    userMessage,
    assistantMessage,
    threadSummary,
  }) {
    const extractionPrompt = [
      'You extract long-term memory for a Telegram assistant.',
      'Return valid JSON only. Do not use Markdown fences.',
      'Never store secrets, API keys, auth codes, OTPs, passwords, payment data, or one-time access tokens.',
      'Only keep memory that would help future conversations with the same user.',
      'Preserve user-specific facts, preferences, goals, constraints, and recurring context.',
      'Add memory entries only when they are meaningful and reusable.',
      'Use salience from 0.0 to 1.0.',
      'Respond with this schema:',
      JSON.stringify(
        {
          profile: {
            summary: 'string',
            facts: ['string'],
            preferences: ['string'],
            goals: ['string'],
            constraints: ['string'],
            topics: ['string'],
          },
          entries: [
            {
              category: 'identity|preference|goal|constraint|project|task|context',
              content: 'string',
              keywords: ['string'],
              salience: 0.85,
            },
          ],
        },
        null,
        2
      ),
    ].join('\n');

    const humanPrompt = [
      'Current profile:',
      JSON.stringify(existingProfile, null, 2),
      '',
      'Latest user message:',
      userMessage || '(empty)',
      '',
      'Latest assistant reply:',
      assistantMessage || '(empty)',
      '',
      'Short-term thread summary:',
      threadSummary || '(empty)',
    ].join('\n');

    try {
      const response = await llm.invoke([
        new SystemMessage({ content: extractionPrompt }),
        new HumanMessage({ content: humanPrompt }),
      ]);

      const parsed = parseJsonPayload(extractTextContent(response?.content));
      if (!parsed) {
        return null;
      }

      return {
        profile: normalizeProfile(parsed.profile),
        entries: normalizeEntries(parsed.entries),
      };
    } catch (error) {
      this.logger.warn?.('Long-term memory extraction failed.', error);
      return null;
    }
  }
}

function extractTextContent(content) {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item.text === 'string') return item.text;
        return '';
      })
      .join('\n')
      .trim();
  }

  return '';
}

function parseJsonPayload(raw = '') {
  if (!raw) {
    return null;
  }

  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonCandidate = fencedMatch?.[1]?.trim() || raw.trim();

  try {
    return JSON.parse(jsonCandidate);
  } catch (error) {
    const firstBrace = jsonCandidate.indexOf('{');
    const lastBrace = jsonCandidate.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(jsonCandidate.slice(firstBrace, lastBrace + 1));
      } catch (nestedError) {
        return null;
      }
    }
    return null;
  }
}

function normalizeProfile(profile = {}) {
  return {
    summary: sanitizeString(profile?.summary, 700),
    facts: sanitizeStringList(profile?.facts),
    preferences: sanitizeStringList(profile?.preferences),
    goals: sanitizeStringList(profile?.goals),
    constraints: sanitizeStringList(profile?.constraints),
    topics: sanitizeStringList(profile?.topics),
  };
}

function mergeProfiles(existingProfile = {}, nextProfile = {}) {
  const current = normalizeProfile(existingProfile);
  const incoming = normalizeProfile(nextProfile);

  return {
    summary: incoming.summary || current.summary || '',
    facts: mergeStringLists(current.facts, incoming.facts),
    preferences: mergeStringLists(current.preferences, incoming.preferences),
    goals: mergeStringLists(current.goals, incoming.goals),
    constraints: mergeStringLists(current.constraints, incoming.constraints),
    topics: mergeStringLists(current.topics, incoming.topics),
  };
}

function hasProfileContent(profile = {}) {
  return Boolean(
    profile.summary ||
    profile.facts?.length ||
    profile.preferences?.length ||
    profile.goals?.length ||
    profile.constraints?.length ||
    profile.topics?.length
  );
}

function normalizeEntries(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }

  const seen = new Set();
  const normalizedEntries = [];

  for (const entry of entries) {
    const category = ALLOWED_ENTRY_CATEGORIES.has(entry?.category) ? entry.category : 'context';
    const content = sanitizeString(entry?.content, 400);
    if (!content) {
      continue;
    }

    const normalizedContent = content.toLowerCase().replace(/\s+/g, ' ').trim();
    const dedupeKey = `${category}:${normalizedContent}`;
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    normalizedEntries.push({
      category,
      content,
      normalizedContent,
      keywords: sanitizeStringList(entry?.keywords).slice(0, 12),
      salience: clampDecimal(entry?.salience, 0.5),
    });
  }

  return normalizedEntries;
}

function normalizeEntry(entry = {}) {
  return {
    _id: entry._id,
    category: sanitizeString(entry.category, 40) || 'context',
    content: sanitizeString(entry.content, 400),
    salience: clampDecimal(entry.salience, 0.5),
    mentionCount: Number.isFinite(Number(entry.mentionCount)) ? Number(entry.mentionCount) : 1,
    lastObservedAt: entry.lastObservedAt || null,
    lastRecalledAt: entry.lastRecalledAt || null,
    keywords: sanitizeStringList(entry.keywords).slice(0, 12),
  };
}

function sanitizeString(value, maxLength = 160) {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  return normalized.slice(0, maxLength);
}

function sanitizeStringList(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(values.map((value) => sanitizeString(value, 160)).filter(Boolean))
  ).slice(0, 12);
}

function mergeStringLists(existingValues = [], nextValues = []) {
  return Array.from(new Set([...(existingValues || []), ...(nextValues || [])])).slice(0, 12);
}

function clampDecimal(value, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Number(Math.min(Math.max(numericValue, 0), 1).toFixed(2));
}

export default LongTermMemoryService;
