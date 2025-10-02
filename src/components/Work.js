'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ========================================
// 📦 DYNAMIC DATA (Backend-Ready)
// ========================================
const workData = {
  heading: {
    title: "Selected Works",
    description: "A collection of my favorite projects"
  },
  
  projects: [
    {
      id: 1,
      projectNumber: '01',
      category: 'E-COMMERCE',
      title: 'Luxury Fashion Store',
      description: 'A sophisticated e-commerce platform for a luxury fashion brand, featuring immersive product galleries, seamless checkout experience, and advanced filtering systems.',
      tags: [
        { id: 1, name: 'React' },
        { id: 2, name: 'Shopify' },
        { id: 3, name: 'GSAP' }
      ],
      image: {
        url: 'https://picsum.photos/800/600?random=20',
        alt: 'Luxury Fashion Store Project'
      },
      link: {
        url: '/projects/luxury-fashion-store', // Replace with actual project URL
        text: 'View Project',
        icon: 'fas fa-arrow-right'
      },
      layout: {
        reverse: false // Image on left, content on right
      }
    },
    {
      id: 2,
      projectNumber: '02',
      category: 'PORTFOLIO',
      title: 'Creative Agency Site',
      description: 'A bold and dynamic website for a creative agency, showcasing their portfolio with stunning animations and interactive elements that engage visitors.',
      tags: [
        { id: 1, name: 'Next.js' },
        { id: 2, name: 'Three.js' },
        { id: 3, name: 'Framer' }
      ],
      image: {
        url: 'https://picsum.photos/800/600?random=21',
        alt: 'Creative Agency Site Project'
      },
      link: {
        url: '/projects/creative-agency-site',
        text: 'View Project',
        icon: 'fas fa-arrow-right'
      },
      layout: {
        reverse: true // Image on right, content on left
      }
    },
    {
      id: 3,
      projectNumber: '03',
      category: 'SAAS',
      title: 'Analytics Dashboard',
      description: 'A comprehensive analytics platform with real-time data visualization, customizable dashboards, and powerful reporting tools for business intelligence.',
      tags: [
        { id: 1, name: 'Vue.js' },
        { id: 2, name: 'D3.js' },
        { id: 3, name: 'Node.js' }
      ],
      image: {
        url: 'https://picsum.photos/800/600?random=22',
        alt: 'Analytics Dashboard Project'
      },
      link: {
        url: '/projects/analytics-dashboard',
        text: 'View Project',
        icon: 'fas fa-arrow-right'
      },
      layout: {
        reverse: false
      }
    }
  ]
}

// ========================================
// 🎨 COMPONENT
// ========================================
export default function Work() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const container = document.querySelector('#work .max-w-6xl')
    if (container) {
      gsap.from(container.children, {
        opacity: 0,
        y: 50,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: {
          trigger: '#work',
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      })
    }
  }, [])

  return (
    <section id="work" className="py-16 sm:py-20 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5">
            {workData.heading.title}
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            {workData.heading.description}
          </p>
        </div>

        {/* Projects List */}
        <div className="space-y-12 sm:space-y-16 md:space-y-20">
          {workData.projects.map((project) => (
            <div
              key={project.id}
              className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center"
            >
              
              {/* Project Image */}
              <div
                className={`image-reveal rounded-lg overflow-hidden shadow-2xl hover-target ${
                  project.layout.reverse ? 'lg:order-2' : ''
                }`}
              >
                <img 
                  src={project.image.url} 
                  alt={project.image.alt} 
                  className="w-full" 
                />
              </div>

              {/* Project Content */}
              <div className={project.layout.reverse ? 'lg:order-1' : ''}>
                
                {/* Category Badge */}
                <div className="text-xs font-semibold tracking-widest mb-2 sm:mb-3 text-gray-600">
                  {project.projectNumber} — {project.category}
                </div>
                
                {/* Project Title */}
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-5">
                  {project.title}
                </h3>
                
                {/* Project Description */}
                <p className="text-sm sm:text-base text-gray-700 mb-5 sm:mb-7 leading-relaxed">
                  {project.description}
                </p>
                
                {/* Technology Tags */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-5 sm:mb-7">
                  {project.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1.5 bg-gray-100 text-xs sm:text-sm font-semibold"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
                
                {/* View Project Link */}
                <a
                  href={project.link.url}
                  className="inline-flex items-center text-sm sm:text-base font-semibold underline-animate hover-target"
                >
                  {project.link.text} <i className={`${project.link.icon} ml-2`}></i>
                </a>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  )
}