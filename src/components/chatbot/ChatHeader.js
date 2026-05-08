import { Trash2, X } from 'lucide-react';

export default function ChatHeader({
  chatbotSettings,
  settingsFetched,
  clearChat,
  setIsOpen,
  isCoursify,
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 sm:p-5 border-b rounded-t-2xl ${isCoursify ? 'border-[#e5e3d8] bg-gradient-to-r from-[#f0f5f2] to-[#fcfbf5]' : 'border-neutral-200/50 bg-gradient-to-r from-neutral-50/80 to-white/80'}`}
    >
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="relative">
          <div
            className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${isCoursify ? 'bg-[#1f644e]' : 'bg-green-500'}`}
          />
          <div
            className={`absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-20 ${isCoursify ? 'bg-[#1f644e]' : 'bg-green-500'}`}
          />
        </div>
        <div>
          <h3
            className={`font-semibold text-base ${isCoursify ? 'text-[#1e3a34]' : 'text-neutral-900'}`}
          >
            {isCoursify ? 'Learning Assistant' : chatbotSettings?.aiName || 'Kiro'}
          </h3>
          <p
            className={`text-[10px] -mt-0.5 hidden sm:block ${isCoursify ? 'text-[#7c8e88]' : 'text-neutral-500'}`}
          >
            {isCoursify ? 'Coursify AI' : 'AI Assistant'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2">
        <button
          onClick={clearChat}
          className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${isCoursify ? 'text-[#7c8e88] hover:text-[#1e3a34] bg-[#f0f5f2] hover:bg-[#e5e3d8]' : 'text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200'}`}
        >
          <Trash2 className="w-3 h-3" />
          <span className="hidden sm:inline">Clear</span>
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className={`p-2 rounded-lg transition-all duration-200 ${isCoursify ? 'text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#e5e3d8]' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'}`}
          aria-label="Close chat"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
