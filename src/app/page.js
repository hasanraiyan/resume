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
import HomepageLoaderManager from '@/components/HomepageLoaderManager';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { serializeProjects } from '@/lib/serialize';
import { getLatestArticles } from '@/app/actions/articleActions';
import { getActiveServices } from '@/app/actions/serviceActions';
import { getAllTechnologies } from '@/app/actions/technologyActions';
import { getAllCertifications } from '@/app/actions/certificationActions';
import { getContactSectionData } from '@/app/actions/contactSectionActions';
import { getHeroData } from '@/app/actions/heroActions';
import { getAboutData } from '@/app/actions/aboutActions';
import { getSiteConfig } from '@/app/actions/siteActions';
import { getStatsData } from '@/app/actions/statsActions';
import { getAchievementsData } from '@/app/actions/achievementActions';
import { getTestimonialsData } from '@/app/actions/testimonialActions';
import { getProjectSectionData } from '@/app/actions/projectSectionActions';
import { getFeaturedProjects } from '@/app/actions/projectActions';
import { getServiceSectionData } from '@/app/actions/serviceSectionActions';
import { getSkillsSectionData } from '@/app/actions/skillsSectionActions';

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

  // CMS Data
  const technologies = await getAllTechnologies();
  const certifications = await getAllCertifications();
  const contactConfig = await getContactSectionData();

  const [
    heroData,
    statsData,
    aboutData,
    siteConfig,
    achievementsData,
    testimonialsData,
    projectSection,
    skillsSectionData,
    serviceSectionData,
  ] = await Promise.all([
    getHeroData(),
    getStatsData(),
    getAboutData(),
    getSiteConfig(),
    getAchievementsData(),
    getTestimonialsData(),
    getProjectSectionData(),
    getSkillsSectionData(),
    getServiceSectionData(),
  ]);

  return (
    <HomepageLoaderManager>
      <Navbar siteConfig={siteConfig} />
      <Hero data={heroData} />
      <Marquee />
      <About aboutData={aboutData} />
      <Skills
        technologies={technologies}
        certifications={certifications}
        section={skillsSectionData || {}}
      />
      <Achievements
        achievements={achievementsData?.achievements || []}
        certifications={achievementsData?.certifications || []}
        section={achievementsData?.section || {}}
      />
      <Services services={services} section={serviceSectionData || {}} />
      <FeaturedWorks featuredProjects={featuredProjects} section={projectSection || {}} />
      <div style={{ overflow: 'hidden', width: '100%' }}>
        <Stats statsData={statsData} />
      </div>

      <Testimonials
        testimonials={testimonialsData?.testimonials || []}
        section={testimonialsData?.section || {}}
      />
      <Contact config={contactConfig} />
      <Footer siteConfig={siteConfig} />
    </HomepageLoaderManager>
  );
}
