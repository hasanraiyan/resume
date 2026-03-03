import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import About from '@/components/About';
import Skills from '@/components/Skills';
import Achievements from '@/components/Achievements';
import Services from '@/components/Services';
import FeaturedWorks from '@/components/FeaturedWorks';
import Stats from '@/components/Stats';
import Testimonials from '@/components/Testimonials';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import AICreatorTeaser from '@/components/AICreatorTeaser';
import HomepageLoaderManager from '@/components/HomepageLoaderManager';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { serializeProjects } from '@/lib/serialize';
import { getLatestArticles } from '@/app/actions/articleActions';
import { getActiveServices } from '@/app/actions/serviceActions';

export default async function Home() {
  await dbConnect();

  // Fetch featured projects from MongoDB
  const featuredProjectsData = await Project.find({
    featured: true,
    visibility: 'public',
    status: 'published',
  })
    .sort({ createdAt: -1 })
    .lean();

  // Serialize all ObjectIds recursively for client components
  const featuredProjects = serializeProjects(featuredProjectsData);

  // Fetch latest articles
  const { success: articlesSuccess, articles: latestArticles } = await getLatestArticles(3);

  // Fetch active services
  const services = await getActiveServices();

  return (
    <HomepageLoaderManager>
      <Navbar />
      <Hero />
      <Marquee />
      <About />
      <Skills />
      <Achievements />
      <Services services={services} />
      <FeaturedWorks featuredProjects={featuredProjects} />
      <AICreatorTeaser />
      {/* Fix for CSS layout issue causing large right-side margin */}
      {/* overflow: 'hidden' clips any content extending beyond boundaries */}
      {/* width: '100%' ensures container takes full width of parent */}
      <div style={{ overflow: 'hidden', width: '100%' }}>
        <Stats />
      </div>
      <Testimonials />
      <Contact />
      <Footer />
    </HomepageLoaderManager>
  );
}
