'use client'

import { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button, Badge } from '@/components/ui'
import { useHeroData } from '@/hooks/useHeroData'
import { SkeletonLoader, SkeletonItem } from './Skeleton'

// ========================================
// 📦 FALLBACK DATA (Default values)
// ========================================
const defaultHeroData = {
  badge: {
    text: "CREATIVE DEVELOPER"
  },
  
  heading: {
    line1: "Crafting",
    line2: "Digital", // This has the stroke effect
    line3: "Excellence"
  },
  
  introduction: {
    text: "I'm John Doe, a creative developer focused on building beautiful and functional digital experiences that make a difference.",
    name: "John Doe", // Separate for easy replacement
    role: "creative developer"
  },
  
  cta: {
    primary: {
      text: "View My Work",
      link: "#work"
    },
    secondary: {
      text: "Contact Me",
      link: "#contact"
    }
  },
  
  socialLinks: [
    {
      id: 1,
      name: "Dribbble",
      url: "https://dribbble.com/yourusername", // Replace with actual URL
      icon: "fab fa-dribbble"
    },
    {
      id: 2,
      name: "Behance",
      url: "https://behance.net/yourusername",
      icon: "fab fa-behance"
    },
    {
      id: 3,
      name: "Instagram",
      url: "https://instagram.com/yourusername",
      icon: "fab fa-instagram"
    },
    {
      id: 4,
      name: "LinkedIn",
      url: "https://linkedin.com/in/yourusername",
      icon: "fab fa-linkedin"
    }
  ],
  
  profile: {
    image: {
      url: "https://api.dicebear.com/7.x/personas/svg?seed=Creative",
      alt: "Portrait"
    },
    badge: {
      value: "5+",
      label: "Years Experience"
    }
  }
}

// Hero Skeleton Component
function HeroSkeleton() {
  return (
    <section id="home" className="min-h-screen flex items-center pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 w-full py-12 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">

          {/* Left Column - Content Skeleton */}
          <div className="order-2 lg:order-1">
            {/* Badge Skeleton */}
            <div className="mb-4 sm:mb-5">
              <SkeletonItem height="h-7" width="w-32" className="rounded-full" />
            </div>

            {/* Main Heading Skeleton */}
            <div className="mb-4 sm:mb-5 space-y-2">
              <SkeletonItem height="h-12 sm:h-14 md:h-16 lg:h-20" width="w-full" />
              <SkeletonItem height="h-12 sm:h-14 md:h-16 lg:h-20" width="w-3/4" className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-clip-text" />
              <SkeletonItem height="h-12 sm:h-14 md:h-16 lg:h-20" width="w-2/3" />
            </div>

            {/* Introduction Skeleton */}
            <div className="mb-8 sm:mb-10 space-y-3">
              <SkeletonItem height="h-4" width="w-full" />
              <SkeletonItem height="h-4" width="w-5/6" />
              <SkeletonItem height="h-4" width="w-4/5" />
            </div>

            {/* CTA Buttons Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 mb-8">
              <SkeletonItem height="h-12" width="w-32" className="rounded-lg" />
              <SkeletonItem height="h-12" width="w-28" className="rounded-lg" />
            </div>

            {/* Social Links Skeleton */}
            <div className="flex gap-6 sm:gap-7 justify-center sm:justify-start">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonItem key={i} height="h-5 w-5" className="rounded-full" />
              ))}
            </div>
          </div>

          {/* Right Column - Profile Image Skeleton */}
          <div className="relative order-1 lg:order-2 max-w-sm mx-auto lg:max-w-none">
            {/* Profile Image Skeleton */}
            <div className="aspect-square bg-gray-200 rounded-full animate-pulse"></div>

            {/* Experience Badge Skeleton */}
            <div className="absolute -bottom-4 sm:-bottom-7 -right-4 sm:-right-7 bg-white p-4 sm:p-6 shadow-2xl rounded-lg">
              <SkeletonItem height="h-8 sm:h-10" width="w-12" className="mb-1" />
              <SkeletonItem height="h-3 sm:h-4" width="w-20" />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ========================================
// 🎨 COMPONENT
// ========================================
export default function Hero() {
  const { heroData: fetchedHeroData, loading, error } = useHeroData()
  const [heroData, setHeroData] = useState(defaultHeroData)

  // Update hero data when fetched data changes
  useEffect(() => {
    if (fetchedHeroData) {
    }
  }, [fetchedHeroData])

  // GSAP Animation - Always run this effect, but only animate when not loading
  useEffect(() => {
    if (loading) return

    gsap.registerPlugin(ScrollTrigger)

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        const elements = document.querySelectorAll('#home .max-w-6xl > div > div')
        if (elements.length > 0) {
          // Reset any existing transforms
          gsap.set(elements, { opacity: 1, y: 0 })
          
          gsap.from(elements, {
            opacity: 0,
            y: 50,
            duration: 1,
            stagger: 0.2,
            scrollTrigger: {
              trigger: '#home',
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
              refreshPriority: -1,
            },
          })
        }
      } catch (error) {
        console.warn('GSAP animation error in Hero:', error)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      // Clean up GSAP animations
      try {
        ScrollTrigger.getAll().forEach(trigger => {
          if (trigger.trigger === '#home') {
            trigger.kill()
          }
        })
      } catch (error) {
        console.warn('GSAP cleanup error:', error)
      }
    }
  }, [loading])

  // Show skeleton while loading
  if (loading) {
    return <HeroSkeleton />
  }

  return (
    <section id="home" className="min-h-screen flex items-center pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 w-full py-12 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          
          {/* Left Column - Content */}
          <div className="order-2 lg:order-1">
            
            {/* Badge */}
            <div className="mb-4 sm:mb-5">
              <Badge variant="category">
                {heroData.badge.text}
              </Badge>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-5 leading-none">
              {heroData.heading.line1}
              <span className="block text-stroke">{heroData.heading.line2}</span>
              {heroData.heading.line3}
            </h1>
            
            {/* Introduction */}
            <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-lg leading-relaxed">
              {heroData.introduction.text}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              <Button
                href={heroData.cta.primary.link}
                variant="primary"
                className="px-6 sm:px-7 py-3 sm:py-3.5 text-center"
              >
                {heroData.cta.primary.text}
              </Button>
              <Button
                href={heroData.cta.secondary.link}
                variant="secondary"
                className="px-6 sm:px-7 py-3 sm:py-3.5 text-center"
              >
                {heroData.cta.secondary.text}
              </Button>
            </div>
            
            {/* Social Links */}
            <div className="flex gap-6 sm:gap-7 mt-8 sm:mt-10 justify-center sm:justify-start">
              {heroData.socialLinks.map((social, index) => (
                <a
                  key={social.id || social._id || index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl hover:opacity-60 transition hover-target"
                  aria-label={social.name}
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Right Column - Profile Image */}
          <div className="relative order-1 lg:order-2 max-w-sm mx-auto lg:max-w-none">
            <div className="aspect-square bg-black rounded-full overflow-hidden image-reveal hover-target">
              <img
                src={heroData.profile.image.url}
                alt={heroData.profile.image.alt}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Experience Badge */}
            <div className="absolute -bottom-4 sm:-bottom-7 -right-4 sm:-right-7 bg-white p-4 sm:p-6 shadow-2xl rounded-lg">
              <div className="text-3xl sm:text-4xl font-bold">
                {heroData.profile.badge.value}
              </div>
              <div className="text-gray-600 text-xs sm:text-sm">
                {heroData.profile.badge.label}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}