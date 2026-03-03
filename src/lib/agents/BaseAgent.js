/**
 * Base Agent Class
 *
 * Abstract base class for all AI agents in the system.
 * Provides common functionality for initialization, execution, validation, and logging.
 */

import { AGENT_IDS, DEFAULT_AGENT_CONFIGS, RATE_LIMIT_DEFAULTS } from '@/lib/constants/agents';

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
   * Initialize the agent
   * Override this method in subclasses to perform setup
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    this.logger.info('Initializing agent...');

    try {
      await this._onInitialize();
      this.isInitialized = true;
      this.logger.info('Agent initialized successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize agent:', error);
      this.isInitialized = false;
      return false;
    }
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

    this.logger.info('Executing agent with input:', input);
    this.lastExecutedAt = new Date();
    this.executionCount++;

    try {
      await this._validateInput(input);
      const result = await this._onExecute(input);
      this.logger.info('Agent execution completed successfully');
      return result;
    } catch (error) {
      this.logger.error('Agent execution failed:', error);
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
   * @returns {boolean} True if execution is allowed
   */
  canExecute() {
    if (!this.isActive) {
      return false;
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
}

export default BaseAgent;
