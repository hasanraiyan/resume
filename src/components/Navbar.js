'use client'

import { useEffect, useState } from 'react'
import { gsap } from 'gsap'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
          setIsMenuOpen(false)
        }
      })
    })
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  return (
    <>
      <nav className="fixed w-full z-50 top-0 bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <a href="#home" className="text-xl sm:text-2xl font-bold hover-target z-50">
              JD
            </a>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8 lg:space-x-10">
              <a
                href="#home"
                className="text-sm lg:text-base text-gray-800 hover:text-gray-600 font-medium underline-animate transition hover-target"
              >
                Home
              </a>
              <a
                href="#about"
                className="text-sm lg:text-base text-gray-800 hover:text-gray-600 font-medium underline-animate transition hover-target"
              >
                About
              </a>
              <a
                href="#work"
                className="text-sm lg:text-base text-gray-800 hover:text-gray-600 font-medium underline-animate transition hover-target"
              >
                Work
              </a>
              <a
                href="#contact"
                className="bg-black text-white px-4 lg:px-5 py-2 lg:py-2.5 text-sm lg:text-base hover:bg-gray-800 transition magnetic-btn hover-target"
              >
                Let&apos;s Talk
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden z-50 relative w-10 h-10 flex items-center justify-center focus:outline-none"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span
                  className={`w-full h-0.5 bg-black transition-all duration-300 ease-out ${
                    isMenuOpen ? 'rotate-45 translate-y-2' : ''
                  }`}
                ></span>
                <span
                  className={`w-full h-0.5 bg-black transition-all duration-300 ease-out ${
                    isMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                ></span>
                <span
                  className={`w-full h-0.5 bg-black transition-all duration-300 ease-out ${
                    isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Slide from Right */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-500 ease-in-out ${
          isMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-500 ${
            isMenuOpen ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        ></div>

        {/* Menu Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transform transition-transform duration-500 ease-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full pt-24 pb-8 px-8">
            {/* Menu Items */}
            <nav className="flex-1 flex flex-col justify-start space-y-2">
              <a
                href="#home"
                className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition py-4 border-b border-gray-100"
              >
                Home
              </a>
              <a
                href="#about"
                className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition py-4 border-b border-gray-100"
              >
                About
              </a>
              <a
                href="#work"
                className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition py-4 border-b border-gray-100"
              >
                Work
              </a>
              <a
                href="#contact"
                className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition py-4 border-b border-gray-100"
              >
                Contact
              </a>
            </nav>

            {/* CTA Button */}
            <div className="mt-8">
              <a
                href="#contact"
                className="block w-full bg-black text-white text-center px-8 py-4 text-lg font-semibold hover:bg-gray-800 transition"
              >
                Let&apos;s Talk
              </a>
            </div>

            {/* Social Links */}
            <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-gray-200">
              <a
                href="#"
                className="text-xl text-gray-600 hover:text-black transition w-12 h-12 flex items-center justify-center"
              >
                <i className="fab fa-dribbble"></i>
              </a>
              <a
                href="#"
                className="text-xl text-gray-600 hover:text-black transition w-12 h-12 flex items-center justify-center"
              >
                <i className="fab fa-behance"></i>
              </a>
              <a
                href="#"
                className="text-xl text-gray-600 hover:text-black transition w-12 h-12 flex items-center justify-center"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href="#"
                className="text-xl text-gray-600 hover:text-black transition w-12 h-12 flex items-center justify-center"
              >
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}