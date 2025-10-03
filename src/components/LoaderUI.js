'use client'

export default function LoaderUI() {
  return (
    <div id="loader-ui" className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      {/* Clean Centered Text */}
      <div className="text-center">
        <div className="mb-4">
          <div className="text-2xl md:text-4xl font-light text-gray-800 tracking-wider">
            RAIYAN
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-800 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-gray-800 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
