export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">You're Offline</h1>

        <p className="text-gray-600 mb-8 leading-relaxed">
          It looks like you're not connected to the internet. Please check your connection and try
          again.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Once you're back online, this page will automatically refresh with
            the latest content.
          </p>
        </div>
      </div>
    </div>
  );
}
