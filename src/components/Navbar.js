'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'

export default function Navbar() {
  useEffect(() => {
    const magneticBtns = document.querySelectorAll('.magnetic-btn')

    magneticBtns.forEach((btn) => {
      const handleMouseMove = (e) => {
        const rect = btn.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2

        gsap.to(btn, {
          x: x * 0.3,
          y: y * 0.3,
          duration: 0.4,
          ease: 'power2.out',
        })
      }

      const handleMouseLeave = () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.3)',
        })
      }

      btn.addEventListener('mousemove', handleMouseMove)
      btn.addEventListener('mouseleave', handleMouseLeave)
    })

    // Smooth scroll
    const anchors = document.querySelectorAll('a[href^="#"]')
    anchors.forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault()
        const target = document.querySelector(this.getAttribute('href'))
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    })
  }, [])

  return (
    <nav className="fixed w-full z-50 top-0 bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <div className="text-2xl font-bold hover-target">JD</div>
          <div className="hidden md:flex items-center space-x-10">
            <a
              href="#home"
              className="text-gray-800 hover:text-gray-600 font-medium underline-animate transition hover-target"
            >
              Home
            </a>
            <a
              href="#about"
              className="text-gray-800 hover:text-gray-600 font-medium underline-animate transition hover-target"
            >
              About
            </a>
            <a
              href="#work"
              className="text-gray-800 hover:text-gray-600 font-medium underline-animate transition hover-target"
            >
              Work
            </a>
            <a
              href="#contact"
              className="bg-black text-white px-5 py-2.5 hover:bg-gray-800 transition magnetic-btn hover-target"
            >
              Let&apos;s Talk
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}