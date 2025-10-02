'use client'

import { useEffect, useState } from 'react'

export default function SuccessToast({ message, onClose, duration = 4000 }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for animation to complete
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
    }`}>
      <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-[300px]">
        <div className="flex-shrink-0">
          <i className="fas fa-check-circle text-lg"></i>
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="flex-shrink-0 text-white hover:text-green-200 transition-colors"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  )
}
