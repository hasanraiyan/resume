/**
 * Agent Registry
 *
 * Central registry for all AI agents in the system.
 * Provides agent discovery, registration, and execution capabilities.
 */

import BaseAgent from './BaseAgent';
import { AGENT_IDS, DEFAULT_AGENT_CONFIGS } from '@/lib/constants/agents';

class AgentRegistry {
  constructor() {
    if (AgentRegistry.instance) {
      return AgentRegistry.instance;
    }

    /** @private */
    this._agents = new Map();
    /** @private */
    this._agentClasses = new Map();
    /** @private */
    this._initialized = false;

    AgentRegistry.instance = this;
  }

  /**
   * Register an agent class with the registry
   * @param {string} agentId - The unique agent ID from AGENT_IDS
   * @param {typeof BaseAgent} AgentClass - The agent class constructor
   * @param {Object} config - Optional configuration
   * @returns {boolean} Success status
   */
  register(agentId, AgentClass, config = {}) {
    if (!agentId) {
      throw new Error('Agent ID is required for registration');
    }

    if (!(AgentClass.prototype instanceof BaseAgent) && AgentClass !== BaseAgent) {
      throw new Error('Agent class must extend BaseAgent');
    }

    if (this._agents.has(agentId)) {
      console.warn(`Agent ${agentId} is already registered. Overwriting.`);
    }

    this._agentClasses.set(agentId, { AgentClass, config });
    console.log(`[AgentRegistry] Registered agent: ${agentId}`);
    return true;
  }

  /**
   * Get an agent instance by ID (creates if doesn't exist)
   * @param {string} agentId - The agent ID
   * @param {Object} config - Optional configuration overrides
   * @returns {BaseAgent} Agent instance
   */
  get(agentId, config = {}) {
    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    // Return existing instance if available
    if (this._agents.has(agentId)) {
      return this._agents.get(agentId);
    }

    // Create new instance if class is registered
    const registration = this._agentClasses.get(agentId);
    if (registration) {
      const { AgentClass, config: defaultConfig } = registration;
      const mergedConfig = { ...defaultConfig, ...config };
      const agent = new AgentClass(agentId, mergedConfig);
      this._agents.set(agentId, agent);
      console.log(`[AgentRegistry] Created new instance for agent: ${agentId}`);
      return agent;
    }

    throw new Error(`Agent ${agentId} is not registered`);
  }

  /**
   * Get an agent instance without creating it
   * @param {string} agentId - The agent ID
   * @returns {BaseAgent|null} Agent instance or null
   */
  getExisting(agentId) {
    return this._agents.get(agentId) || null;
  }

  /**
   * Execute an agent by ID
   * @param {string} agentId - The agent ID
   * @param {Object} input - Input data for the agent
   * @param {Object} options - Optional execution settings
   * @param {boolean} options.bypassRateLimit - If true, ignore rate limits
   * @param {Object} options.config - Optional configuration overrides for the instance
   * @returns {Promise<Object>} Agent execution result
   */
  async execute(agentId, input, options = {}) {
    const { bypassRateLimit = false, config = {} } = options;
    const agent = this.get(agentId, config);

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!agent.canExecute(bypassRateLimit)) {
      throw new Error(`Agent ${agentId} is rate limited`);
    }

