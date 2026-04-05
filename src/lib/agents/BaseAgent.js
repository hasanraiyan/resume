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

class BaseAgent {
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
  async initialize() {
    if (this.isInitialized) return true;
    if (this._initPromise) return this._initPromise;

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
        provider.apiKey = decrypt(provider.apiKey);

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
      const result = await this._onExecute(input);
      this.logger.info('Agent execution completed successfully');

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
      for await (const chunk of this._onStreamExecute(input)) {
        if (chunk.type === 'tool_result') {
          toolCallCount++;
          const toolName = chunk.name || chunk.toolName || 'unknown';
          toolNames.push(toolName);
          this.logger.debug(`Tool #${toolCallCount}: ${toolName}`);
        }
        yield chunk;
      }

      const durationMs = Date.now() - startTime;
      this.logger.info(
        `Stream completed — Tools used: ${toolCallCount}, Names: [${toolNames.join(', ')}], Duration: ${durationMs}ms`
      );

      // Asynchronously log success
      this._logExecutionToDatabase({ status: 'success', durationMs }).catch((err) =>
        this.logger.error('Failed to log execution stream to DB:', err)
      );
    } catch (error) {
      this.logger.error('Agent stream execution failed:', error);

      // Asynchronously log error
      this._logExecutionToDatabase({
        status: 'error',
        durationMs: Date.now() - startTime,
        errorMessage: error?.message || 'Unknown error',
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
  async _logExecutionToDatabase({ status, durationMs, errorMessage }) {
    try {
      await dbConnect();
      await AgentExecutionLog.create({
        agentId: this.agentId,
        providerId: this.config.providerId || this.config.defaultProvider,
        status,
        durationMs,
        errorMessage,
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
    if (!this.isInitialized) await this.initialize();

    const requestedProviderId = providerId || '';
    const currentProviderId = this.config.providerId || this.config.defaultProvider || '';

    if (!requestedProviderId || requestedProviderId === currentProviderId) {
      return this.config.provider;
    }

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
        `Missing API key for AI provider: ${provider.name}. Please check Admin > AI Command Hub.`
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
      });
    }

    return new ChatOpenAI({
      apiKey: provider.apiKey,
      modelName: normalizedModelName,
      configuration: {
        baseURL: provider.baseUrl,
      },
      maxTokens,
      temperature,
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
        `AI Provider API key is missing for agent ${this.agentId}. Please check Admin > AI Command Hub.`
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
}

export default BaseAgent;
