'use client';

import { useState } from 'react';
import { Send, ChevronDown } from 'lucide-react';
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
  // feature flags so parents can control which controls appear
  showModeToggle,
  showToolsMenu = true,
}) {
  const [showImageWarning, setShowImageWarning] = useState(false);
  const isGreenTheme = theme === 'green';
  // default to showing the mode toggle whenever chat mode handlers exist,
  // but let parents explicitly disable it via the prop
  const shouldShowModeToggle = showModeToggle ?? typeof setChatMode === 'function';
  const showDeviceOption = Boolean(deviceAvailability?.supported);
  const modeOptions = showDeviceOption
    ? [
        { id: 'cloud', label: 'Cloud' },
        { id: 'device', label: 'On-device' },
      ]
    : [{ id: 'cloud', label: 'Cloud' }];
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const currentMode = modeOptions.find((option) => option.id === chatMode) || modeOptions[0];

  const containerBg = isGreenTheme ? 'bg-[#fcfbf5]' : 'bg-white';
  const borderColor = isGreenTheme ? 'border-[#e5e3d8]' : 'border-neutral-200/80';
  const focusBorder = isGreenTheme
    ? 'focus-within:border-[#1f644e]/50'
    : 'focus-within:border-black/50';
  const textColor = isGreenTheme ? 'text-[#1e3a34]' : 'text-neutral-900';
  const placeholderColor = isGreenTheme
    ? 'placeholder:text-[#7c8e88]'
    : 'placeholder:text-neutral-400';
  const warningBg = isGreenTheme ? 'bg-[#fef3c7]' : 'bg-amber-50';
  const warningText = isGreenTheme ? 'text-[#92400e]' : 'text-amber-700';
  const warningBorder = isGreenTheme ? 'border-[#fcd34d]' : 'border-amber-200';

  return (
    <div className={`p-3 border-t ${borderColor} ${containerBg} shrink-0`}>
      <div
        className={`rounded-3xl border ${borderColor} ${containerBg} shadow-sm ${focusBorder} focus-within:ring-1 ${isGreenTheme ? 'focus-within:ring-[#1f644e]/20' : 'focus-within:ring-black/20'} transition-all flex flex-col`}
      >
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
          }}
          onPaste={(e) => {
            const hasImage = Array.from(e.clipboardData?.items || []).some((item) =>
              item.type.startsWith('image/')
            );
            if (hasImage) {
              e.preventDefault();
              setShowImageWarning(true);
              setTimeout(() => setShowImageWarning(false), 3000);
            }
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
          className={`w-full resize-none bg-transparent px-4 pt-3 pb-2 text-[13px] leading-relaxed outline-none ${placeholderColor} disabled:opacity-50 max-h-40 overflow-hidden ${textColor} [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
          style={{ height: '44px' }}
        />

        {showImageWarning && (
          <div
            className={`mx-4 mb-2 px-3 py-2 text-xs ${warningBg} ${warningText} rounded-lg border ${warningBorder}`}
          >
            Image input not supported. Please paste a description or use text instead.
          </div>
        )}

        <div
          className={`flex ${
            !showToolsMenu || !availableMCPs || availableMCPs.length === 0
              ? 'justify-end'
              : 'justify-between'
          } items-center gap-1.5 px-2 pb-2 mt-auto`}
        >
          {/* Left: Settings Menu & Active Tools */}
          <div className="flex items-center gap-2">
            {showToolsMenu && (
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
            )}

            {shouldShowModeToggle && (
              <div className="relative mode-selector-container">
                {modeOptions.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (isLoading) return;
                        setIsModeMenuOpen((open) => !open);
                      }}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium shadow-sm transition-colors ${
                        isGreenTheme
                          ? 'border-[#e5e3d8] bg-[#f5f3e6] text-[#1e3a34] hover:bg-[#ebe7d4]'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-800 hover:bg-neutral-100'
                      } ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span>{currentMode.label}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          isModeMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isModeMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-32 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden z-40">
                        {modeOptions.map((option) => {
                          const isActive = option.id === currentMode.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                setIsModeMenuOpen(false);
                                if (!isLoading && setChatMode) {
                                  setChatMode(option.id);
                                }
                              }}
                              className={`w-full text-left px-3 py-2 text-[11px] transition-colors ${
                                isActive
                                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                      isGreenTheme
                        ? 'border-[#e5e3d8] bg-[#f5f3e6] text-[#1e3a34]'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    {currentMode.label}
                  </div>
                )}
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
                onTranscript={setInputMessage}
                continuous={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