    agent._recordExecution();
    return await agent.execute(input);
  }

  /**
   * Execute an agent by ID as a stream
   * @param {string} agentId - The agent ID
   * @param {Object} input - Input data for the agent
   * @param {Object} options - Optional execution settings
   * @param {boolean} options.bypassRateLimit - If true, ignore rate limits
   * @param {Object} options.config - Optional configuration overrides for the instance
   * @returns {AsyncGenerator<Object>} Agent streaming execution result
   */
  async *streamExecute(agentId, input, options = {}) {
    const { bypassRateLimit = false, config = {} } = options;
    const agent = this.get(agentId, config);

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!agent.canExecute(bypassRateLimit)) {
      throw new Error(`Agent ${agentId} is rate limited`);
    }

    agent._recordExecution();
    yield* agent.streamExecute(input);
  }

  /**
   * Check if an agent is registered
   * @param {string} agentId - The agent ID
   * @returns {boolean} True if registered
   */
  has(agentId) {
    return this._agentClasses.has(agentId);
  }

  /**
   * Check if an agent instance exists
   * @param {string} agentId - The agent ID
   * @returns {boolean} True if instance exists
   */
  hasInstance(agentId) {
    return this._agents.has(agentId);
  }

  /**
   * Get all registered agent IDs
   * @returns {string[]} Array of agent IDs
   */
  getAllIds() {
    return Array.from(this._agentClasses.keys());
  }

  /**
   * Get all agent instances
   * @returns {Map<string, BaseAgent>} Map of agent instances
   */
  getAllInstances() {
    return new Map(this._agents);
  }

  /**
   * Get all registered agents with metadata
   * @returns {Object[]} Array of agent metadata
   */
  getAll() {
    const agents = [];

    for (const [agentId, { AgentClass, config }] of this._agentClasses) {
      const instance = this._agents.get(agentId);
      agents.push({
        agentId,
        name: config.name || DEFAULT_AGENT_CONFIGS[agentId]?.name || 'Unknown',
        description: config.description || DEFAULT_AGENT_CONFIGS[agentId]?.description || '',
        type: config.type || DEFAULT_AGENT_CONFIGS[agentId]?.type || '',
        category: config.category || DEFAULT_AGENT_CONFIGS[agentId]?.category || '',
        icon: config.icon || DEFAULT_AGENT_CONFIGS[agentId]?.icon || '',
        isActive: instance?.isActive ?? config.isActive ?? true,
        isInitialized: instance?.isInitialized ?? false,
        executionCount: instance?.executionCount ?? 0,
      });
    }

    return agents;
  }

  /**
   * Get agents by type
   * @param {string} type - Agent type to filter by
   * @returns {Object[]} Array of agent metadata
   */
  getByType(type) {
    return this.getAll().filter((agent) => agent.type === type);
  }

  /**
   * Get agents by category
   * @param {string} category - Agent category to filter by
   * @returns {Object[]} Array of agent metadata
   */
  getByCategory(category) {
    return this.getAll().filter((agent) => agent.category === category);
  }

  /**
   * Get active agents
   * @returns {Object[]} Array of active agent metadata
   */
  getActive() {
    return this.getAll().filter((agent) => agent.isActive);
  }

  /**
   * Unregister an agent
   * @param {string} agentId - The agent ID
   * @returns {boolean} Success status
   */
  unregister(agentId) {
    const instance = this._agents.get(agentId);
    if (instance) {
      instance.deactivate();
      this._agents.delete(agentId);
    }

    const removed = this._agentClasses.delete(agentId);
    console.log(`[AgentRegistry] Unregistered agent: ${agentId}`);
    return removed;
  }

  /**
   * Clear all registered agents
   */
  clear() {
    for (const [agentId, instance] of this._agents) {
      instance.deactivate();
    }
    this._agents.clear();
    this._agentClasses.clear();
    console.log('[AgentRegistry] Cleared all agents');
  }

  /**
   * Get agent statistics
   * @returns {Object} Registry statistics
   */
  getStats() {
    const allAgents = this.getAll();
    return {
      totalRegistered: this._agentClasses.size,
      totalInstances: this._agents.size,
      activeAgents: allAgents.filter((a) => a.isActive).length,
      initializedAgents: allAgents.filter((a) => a.isInitialized).length,
      totalExecutions: allAgents.reduce((sum, a) => sum + (a.executionCount || 0), 0),
    };
  }

  /**
   * Get metadata for a specific agent
   * @param {string} agentId - The agent ID
   * @returns {Object|null} Agent metadata or null
   */
  getMetadata(agentId) {
    const registration = this._agentClasses.get(agentId);
    if (!registration) {
      return null;
    }

    const instance = this._agents.get(agentId);
    const config = registration.config;

    return {
      agentId,
      name: config.name || DEFAULT_AGENT_CONFIGS[agentId]?.name || 'Unknown',
      description: config.description || DEFAULT_AGENT_CONFIGS[agentId]?.description || '',
      type: config.type || DEFAULT_AGENT_CONFIGS[agentId]?.type || '',
      category: config.category || DEFAULT_AGENT_CONFIGS[agentId]?.category || '',
      icon: config.icon || DEFAULT_AGENT_CONFIGS[agentId]?.icon || '',
      isActive: instance?.isActive ?? config.isActive ?? true,
      isInitialized: instance?.isInitialized ?? false,
      executionCount: instance?.executionCount ?? 0,
      lastExecutedAt: instance?.lastExecutedAt ?? null,
      canExecute: instance?.canExecute() ?? true,
      rateLimit: config.rateLimit,
    };
  }
}

// Export singleton instance
const agentRegistry = new AgentRegistry();
export default agentRegistry;
