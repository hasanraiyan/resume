import { MessageCircle, X } from 'lucide-react';

export default function OfflineState({ chatbotSettings, setIsOpen }) {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-in slide-in-from-bottom-4 duration-300 chatbot-widget-container">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 flex flex-col border border-neutral-200/50 shadow-black/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200/50 bg-neutral-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-neutral-400 rounded-full border-2 border-white shadow-sm" />
            <div>
              <h3 className="font-semibold text-neutral-900 text-base">Offline</h3>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all duration-200"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6 text-center bg-white space-y-4">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <MessageCircle className="w-6 h-6 text-neutral-400" />
          </div>
          <h4 className="font-medium text-neutral-900">AI Assistant is currently away</h4>
          <p className="text-sm text-neutral-500 leading-relaxed">
            {chatbotSettings?.aiName || 'Kiro'} is taking a break right now. You can still reach out
            directly via the contact form for any inquiries or project requests.
          </p>
          <a
            href="#contact"
            className="mt-4 inline-flex items-center justify-center w-full px-4 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors shadow-sm font-medium text-sm"
            onClick={(e) => {
              setIsOpen(false);
              if (window.location.pathname !== '/') {
                e.preventDefault();
                window.location.href = '/#contact';
              }
            }}
          >
            Contact Me
          </a>
        </div>
      </div>
    </div>
  );
}
