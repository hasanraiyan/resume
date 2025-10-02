'use client'

import { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CustomDropdown from './CustomDropdown'

// ========================================
// 📦 DYNAMIC DATA (Backend-Ready)
// ========================================
const contactData = {
  heading: {
    title: "Let's Create",
    subtitle: "Something Amazing",
    description: "Have a project in mind? Let's talk about it."
  },
  
  form: {
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'YOUR NAME',
        type: 'text',
        placeholder: '',
        required: true,
        gridColumn: 'half'
      },
      {
        id: 'email',
        name: 'email',
        label: 'YOUR EMAIL',
        type: 'email',
        placeholder: '',
        required: true,
        gridColumn: 'half'
      },
      {
        id: 'projectType',
        name: 'projectType',
        label: 'PROJECT TYPE',
        type: 'dropdown', // Changed from 'select' to 'dropdown'
        required: true,
        gridColumn: 'full',
        options: [
          { value: 'web-design', label: 'Web Design' },
          { value: 'web-development', label: 'Web Development' },
          { value: 'mobile-app', label: 'Mobile App' },
          { value: 'branding', label: 'Branding' },
          { value: 'ui-ux', label: 'UI/UX Design' },
          { value: 'consulting', label: 'Consulting' },
          { value: 'other', label: 'Other' }
        ],
        defaultValue: 'web-design'
      },
      {
        id: 'message',
        name: 'message',
        label: 'YOUR MESSAGE',
        type: 'textarea',
        placeholder: '',
        required: true,
        rows: 5,
        gridColumn: 'full'
      }
    ],
    
    submitButton: {
      text: 'Send Message',
      loadingText: 'Sending...'
    }
  },
  
  apiEndpoint: '/api/contact',
  
  messages: {
    success: 'Thank you! Your message has been sent successfully.',
    error: 'Oops! Something went wrong. Please try again.'
  }
}

// ========================================
// 🎨 COMPONENT
// ========================================
export default function Contact() {
  const initialFormData = contactData.form.fields.reduce((acc, field) => {
    acc[field.name] = field.defaultValue || ''
    return acc
  }, {})

  const [formData, setFormData] = useState(initialFormData)

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
    
    // Future: Send to backend
    // fetch(contactData.apiEndpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(formData)
    // })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Render field based on type
  const renderField = (field) => {
    const baseClasses = "w-full border-b-2 border-gray-300 pb-3 focus:border-black focus:outline-none transition text-sm sm:text-base bg-transparent hover-target"
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            rows={field.rows}
            required={field.required}
            placeholder={field.placeholder}
            className={`${baseClasses} resize-none`}
          />
        )
      
      case 'dropdown':
        return (
          <CustomDropdown
            label={field.label}
            options={field.options}
            value={formData[field.name]}
            onChange={handleChange}
            name={field.name}
            required={field.required}
          />
        )
      
      default: // text, email, etc.
        return (
          <input
            type={field.type}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            required={field.required}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        )
    }
  }

  return (
    <section id="contact" className="py-16 sm:py-20 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-5">
            {contactData.heading.title}
            <br />
            {contactData.heading.subtitle}
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            {contactData.heading.description}
          </p>
        </div>

        {/* Form */}
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
            
            {/* Group fields by grid layout */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-7">
              {contactData.form.fields
                .filter(field => field.gridColumn === 'half')
                .map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold mb-2 tracking-wider">
                      {field.label}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
            </div>

            {/* Full width fields */}
            {contactData.form.fields
              .filter(field => field.gridColumn === 'full')
              .map((field) => (
                <div key={field.id}>
                  {field.type !== 'dropdown' && (
                    <label className="block text-xs font-semibold mb-2 tracking-wider">
                      {field.label}
                    </label>
                  )}
                  {renderField(field)}
                </div>
              ))}

            {/* Submit Button */}
            <div className="text-center pt-6 sm:pt-7">
              <button
                type="submit"
                className="w-full sm:w-auto bg-black text-white px-10 sm:px-14 py-4 sm:py-5 text-sm sm:text-base font-semibold hover:bg-gray-800 transition magnetic-btn hover-target"
              >
                {contactData.form.submitButton.text}
              </button>
            </div>

          </form>
        </div>
      </div>
    </section>
  )
}