'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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

  const stats = [
    { number: '180+', label: 'Projects Completed' },
    { number: '75+', label: 'Happy Clients' },
    { number: '12+', label: 'Awards Won' },
    { number: '5+', label: 'Years Experience' },
  ]

  return (
    <section className="stats-section py-20 bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-10 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-5xl font-bold mb-3">{stat.number}</div>
              <div className="text-gray-400 text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}