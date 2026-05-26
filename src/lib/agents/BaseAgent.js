/**
 * Base Agent Class
 *
 * Abstract base class for all AI agents in the system.
 * Provides common functionality for initialization, execution, validation, and logging.
 */

import { AGENT_IDS, DEFAULT_AGENT_CONFIGS, RATE_LIMIT_DEFAULTS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import AgentConfig from '@/models/AgentConfig';
import ProviderSettings from '@/models/ProviderSettings';
import AgentExecutionLog from '@/models/AgentExecutionLog';
import { decrypt } from '@/lib/crypto';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { GoogleGenAI } from '@google/genai';
import keyRotationManager from '@/lib/providers/KeyRotationManager';

class BaseAgent {
  static isAgent = true;

  /**
   * Create a new agent instance
   * @param {string} agentId - The unique agent ID from AGENT_IDS
   * @param {Object} config - Optional configuration overrides
   */
  constructor(agentId, config = {}) {
    if (new.target === BaseAgent) {
      throw new Error('BaseAgent is an abstract class and cannot be instantiated directly.');
    }

    this.agentId = agentId;
    this.config = this._mergeConfig(config);
    this.isActive = this.config.isActive ?? true;
    this.isInitialized = false;
    this.lastInitialized = 0;
    this.lastExecutedAt = null;
    this.executionCount = 0;
    this.logger = this._createLogger();
    /** @private */
    this._initPromise = null;
  }

  /**
   * Merge default config with provided config
   * @private
   */
  _mergeConfig(customConfig = {}) {
    const defaultConfig = DEFAULT_AGENT_CONFIGS[this.agentId] || {};
    return {
      ...defaultConfig,
      ...customConfig,
      rateLimit: {
        ...(RATE_LIMIT_DEFAULTS[this.agentId] || { requests: 10, window: 60 }),
        ...(customConfig.rateLimit || {}),
      },
    };
  }

  /**
   * Create a logger instance for the agent
   * @private
   */
  _createLogger() {
    const prefix = `[Agent:${this.agentId}]`;
    return {
      info: (...args) => console.log(prefix, '[INFO]', ...args),
      warn: (...args) => console.warn(prefix, '[WARN]', ...args),
      error: (...args) => console.error(prefix, '[ERROR]', ...args),
      debug: (...args) => console.debug(prefix, '[DEBUG]', ...args),
    };
  }

  /**
   * Sanitize input for logging — truncates long strings (e.g. base64 data)
   * @private
   */
  _sanitizeLog(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.length > 200) {
        sanitized[key] = value.substring(0, 100) + `... (${value.length} chars)`;
      } else if (Array.isArray(value)) {
        sanitized[key] = `[Array(${value.length})]`;
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Initialize the agent and fetch database configurations
   * Override _onInitialize in subclasses instead of this method
   * @returns {Promise<boolean>} Success status
   */
  async initialize(force = false) {
    const CACHE_TTL = 30000; // 30 seconds cache for DB configs
    if (this.isInitialized && !force && Date.now() - this.lastInitialized < CACHE_TTL) return true;
    if (this._initPromise && !force) return this._initPromise;

    this._initPromise = (async () => {
      this.logger.info('Initializing agent configurations from DB...');

      try {
        await dbConnect();

        // 1. Fetch Agent Specific Configuration
        const dbConfig = await AgentConfig.findOne({ agentId: this.agentId }).lean();
        if (dbConfig) {
          this.config = this._mergeConfig({ ...this.config, ...dbConfig });
          this.isActive = this.config.isActive ?? true;
        }

        // 2. Resolve default provider if configured
        // Support BOTH providerId (DB/Config) AND defaultProvider (Constants)
        const providerId = this.config.providerId || this.config.defaultProvider;
        if (providerId) {
          this.config.provider = await this.resolveProvider(providerId);
        }

        await this._onInitialize();
        this.isInitialized = true;
        this.lastInitialized = Date.now();
        this.logger.info('Agent initialized successfully');
        return true;
      } catch (error) {
        this.logger.error('Failed to initialize agent:', error);
        this.isInitialized = false;
        this._initPromise = null; // Allow retry on failure
        return false;
      }
    })();

    return this._initPromise;
  }

  /**
   * Helper to fetch and decrypt a Provider securely by ID
   * @param {string} providerId
   * @returns {Promise<Object>} The securely decrypted provider configuration
   */
  async resolveProvider(providerId) {
    if (!providerId) return null;
    await dbConnect();

    // 1. Check if this is a POOLED request (e.g. "google-pool" or "openai-pool")
    if (providerId.toLowerCase().includes('-pool')) {
      const baseName = providerId.split('-pool')[0].toLowerCase();

      // Fetch all active providers that match this base name in their ID or name
      const pooledProviders = await ProviderSettings.find({
        isActive: true,
        $or: [
          { providerId: { $regex: baseName, $options: 'i' } },
          { name: { $regex: baseName, $options: 'i' } },
        ],
      }).lean();

      if (pooledProviders.length > 0) {
        this.logger.info(
          `Resolved pooled provider "${providerId}" with ${pooledProviders.length} keys.`
        );

        // Register each in the rotation manager
        for (const p of pooledProviders) {
          if (p.apiKey) {
            try {
              p.apiKey = decrypt(p.apiKey);
              keyRotationManager.registerProvider(providerId, {
                ...p,
                defaultRPM: p.defaultRPM,
                defaultTPM: p.defaultTPM,
                defaultRPD: p.defaultRPD,
              });
            } catch (e) {
              this.logger.error(`Failed to decrypt API key for pooled provider ${p.providerId}`, e);
            }
          }
        }

        // Get the next available key from the pool
        const next = await keyRotationManager.getNextProvider(providerId);
        if (next) {
          return {
            ...next,
            poolId: providerId, // Store this for rotation logic later
            isPooled: true,
          };
        }
      }
    }

    // 2. Standard single provider resolution
    // Try the specific providerId field first (standard for our system)
    let provider = await ProviderSettings.findOne({ providerId }).lean();

    // If not found, try by ID, but only if it looks like a valid ObjectId to avoid CastError
    if (!provider && /^[0-9a-fA-F]{24}$/.test(providerId)) {
      provider = await ProviderSettings.findById(providerId).lean();
    }

    // Fallback for any legacy 'id' field
    if (!provider) {
      provider = await ProviderSettings.findOne({ id: providerId }).lean();
    }

    // NEW: Smart Fallback for default slugs ('google', 'openai')
    const slug = providerId?.toLowerCase();
    if (!provider && (slug === 'google' || slug === 'openai')) {
      this.logger.info(
        `Provider ID "${providerId}" not found. Attempting fuzzy fallback search...`
      );
      const searchTerms = slug === 'google' ? ['google', 'gemini', 'googleapis'] : ['openai'];

      provider = await ProviderSettings.findOne({
        isActive: true,
        $or: [
          { name: { $regex: searchTerms.join('|'), $options: 'i' } },
          { baseUrl: { $regex: searchTerms.join('|'), $options: 'i' } },
          { providerId: { $regex: searchTerms.join('|'), $options: 'i' } },
        ],
      }).lean();

      if (provider) {
        this.logger.info(`Resolved fallback provider: ${provider.name} (${provider.providerId})`);
      }
    }

    if (provider && provider.apiKey) {
      try {
        const encryptedKey = provider.apiKey;

        // Handle both single key string and array of keys
        if (Array.isArray(provider.apiKey)) {
          provider.apiKey = provider.apiKey.map((k) => decrypt(k));

          // AUTO-ENABLE POOLING: If there are multiple keys, register as a pool automatically
          if (provider.apiKey.length > 1) {
            keyRotationManager.registerProvider(provider.providerId, provider);
            const next = await keyRotationManager.getNextProvider(provider.providerId);
            if (next) {
              return {
                ...next,
                poolId: provider.providerId,
                isPooled: true,
              };
            }
          } else if (provider.apiKey.length === 1) {
            // Just one key, make it a string for standard compatibility
            provider.apiKey = provider.apiKey[0];
          }
        } else {
          provider.apiKey = decrypt(provider.apiKey);
        }

        console.log(
          `[BaseAgent:resolveProvider] Resolved provider: ${provider.name} (${provider.providerId})`
        );
        console.log(
          `[BaseAgent:resolveProvider] API Key - Encrypted Length: ${encryptedKey?.length}, Decrypted Length: ${provider.apiKey?.length}`
        );

        if (!provider.apiKey) {
          this.logger.error(
            `Decryption failed for provider ${providerId}. Result was empty string or null.`
          );
        }
      } catch (e) {
        this.logger.error(`Failed to decrypt API key for provider ${providerId}`, e);
        provider.apiKey = null;
      }
    } else {
      console.log(
        `[BaseAgent:resolveProvider] Provider ${providerId} found but NO apiKey field exists.`
      );
    }

    return provider;
  }

  /**
   * Override this method for agent-specific initialization
   * @protected
   */
  async _onInitialize() {
    // To be implemented by subclasses
  }

  /**
   * Execute the agent's primary function
   * @param {Object} input - Input data for the agent
   * @returns {Promise<Object>} Result of agent execution
   */
  async execute(input) {
    if (!this.isActive) {
      throw new Error(`Agent ${this.agentId} is currently inactive.`);
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    this.logger.info('Executing agent with input:', this._sanitizeLog(input));
    this.lastExecutedAt = new Date();
    this.executionCount++;
    const startTime = Date.now();

    try {
      await this._validateInput(input);

      let result;
      let attempts = 0;
      const maxRetries = 5;

      while (attempts < maxRetries) {
        try {
          result = await this._onExecute(input);
          break; // Success!
        } catch (error) {
          if (this._isRetryableError(error) && this.config.provider?.isPooled) {
            this.logger.warn(
              `Retryable error hit on attempt ${attempts + 1}. Rotating key and retrying...`
            );
            await this._rotateProvider();
            attempts++;
            continue;
          }
          throw error; // Rethrow if not a retryable error or no pool available
        }
      }

      this.logger.info('Agent execution completed successfully');

      // ─── NEW: Report Capacity Usage ───
      if (this.config.provider?.isPooled && result?.usage) {
        await keyRotationManager.reportUsage(
          this.config.provider.poolId,
          this.config.provider.internalId,
          result.usage.totalTokens || 0
        );
      }

      // Asynchronously log success
      this._logExecutionToDatabase({ status: 'success', durationMs: Date.now() - startTime }).catch(
        (err) => this.logger.error('Failed to log execution to DB:', err)
      );

      return result;
    } catch (error) {
      this.logger.error('Agent execution failed:', error);

      // Asynchronously log error
      this._logExecutionToDatabase({
        status: 'error',
        durationMs: Date.now() - startTime,
        errorMessage: error?.message || 'Unknown error',
      }).catch((err) => this.logger.error('Failed to log execution error to DB:', err));

      throw error;
    }
  }

  /**
   * Override this method for agent-specific execution logic
   * @protected
   */
  async _onExecute(input) {
    throw new Error('_onExecute must be implemented by subclass');
  }

  /**
   * Execute the agent's primary function as a stream
   * @param {Object} input - Input data for the agent
   * @returns {AsyncGenerator<Object>} Stream of agent execution results
   */
  async *streamExecute(input) {
    if (!this.isActive) {
      throw new Error(`Agent ${this.agentId} is currently inactive.`);
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    this.logger.info('Executing agent stream with input:', this._sanitizeLog(input));
    this.lastExecutedAt = new Date();
    this.executionCount++;
    const startTime = Date.now();

    try {
      await this._validateInput(input);

      let toolCallCount = 0;
      const toolNames = [];
      const toolCallIdToName = new Map(); // resolve TOOL_CALL_END names from AG-UI events
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      let attempts = 0;
      const maxRetries = 5;
      let hasYielded = false;

      while (attempts < maxRetries) {
        try {
          for await (const chunk of this._onStreamExecute(input)) {
            // Only consider the stream "dirty" if we yielded material data (content or results)
            // status and tool_call (started) are considered transient/retryable.
            // Supports both legacy custom event types and AG-UI EventType strings.
            if (
              chunk.type === 'content' ||
              chunk.type === 'TEXT_MESSAGE_CONTENT' ||
              chunk.type === 'tool_result' ||
              chunk.type === 'TOOL_CALL_END' ||
              chunk.type === 'usage' ||
              (chunk.type === 'CUSTOM' && chunk.name === 'coursify_usage')
            ) {
              hasYielded = true;
            }

            // Track tool usage - support legacy and AG-UI event types
            const isToolResult = chunk.type === 'tool_result';
            const isCompletedToolCall = chunk.type === 'tool_call' && chunk.status === 'completed';
            const isAGUIToolEnd = chunk.type === 'TOOL_CALL_END';

            // Register name when a tool call starts so TOOL_CALL_END can resolve it
            if (chunk.type === 'TOOL_CALL_START' && chunk.toolCallId && chunk.toolCallName) {
              toolCallIdToName.set(chunk.toolCallId, chunk.toolCallName);
            }

            if (isToolResult || isCompletedToolCall || isAGUIToolEnd) {
              toolCallCount++;
              const toolName =
                (isAGUIToolEnd && chunk.toolCallId
                  ? toolCallIdToName.get(chunk.toolCallId)
                  : null) ||
                chunk.name ||
                chunk.tool ||
                chunk.toolName ||
                chunk.toolCallName ||
                'unknown';
              toolNames.push(toolName);
              this.logger.debug(`Tool #${toolCallCount}: ${toolName}`);
            }

            // Track token usage if emitted by subclass (legacy `usage` type or AG-UI CUSTOM `coursify_usage`)
            if (chunk.type === 'usage' && chunk.data) {
              usage.promptTokens += chunk.data.promptTokens || 0;
              usage.completionTokens += chunk.data.completionTokens || 0;
              usage.totalTokens += chunk.data.totalTokens || 0;
            } else if (chunk.type === 'CUSTOM' && chunk.name === 'coursify_usage' && chunk.value) {
              usage.promptTokens += chunk.value.promptTokens || 0;
              usage.completionTokens += chunk.value.completionTokens || 0;
              usage.totalTokens += chunk.value.totalTokens || 0;
            }

            yield chunk;
          }
          break; // Success!
        } catch (error) {
          if (this._isRetryableError(error) && this.config.provider?.isPooled) {
            if (hasYielded) {
              this.logger.error(
                `Retryable error hit mid-stream on attempt ${attempts + 1}. Cannot safely retry after yielding data.`
              );
              throw error; // Cannot safely retry if client already received partial data
            }

            this.logger.warn(
              `Retryable error hit on stream attempt ${attempts + 1} before yielding. Rotating key and retrying...`
            );
            await this._rotateProvider();
            attempts++;
            // Re-initialize subclass if necessary before retry
            await this._onInitialize();
            continue;
          }
          throw error;
        }
      }

      const durationMs = Date.now() - startTime;
      this.logger.info(
        `Stream completed — Tools used: ${toolCallCount}, Tokens: ${usage.totalTokens}, Duration: ${durationMs}ms`
      );

      // ─── NEW: Report Capacity Usage ───
      if (this.config.provider?.isPooled && usage.totalTokens > 0) {
        await keyRotationManager.reportUsage(
          this.config.provider.poolId,
          this.config.provider.internalId,
          usage.totalTokens
        );
      }

      // Asynchronously log success
      this._logExecutionToDatabase({
        status: 'success',
        durationMs,
        usage,
        input,
        outputSlug: input.outputSlug,
        outputId: input.outputId,
      }).catch((err) => this.logger.error('Failed to log execution stream to DB:', err));
    } catch (error) {
      this.logger.error('Agent stream execution failed:', error);

      // Asynchronously log error
      this._logExecutionToDatabase({
        status: 'error',
        durationMs: Date.now() - startTime,
        errorMessage: error?.message || 'Unknown error',
        input,
      }).catch((err) => this.logger.error('Failed to log stream execution error to DB:', err));

      throw error;
    }
  }

  /**
   * Override this method for agent-specific streaming execution logic
   * @protected
   */
  async *_onStreamExecute(input) {
    throw new Error('_onStreamExecute must be implemented by subclass for streaming');
  }

  /**
   * Asynchronously log the execution to the database
   * @private
   */
  async _logExecutionToDatabase({
    status,
    durationMs,
    errorMessage,
    usage,
    input,
    outputSlug,
    outputId,
  }) {
    try {
      await dbConnect();
      await AgentExecutionLog.create({
        agentId: this.agentId,
        providerId: this.config.providerId || this.config.defaultProvider,
        status,
        durationMs,
        errorMessage,
        usage,
        input,
        outputSlug,
        outputId,
      });
    } catch (error) {
      this.logger.error('Database execution logging failed:', error);
    }
  }

  /**
   * Validate input before execution
   * @protected
   */
  async _validateInput(input) {
    if (!input) {
      throw new Error('Input cannot be empty');
    }
  }

  /**
   * Check if the agent can execute based on rate limits
   * @param {boolean} bypass - If true, ignore rate limits (for admin/system actions)
   * @returns {boolean} True if execution is allowed
   */
  canExecute(bypass = false) {
    if (!this.isActive) {
      return false;
    }

    if (bypass) {
      return true;
    }

    const { requests, window } = this.config.rateLimit;
    const now = Date.now();
    const windowMs = window * 1000;

    // Simple rate limiting check
    if (!this._executionHistory) {
      this._executionHistory = [];
    }

    // Remove old executions outside the window
    this._executionHistory = this._executionHistory.filter(
      (timestamp) => now - timestamp < windowMs
    );

    return this._executionHistory.length < requests;
  }

  /**
   * Record an execution for rate limiting
   * @protected
   */
  _recordExecution() {
    if (!this._executionHistory) {
      this._executionHistory = [];
    }
    this._executionHistory.push(Date.now());
  }

  /**
   * Get agent statistics
   * @returns {Object} Agent statistics
   */
  getStats() {
    return {
      agentId: this.agentId,
      name: this.config.name,
      isActive: this.isActive,
      isInitialized: this.isInitialized,
      executionCount: this.executionCount,
      lastExecutedAt: this.lastExecutedAt,
      canExecute: this.canExecute(),
      rateLimit: this.config.rateLimit,
    };
  }

  /**
   * Activate the agent
   */
  activate() {
    this.isActive = true;
    this.logger.info('Agent activated');
  }

  /**
   * Deactivate the agent
   */
  deactivate() {
    this.isActive = false;
    this.logger.info('Agent deactivated');
  }

  /**
   * Update agent configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = this._mergeConfig({ ...this.config, ...newConfig });
    this.logger.info('Agent configuration updated');
  }

  /**
   * Get the agent's metadata
   * @returns {Object} Agent metadata
   */
  getMetadata() {
    return {
      agentId: this.agentId,
      name: this.config.name,
      description: this.config.description,
      type: this.config.type,
      category: this.config.category,
      icon: this.config.icon,
      isActive: this.isActive,
    };
  }

  /**
   * Resolve a provider for chat model creation.
   * Reuses the initialized primary provider when possible and only looks up a new one when
   * a different providerId is explicitly requested.
   * @private
   */
  async _resolveChatProvider(providerId = '') {
    // Ensure we have basic config first, but initialize handles its own TTL now
    if (!this.isInitialized) await this.initialize();

    const requestedProviderId =
      providerId || this.config.providerId || this.config.defaultProvider || '';

    // ALWAYS resolve fresh from DB to pick up runtime changes to ProviderSettings (URL, API Key, etc)
    // The resolveProvider method hits the DB directly.
    return await this.resolveProvider(requestedProviderId);
  }

  /**
   * Build a LangChain chat model from an already resolved provider and model selection.
   * @private
   */
  _buildChatModel({ provider, modelName, temperature, maxTokens, purpose = 'chat' }) {
    if (!provider) {
      throw new Error(`No provider resolved for ${purpose} on agent ${this.agentId}`);
    }

    if (!provider.apiKey) {
      console.error(
        `[BaseAgent:_buildChatModel] FAILED: apiKey is MISSING for provider ${provider.name}`
      );
      this.logger.error(
        `API Key is MISSING for provider: ${provider.name} (${provider.providerId}) used in ${purpose}`
      );
      const err = new Error(
        `Missing API key for AI provider: ${provider.name}. Please check Admin > Small Claw.`
      );
      err.lc_error_code = 'MISSING_API_KEY';
      throw err;
    }

    console.log(
      `[BaseAgent:_buildChatModel] Successfully verified apiKey for ${provider.name}. Building ${modelName}...`
    );

    const normalizedModelName = (modelName || '').replace(/^models\//, '');
    if (!normalizedModelName) {
      throw new Error(
        `Chat model name is missing for ${purpose} on agent ${this.agentId}. Please configure it in Agent Settings or Provider Settings.`
      );
    }

    if (provider.baseUrl?.includes('googleapis') || provider.providerId === 'google') {
      return new ChatGoogleGenerativeAI({
        apiKey: provider.apiKey,
        model: normalizedModelName,
        maxOutputTokens: maxTokens,
        temperature,
        timeout: 45000,
        maxRetries: 2,
      });
    }

    return new ChatOpenAI({
      apiKey: provider.apiKey,
      modelName: normalizedModelName,
      configuration: {
        baseURL: provider.baseUrl,
        defaultHeaders: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          'X-Title': 'Coursify AI',
        },
      },
      maxTokens,
      temperature,
      timeout: 45000, // 45 seconds timeout to prevent hanging
      maxRetries: 2,
      streamUsage: true, // MANDATORY for usage tracking in streams
    });
  }

  /**
   * Create a LangChain Chat Model based on current provider and config
   * @param {Object} overrides - Optional overrides for model/temperature etc.
   * @returns {Promise<ChatOpenAI|ChatGoogleGenerativeAI>}
   */
  async createChatModel(overrides = {}) {
    if (!this.isInitialized) await this.initialize();

    const provider = overrides.provider || (await this._resolveChatProvider(overrides.providerId));
    const modelName = overrides.model || this.config.model || provider?.model || '';
    const temperature = overrides.temperature ?? this.config.temperature ?? 0.7;
    const maxTokens = overrides.maxTokens ?? this.config.maxTokens;

    return this._buildChatModel({
      provider,
      modelName,
      temperature,
      maxTokens,
      purpose: 'chat execution',
    });
  }

  /**
   * Create a dedicated chat model for lightweight conversation summarization.
   * Falls back to the primary agent provider/model when a separate summary engine is not configured.
   * @param {Object} overrides - Optional overrides for provider/model/temperature etc.
   * @returns {Promise<ChatOpenAI|ChatGoogleGenerativeAI>}
   */
  async createSummaryChatModel(overrides = {}) {
    if (!this.isInitialized) await this.initialize();

    const summaryProviderId = overrides.providerId ?? this.config.summaryProviderId ?? '';
    const provider = overrides.provider || (await this._resolveChatProvider(summaryProviderId));
    const modelName =
      overrides.model ?? this.config.summaryModel ?? this.config.model ?? provider?.model ?? '';
    const temperature = overrides.temperature ?? this.config.temperature ?? 0.7;
    const maxTokens = overrides.maxTokens ?? this.config.maxTokens;

    return this._buildChatModel({
      provider,
      modelName,
      temperature,
      maxTokens,
      purpose: 'conversation summarization',
    });
  }

  /**
   * Create LangChain Embeddings based on current provider and config
   * @param {Object} overrides - Optional overrides
   * @returns {Promise<OpenAIEmbeddings|GoogleGenerativeAIEmbeddings>}
   */
  async createEmbeddings(overrides = {}) {
    if (!this.isInitialized) await this.initialize();

    const provider = this.config.provider;
    if (!provider) throw new Error(`No provider resolved for agent ${this.agentId}`);

    const modelName = (overrides.model || this.config.model || provider.model || '').replace(
      /^models\//,
      ''
    );

    if (!modelName) {
      throw new Error(
        `Embedding model name is missing for agent ${this.agentId}. Please configure it in Agent Settings or Provider Settings.`
      );
    }

    const dimensions = overrides.dimensions ?? this.config.embeddingDimensions ?? 3072;

    if (provider.baseUrl?.includes('googleapis') || provider.providerId === 'google') {
      return new GoogleGenerativeAIEmbeddings({
        apiKey: provider.apiKey,
        model: modelName,
        taskType: overrides.taskType,
      });
    }

    return new OpenAIEmbeddings({
      openAIApiKey: provider.apiKey,
      modelName: modelName,
      dimensions: dimensions,
      configuration: {
        baseURL: provider.baseUrl,
      },
    });
  }

  /**
   * Create a raw Google GenAI client for specialized tasks (image generation/editing)
   * that require features not supported by LangChain abstractions.
   * @param {Object} overrides - Optional overrides
   * @returns {Promise<{client: GoogleGenAI, modelName: string}>}
   */
  async createGoogleGenAI(overrides = {}) {
    if (!this.isInitialized) await this.initialize();

    const provider = this.config.provider;
    if (!provider) throw new Error(`No provider resolved for agent ${this.agentId}`);

    if (!provider.apiKey) {
      throw new Error(
        `AI Provider API key is missing for agent ${this.agentId}. Please check Admin > Small Claw.`
      );
    }

    const modelName = (overrides.model || this.config.model || provider.model || '').replace(
      /^models\//,
      ''
    );

    if (!modelName) {
      throw new Error(
        `Model name is missing for agent ${this.agentId}. Please configure it in Agent Settings or Provider Settings.`
      );
    }

    const client = new GoogleGenAI({ apiKey: provider.apiKey });
    return { client, modelName };
  }

  /**
   * Check if an error is a rate limit error (429)
   * @private
   */
  _isRateLimitError(error) {
    if (!error) return false;
    const msg = error.message?.toLowerCase() || '';
    const code = error.status || error.statusCode || error.lc_error_code || '';

    return (
      code === 429 ||
      msg.includes('rate limit') ||
      msg.includes('quota exceeded') ||
      msg.includes('429') ||
      msg.includes('too many requests')
    );
  }

  /**
   * Rotate to the next provider in the pool
   * @private
   */
  async _rotateProvider(error) {
    const provider = this.config.provider;
    if (!provider || !provider.isPooled || !provider.poolId) return;

    // 1. Determine cooldown based on error
    let cooldown = 60 * 1000; // Default 1m
    const msg = error?.message?.toLowerCase() || '';
    if (msg.includes('quota exceeded') || msg.includes('daily')) {
      cooldown = 24 * 60 * 60 * 1000; // 24h for daily quota
      this.logger.warn(`Daily quota exceeded for key ${provider.internalId}. Throttling for 24h.`);
    }

    // 2. Mark specific key as throttled (using internalId now!)
    await keyRotationManager.markThrottled(provider.poolId, provider.internalId, cooldown);

    // 3. Get next available
    const next = await keyRotationManager.getNextProvider(provider.poolId);
    if (next) {
      this.logger.info(
        `Rotated from ${provider.internalId} to ${next.internalId} in pool ${provider.poolId}`
      );
      this.config.provider = {
        ...next,
        poolId: provider.poolId,
        isPooled: true,
      };
    } else {
      this.logger.error(`No more providers available in pool ${provider.poolId}`);
      throw new Error(`All API keys in pool ${provider.poolId} are currently rate-limited.`);
    }
  }

  /**
   * Check if an error should trigger a rotation/retry
   * Includes Rate Limits (429) and Network/Fetch failures
   * @private
   */
  _isRetryableError(error) {
    if (!error) return false;
    const msg = error.message?.toLowerCase() || '';
    const code = error.status || error.statusCode || error.lc_error_code || '';

    return (
      code === 429 ||
      msg.includes('rate limit') ||
      msg.includes('quota exceeded') ||
      msg.includes('429') ||
      msg.includes('too many requests') ||
      msg.includes('fetch failed') ||
      msg.includes('econnreset') ||
      msg.includes('etimedout') ||
      msg.includes('enotfound') ||
      msg.includes('network error')
    );
  }
}

export default BaseAgent;
