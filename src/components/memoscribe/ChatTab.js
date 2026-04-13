'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useMemoscribe } from '@/context/MemoscribeContext';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatTab() {
  const { chatMessages, setChatMessages, chatInput, setChatInput, settings } = useMemoscribe();
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isStreaming]);

  const handleSend = async () => {
    if (!chatInput.trim() || isStreaming) return;

    if (!settings?.hasApiKey) {
      alert('Please configure your Qdrant Database in Settings first to use the Chatbot.');
      return;
    }

    const newUserMsg = { role: 'user', content: chatInput };
    setChatMessages((prev) => [...prev, newUserMsg]);
    setChatInput('');
    setIsStreaming(true);

    const placeholderAiMsgId = Date.now().toString();
    setChatMessages((prev) => [
      ...prev,
      { id: placeholderAiMsgId, role: 'assistant', content: '', isStreaming: true },
    ]);

    try {
      const response = await fetch('/api/memoscribe/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: newUserMsg.content,
          chatHistory: chatMessages.filter((m) => !m.isStreaming),
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          try {
            const event = JSON.parse(line);

            if (event.type === 'message' || event.type === 'chunk') {
              fullContent += event.content || '';
              setChatMessages((prev) =>
                prev.map((msg) =>
                  msg.id === placeholderAiMsgId ? { ...msg, content: fullContent } : msg
                )
              );
            } else if (event.type === 'tool_start') {
              // Optionally show tool usage indicator
              console.log('Tool started:', event.tool);
            }
          } catch (e) {
            console.error('Error parsing SSE event', e);
          }
        }
      }

      // finalize message
      setChatMessages((prev) =>
        prev.map((msg) => (msg.id === placeholderAiMsgId ? { ...msg, isStreaming: false } : msg))
      );
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderAiMsgId
            ? { ...msg, content: 'Error: Could not connect to AI assistant.', isStreaming: false }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] rounded-xl border border-[#e5e3d8] bg-white overflow-hidden relative">
      {!settings?.hasApiKey && (
        <div className="absolute top-0 left-0 right-0 bg-[#c94c4c] text-white text-xs font-bold py-2 text-center z-10">
          Missing Qdrant Configuration. Please configure in Settings.
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-10">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#7c8e88]">
            <Bot className="w-12 h-12 mb-3 text-[#e5e3d8]" />
            <p className="font-bold">Memo Scribe AI</p>
            <p className="text-sm mt-1">Ask me anything about your saved clips!</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f0f5f2] flex items-center justify-center border border-[#e5e3d8]">
                  <Bot className="w-4 h-4 text-[#1f644e]" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#1f644e] text-white rounded-br-none'
                    : 'bg-[#fcfbf5] border border-[#e5e3d8] text-[#1e3a34] rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-[#1f644e] animate-pulse align-middle" />
                )}
              </div>

              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1e3a34] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-[#e5e3d8]">
        <div className="relative">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            rows={1}
            disabled={isStreaming}
            className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] py-3 pl-4 pr-12 text-sm outline-none transition focus:border-[#1f644e] resize-none disabled:opacity-50"
            style={{ minHeight: '46px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!chatInput.trim() || isStreaming}
            className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-[#1f644e] text-white disabled:opacity-50 hover:bg-[#17503e] transition"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
