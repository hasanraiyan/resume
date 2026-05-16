'use client';

import { useState, useEffect } from 'react';
import { Bot, Activity, Network, Power, Loader2 } from 'lucide-react';
import { Card } from '@/components/custom-ui';
import { useSmallClaw } from '@/context/SmallClawContext';
import AgentConfigurationModal from '@/components/admin/AgentConfigurationModal';
import { formatDistanceToNow } from 'date-fns';

export default function AgentsTab() {
  const { agents, providers, refreshAgents, refreshProviders, searchQuery } = useSmallClaw();

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const needsAgents = agents.length === 0;
      const needsProviders = providers.length === 0;

      if (needsAgents || needsProviders) {
        setIsLoading(true);
        const promises = [];
        if (needsAgents) promises.push(refreshAgents());
        if (needsProviders) promises.push(refreshProviders());
        await Promise.all(promises);
        setIsLoading(false);
      }
    };

    loadData();
  }, [agents.length, providers.length, refreshAgents, refreshProviders]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-[#1f644e] animate-spin" />
        <p className="mt-4 text-neutral-500 font-medium">Loading Agents...</p>
      </div>
    );
  }

  const filteredAgents = agents.filter(
    (a) =>
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-[#1e3a34]">
            Intelligent Agents
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Configure models, tools, and capabilities for your system agents.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Card
            key={agent.agentId}
            interactive
            className="group flex flex-col h-full bg-white border-2 border-neutral-100 rounded-xl overflow-hidden cursor-pointer hover:border-[#1f644e] transition-all duration-300 relative"
            onClick={() => {
              setSelectedAgent(agent);
              setIsAgentModalOpen(true);
            }}
          >
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${agent.isActive ? 'bg-[#1f644e] text-white' : 'bg-neutral-100 text-neutral-400'}`}
                  >
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900 group-hover:text-[#1e3a34] transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium capitalize mt-0.5">
                      {agent.category} Engine
                    </p>
                  </div>
                </div>
                <div title={agent.isActive ? 'Online' : 'Offline'}>
                  {agent.isActive ? (
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  ) : (
                    <Power className="w-4 h-4 text-neutral-300" />
                  )}
                </div>
              </div>

              {agent.description && (
                <p className="text-sm text-neutral-600 line-clamp-2 mt-2 mb-4 flex-1">
                  {agent.description}
                </p>
              )}

              <div className="flex flex-col gap-1.5 mb-6">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Activity className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="font-medium text-neutral-700">
                    {agent.executionCount || 0}
                  </span>{' '}
                  Executions
                </div>
                {agent.lastExecutedAt && (
                  <div className="text-[10px] text-neutral-400 ml-5.5">
                    Last run{' '}
                    {formatDistanceToNow(new Date(agent.lastExecutedAt), { addSuffix: true })}
                  </div>
                )}
              </div>

              <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-neutral-100">
                {agent.model ? (
                  <span
                    className="px-2.5 py-1 bg-neutral-100 text-neutral-700 text-[10px] font-mono rounded-md border border-neutral-200/60 truncate max-w-[140px]"
                    title={agent.model}
                  >
                    {agent.model}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/50 text-[10px] font-medium rounded-md">
                    No Model Set
                  </span>
                )}

                {agent.tools && agent.tools.length > 0 && (
                  <span className="px-2.5 py-1 bg-neutral-50 text-neutral-600 text-[10px] font-medium rounded-md border border-neutral-200/60 flex items-center gap-1">
                    <Network className="w-3 h-3" />
                    {agent.tools.length} {agent.tools.length === 1 ? 'Tool' : 'Tools'}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {agents.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50 flex flex-col items-center justify-center">
          <Bot className="w-12 h-12 text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700">No Agents Configured</h3>
          <p className="text-sm text-neutral-500 mt-2 max-w-md">
            Create an agent and assign it a model and tools to start building your AI workforce.
          </p>
        </div>
      ) : filteredAgents.length === 0 && searchQuery ? (
        <div className="text-center p-12 border border-dashed rounded-2xl bg-neutral-50 text-neutral-500">
          No agents match your search for "{searchQuery}".
        </div>
      ) : null}

      <AgentConfigurationModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        agentData={selectedAgent}
        providers={providers}
        onSave={refreshAgents}
      />
    </div>
  );
}
