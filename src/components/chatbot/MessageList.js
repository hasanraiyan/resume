import { User, Bot } from 'lucide-react';
import StepHistory from './StepHistory';
import MdContent from './MdContent';
import FinanceChatBlockRenderer from '@/components/pocketly-tracker/FinanceChatBlockRenderer';
import TasklyChatBlockRenderer from '@/components/taskly/TasklyChatBlockRenderer';
import MCQ from './MCQ';

export default function MessageList({
  messages,
  messagesEndRef,
  handleUIInteract,
  handleLinkClick,
  theme = 'default',
}) {
  const isGreenTheme = theme === 'green';

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
                    if (block.kind === 'mcq') {
                      const data = block.data || {};
                      return (
                        <MCQ
                          key={`${message.id}-block-${block.kind}-${blockIndex}`}
                          id={message.id}
                          prompt={data.prompt}
                          options={data.options}
                          validation={data.validation}
                          mode={data.mode || 'single'}
                          onSubmit={(value) =>
                            handleUIInteract?.({ type: 'mcq_response', ...value })
                          }
                        />
                      );
                    }
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
                    <MdContent content={message.content} isUser={true} />
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
