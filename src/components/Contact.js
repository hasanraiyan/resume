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

    const container = document.querySelector('#contact .max-w-7xl')
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
    <section id="contact" className="py-32">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <div className="text-center mb-20">
          <h2 className="text-7xl lg:text-8xl font-bold mb-6">
            Let&apos;s Create
            <br />
            Something Amazing
          </h2>
          <p className="text-xl text-gray-600">
            Have a project in mind? Let&apos;s talk about it.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold mb-3 tracking-wider">
                  YOUR NAME
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border-b-2 border-gray-300 pb-4 focus:border-black focus:outline-none transition text-lg bg-transparent hover-target"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3 tracking-wider">
                  YOUR EMAIL
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border-b-2 border-gray-300 pb-4 focus:border-black focus:outline-none transition text-lg bg-transparent hover-target"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3 tracking-wider">
                PROJECT TYPE
              </label>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="w-full border-b-2 border-gray-300 pb-4 focus:border-black focus:outline-none transition text-lg bg-transparent hover-target"
              >
                <option>Web Design</option>
                <option>Web Development</option>
                <option>Mobile App</option>
                <option>Branding</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3 tracking-wider">
                YOUR MESSAGE
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="6"
                className="w-full border-b-2 border-gray-300 pb-4 focus:border-black focus:outline-none transition text-lg resize-none bg-transparent hover-target"
              ></textarea>
            </div>
            <div className="text-center pt-8">
              <button
                type="submit"
                className="bg-black text-white px-16 py-6 text-lg font-semibold hover:bg-gray-800 transition magnetic-btn hover-target"
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