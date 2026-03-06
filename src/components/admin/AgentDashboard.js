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
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black flex items-center gap-3 tracking-tighter">
            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-black/10">
              <Cpu className="w-6 h-6" />
            </div>
            AGENT CENTER
          </h1>
          <p className="text-neutral-400 text-sm font-medium pl-15">
            Orchestrate and monitor your AI infrastructure
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="rounded-2xl border-neutral-100 bg-white shadow-sm hover:border-neutral-200 px-5 h-11"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Sync Status
          </Button>
        </div>
      </div>

      {/* Health Summary */}
      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white border border-neutral-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
                <Activity className="w-6 h-6" />
              </div>
              <p
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                  health.summary.healthScore >= 80
                    ? 'bg-green-50 text-green-600'
                    : 'bg-yellow-50 text-yellow-600'
                }`}
              >
                Operational
              </p>
            </div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">
              Health Score
            </p>
            <p className="text-3xl font-black tracking-tighter">{health.summary.healthScore}%</p>
          </div>

          <div className="p-6 bg-white border border-neutral-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
                <Server className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">
              Total Cluster
            </p>
            <p className="text-3xl font-black tracking-tighter">{health.summary.totalAgents}</p>
          </div>

          <div className="p-6 bg-white border border-neutral-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
                <Zap className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-md">
                Live
              </p>
            </div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">
              Active Now
            </p>
            <p className="text-3xl font-black tracking-tighter">{health.summary.activeAgents}</p>
          </div>

          <div className="p-6 bg-white border border-neutral-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-1">
              Ready Nodes
            </p>
            <p className="text-3xl font-black tracking-tighter">{health.summary.readyAgents}</p>
          </div>
        </div>
      )}

      {/* Agents Table Section */}
      <div className="bg-white border border-neutral-100 rounded-[2.5rem] shadow-sm overflow-hidden p-2">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead className="">
              <tr>
                <th className="text-left px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-50">
                  Agent Instance
                </th>
                <th className="text-left px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-50">
                  Type
                </th>
                <th className="text-left px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-50">
                  Status
                </th>
                <th className="text-left px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-50">
                  Load
                </th>
                <th className="text-right px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="">
              {agents.map((agent) => (
                <tr
                  key={agent.agentId}
                  className="group hover:bg-neutral-50/50 transition-all duration-300"
                >
                  <td className="px-6 py-6 border-b border-neutral-50">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          agent.isActive ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        {getStatusIcon(agent)}
                      </div>
                      <div>
                        <p className="font-bold text-sm tracking-tight">{agent.name}</p>
                        <p className="text-[11px] text-neutral-400 font-medium max-w-xs truncate mt-0.5">
                          {agent.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 border-b border-neutral-50">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border shadow-sm ${getTypeColor(agent.type)} border-current opacity-70`}
                    >
                      {agent.type}
                    </span>
                  </td>
                  <td className="px-6 py-6 border-b border-neutral-50">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(agent)}
                      {agent.lastExecutedAt && (
                        <span className="text-[10px] text-neutral-300 font-medium">
                          •{' '}
                          {new Date(agent.lastExecutedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6 border-b border-neutral-50">
                    <div className="flex flex-col gap-1.5 min-w-[100px]">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
                        <span>{agent.executionCount || 0} hits</span>
                        <span>{Math.min(100, (agent.executionCount || 0) * 2)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(100, (agent.executionCount || 0) * 2)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 border-b border-neutral-50 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAgent(agent)}
                        className="h-9 px-4 rounded-xl border-neutral-100 bg-white shadow-sm hover:border-neutral-200 text-xs font-bold uppercase tracking-widest"
                      >
                        Config
                      </Button>
                      <Button
                        variant={agent.isActive ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleAgent(agent.agentId, agent.isActive)}
                        disabled={actionInProgress === agent.agentId}
                        className={`h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest ${
                          agent.isActive
                            ? 'text-red-600 border-red-50 hover:bg-red-100'
                            : 'bg-black hover:bg-neutral-800 text-white shadow-lg shadow-black/10'
                        }`}
                      >
                        {actionInProgress === agent.agentId ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : agent.isActive ? (
                          'Kill'
                        ) : (
                          'Power'
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
        <div className="text-center py-24 bg-white border border-neutral-100 rounded-[3rem]">
          <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot className="w-10 h-10 text-neutral-200" />
          </div>
          <h3 className="text-xl font-bold mb-2">Cluster Empty</h3>
          <p className="text-neutral-400 text-sm max-w-xs mx-auto">
            No agent instances are currently registered in your local infrastructure.
          </p>
        </div>
      )}
    </div>
  );
}
