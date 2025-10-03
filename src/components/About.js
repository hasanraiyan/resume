'use client'

import { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Section, Card, Button } from '@/components/ui'
import { SkeletonLoader, SkeletonItem } from './Skeleton'

// ========================================
//  DYNAMIC DATA (Backend-Ready)
// ========================================
const About = () => {
  const [aboutData, setAboutData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await fetch('/api/about')
        const result = await response.json()

        if (result.success) {
          setAboutData(result.data)
        }
      } catch (error) {
        console.error('Error fetching about data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAboutData()

    // Listen for real-time updates
    const handleAboutDataUpdate = () => {
      fetchAboutData()
    }

    window.addEventListener('aboutDataUpdated', handleAboutDataUpdate)

    return () => {
      window.removeEventListener('aboutDataUpdated', handleAboutDataUpdate)
    }
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const container = document.querySelector('#about')
      if (container) {
        const gridContainer = container.querySelector('.grid.lg\\:grid-cols-2')
        if (gridContainer && gridContainer.children.length > 0) {
          // Reset any existing transforms
          gsap.set(gridContainer.children, { opacity: 1, y: 0 })

          gsap.from(gridContainer.children, {
            opacity: 0,
            y: 50,
            duration: 1,
            stagger: 0.2,
            scrollTrigger: {
              trigger: '#about',
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
              refreshPriority: -1,
            },
          })
        }
      }
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [loading, aboutData])

  if (loading || !aboutData) {
    return (
      <Section
        id="about"
        title="About Me"
        className="py-16 sm:py-20 md:py-24"
      >
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-center">
          {/* Left Column - Bio Skeleton */}
          <div className="space-y-4 sm:space-y-5">
            <SkeletonLoader type="text" count={3} />
            <div className="mt-8 sm:mt-10">
              <SkeletonLoader type="card" className="w-40 h-12" />
            </div>
          </div>

          {/* Right Column - Features Grid Skeleton */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} variant="elevated" className="p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <SkeletonItem height="h-5" width="w-3/4" />
                  <SkeletonItem height="h-3" width="w-full" />
                  <SkeletonItem height="h-3" width="w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>
    )
  }

  return (
    <Section
      id="about"
      title={aboutData.sectionTitle}
      className="py-16 sm:py-20 md:py-24"
    >
      <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-center">

        {/* Left Column - Bio */}
        <div>
          <div className="space-y-4 sm:space-y-5 text-sm sm:text-base text-gray-700 leading-relaxed">
            {aboutData.bio?.paragraphs?.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 sm:mt-10">
            <Button
              href={aboutData.resume?.url}
              variant="secondary"
              className="inline-flex items-center"
            >
              {aboutData.resume?.text} <i className={`${aboutData.resume?.icon} ml-2`}></i>
            </Button>
          </div>
        </div>

        {/* Right Column - Features Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {aboutData.features?.map((feature) => (
            <Card
              key={feature.id}
              variant="elevated"
              interactive={true}
              className="p-4 sm:p-6"
            >
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
                <i className={feature.icon}></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

      </div>
    </Section>
  )
}

export default About