import { User, Bot } from 'lucide-react';
import StepHistory from './StepHistory';
import MdContent from './MdContent';
import FinanceChatBlockRenderer from '@/components/pocketly-tracker/FinanceChatBlockRenderer';
import TasklyChatBlockRenderer from '@/components/taskly/TasklyChatBlockRenderer';

export default function MessageList({
  messages,
  messagesEndRef,
  handleUIInteract,
  handleLinkClick,
  theme = 'default',
}) {
  const isGreenTheme = theme === 'green';

  const formatMcqUserMessage = (content) => {
    if (!content || typeof content !== 'string') return content;

    // Single-question MCQ answer: [MCQ answer <id>] Selected options: opt_a, opt_b | Other: ...
    if (content.startsWith('[MCQ answer ')) {
      const afterTag = content.replace(/^\[MCQ answer [^\]]+\]\s*/u, '');

      const selectedMatch = afterTag.match(/Selected options:\s*([^|]+)/i);
      const otherMatch = afterTag.match(/\bOther:\s*(.+)$/i);

      const selectedRaw = (selectedMatch?.[1] || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const prettifyId = (id) => {
        if (!id) return id;
        const cleaned = id.replace(/^mcq[-_]/i, '').replace(/[_-]+/g, ' ');
        return cleaned
          .split(' ')
          .filter(Boolean)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };

      const prettyOptions = selectedRaw.map(prettifyId);
      const otherText = otherMatch?.[1]?.trim();

      if (prettyOptions.length === 0 && !otherText) {
        return content;
      }

      if (prettyOptions.length > 0 && otherText) {
        return `I chose: ${prettyOptions.join(', ')}\nOther: ${otherText}`;
      }

      if (prettyOptions.length > 0) {
        return `I chose: ${prettyOptions.join(', ')}`;
      }

      return `I answered: ${otherText}`;
    }

    // Group MCQ answers: [MCQ group <id>] Q q1: selected: ... || Q q2: selected: ...
    if (content.startsWith('[MCQ group ')) {
      const afterTag = content.replace(/^\[MCQ group [^\]]+\]\s*/u, '');

      const parts = afterTag
        .split('||')
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length === 0) return content;

      const lines = parts.map((part) => {
        // Expect something like: Q qid: selected: a, b | other: text
        const withoutQ = part.replace(/^Q\s+/i, '').trim();
        const [qidPart, rest = ''] = withoutQ.split(':').map((x) => x.trim());

        const selectedMatch = rest.match(/selected:\s*([^|]+)/i);
        const otherMatch = rest.match(/other:\s*(.+)$/i);

        const selectedRaw = (selectedMatch?.[1] || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        const prettifyId = (id) => {
          if (!id) return id;
          const cleaned = id.replace(/^mcq[-_]/i, '').replace(/[_-]+/g, ' ');
          return cleaned
            .split(' ')
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };

        const prettyOptions = selectedRaw.map(prettifyId);
        const otherText = otherMatch?.[1]?.trim();

        const label = prettifyId(qidPart || 'Question');
        const pieces = [];
        if (prettyOptions.length) {
          pieces.push(prettyOptions.join(', '));
        }
        if (otherText) {
          pieces.push(`Other: ${otherText}`);
        }

        if (pieces.length === 0) return null;
        return `- ${label}: ${pieces.join(' | ')}`;
      });

      const filteredLines = lines.filter(Boolean);
      if (!filteredLines.length) return content;

      return `You answered:\n${filteredLines.join('\n')}`;
    }

    return content;
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 space-y-3 bg-gradient-to-b from-white/50 to-neutral-50/50 custom-chat-scrollbar">
      {messages.map((message, index) => {
        // Hide tool_action messages - they're shown in StepHistory instead
        if (message.role === 'tool_action') {
          return null;
        }

        if (message.hidden) return null;
        const isAssistant = message.role === 'assistant';

        let isConsecutive = false;
        for (let i = index - 1; i >= 0; i--) {
          const prevMsg = messages[i];
          if (prevMsg.hidden) continue;
          if (prevMsg.role === 'tool_action' && prevMsg.done) continue;
          isConsecutive = prevMsg.role === message.role;
          break;
        }

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300 w-full`}
          >
            <div className="relative w-7 h-7 shrink-0 mt-1 flex items-center justify-center">
              {!isConsecutive && (
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center shadow-sm ${message.role === 'user' ? (isGreenTheme ? 'bg-[#1f644e] ring-2 ring-[#1f644e]/10' : 'bg-black ring-2 ring-black/10') : 'bg-neutral-100 border border-neutral-200/60'}`}
                >
                  {message.role === 'user' ? (
                    <User className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-neutral-600" />
                  )}
                </div>
              )}
            </div>

            <div
              className={`min-w-0 ${message.role === 'user' ? 'max-w-[85%] items-end' : 'w-full max-w-[95%] items-stretch'} flex flex-1 flex-col`}
            >
              {/* Show tool history for agents */}
              {isAssistant && message.steps?.length > 0 && (
                <StepHistory steps={message.steps} onInteract={handleUIInteract} />
              )}

              {isAssistant && message.uiBlocks?.length > 0 && (
                <div className="mt-3 flex min-w-0 w-full max-w-full self-stretch flex-col gap-3 overflow-x-hidden">
                  {message.uiBlocks.map((block, blockIndex) => {
                    const Renderer =
                      theme === 'taskly' ? TasklyChatBlockRenderer : FinanceChatBlockRenderer;
                    return (
                      <Renderer
                        key={`${message.id}-block-${block.kind}-${blockIndex}`}
                        block={block}
                        onInteract={handleUIInteract}
                      />
                    );
                  })}
                </div>
              )}

              {message.content && (
                <div
                  className={`${
                    isAssistant && message.uiBlocks?.length > 0 ? 'mt-3' : ''
                  } px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-sm text-[13px] overflow-hidden ${message.role === 'user' ? (isGreenTheme ? 'bg-[#1f644e] text-white shadow-[#1f644e]/20 rounded-tr-sm' : 'bg-gradient-to-br from-black to-neutral-900 text-white shadow-black/20 rounded-tr-sm') : 'bg-white/90 backdrop-blur-sm text-neutral-900 shadow-neutral-200/50 border border-neutral-200/50 rounded-tl-sm'}`}
                >
                  {message.role === 'assistant' ? (
                    <MdContent content={message.content} onLinkClick={handleLinkClick} />
                  ) : (
                    <MdContent content={formatMcqUserMessage(message.content)} isUser={true} />
                  )}
                  <p className={`text-[10px] mt-1.5 text-neutral-400`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}
