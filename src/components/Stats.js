'use client'

import { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ========================================
// 📦 DYNAMIC DATA (Backend-Ready)
// ========================================
export default function Stats() {
  const [statsData, setStatsData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const response = await fetch('/api/stats')
        const result = await response.json()

        if (result.success) {
          setStatsData(result.data)
        }
      } catch (error) {
        console.error('Error fetching stats data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatsData()

    // Listen for real-time updates
    const handleStatsDataUpdate = () => {
      fetchStatsData()
    }

    window.addEventListener('statsDataUpdated', handleStatsDataUpdate)

    return () => {
      window.removeEventListener('statsDataUpdated', handleStatsDataUpdate)
    }
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const container = document.querySelector('.stats-section .max-w-6xl')
      if (container && container.children.length > 0) {
        // Reset any existing transforms
        gsap.set(container.children, { opacity: 1, y: 0 })

        gsap.from(container.children, {
          opacity: 0,
          y: 50,
          duration: 1,
          stagger: 0.2,
          scrollTrigger: {
            trigger: '.stats-section',
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse',
            refreshPriority: -1,
          },
        })
      }
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [loading, statsData])

  if (loading || !statsData) {
    return (
      <section className="stats-section py-12 sm:py-16 md:py-20 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="stats-section py-12 sm:py-16 md:py-20 bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {statsData.stats?.map((stat) => (
            <div key={stat.id} className="text-center group relative">
              {/* Combined Icon + Number Row */}
              <div className="flex items-center justify-center mb-2 sm:mb-3 space-x-3">
                {/* Icon */}
                {stat.icon && (
                  <i className={`${stat.icon} text-2xl sm:text-3xl text-gray-300 group-hover:text-white transition-colors duration-300 flex-shrink-0`}></i>
                )}

                {/* Number */}
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white group-hover:text-gray-200 transition-colors duration-300">
                  {stat.number}
                </div>
              </div>

              {/* Label */}
              <div className="text-gray-400 text-xs sm:text-sm md:text-base group-hover:text-gray-300 transition-colors duration-300">
                {stat.label}
              </div>

              {/* Optional description tooltip */}
              {stat.description && (
                <div className="absolute z-10 px-3 py-2 bg-gray-900 text-gray-300 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none transform -translate-x-1/2 left-1/2 mt-2 whitespace-nowrap">
                  {stat.description}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}