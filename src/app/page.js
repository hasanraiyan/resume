import CustomCursor from '@/components/CustomCursor'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Marquee from '@/components/Marquee'
import About from '@/components/About'
import Work from '@/components/Work'
import Stats from '@/components/Stats'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import HomePageClient from '@/components/HomePageClient'
import dbConnect from '@/lib/dbConnect'
import Project from '@/models/Project'
import { serializeProjects } from '@/lib/serialize'

export default async function Home() {
  await dbConnect()
  
  // Fetch featured projects from MongoDB
  const featuredProjectsData = await Project.find({ featured: true }).sort({ createdAt: -1 }).lean()
  
  // Serialize all ObjectIds recursively for client components
  const featuredProjects = serializeProjects(featuredProjectsData)

  return (
    <>
      <HomePageClient>
        <CustomCursor />
        <Navbar />
        <Hero />
        <Marquee />
        <About />
        <Work featuredProjects={featuredProjects} />
        <Stats />
        <Contact />
        <Footer />
      </HomePageClient>
    </>
  )
}