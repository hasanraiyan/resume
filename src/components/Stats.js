'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ========================================
// 📦 DYNAMIC DATA (Backend-Ready)
// ========================================
const statsData = {
  // Optional: Section heading for future use
  heading: {
    title: "Our Achievements", // Hidden by default, can be shown later
    description: "Numbers that speak for themselves"
  },
  
  stats: [
    {
      id: 1,
      number: '180+',
      label: 'Projects Completed',
      icon: 'fas fa-project-diagram', // Optional icon for future use
      description: 'Successfully delivered projects' // Optional tooltip/description
    },
    {
      id: 2,
      number: '75+',
      label: 'Happy Clients',
      icon: 'fas fa-smile',
      description: 'Satisfied clients worldwide'
    },
    {
      id: 3,
      number: '12+',
      label: 'Awards Won',
      icon: 'fas fa-trophy',
      description: 'Industry recognition and awards'
    },
    {
      id: 4,
      number: '5+',
      label: 'Years Experience',
      icon: 'fas fa-calendar-alt',
      description: 'Years of professional experience'
    }
  ],
  
  // Animation configuration (optional)
  animation: {
    countUp: true, // Enable number count-up animation
    duration: 2000 // Animation duration in ms
  }
}

// ========================================
// 🎨 COMPONENT
// ========================================
export default function Stats() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const container = document.querySelector('.stats-section .max-w-6xl')
    if (container) {
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
        },
      })
    }
  }, [])

  return (
    <section className="stats-section py-12 sm:py-16 md:py-20 bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 text-center">
          {statsData.stats.map((stat) => (
            <div key={stat.id}>
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3">
                {stat.number}
              </div>
              <div className="text-gray-400 text-xs sm:text-sm md:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}