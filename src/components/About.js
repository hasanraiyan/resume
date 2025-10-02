'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function About() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const container = document.querySelector('#about .max-w-7xl')
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
    <section id="about" className="py-32">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-6xl font-bold mb-8">About Me</h2>
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
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
            <div className="mt-12">
              <a
                href="#"
                className="inline-flex items-center text-lg font-semibold underline-animate hover-target"
              >
                Download Resume <i className="fas fa-arrow-right ml-3"></i>
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white p-8 shadow-lg hover:shadow-2xl transition hover-target">
              <div className="text-4xl mb-4">
                <i className="fas fa-lightbulb"></i>
              </div>
              <h3 className="text-2xl font-bold mb-2">Creative</h3>
              <p className="text-gray-600">Innovative solutions for complex problems</p>
            </div>
            <div className="bg-white p-8 shadow-lg hover:shadow-2xl transition hover-target">
              <div className="text-4xl mb-4">
                <i className="fas fa-rocket"></i>
              </div>
              <h3 className="text-2xl font-bold mb-2">Fast</h3>
              <p className="text-gray-600">Optimized performance and quick delivery</p>
            </div>
            <div className="bg-white p-8 shadow-lg hover:shadow-2xl transition hover-target">
              <div className="text-4xl mb-4">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3 className="text-2xl font-bold mb-2">Responsive</h3>
              <p className="text-gray-600">Works perfectly on all devices</p>
            </div>
            <div className="bg-white p-8 shadow-lg hover:shadow-2xl transition hover-target">
              <div className="text-4xl mb-4">
                <i className="fas fa-code"></i>
              </div>
              <h3 className="text-2xl font-bold mb-2">Clean Code</h3>
              <p className="text-gray-600">Maintainable and scalable solutions</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}