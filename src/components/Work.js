'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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

  const projects = [
    {
      id: '01',
      category: 'E-COMMERCE',
      title: 'Luxury Fashion Store',
      description:
        'A sophisticated e-commerce platform for a luxury fashion brand, featuring immersive product galleries, seamless checkout experience, and advanced filtering systems.',
      tags: ['React', 'Shopify', 'GSAP'],
      image: 'https://picsum.photos/800/600?random=20',
    },
    {
      id: '02',
      category: 'PORTFOLIO',
      title: 'Creative Agency Site',
      description:
        'A bold and dynamic website for a creative agency, showcasing their portfolio with stunning animations and interactive elements that engage visitors.',
      tags: ['Next.js', 'Three.js', 'Framer'],
      image: 'https://picsum.photos/800/600?random=21',
      reverse: true,
    },
    {
      id: '03',
      category: 'SAAS',
      title: 'Analytics Dashboard',
      description:
        'A comprehensive analytics platform with real-time data visualization, customizable dashboards, and powerful reporting tools for business intelligence.',
      tags: ['Vue.js', 'D3.js', 'Node.js'],
      image: 'https://picsum.photos/800/600?random=22',
    },
  ]

  return (
    <section id="work" className="py-16 sm:py-20 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5">Selected Works</h2>
          <p className="text-base sm:text-lg text-gray-600">A collection of my favorite projects</p>
        </div>
        <div className="space-y-12 sm:space-y-16 md:space-y-20">
          {projects.map((project) => (
            <div
              key={project.id}
              className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center"
            >
              <div
                className={`image-reveal rounded-lg overflow-hidden shadow-2xl hover-target ${
                  project.reverse ? 'lg:order-2' : ''
                }`}
              >
                <img src={project.image} alt="Project" className="w-full" />
              </div>
              <div className={project.reverse ? 'lg:order-1' : ''}>
                <div className="text-xs font-semibold tracking-widest mb-2 sm:mb-3 text-gray-600">
                  {project.id} — {project.category}
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-5">{project.title}</h3>
                <p className="text-sm sm:text-base text-gray-700 mb-5 sm:mb-7 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-5 sm:mb-7">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-gray-100 text-xs sm:text-sm font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href="#"
                  className="inline-flex items-center text-sm sm:text-base font-semibold underline-animate hover-target"
                >
                  View Project <i className="fas fa-arrow-right ml-2"></i>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}