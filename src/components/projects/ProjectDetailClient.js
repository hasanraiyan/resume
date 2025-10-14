'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Section, Button, Badge } from '@/components/ui';
import ProjectGallery from './ProjectGallery';
import RelatedProjects from './RelatedProjects';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

export default function ProjectDetailClient({ project, relatedProjects }) {
  return (
    <main className="pt-20 sm:pt-24">
      <Section className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-4xl mx-auto project-detail-content">
          <div className="text-center">
            <div className="mb-6 sm:mb-8">
              <Button href="/projects" variant="ghost" className="inline-flex items-center">
                <i className="fas fa-arrow-left mr-2"></i> Back to Projects
              </Button>
            </div>
            <div className="text-xs font-semibold tracking-widest mb-3 sm:mb-4 text-gray-600">
              {project.projectNumber} — {project.category}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              {project.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">{project.tagline}</p>
            {/* FIX: Limit the number of tags displayed in the header */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              {project.tags?.slice(0, 4).map((tag, index) => (
                <Badge key={index} variant="tag">
                  {tag.name}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {project.isForSale && project.links?.sales && (
                <Button
                  href={project.links.sales}
                  external={true}
                  variant="primary"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <i className="fas fa-shopping-cart mr-2"></i> Purchase Project
                </Button>
              )}
              {project.links?.live && (
                <Button href={project.links.live} external={true} variant="primary">
                  <i className="fas fa-external-link-alt mr-2"></i> View Live Site
                </Button>
              )}
              {project.links?.github && (
                <Button href={project.links.github} external={true} variant="secondary">
                  <i className="fab fa-github mr-2"></i> View Code
                </Button>
              )}
              {project.links?.figma && (
                <Button href={project.links.figma} external={true} variant="ghost">
                  <i className="fab fa-figma mr-2"></i> Design Files
                </Button>
              )}
            </div>
          </div>

          {project.images && project.images.length > 0 && (
            <div className="my-12 sm:my-16">
              <ProjectGallery images={project.images} />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8 sm:gap-12 mb-12 sm:mb-16">
            <div className="lg:col-span-2">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Project Overview</h2>
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                <MarkdownRenderer content={project.fullDescription || ''} />
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 sm:p-8 rounded-lg sticky top-28">
                <h3 className="text-lg font-bold mb-4">Project Details</h3>
                <dl className="space-y-3 text-sm">
                  {project.details?.client && (
                    <div>
                      <dt className="font-semibold text-gray-600">Client</dt>
                      <dd className="text-gray-800">{project.details.client}</dd>
                    </div>
                  )}
                  {project.details?.year && (
                    <div>
                      <dt className="font-semibold text-gray-600">Year</dt>
                      <dd className="text-gray-800">{project.details.year}</dd>
                    </div>
                  )}
                  {project.details?.duration && (
                    <div>
                      <dt className="font-semibold text-gray-600">Duration</dt>
                      <dd className="text-gray-800">{project.details.duration}</dd>
                    </div>
                  )}
                  {project.details?.role && (
                    <div>
                      <dt className="font-semibold text-gray-600">Role</dt>
                      <dd className="text-gray-800">{project.details.role}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>

          {(project.details?.challenge || project.details?.solution) && (
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16">
              {project.details.challenge && (
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4">The Challenge</h3>
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                    <MarkdownRenderer content={project.details.challenge} />
                  </div>
                </div>
              )}
              {project.details.solution && (
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4">The Solution</h3>
                  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                    <MarkdownRenderer content={project.details.solution} />
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* Alternative: If using tags array instead of technologies */}
          {(!project.technologies || project.technologies.length === 0) &&
            project.tags &&
            project.tags.length > 0 && (
              <div className="mb-12 sm:mb-16">
                <h3 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
                  Technology Stack
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {project.tags.map((tag, index) => (
                    <div key={index} className="text-center group">
                      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300 hover:border-gray-300">
                        <h4 className="font-semibold text-gray-900 mb-1">{tag.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">
                          {tag.category || 'Technology'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </Section>

      {/* Call to Action Section */}
      <Section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Interested in working together?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10">
            Let's create something amazing for your business
          </p>
          <Button
            href="/#contact"
            variant="primary"
            className="inline-flex items-center bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold"
          >
            Get In Touch
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Button>
        </div>
      </Section>

      <RelatedProjects projects={relatedProjects} />
    </main>
  );
}
