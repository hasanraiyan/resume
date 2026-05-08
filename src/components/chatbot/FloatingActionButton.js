import { MessageCircle } from 'lucide-react';

export default function FloatingActionButton({
  handleOpenChat,
  chatbotSettings,
  settingsFetched,
  isCoursify,
}) {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 group flex flex-col items-end gap-2 chatbot-widget-container">
      {/* Tooltip */}
      <div
        className={`opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 px-3 py-1.5 text-xs font-medium rounded-lg shadow-lg pointer-events-none whitespace-nowrap ${isCoursify ? 'bg-[#1f644e] text-white' : 'bg-black text-white'}`}
      >
        Chat with {chatbotSettings?.aiName || 'Kiro'}
      </div>

      <button
        onClick={handleOpenChat}
        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center border border-white/20 backdrop-blur-sm ${isCoursify ? 'bg-gradient-to-br from-[#1f644e] to-[#2d8a6a] hover:from-[#17503e] hover:to-[#1f644e]' : 'bg-gradient-to-br from-black to-neutral-900 hover:from-neutral-900 hover:to-black'}`}
        aria-label="Open chat"
      >
        {/* Notification Badge / Status Indicator */}
        <div
          className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-theme-bg shadow-sm z-20 ${settingsFetched && chatbotSettings?.isActive ? 'bg-green-500' : 'bg-red-500'}`}
        >
          <div
            className={`absolute inset-0 w-full h-full rounded-full animate-ping opacity-75 ${settingsFetched && chatbotSettings?.isActive ? 'bg-green-500' : 'bg-red-500'}`}
          />
        </div>

        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" />
      </button>
    </div>
  );
}
