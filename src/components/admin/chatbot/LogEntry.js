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
    <div className="mt-2 space-y-2">
      <div>
        <p className="text-xs font-medium text-neutral-600 mb-1">Arguments:</p>
        <pre className="text-xs bg-neutral-100 p-2 rounded-md overflow-auto">
          {JSON.stringify(tool.arguments, null, 2)}
        </pre>
      </div>
      {tool.result && (
        <div>
          <p className="text-xs font-medium text-neutral-600 mb-1">
            Result:
            {tool.result._truncated && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                Truncated ({tool.result._originalSize} chars → 5KB limit)
              </span>
            )}
          </p>
          <pre className="text-xs bg-green-50 border border-green-200 p-2 rounded-md overflow-auto max-h-48">
            {JSON.stringify(tool.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  </div>
);

export default function LogEntry({ log }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(log.createdAt), { addSuffix: true });

  // Debug: Check conversationContext in individual log
  console.log(
    `[LogEntry] 🔍 Log ${log._id} has conversationContext: ${log.conversationContext ? 'YES' : 'NO'}`
  );
  if (log.conversationContext) {
    console.log(`[LogEntry] 📊 Log ${log._id} context messages: ${log.conversationContext.length}`);
    console.log(
      `[LogEntry] 📋 Log ${log._id} context type: ${Array.isArray(log.conversationContext) ? 'Array' : typeof log.conversationContext}`
    );
    if (log.conversationContext.length > 0) {
      console.log(`[LogEntry] 📋 First message role: ${log.conversationContext[0]?.role || 'N/A'}`);
      console.log(
        `[LogEntry] 📋 First message preview: ${log.conversationContext[0]?.content?.substring(0, 100) || 'N/A'}...`
      );
    }
  } else {
    console.log(`[LogEntry] ⚠️ Log ${log._id} missing conversationContext field`);
  }

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
          {log.conversationContext && log.conversationContext.length > 0 && (
            <div className="mt-4">
              <h5 className="font-semibold text-md text-neutral-900 mb-2">
                Conversation Context Sent to AI
              </h5>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {log.conversationContext.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md border ${
                      message.role === 'system'
                        ? 'bg-blue-50 border-blue-200'
                        : message.role === 'user'
                          ? 'bg-green-50 border-green-200'
                          : message.role === 'assistant'
                            ? 'bg-purple-50 border-purple-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <p className="text-xs font-medium text-neutral-600 mb-1">
                      {message.role === 'system' && '🤖 System'}
                      {message.role === 'user' && '👤 User'}
                      {message.role === 'assistant' && '🧠 Assistant'}
                      {message.role === 'tool' && '🔧 Tool'}
                    </p>
                    <div className="text-sm text-neutral-800 whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show message if conversation context is missing (for older logs) */}
          {(!log.conversationContext || log.conversationContext.length === 0) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This log was created before conversation context tracking was
                implemented. Conversation context shows all messages sent to the AI for debugging
                purposes.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
