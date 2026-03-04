'use client';

import { CheckCircle2, Clock, BookOpen, Lightbulb, PenTool, Image, Zap, Save } from 'lucide-react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Map graph node names to readable labels and icons
const GRAPH_NODES = {
  fetchExisting: { label: 'Fetching existing content', icon: BookOpen },
  planTopic: { label: 'Planning topic & research', icon: Lightbulb },
  writeDraft: { label: 'Writing draft content', icon: PenTool },
  generateImages: { label: 'Generating images', icon: Image },
  assemblePost: { label: 'Assembling final post', icon: Zap },
  saveDraft: { label: 'Publishing article', icon: Save },
};

const NODE_ORDER = [
  'fetchExisting',
  'planTopic',
  'writeDraft',
  'generateImages',
  'assemblePost',
  'saveDraft',
];
const TOTAL_NODES = NODE_ORDER.length; // 6 nodes

export default function AgentProgress({
  agentId,
  steps = [],
  isComplete = false,
  articleId = null,
}) {
  const [expanded, setExpanded] = useState(true);

  // Filter for agent-specific graph nodes
  const graphSteps = steps.filter((s) => s.type === 'graph_node' && s.agentId === agentId);

  if (!graphSteps || graphSteps.length === 0) {
    return null;
  }

  // Create a map of completed nodes
  const completedNodes = new Set(graphSteps.filter((s) => s.done).map((s) => s.nodeId));

  // Get the article ID from the last completed node
  const lastCompletedStep = graphSteps.find((s) => s.done && s.articleId);
  const finalArticleId = articleId || lastCompletedStep?.articleId;

  // Count completed steps - use TOTAL_NODES as reference, not actual count
  const completedCount = completedNodes.size;
  const totalCount = TOTAL_NODES;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="flex flex-col w-full mb-4 group/progress">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors w-full border border-blue-200/40"
      >
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-neutral-900">Building blog article</span>
            <span className="text-xs font-medium text-blue-600">
              {completedCount}/{totalCount}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 text-neutral-600 ${
            expanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>

      {expanded && (
        <div className="mt-3 ml-2 pl-5 border-l-2 border-dashed border-blue-200 space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
          {NODE_ORDER.map((nodeId) => {
            const nodeInfo = GRAPH_NODES[nodeId];
            if (!nodeInfo) return null;

            const isDone = completedNodes.has(nodeId);
            const Icon = nodeInfo.icon;

            return (
              <div
                key={nodeId}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${
                  isDone
                    ? 'bg-blue-50/50 border border-blue-100/60'
                    : 'bg-neutral-50/50 border border-neutral-100/40'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isDone ? 'bg-green-500 text-white' : 'bg-neutral-300 text-neutral-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                </div>

                <span
                  className={`text-xs font-medium ${
                    isDone ? 'text-green-700' : 'text-neutral-600'
                  }`}
                >
                  {nodeInfo.label}
                </span>

                {!isDone && (
                  <div className="ml-auto">
                    <div className="w-3 h-3 rounded-full border-2 border-transparent border-t-neutral-400 border-r-neutral-400 animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isComplete && (
        <div className="mt-2 p-2.5 rounded-lg bg-green-50 border border-green-200/60 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-xs font-medium text-green-700">
            Article published successfully! ✨
          </span>
        </div>
      )}
    </div>
  );
}
