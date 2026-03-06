/**
 * Agent Manager
 *
 * Runtime agent management for monitoring, orchestration, and lifecycle control.
 * Works with AgentRegistry to provide operational management.
 */

import agentRegistry from './AgentRegistry';
import dbConnect from '@/lib/dbConnect';
import AgentConfig from '@/models/AgentConfig';

class AgentManager {
  constructor() {
    if (AgentManager.instance) {
      return AgentManager.instance;
    }

    this._monitoringInterval = null;
    this._monitoringIntervalMs = 30000; // 30 seconds
    this._metrics = new Map();
    this._eventListeners = new Map();

    AgentManager.instance = this;
  }

  /**
   * Initialize the agent manager
   * Loads agent settings from database and syncs with registry
   */
  async initialize() {
    console.log('[AgentManager] Initializing...');

    try {
      await dbConnect();
      await this._loadAgentSettings();
      this._startMonitoring();

      console.log('[AgentManager] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[AgentManager] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Load agent settings from database
   * @private
   */
  async _loadAgentSettings() {
    try {
      const allConfigs = await AgentConfig.find({}).lean();

      if (!allConfigs || allConfigs.length === 0) {
        console.log('[AgentManager] No agent configurations found in database');
        return;
      }

      // Sync database settings with registry agents
      for (const config of allConfigs) {
        const agentId = config.agentId;

        if (agentRegistry.has(agentId)) {
          // If instance doesn't exist yet, AgentRegistry.get will handle it if we ever need it.
          // For now, we update the config of the existing instance if it exists.
          const agent = agentRegistry.getExisting(agentId);

          if (agent) {
            agent.updateConfig({
              providerId: config.providerId,
              model: config.model,
              persona: config.persona,
              isActive: config.isActive,
              metadata: config.metadata,
              tools: config.tools,
              activeMCPs: config.activeMCPs,
            });
          }

          // Track metrics
          this._updateMetrics(agentId, {
            isActive: config.isActive,
            providerId: config.providerId,
            model: config.model,
          });
        }
      }

      console.log('[AgentManager] Loaded agent settings from database');
    } catch (error) {
      console.error('[AgentManager] Error loading settings:', error);
    }
  }

  /**
   * Start periodic monitoring
   * @private
   */
  _startMonitoring() {
    if (this._monitoringInterval) {
      clearInterval(this._monitoringInterval);
    }

    this._monitoringInterval = setInterval(() => {
      this._collectMetrics();
    }, this._monitoringIntervalMs);

    console.log('[AgentManager] Started monitoring interval');
  }

  /**
   * Stop periodic monitoring
   */
  stopMonitoring() {
    if (this._monitoringInterval) {
      clearInterval(this._monitoringInterval);
      this._monitoringInterval = null;
      console.log('[AgentManager] Stopped monitoring');
    }
  }

  /**
   * Collect metrics from all agents
   * @private
   */
  _collectMetrics() {
    const allAgents = agentRegistry.getAll();

    for (const agent of allAgents) {
      const instance = agentRegistry.getExisting(agent.agentId);
      if (instance) {
        const stats = instance.getStats();
        this._updateMetrics(agent.agentId, stats);
      }
    }

    this._emitEvent('metrics:collected', { timestamp: new Date() });
  }

  /**
   * Update metrics for an agent
   * @private
   */
  _updateMetrics(agentId, metrics) {
    const existing = this._metrics.get(agentId) || {};
    this._metrics.set(agentId, {
      ...existing,
      ...metrics,
      lastUpdated: new Date(),
    });
  }

  /**
   * Get metrics for an agent
   * @param {string} agentId - Agent ID
   * @returns {Object|null} Agent metrics
   */
  getMetrics(agentId) {
    return this._metrics.get(agentId) || null;
  }

  /**
   * Get all agent metrics
   * @returns {Object} All agent metrics
   */
  getAllMetrics() {
    const metrics = {};
    for (const [agentId, data] of this._metrics) {
      metrics[agentId] = data;
    }
    return metrics;
  }

  /**
   * Activate an agent
   * @param {string} agentId - Agent ID
   * @returns {boolean} Success status
   */
  async activateAgent(agentId) {
    let agent = agentRegistry.getExisting(agentId);

    // If no instance exists but it's registered, create it
    if (!agent && agentRegistry.has(agentId)) {
      console.log(`[AgentManager] Instantiating agent for activation: ${agentId}`);
      agent = agentRegistry.get(agentId);
    }

    if (!agent) {
      console.error(`[AgentManager] Agent ${agentId} not found in registry`);
      return false;
    }

    agent.activate();
    this._updateMetrics(agentId, { isActive: true });
    await this._persistAgentState(agentId, { isActive: true });

    this._emitEvent('agent:activated', { agentId, timestamp: new Date() });
    console.log(`[AgentManager] Activated agent: ${agentId}`);
    return true;
  }

  /**
   * Deactivate an agent
   * @param {string} agentId - Agent ID
   * @returns {boolean} Success status
   */
  async deactivateAgent(agentId) {
    let agent = agentRegistry.getExisting(agentId);

    if (!agent && agentRegistry.has(agentId)) {
      console.log(`[AgentManager] Instantiating agent for deactivation: ${agentId}`);
      agent = agentRegistry.get(agentId);
    }

    if (!agent) {
      console.error(`[AgentManager] Agent ${agentId} not found in registry`);
      return false;
    }

    agent.deactivate();
    this._updateMetrics(agentId, { isActive: false });
    await this._persistAgentState(agentId, { isActive: false });

    this._emitEvent('agent:deactivated', { agentId, timestamp: new Date() });
    console.log(`[AgentManager] Deactivated agent: ${agentId}`);
    return true;
  }

  /**
   * Update agent configuration
   * @param {string} agentId - Agent ID
   * @param {Object} config - New configuration
   * @returns {boolean} Success status
   */
  async updateAgentConfig(agentId, config) {
    let agent = agentRegistry.getExisting(agentId);

    if (!agent && agentRegistry.has(agentId)) {
      console.log(`[AgentManager] Instantiating agent for config update: ${agentId}`);
      agent = agentRegistry.get(agentId);
    }

    if (!agent) {
      console.error(`[AgentManager] Agent ${agentId} not found in registry`);
      return false;
    }

    agent.updateConfig(config);
    this._updateMetrics(agentId, config);
    await this._persistAgentState(agentId, config);

    this._emitEvent('agent:config_updated', { agentId, config, timestamp: new Date() });
    console.log(`[AgentManager] Updated config for agent: ${agentId}`);
    return true;
  }

  /**
   * Persist agent state to database
   * @private
   */
  async _persistAgentState(agentId, updates) {
    try {
      await dbConnect();

      // Persist to AgentConfig model (Source of Truth)
      await AgentConfig.findOneAndUpdate(
        { agentId },
        { $set: updates },
        { upsert: true, new: true, runValidators: true }
      );

      console.log(`[AgentManager] Persisted state for agent: ${agentId} (AgentConfig)`);
    } catch (error) {
      console.error(`[AgentManager] Error persisting state for ${agentId}:`, error);
    }
  }

  /**
   * Get agent status
   * @param {string} agentId - Agent ID
   * @returns {Object} Agent status
   */
  getAgentStatus(agentId) {
    const agent = agentRegistry.getExisting(agentId);
    const metrics = this._metrics.get(agentId);

    return {
      agentId,
      isRegistered: agentRegistry.has(agentId),
      isInitialized: agent?.isInitialized ?? false,
      isActive: agent?.isActive ?? false,
      canExecute: agent?.canExecute() ?? false,
      executionCount: agent?.executionCount ?? 0,
      lastExecutedAt: agent?.lastExecutedAt ?? null,
      metrics: metrics || null,
    };
  }

  /**
   * Get status of all agents
   * @returns {Object[]} Array of agent statuses
   */
  getAllStatuses() {
    const allIds = agentRegistry.getAllIds();
    return allIds.map((id) => this.getAgentStatus(id));
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   * @private
   */
  _emitEvent(event, data) {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[AgentManager] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get system health report
   * @returns {Object} Health report
   */
  getHealthReport() {
    const allStatuses = this.getAllStatuses();
    const registryStats = agentRegistry.getStats();

    const activeCount = allStatuses.filter((s) => s.isActive).length;
    const healthyCount = allStatuses.filter((s) => s.isInitialized && s.isActive).length;
    const canExecuteCount = allStatuses.filter((s) => s.canExecute).length;

    return {
      timestamp: new Date(),
      registry: registryStats,
      summary: {
        totalAgents: allStatuses.length,
        activeAgents: activeCount,
        healthyAgents: healthyCount,
        readyAgents: canExecuteCount,
        healthScore:
          allStatuses.length > 0 ? Math.round((healthyCount / allStatuses.length) * 100) : 0,
      },
      agents: allStatuses,
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    console.log('[AgentManager] Shutting down...');

    this.stopMonitoring();

    // Deactivate all agents
    const allIds = agentRegistry.getAllIds();
    for (const agentId of allIds) {
      const agent = agentRegistry.getExisting(agentId);
      if (agent) {
        agent.deactivate();
      }
    }

    this._eventListeners.clear();
    this._metrics.clear();

    console.log('[AgentManager] Shutdown complete');
  }
}

// Export singleton instance
const agentManager = new AgentManager();
export default agentManager;
