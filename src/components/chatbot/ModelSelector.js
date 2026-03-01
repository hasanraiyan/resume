import { ChevronDown, Check } from 'lucide-react';

export default function ModelSelector({
  chatbotSettings,
  selectedModel,
  setSelectedModel,
  isModelSelectorOpen,
  setIsModelSelectorOpen,
  setIsToolsMenuOpen,
  isLoading,
  inputRef,
}) {
  if (
    !chatbotSettings?.fastModel &&
    !chatbotSettings?.thinkingModel &&
    !chatbotSettings?.proModel
  ) {
    return null;
  }

  return (
    <div className="relative model-selector-container">
      <button
        type="button"
        onClick={() => {
          setIsModelSelectorOpen(!isModelSelectorOpen);
          if (!isModelSelectorOpen) setIsToolsMenuOpen(false);
        }}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
      >
        {(() => {
          if (selectedModel === chatbotSettings?.fastModel) return 'Fast';
          if (selectedModel === chatbotSettings?.thinkingModel) return 'Thinking';
          if (selectedModel === chatbotSettings?.proModel) return 'Pro';
          return 'Default';
        })()}
        <ChevronDown
          className={`w-3 h-3 transition-transform ${isModelSelectorOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isModelSelectorOpen && (
        <div className="absolute bottom-full right-0 mb-3 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-200/50 overflow-hidden text-left animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
          <div className="px-3 py-2 border-b border-neutral-100 bg-neutral-50/80">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              AI Models
            </span>
          </div>
          <div className="p-1.5 flex flex-col gap-1">
            {chatbotSettings.fastModel && (
              <button
                onClick={() => {
                  setSelectedModel(chatbotSettings.fastModel);
                  setIsModelSelectorOpen(false);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  selectedModel === chatbotSettings.fastModel
                    ? 'bg-blue-50/50 text-blue-700'
                    : 'hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Fast Engine</span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">
                    Quick, everyday answers
                  </span>
                </div>
                {selectedModel === chatbotSettings.fastModel && (
                  <Check className="w-3.5 h-3.5 text-blue-500" />
                )}
              </button>
            )}

            {chatbotSettings.thinkingModel && (
              <button
                onClick={() => {
                  setSelectedModel(chatbotSettings.thinkingModel);
                  setIsModelSelectorOpen(false);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  selectedModel === chatbotSettings.thinkingModel
                    ? 'bg-blue-50/50 text-blue-700'
                    : 'hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Thinking Engine</span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">Deep reasoning</span>
                </div>
                {selectedModel === chatbotSettings.thinkingModel && (
                  <Check className="w-3.5 h-3.5 text-blue-500" />
                )}
              </button>
            )}

            {chatbotSettings.proModel && (
              <button
                onClick={() => {
                  setSelectedModel(chatbotSettings.proModel);
                  setIsModelSelectorOpen(false);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  selectedModel === chatbotSettings.proModel
                    ? 'bg-blue-50/50 text-blue-700'
                    : 'hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Pro Engine</span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">Advanced capability</span>
                </div>
                {selectedModel === chatbotSettings.proModel && (
                  <Check className="w-3.5 h-3.5 text-blue-500" />
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
