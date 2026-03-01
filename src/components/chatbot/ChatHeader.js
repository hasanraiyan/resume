import { Trash2, X } from 'lucide-react';

export default function ChatHeader({ chatbotSettings, settingsFetched, clearChat, setIsOpen }) {
  return (
    <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50/80 to-white/80 rounded-t-2xl">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="relative">
          <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
          <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-20" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-900 text-base">
            {chatbotSettings?.aiName || 'Kiro'}
          </h3>
          <p className="text-[10px] text-neutral-500 -mt-0.5 hidden sm:block">AI Assistant</p>
        </div>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2">
        <button
          onClick={clearChat}
          className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-all duration-200 flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          <span className="hidden sm:inline">Clear</span>
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all duration-200"
          aria-label="Close chat"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
