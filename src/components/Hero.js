'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function Hero() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    gsap.from('#home .max-w-6xl > div > div', {
      opacity: 0,
      y: 50,
      duration: 1,
      stagger: 0.2,
      scrollTrigger: {
        trigger: '#home',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
      },
    })
  }, [])

  return (
    <section id="home" className="min-h-screen flex items-center pt-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 w-full py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-semibold tracking-widest mb-5 text-gray-600">
              CREATIVE DEVELOPER
            </div>
            <h1 className="text-6xl lg:text-7xl font-bold mb-5 leading-none">
              Crafting
              <span className="block text-stroke">Digital</span>
              Excellence
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-lg leading-relaxed">
              I&apos;m John Doe, a creative developer focused on building beautiful and
              functional digital experiences that make a difference.
            </p>
            <div className="flex gap-5">
              <a
                href="#work"
                className="bg-black text-white px-7 py-3.5 text-base font-medium hover:bg-gray-800 transition magnetic-btn hover-target"
              >
                View My Work
              </a>
              <a
                href="#contact"
                className="border-2 border-black px-7 py-3.5 text-base font-medium hover:bg-black hover:text-white transition magnetic-btn hover-target"
              >
                Contact Me
              </a>
            </div>
            <div className="flex gap-7 mt-10">
              <a href="#" className="text-xl hover:opacity-60 transition hover-target">
                <i className="fab fa-dribbble"></i>
              </a>
              <a href="#" className="text-xl hover:opacity-60 transition hover-target">
                <i className="fab fa-behance"></i>
              </a>
              <a href="#" className="text-xl hover:opacity-60 transition hover-target">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-xl hover:opacity-60 transition hover-target">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-black rounded-full overflow-hidden image-reveal hover-target">
              <img
                src="https://api.dicebear.com/7.x/personas/svg?seed=Creative"
                alt="Portrait"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-7 -right-7 bg-white p-6 shadow-2xl rounded-lg">
              <div className="text-4xl font-bold">5+</div>
              <div className="text-gray-600 text-sm">Years Experience</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}