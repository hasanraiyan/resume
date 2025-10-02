'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Section, Button, Badge } from '@/components/ui'
import ProjectGallery from './ProjectGallery'
import RelatedProjects from './RelatedProjects'

/**
 * Client Component for Project Detail Page
 * Handles GSAP animations
 */
export default function ProjectDetailClient({ project, relatedProjects }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Clean up any existing ScrollTriggers
    ScrollTrigger.getAll().forEach(trigger => trigger.kill())

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('.project-detail-content > *')
      if (elements.length > 0) {
        // Reset any existing transforms
        gsap.set(elements, { opacity: 1, y: 0 })
        
        gsap.from(elements, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          stagger: 0.15,
          scrollTrigger: {
            trigger: '.project-detail-content',
            start: 'top 80%',
            toggleActions: 'play none none reverse',
            refreshPriority: -1,
          },
        })
      }
      
      // Refresh ScrollTrigger to recalculate positions
      ScrollTrigger.refresh()
    }, 100)

    return () => {
      clearTimeout(timer)
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [])

  return (
    <main className="pt-20 sm:pt-24">
      
      {/* Project Header */}
      <Section className="py-8 sm:py-12 md:py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Back Button */}
          <div className="mb-6 sm:mb-8">
            <Button
              href="/projects"
              variant="ghost"
              className="inline-flex items-center"
            >
              <i className="fas fa-arrow-left mr-2"></i> Back to Projects
            </Button>
          </div>

          {/* Category Badge */}
          <div className="text-xs font-semibold tracking-widest mb-3 sm:mb-4 text-gray-600">
            {project.projectNumber} — {project.category}
          </div>
          
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            {project.title}
          </h1>
          
          {/* Tagline */}
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
            {project.tagline}
          </p>
          
          {/* Tech Tags */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            {project.tags?.map((tag, index) => (
              <Badge key={index} variant="tag">
                {tag.name}
              </Badge>
            ))}
          </div>

          {/* Links */}
          {project.links && (
            <div className="flex flex-wrap justify-center gap-4">
              {project.links.live && (
                <Button
                  href={project.links.live}
                  external={true}
                  variant="primary"
                  className="px-6 sm:px-8 py-3 sm:py-4"
                >
                  <i className="fas fa-external-link-alt mr-2"></i> View Live Site
                </Button>
              )}
              {project.links.github && (
                <Button
                  href={project.links.github}
                  external={true}
                  variant="secondary"
                  className="px-6 sm:px-8 py-3 sm:py-4"
                >
                  <i className="fab fa-github mr-2"></i> Source Code
                </Button>
              )}
              {project.links.figma && (
                <Button
                  href={project.links.figma}
                  external={true}
                  variant="ghost"
                  className="px-6 sm:px-8 py-3 sm:py-4"
                >
                  <i className="fab fa-figma mr-2"></i> Design Files
                </Button>
              )}
            </div>
          )}
          {/* Image Gallery */}
          {project.images && project.images.length > 0 && (
            <div className="mb-12 sm:mb-16">
              <ProjectGallery images={project.images} />
            </div>
          )}

          {/* Project Overview */}
          <div className="grid lg:grid-cols-3 gap-8 sm:gap-12 mb-12 sm:mb-16">
            
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
                Project Overview
              </h2>
              <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
                {project.fullDescription?.split('\n').map((paragraph, index) => (
                  paragraph.trim() && <p key={index}>{paragraph.trim()}</p>
                ))}
              </div>
            </div>

            {/* Project Details Sidebar */}
            {project.details && (
              <div className="lg:col-span-1">
                <div className="bg-gray-50 p-6 sm:p-8 rounded-lg">
                  <h3 className="text-lg font-bold mb-4">Project Details</h3>
                  <dl className="space-y-3 text-sm">
                    {project.details.client && (
                      <div>
                        <dt className="font-semibold text-gray-600">Client</dt>
                        <dd className="text-gray-800">{project.details.client}</dd>
                      </div>
                    )}
                    {project.details.year && (
                      <div>
                        <dt className="font-semibold text-gray-600">Year</dt>
                        <dd className="text-gray-800">{project.details.year}</dd>
                      </div>
                    )}
                    {project.details.duration && (
                      <div>
                        <dt className="font-semibold text-gray-600">Duration</dt>
                        <dd className="text-gray-800">{project.details.duration}</dd>
                      </div>
                    )}
                    {project.details.role && (
                      <div>
                        <dt className="font-semibold text-gray-600">Role</dt>
                        <dd className="text-gray-800">{project.details.role}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}
          </div>

          {/* Challenge & Solution */}
          {project.details && (project.details.challenge || project.details.solution) && (
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16">
              {project.details.challenge && (
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4">
                    The Challenge
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {project.details.challenge}
                  </p>
                </div>
              )}
              {project.details.solution && (
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4">
                    The Solution
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {project.details.solution}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {project.details?.results && project.details.results.length > 0 && (
            <div className="bg-black text-white p-8 sm:p-12 rounded-lg mb-12 sm:mb-16">
              <h3 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">
                Results & Impact
              </h3>
              <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                {project.details.results.map((result, index) => (
                  <div key={index} className="flex items-start">
                    <i className="fas fa-check-circle text-green-400 text-xl mr-3 mt-1"></i>
                    <p className="text-base sm:text-lg">{result}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack Deep Dive */}
          {project.tags && project.tags.length > 0 && (
            <div className="mb-12 sm:mb-16">
              <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
                Technology Stack
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {project.tags.map((tag, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 p-4 sm:p-6 text-center hover:bg-gray-100 transition"
                  >
                    <p className="font-semibold text-sm sm:text-base">{tag.name}</p>
                    {tag.category && (
                      <p className="text-xs text-gray-500 mt-1 capitalize">{tag.category}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center py-8 sm:py-12 border-t-2 border-gray-200">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Interested in working together?
            </h3>
            <p className="text-gray-600 mb-6 sm:mb-8">
              Let's create something amazing for your business
            </p>
            <Button
              href="/#contact"
              variant="primary"
              className="px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg"
            >
              Get In Touch <i className="fas fa-arrow-right ml-3"></i>
            </Button>
          </div>

        </div>
      </Section>

      {/* Related Projects */}
      <RelatedProjects projects={relatedProjects} />

    </main>
  )
}