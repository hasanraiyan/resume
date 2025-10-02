'use client'

import { useState, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import { Section } from '@/components/ui'
import ProjectCard from '@/components/projects/ProjectCard'
import ProjectFilters from '@/components/projects/ProjectFilters'
import { getAllProjects, getProjectsByCategory, searchProjects } from '@/data/projects'
export default function ProjectsPage() {
  const allProjects = getAllProjects()
  const [filteredProjects, setFilteredProjects] = useState(allProjects)
  const [isLoading, setIsLoading] = useState(false)

  // Cleanup on component mount to ensure fresh state
  useEffect(() => {
    // Kill any existing ScrollTriggers from other pages
    ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    ScrollTrigger.refresh()
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Clean up previous ScrollTriggers
    ScrollTrigger.getAll().forEach(trigger => trigger.kill())

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const grid = document.querySelector('.projects-grid')
      if (grid && grid.children.length > 0) {
        // Reset any existing transforms
        gsap.set(grid.children, { opacity: 1, y: 0 })
        
        gsap.from(grid.children, {
          opacity: 0,
          y: 50,
          duration: 0.8,
          stagger: 0.1,
          scrollTrigger: {
            trigger: grid,
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
  }, [filteredProjects])

  const handleFilterChange = (category) => {
    setIsLoading(true)
    setTimeout(() => {
      const filtered = getProjectsByCategory(category)
      setFilteredProjects(filtered)
      setIsLoading(false)
    }, 300)
  }

  const handleSearch = (query) => {
    setIsLoading(true)
    setTimeout(() => {
      if (query.trim() === '') {
        setFilteredProjects(allProjects)
      } else {
        const results = searchProjects(query)
        setFilteredProjects(results)
      }
      setIsLoading(false)
    }, 300)
  }

  return (
    <>
      <CustomCursor />
      <Navbar />
      
      <main className="pt-20 sm:pt-24 min-h-screen">
        
        {/* Page Header */}
        <Section
          title="All Projects"
          description="Explore my complete portfolio of web and mobile applications"
          centered={true}
          className="py-12 sm:py-16 md:py-20"
        >
          
          {/* Filters */}
          <ProjectFilters 
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
          />

          {/* Projects Grid */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
              <p className="mt-4 text-gray-600">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <i className="fas fa-search text-5xl text-gray-300 mb-4"></i>
              <p className="text-xl text-gray-600">No projects found</p>
              <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {/* FIXED GRID - Better spacing and alignment */}
              <div 
                key={filteredProjects.length} 
                className="projects-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12"
              >
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>

              {/* Project Count */}
              <div className="text-center mt-12 sm:mt-16 text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredProjects.length}</span> of <span className="font-semibold">{allProjects.length}</span> projects
              </div>
            </>
          )}

        </Section>
      </main>

      <Footer />
    </>
  )
}