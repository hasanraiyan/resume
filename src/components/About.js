'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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

    const container = document.querySelector('#about .max-w-6xl')
    if (container) {
      gsap.from(container.children, {
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
  }, [])

  return (
    <section id="about" className="py-16 sm:py-20 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-center">
          
          {/* Left Column - Bio */}
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 sm:mb-7">
              {aboutData.sectionTitle}
            </h2>
            
            <div className="space-y-4 sm:space-y-5 text-sm sm:text-base text-gray-700 leading-relaxed">
              {aboutData.bio.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            
            <div className="mt-8 sm:mt-10">
              <a
                href={aboutData.resume.url}
                className="inline-flex items-center text-sm sm:text-base font-semibold underline-animate hover-target"
              >
                {aboutData.resume.text} <i className={`${aboutData.resume.icon} ml-2`}></i>
              </a>
            </div>
          </div>

          {/* Right Column - Features Grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {aboutData.features.map((feature) => (
              <div 
                key={feature.id}
                className="bg-white p-4 sm:p-6 shadow-lg hover:shadow-2xl transition hover-target"
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
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}