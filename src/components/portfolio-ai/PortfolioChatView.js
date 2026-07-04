'use client';

import { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import ChatInput from '@/components/chatbot/ChatInput';
import MdContent from '@/components/chatbot/MdContent';
import PortfolioChatBlockRenderer from './PortfolioChatBlockRenderer';

export default function PortfolioChatView({
  messages,
  isLoading,
  statusMessage,
  inputMessage,
  setInputMessage,
  inputRef,
  onQuery,
  isListening,
  toggleListening,
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    onQuery(inputMessage);
  };

  const visibleMessages = messages.filter(
    (m) => !m.hidden && m.role !== 'tool' && m.role !== 'tool_action'
  );

  const lastMessage = visibleMessages[visibleMessages.length - 1];
  const showFollowUps =
    lastMessage &&
    lastMessage.role === 'assistant' &&
    !isLoading &&
    lastMessage.followUpQuestions?.length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {visibleMessages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`flex gap-2.5 max-w-[96%] sm:max-w-[85%] min-w-0 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-7 h-7 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white/70">
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex flex-col gap-3 min-w-0">
                    {message.content && (
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-white/[0.06] backdrop-blur-xl border border-white/10 text-white/90 rounded-tl-sm'
                        }`}
                      >
                        {isUser ? message.content : <MdContent content={message.content} />}
                      </div>
                    )}
                    {message.uiBlocks?.length > 0 && (
                      <div className="flex flex-col gap-3">
                        {message.uiBlocks.map((block, i) => (
                          <PortfolioChatBlockRenderer
                            key={`${message.id}-${block.kind}-${i}`}
                            block={block}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-2.5">
                <div className="w-7 h-7 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white/70">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                  {statusMessage && (
                    <span className="ml-1.5 text-white/40 text-xs">{statusMessage}</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto px-2 pb-4 sm:pb-6 flex flex-col gap-3">
        {showFollowUps && (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {lastMessage.followUpQuestions.map((question) => (
              <button
                key={question}
                onClick={() => onQuery(question)}
                className="shrink-0 px-3.5 py-2 rounded-full text-xs font-medium bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/70 hover:text-white/90 transition-colors whitespace-nowrap cursor-pointer"
              >
                {question}
              </button>
            ))}
          </div>
        )}
        <ChatInput
          inputRef={inputRef}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          isLoading={isLoading}
          handleSubmit={handleSubmit}
          activeQuote=""
          isListening={isListening}
          toggleListening={toggleListening}
          showModelSelector={false}
          theme="dark"
          showTopBorder={false}
          placeholder="Ask a follow-up..."
        />
      </div>
    </div>
  );
}
