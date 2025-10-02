'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 sm:mb-7">About Me</h2>
            <div className="space-y-4 sm:space-y-5 text-sm sm:text-base text-gray-700 leading-relaxed">
              <p>
                I&apos;m a passionate creative developer with a love for crafting
                exceptional digital experiences. My journey in design and development
                has been driven by curiosity and a constant desire to learn.
              </p>
              <p>
                With expertise spanning from concept to execution, I bring ideas to life
                through clean code, thoughtful design, and attention to detail that makes
                every project unique.
              </p>
              <p>
                When I&apos;m not coding, you&apos;ll find me exploring new design trends,
                experimenting with new technologies, or enjoying a good cup of coffee
                while sketching new ideas.
              </p>
            </div>
            <div className="mt-8 sm:mt-10">
              <a
                href="#"
                className="inline-flex items-center text-sm sm:text-base font-semibold underline-animate hover-target"
              >
                Download Resume <i className="fas fa-arrow-right ml-2"></i>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 shadow-lg hover:shadow-2xl transition hover-target">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
                <i className="fas fa-lightbulb"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Creative</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Innovative solutions for complex problems</p>
            </div>
            <div className="bg-white p-4 sm:p-6 shadow-lg hover:shadow-2xl transition hover-target">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
                <i className="fas fa-rocket"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Fast</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Optimized performance and quick delivery</p>
            </div>
            <div className="bg-white p-4 sm:p-6 shadow-lg hover:shadow-2xl transition hover-target">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Responsive</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Works perfectly on all devices</p>
            </div>
            <div className="bg-white p-4 sm:p-6 shadow-lg hover:shadow-2xl transition hover-target">
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
                <i className="fas fa-code"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Clean Code</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Maintainable and scalable solutions</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}