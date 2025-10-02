'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Section, Card, Button } from '@/components/ui'

// ========================================
// 📦 DYNAMIC DATA (Backend-Ready)
// ========================================
const aboutData = {
  sectionTitle: "About Me",
  
  bio: {
    paragraphs: [
      "I'm a passionate creative developer with a love for crafting exceptional digital experiences. My journey in design and development has been driven by curiosity and a constant desire to learn.",
      "With expertise spanning from concept to execution, I bring ideas to life through clean code, thoughtful design, and attention to detail that makes every project unique.",
      "When I'm not coding, you'll find me exploring new design trends, experimenting with new technologies, or enjoying a good cup of coffee while sketching new ideas."
    ]
  },
  
  resume: {
    text: "Download Resume",
    url: "#", // Replace with actual resume URL
    icon: "fas fa-arrow-right"
  },
  
  features: [
    {
      id: 1,
      icon: "fas fa-lightbulb",
      title: "Creative",
      description: "Innovative solutions for complex problems"
    },
    {
      id: 2,
      icon: "fas fa-rocket",
      title: "Fast",
      description: "Optimized performance and quick delivery"
    },
    {
      id: 3,
      icon: "fas fa-mobile-alt",
      title: "Responsive",
      description: "Works perfectly on all devices"
    },
    {
      id: 4,
      icon: "fas fa-code",
      title: "Clean Code",
      description: "Maintainable and scalable solutions"
    }
  ]
}

// ========================================
// 🎨 COMPONENT
// ========================================
export default function About() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const container = document.querySelector('#about')
    if (container) {
      const gridContainer = container.querySelector('.grid.lg\\:grid-cols-2')
      if (gridContainer) {
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
          },
        })
      }
    }
  }, [])

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
            {aboutData.bio.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          
          <div className="mt-8 sm:mt-10">
            <Button
              href={aboutData.resume.url}
              variant="secondary"
              className="inline-flex items-center"
            >
              {aboutData.resume.text} <i className={`${aboutData.resume.icon} ml-2`}></i>
            </Button>
          </div>
        </div>

        {/* Right Column - Features Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {aboutData.features.map((feature) => (
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