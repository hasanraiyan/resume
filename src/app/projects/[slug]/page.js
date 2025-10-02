import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import ProjectDetailClient from '@/components/projects/ProjectDetailClient'
import dbConnect from '@/lib/dbConnect'
import Project from '@/models/Project'

// ========================================
//  GENERATE STATIC PARAMS (Optional but recommended)
// Pre-render all project pages at build time
// ========================================
export async function generateStaticParams() {
  await dbConnect()
  const projects = await Project.find({}, 'slug').lean()
  
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

// ========================================
// 🎯 GENERATE METADATA (SEO)
// ========================================
export async function generateMetadata({ params }) {
  await dbConnect()
  const { slug } = await params
  const project = await Project.findOne({ slug }).lean()
  
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
  await dbConnect()
  
  // Await params to unwrap the Promise
  const { slug } = await params
  const project = await Project.findOne({ slug }).lean()
  
  // If project not found, show 404
  if (!project) {
    notFound()
  }

  // Convert MongoDB _id to string and get related projects
  const projectData = {
    ...project,
    id: project._id.toString(),
    _id: project._id.toString(),
  }

  // Get related projects from the same category (limit to 3)
  const relatedProjectsData = await Project.find({ 
    category: project.category, 
    _id: { $ne: project._id } 
  })
  .limit(3)
  .lean()

  const relatedProjects = relatedProjectsData.map(p => ({
    ...p,
    id: p._id.toString(),
    _id: p._id.toString(),
  }))

  return (
    <>
      <CustomCursor />
      <Navbar />
      
      {/* Pass data to Client Component for animations */}
      <ProjectDetailClient 
        project={projectData} 
        relatedProjects={relatedProjects} 
      />

      <Footer />
    </>
  )
}