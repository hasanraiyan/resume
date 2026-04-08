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
  showModelSelector = true,
  theme = 'default',
  chatMode,
  setChatMode,
  deviceAvailability,
}) {
  const isGreenTheme = theme === 'green';
  const showModeToggle = typeof setChatMode === 'function';
  const showDeviceOption = Boolean(deviceAvailability?.supported);
  const modeOptions = showDeviceOption
    ? [
        { id: 'cloud', label: 'Cloud' },
        { id: 'device', label: 'On-device' },
      ]
    : [{ id: 'cloud', label: 'Cloud' }];
  const activeModeIndex = Math.max(
    0,
    modeOptions.findIndex((option) => option.id === chatMode)
  );

  return (
    <div className="p-3 border-t border-neutral-200/50 bg-white shrink-0">
      <div className="rounded-3xl border border-neutral-200/80 bg-white shadow-sm focus-within:border-black/50 focus-within:ring-1 focus-within:ring-black/20 transition-all flex flex-col">
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
          className={`flex ${!availableMCPs || availableMCPs.length === 0 ? 'justify-end' : 'justify-between'} items-center gap-1.5 px-2 pb-2 mt-auto`}
        >
          {/* Left: Settings Menu & Active Tools */}
          <div className="flex items-center gap-2">
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

            {showModeToggle && (
              <div className="relative flex items-center rounded-full border border-neutral-200 bg-neutral-50 p-1">
                <div
                  className={`absolute top-1 bottom-1 rounded-full shadow-sm transition-all duration-300 ease-out ${
                    isGreenTheme ? 'bg-[#1f644e]' : 'bg-black'
                  } ${modeOptions.length === 2 ? 'w-[calc(50%-2px)]' : 'left-1 right-1'}`}
                  style={
                    modeOptions.length === 2
                      ? {
                          left: activeModeIndex === 0 ? '4px' : 'calc(50% + 2px)',
                        }
                      : undefined
                  }
                />

                {modeOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setChatMode(option.id)}
                    disabled={isLoading}
                    title={
                      option.id === 'device'
                        ? 'Run locally in this browser'
                        : 'Use the server-powered finance assistant'
                    }
                    className={`relative z-10 cursor-pointer rounded-full px-3 py-1 text-[11px] font-semibold transition-colors duration-300 ${
                      option.id === chatMode
                        ? isGreenTheme
                          ? 'text-white'
                          : 'bg-black text-white'
                        : 'text-neutral-600 hover:text-neutral-900'
                    } ${modeOptions.length === 2 ? 'min-w-[112px]' : 'min-w-[88px]'} ${
                      isLoading ? 'cursor-not-allowed opacity-70' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Submit Button or Voice Input */}
          <div className="flex items-center justify-end gap-2">
            {showModelSelector && (
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
            )}

            {!isListening && (inputMessage.trim() || activeQuote) ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isGreenTheme ? 'bg-[#1f644e] text-white hover:bg-[#1a5542]' : 'bg-black text-white hover:opacity-90'} active:scale-95`}
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
