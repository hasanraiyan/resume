'use client'

import { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: 'Web Design',
    message: '',
  })

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const container = document.querySelector('#contact .max-w-6xl')
    if (container) {
      gsap.from(container.children, {
        opacity: 0,
        y: 50,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: {
          trigger: '#contact',
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      })
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // Add your form submission logic here
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <section id="contact" className="py-16 sm:py-20 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-5">
            Let&apos;s Create
            <br />
            Something Amazing
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            Have a project in mind? Let&apos;s talk about it.
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-7">
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wider">
                  YOUR NAME
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border-b-2 border-gray-300 pb-3 focus:border-black focus:outline-none transition text-sm sm:text-base bg-transparent hover-target"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wider">
                  YOUR EMAIL
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border-b-2 border-gray-300 pb-3 focus:border-black focus:outline-none transition text-sm sm:text-base bg-transparent hover-target"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 tracking-wider">
                PROJECT TYPE
              </label>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="w-full border-b-2 border-gray-300 pb-3 focus:border-black focus:outline-none transition text-sm sm:text-base bg-transparent hover-target"
              >
                <option>Web Design</option>
                <option>Web Development</option>
                <option>Mobile App</option>
                <option>Branding</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 tracking-wider">
                YOUR MESSAGE
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="5"
                className="w-full border-b-2 border-gray-300 pb-3 focus:border-black focus:outline-none transition text-sm sm:text-base resize-none bg-transparent hover-target"
              ></textarea>
            </div>
            <div className="text-center pt-6 sm:pt-7">
              <button
                type="submit"
                className="w-full sm:w-auto bg-black text-white px-10 sm:px-14 py-4 sm:py-5 text-sm sm:text-base font-semibold hover:bg-gray-800 transition magnetic-btn hover-target"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}