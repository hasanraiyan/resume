'use client';
import { Send } from 'lucide-react';
import ToolSelector from './ToolSelector';
import ModelSelector from './ModelSelector';
import VoiceInputControl from './VoiceInputControl';

export default function ChatInput({
  inputRef,
  inputMessage,
  setInputMessage,
  isLoading,
  handleSubmit,
  activeQuote,
  isListening,
  toggleListening,
  activeMCPs,
  setActiveMCPs,
  availableMCPs,
  isToolsMenuOpen,
  setIsToolsMenuOpen,
  isModelSelectorOpen,
  setIsModelSelectorOpen,
  chatbotSettings,
  selectedAgentId,
  setSelectedAgentId,
}) {
  return (
    <div className="p-3 border-t border-neutral-200/50 bg-white shrink-0">
      <div className="rounded-3xl focus-within:border-black/50 focus-within:ring-1 focus-within:ring-black/20 transition-all flex flex-col">
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!isLoading && (inputMessage.trim() || activeQuote)) {
                handleSubmit(e);
              }
            }
          }}
          placeholder={`Ask ${chatbotSettings?.aiName || 'Kiro'} a question...`}
          rows={1}
          disabled={isLoading}
          className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-[13px] leading-relaxed outline-none placeholder:text-neutral-400 disabled:opacity-50 max-h-40 overflow-hidden text-neutral-900 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ height: '44px' }}
        />

        <div
          className={`flex ${!availableMCPs || availableMCPs.length === 0 ? 'justify-end' : 'justify-between'} items-center px-2 pb-2 mt-auto`}
        >
          {/* Left: Settings Menu & Active Tools */}
          <ToolSelector
            activeMCPs={activeMCPs}
            setActiveMCPs={setActiveMCPs}
            availableMCPs={availableMCPs}
            isToolsMenuOpen={isToolsMenuOpen}
            setIsToolsMenuOpen={setIsToolsMenuOpen}
            setIsModelSelectorOpen={setIsModelSelectorOpen}
            isLoading={isLoading}
            inputRef={inputRef}
          />

          {/* Right: Submit Button or Voice Input */}
          <div className="flex items-center justify-end gap-2">
            <ModelSelector
              chatbotSettings={chatbotSettings}
              selectedAgentId={selectedAgentId}
              setSelectedAgentId={setSelectedAgentId}
              isModelSelectorOpen={isModelSelectorOpen}
              setIsModelSelectorOpen={setIsModelSelectorOpen}
              setIsToolsMenuOpen={setIsToolsMenuOpen}
              isLoading={isLoading}
              inputRef={inputRef}
            />

            {!isListening && (inputMessage.trim() || activeQuote) ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-black text-white hover:opacity-90 active:scale-95"
              >
                {isLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            ) : (
              <VoiceInputControl
                isListening={isListening}
                toggleListening={toggleListening}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
