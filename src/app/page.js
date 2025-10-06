import CustomCursor from '@/components/CustomCursor'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Marquee from '@/components/Marquee'
import About from '@/components/About'
import Work from '@/components/Work'
import Stats from '@/components/Stats'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import HomepageLoaderManager from '@/components/HomepageLoaderManager'
import dbConnect from '@/lib/dbConnect'
import Project from '@/models/Project'
import { serializeProjects } from '@/lib/serialize'
import { getLatestArticles } from '@/app/actions/articleActions'

export default async function Home() {
  await dbConnect()

  // Fetch featured projects from MongoDB
  const featuredProjectsData = await Project.find({ featured: true }).sort({ createdAt: -1 }).lean()

  // Serialize all ObjectIds recursively for client components
  const featuredProjects = serializeProjects(featuredProjectsData)

  // Fetch latest articles
  const { success: articlesSuccess, articles: latestArticles } = await getLatestArticles(3)

  return (
    <HomepageLoaderManager>
      <CustomCursor />
      <Navbar />
      <Hero />
      <Marquee />
      <About />
      <Work featuredProjects={featuredProjects} />
      {/* Fix for CSS layout issue causing large right-side margin */}
      {/* overflow: 'hidden' clips any content extending beyond boundaries */}
      {/* width: '100%' ensures container takes full width of parent */}
      <div style={{ overflow: 'hidden', width: '100%' }}>
        <Stats />
      </div>
      <Contact />
      <Footer />
    </HomepageLoaderManager>
  )
}
