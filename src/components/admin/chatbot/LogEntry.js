'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Bot,
  Clock,
  Hash,
  Code,
  Terminal,
  BrainCircuit,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ToolUsage = ({ tool }) => (
  <div className="mt-2 p-3 bg-neutral-50 rounded-md border border-neutral-200">
    <p className="font-semibold text-sm text-neutral-800 flex items-center">
      <Code size={14} className="mr-2" />
      Tool: {tool.name} (Iteration {tool.iteration})
    </p>
    <pre className="text-xs bg-neutral-100 p-2 rounded-md mt-1 overflow-auto">
      {JSON.stringify(tool.arguments, null, 2)}
    </pre>
  </div>
);

export default function LogEntry({ log }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(log.createdAt), { addSuffix: true });

  return (
    <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center text-sm text-neutral-500 mb-3">
            <Clock size={14} className="mr-2" />
            <span>
              {timeAgo} on{' '}
              <code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">{log.path}</code>
            </span>
          </div>

          {/* User Message */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
              <MessageSquare size={18} className="text-neutral-600" />
            </div>
            <p className="flex-grow bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-neutral-800">
              {log.userMessage}
            </p>
          </div>

          {/* AI Response */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <p className="flex-grow bg-blue-50 p-3 rounded-lg border border-blue-200 text-neutral-900">
              {log.aiResponse}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors"
          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-neutral-200 animate-fade-in-up">
          <h4 className="font-semibold text-md text-neutral-900 mb-3">Log Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Hash size={14} className="mr-2 text-neutral-500" />
              <strong>Session ID:</strong>
              <code className="ml-2 text-xs bg-neutral-100 px-2 py-1 rounded">{log.sessionId}</code>
            </div>
            <div className="flex items-center">
              <BrainCircuit size={14} className="mr-2 text-neutral-500" />
              <strong>Model:</strong>
              <span className="ml-2">{log.modelName}</span>
            </div>
            <div className="flex items-center">
              <Terminal size={14} className="mr-2 text-neutral-500" />
              <strong>Execution Time:</strong>
              <span className="ml-2">{log.executionTime || 'N/A'} ms</span>
            </div>
          </div>
          {log.toolsUsed && log.toolsUsed.length > 0 && (
            <div className="mt-4">
              <h5 className="font-semibold text-md text-neutral-900 mb-2">Tools Used</h5>
              <div className="space-y-2">
                {log.toolsUsed.map((tool, index) => (
                  <ToolUsage key={index} tool={tool} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
