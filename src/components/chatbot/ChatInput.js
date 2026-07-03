'use client';

import { useState } from 'react';
import { Send, ChevronDown } from 'lucide-react';
import ModelSelector from './ModelSelector';
import VoiceInputControl from './VoiceInputControl';

export default function ChatInput({
  inputRef,
  inputMessage,
  setInputMessage,
  isLoading,
  handleSubmit,
  onStop,
  activeQuote,
  isListening,
  toggleListening,
  isModelSelectorOpen,
  setIsModelSelectorOpen,
  chatbotSettings,
  selectedAgentId,
  setSelectedAgentId,
  showModelSelector = true,
  theme = 'default',
  setIsToolsMenuOpen,
  chatMode,
  setChatMode,
  deviceAvailability,
  // feature flags so parents can control which controls appear
  showModeToggle,
  onImagesSelected,
  uploadedImages = [],
  maxImages = 4,
  showTopBorder = true,
  disabledModes = [],
  customModeOptions = null,
  dropdownPosition = 'up',
  customOuterBg = null,
  customInnerBg = null,
  customPadding = 'p-2 sm:p-3',
  modeSelectorSide = 'left',
  placeholder,
}) {
  const isGreenTheme = theme === 'green';
  const isDarkTheme = theme === 'dark';
  // default to showing the mode toggle whenever chat mode handlers exist,
  // but let parents explicitly disable it via the prop
  const shouldShowModeToggle = showModeToggle ?? typeof setChatMode === 'function';
  const showDeviceOption = Boolean(deviceAvailability?.supported);
  const modeOptions = customModeOptions || [
    { id: 'flash', label: 'Flash' },
    { id: 'pro', label: 'Pro' },
    ...(showDeviceOption ? [{ id: 'device', label: 'On-device' }] : []),
  ];
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const currentMode = modeOptions.find((option) => option.id === chatMode) || modeOptions[0];

  const outerBg =
    customOuterBg || (isDarkTheme ? 'bg-transparent' : isGreenTheme ? 'bg-[#fcfbf5]' : 'bg-white');
  const innerBg =
    customInnerBg ||
    (isDarkTheme ? 'bg-white/[0.04] backdrop-blur-xl' : isGreenTheme ? 'bg-[#fcfbf5]' : 'bg-white');
  const borderColor = isDarkTheme
    ? 'border-white/10'
    : isGreenTheme
      ? 'border-[#e5e3d8]'
      : 'border-neutral-200/80';
  const focusBorder = isDarkTheme
    ? 'focus-within:border-blue-500/50'
    : isGreenTheme
      ? 'focus-within:border-[#1f644e]/50'
      : 'focus-within:border-black/50';
  const textColor = isDarkTheme
    ? 'text-white'
    : isGreenTheme
      ? 'text-[#1e3a34]'
      : 'text-neutral-900';
  const placeholderColor = isDarkTheme
    ? 'placeholder:text-white/30'
    : isGreenTheme
      ? 'placeholder:text-[#5c6e68]'
      : 'placeholder:text-neutral-500';
  const warningBg = isGreenTheme ? 'bg-[#fef3c7]' : 'bg-amber-50';
  const warningText = isGreenTheme ? 'text-[#92400e]' : 'text-amber-700';
  const warningBorder = isGreenTheme ? 'border-[#fcd34d]' : 'border-amber-200';

  return (
    <div
      className={`${customPadding} ${showTopBorder ? `border-t ${borderColor}` : ''} ${outerBg} shrink-0`}
    >
      <div
        className={`rounded-3xl border ${borderColor} ${innerBg} ${focusBorder} focus-within:ring-1 ${isDarkTheme ? 'focus-within:ring-blue-500/20' : isGreenTheme ? 'focus-within:ring-[#1f644e]/20' : 'focus-within:ring-black/20'} transition-all flex flex-col`}
      >
        {uploadedImages.length > 0 && (
          <div className="mx-4 mt-2 flex flex-wrap gap-2">
            {uploadedImages.map((img, idx) => (
              <div key={idx} className="relative">
                <img
                  src={img.base64}
                  alt={img.name}
                  className="h-16 w-auto rounded object-contain border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = uploadedImages.filter((_, i) => i !== idx);
                    if (onImagesSelected) onImagesSelected(updated);
                  }}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
          }}
          onPaste={(e) => {
            if (!onImagesSelected) return;
            const imageItems = Array.from(e.clipboardData?.items || []).filter((item) =>
              item.type.startsWith('image/')
            );
            if (imageItems.length > 0) {
              e.preventDefault();
              const newImages = [];
              let loadedCount = 0;

              imageItems.forEach((item) => {
                const file = item.getAsFile();
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const base64 = event.target.result;
                    newImages.push({ base64, name: file.name });
                    loadedCount++;

                    if (loadedCount === imageItems.length) {
                      const updated = [...uploadedImages, ...newImages].slice(0, maxImages);
                      if (onImagesSelected) onImagesSelected(updated);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              });
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
          placeholder={placeholder || `Ask ${chatbotSettings?.aiName || 'Kiro'} a question...`}
          rows={1}
          disabled={isLoading}
          className={`w-full resize-none bg-transparent px-3.5 pt-2.5 pb-1.5 sm:px-4 sm:pt-3 sm:pb-2 text-[13px] leading-relaxed outline-none ${placeholderColor} disabled:opacity-50 max-h-40 overflow-hidden ${textColor} [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
          style={{ height: '40px' }}
        />

        <div className="flex justify-between items-center gap-1.5 px-3.5 pb-2 sm:px-4 sm:pb-3 mt-auto">
          {/* Left: Settings Menu & Active Tools */}
          <div className="flex items-center gap-2">
            {onImagesSelected && (
              <>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const newImages = [];
                    let loadedCount = 0;

                    files.forEach((file) => {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = event.target.result;
                        newImages.push({ base64, name: file.name });
                        loadedCount++;

                        if (loadedCount === files.length) {
                          const updated = [...uploadedImages, ...newImages].slice(0, maxImages);
                          if (onImagesSelected) onImagesSelected(updated);
                        }
                      };
                      reader.readAsDataURL(file);
                    });

                    e.target.value = '';
                  }}
                  style={{ display: 'none' }}
                  id="image-upload-input"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('image-upload-input').click()}
                  disabled={isLoading}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isGreenTheme
                      ? 'bg-transparent text-[#1f644e] hover:bg-[#f5f3e6]'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title="Upload images"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </>
            )}

            {shouldShowModeToggle && modeSelectorSide !== 'right' && (
              <div className="relative mode-selector-container">
                {modeOptions.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (isLoading) return;
                        setIsModeMenuOpen((open) => !open);
                      }}
                      className={`flex items-center justify-center gap-1 rounded-full border px-2.5 h-7 text-[10px] font-medium transition-colors ${
                        isGreenTheme
                          ? 'border-[#e5e3d8] bg-transparent text-[#1e3a34] hover:bg-[#f5f3e6]'
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
                      <div
                        className={`absolute left-0 w-32 rounded-xl border border-neutral-200 bg-white overflow-hidden z-40 ${
                          dropdownPosition === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'
                        }`}
                      >
                        {modeOptions.map((option) => {
                          const isActive = option.id === currentMode.id;
                          const isDisabled = disabledModes.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                setIsModeMenuOpen(false);
                                if (!isLoading && setChatMode) {
                                  setChatMode(option.id);
                                }
                              }}
                              className={`w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center justify-between ${
                                isActive
                                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                                  : isDisabled
                                    ? 'text-neutral-300 bg-neutral-50 cursor-not-allowed'
                                    : 'bg-white text-neutral-700 hover:bg-neutral-50'
                              }`}
                              title={
                                isDisabled ? 'Sign in as admin to access Pro model' : undefined
                              }
                            >
                              <span>{option.label}</span>
                              {isDisabled && (
                                <svg
                                  className="w-2.5 h-2.5 text-neutral-400 shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className={`flex items-center justify-center rounded-full border px-2.5 h-7 text-[10px] font-medium ${
                      isGreenTheme
                        ? 'border-[#e5e3d8] bg-transparent text-[#1e3a34]'
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
            {shouldShowModeToggle && modeSelectorSide === 'right' && (
              <div className="relative mode-selector-container">
                {modeOptions.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (isLoading) return;
                        setIsModeMenuOpen((open) => !open);
                      }}
                      className={`flex items-center justify-center gap-1 rounded-full border px-2.5 h-7 text-[10px] font-medium transition-colors ${
                        isGreenTheme
                          ? 'border-[#e5e3d8] bg-transparent text-[#1e3a34] hover:bg-[#f5f3e6]'
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
                      <div
                        className={`absolute right-0 w-32 rounded-xl border border-neutral-200 bg-white overflow-hidden z-40 ${
                          dropdownPosition === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'
                        }`}
                      >
                        {modeOptions.map((option) => {
                          const isActive = option.id === currentMode.id;
                          const isDisabled = disabledModes.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                setIsModeMenuOpen(false);
                                if (!isLoading && setChatMode) {
                                  setChatMode(option.id);
                                }
                              }}
                              className={`w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center justify-between ${
                                isActive
                                  ? 'bg-neutral-100 text-neutral-900 font-semibold'
                                  : isDisabled
                                    ? 'text-neutral-300 bg-neutral-50 cursor-not-allowed'
                                    : 'bg-white text-neutral-700 hover:bg-neutral-50'
                              }`}
                              title={
                                isDisabled ? 'Sign in as admin to access Pro model' : undefined
                              }
                            >
                              <span>{option.label}</span>
                              {isDisabled && (
                                <svg
                                  className="w-2.5 h-2.5 text-neutral-400 shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className={`flex items-center justify-center rounded-full border px-2.5 h-7 text-[10px] font-medium ${
                      isGreenTheme
                        ? 'border-[#e5e3d8] bg-transparent text-[#1e3a34]'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    {currentMode.label}
                  </div>
                )}
              </div>
            )}

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

            {!isListening && isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-[#c94c4c] text-white hover:bg-[#b03a3a] active:scale-95 transition-all cursor-pointer"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : !isListening &&
              (inputMessage.trim() || activeQuote || uploadedImages.length > 0) ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isDarkTheme ? 'bg-blue-500 text-white hover:bg-blue-600' : isGreenTheme ? 'bg-[#1f644e] text-white hover:bg-[#1a5542]' : 'bg-black text-white hover:opacity-90'} active:scale-95`}
              >
                <Send className="w-3.5 h-3.5" />
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
