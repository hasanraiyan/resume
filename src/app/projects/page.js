import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import { Section } from '@/components/ui'
import ProjectsPageClient from '@/components/projects/ProjectsPageClient'
import dbConnect from '@/lib/dbConnect'
import Project from '@/models/Project'
export default async function ProjectsPage() {
  await dbConnect()
  
  // Fetch all projects from MongoDB, convert to plain objects
  const allProjects = await Project.find({}).sort({ createdAt: -1 }).lean()
  
  // Convert MongoDB _id to string for client components
  const projects = allProjects.map(project => ({
    ...project,
    id: project._id.toString(),
    _id: project._id.toString(),
  }))

  return (
    <>
      <CustomCursor />
      <Navbar />
      
      <main className="pt-20 sm:pt-24 min-h-screen">
        <Section
          title="All Projects"
          description="Explore my complete portfolio of web and mobile applications"
          centered={true}
          className="py-12 sm:py-16 md:py-20"
        >
          <ProjectsPageClient projects={projects} />
        </Section>
      </main>

      <Footer />
    </>
  )
}