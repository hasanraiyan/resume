'use client'

import ProjectCard from './ProjectCard'
import { Section } from '@/components/ui'

/**
 * Related Projects Component
 * Shows similar projects at bottom of detail page
 */
export default function RelatedProjects({ projects }) {
  if (!projects || projects.length === 0) return null

  return (
    <Section
      title="Related Projects"
      description="You might also like these"
      centered={true}
      className="py-16 sm:py-20 bg-gray-50"
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </Section>
  )
}