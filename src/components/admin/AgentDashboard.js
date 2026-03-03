'use client';

import { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Settings2,
  Play,
  Square,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bot,
  Zap,
  TrendingUp,
  Clock,
  Server,
} from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * AgentDashboard
 *
 * Admin dashboard for monitoring and managing all AI agents.
 * Shows agent status, health, metrics, and provides controls.
 */
export default function AgentDashboard() {
  const [agents, setAgents] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    fetchAgents();
    fetchHealth();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/admin/agents/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data.health);
      }
    } catch (error) {
      console.error('Error fetching health:', error);
    }
  };

  const handleToggleAgent = async (agentId, currentStatus) => {
    setActionInProgress(agentId);
    try {
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        await fetchAgents();
        await fetchHealth();
      }
    } catch (error) {
      console.error('Error toggling agent:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRefresh = async () => {
    await fetchAgents();
    await fetchHealth();
  };

  const getStatusIcon = (agent) => {
    if (!agent.isActive) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (agent.isInitialized && agent.canExecute) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    if (agent.isInitialized) {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
    return <Clock className="w-5 h-5 text-neutral-400" />;
  };

  const getStatusBadge = (agent) => {
    if (!agent.isActive) {
      return (
        <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
          Inactive
        </span>
      );
    }
    if (agent.isInitialized && agent.canExecute) {
      return (
        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
          Ready
        </span>
      );
    }
    if (agent.isInitialized) {
      return (
        <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full">
          Initializing
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-neutral-50 text-neutral-700 text-xs font-medium rounded-full">
        Pending
      </span>
    );
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'media':
        return 'bg-blue-100 text-blue-700';
      case 'chat':
        return 'bg-purple-100 text-purple-700';
      case 'content':
        return 'bg-orange-100 text-orange-700';
      case 'analytics':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="w-6 h-6" />
            Agent Dashboard
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Monitor and manage your AI agents</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Health Summary */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white border border-neutral-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Health Score</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    health.summary.healthScore >= 80
                      ? 'text-green-600'
                      : health.summary.healthScore >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {health.summary.healthScore}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-neutral-300" />
            </div>
          </div>

          <div className="p-4 bg-white border border-neutral-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Total Agents</p>
                <p className="text-2xl font-bold mt-1">{health.summary.totalAgents}</p>
              </div>
              <Server className="w-8 h-8 text-neutral-300" />
            </div>
          </div>

          <div className="p-4 bg-white border border-neutral-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Active Agents</p>
                <p className="text-2xl font-bold mt-1">{health.summary.activeAgents}</p>
              </div>
              <Zap className="w-8 h-8 text-neutral-300" />
            </div>
          </div>

          <div className="p-4 bg-white border border-neutral-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  Ready to Execute
                </p>
                <p className="text-2xl font-bold mt-1">{health.summary.readyAgents}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-neutral-300" />
            </div>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Agent
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Executions
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {agents.map((agent) => (
                <tr key={agent.agentId} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(agent)}
                      <div>
                        <p className="font-medium text-sm">{agent.name}</p>
                        <p className="text-xs text-neutral-500 max-w-xs truncate">
                          {agent.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(agent.type)}`}
                    >
                      {agent.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(agent)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="w-4 h-4 text-neutral-400" />
                      {agent.executionCount || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-neutral-500">
                      <Clock className="w-4 h-4" />
                      {agent.lastExecutedAt
                        ? new Date(agent.lastExecutedAt).toLocaleString()
                        : 'Never'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAgent(agent)}
                        className="text-xs"
                      >
                        <Settings2 className="w-3 h-3 mr-1" />
                        Configure
                      </Button>
                      <Button
                        variant={agent.isActive ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleAgent(agent.agentId, agent.isActive)}
                        disabled={actionInProgress === agent.agentId}
                        className={`text-xs ${
                          agent.isActive
                            ? 'text-red-600 border-red-200 hover:bg-red-50'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {actionInProgress === agent.agentId ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : agent.isActive ? (
                          <>
                            <Square className="w-3 h-3 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {agents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">No agents registered</p>
        </div>
      )}
    </div>
  );
}
