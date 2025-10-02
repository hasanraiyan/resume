import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import ProjectDetailClient from '@/components/projects/ProjectDetailClient'
import { getProjectBySlug, getRelatedProjects, getAllProjects } from '@/data/projects'

// ========================================
//  GENERATE STATIC PARAMS (Optional but recommended)
// Pre-render all project pages at build time
// ========================================
export async function generateStaticParams() {
  const projects = getAllProjects()
  
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

// ========================================
// 🎯 GENERATE METADATA (SEO)
// ========================================
export async function generateMetadata({ params }) {
  const { slug } = await params
  const project = getProjectBySlug(slug)
  
  if (!project) {
    return {
      title: 'Project Not Found',
    }
  }

  return {
    title: `${project.title} - Portfolio`,
    description: project.description,
  }
}

// ========================================
// 🎨 SERVER COMPONENT (Handles async params)
// ========================================
export default async function ProjectDetailPage({ params }) {
  // Await params to unwrap the Promise
  const { slug } = await params
  const project = getProjectBySlug(slug)
  
  // If project not found, show 404
  if (!project) {
    notFound()
  }

  const relatedProjects = getRelatedProjects(project.id)

  return (
    <>
      <CustomCursor />
      <Navbar />
      
      {/* Pass data to Client Component for animations */}
      <ProjectDetailClient 
        project={project} 
        relatedProjects={relatedProjects} 
      />

      <Footer />
    </>
  )
}