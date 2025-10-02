'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button, Badge } from '@/components/ui'

// ========================================
// 📦 DYNAMIC DATA (Backend-Ready)
// ========================================
const heroData = {
  badge: {
    text: "CREATIVE DEVELOPER"
  },
  
  heading: {
    line1: "Crafting",
    line2: "Digital", // This has the stroke effect
    line3: "Excellence"
  },
  
  introduction: {
    text: "I&apos;m John Doe, a creative developer focused on building beautiful and functional digital experiences that make a difference.",
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

// ========================================
// 🎨 COMPONENT
// ========================================
export default function Hero() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
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
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [])

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
              {heroData.socialLinks.map((social) => (
                <a
                  key={social.id}
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