import Navbar from '@/components/Navbar';
import PersonaAwareHome from '@/components/home/PersonaAwareHome';
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

  // Fetch latest articles for the developer homepage view
  const { articles: latestArticles } = await getLatestArticles(3);

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
      <PersonaAwareHome
        heroData={heroData}
        aboutData={aboutData}
        technologies={technologies}
        certifications={certifications}
        achievementsData={achievementsData}
        services={services}
        serviceSectionData={serviceSectionData}
        featuredProjects={featuredProjects}
        projectSection={projectSection}
        statsData={statsData}
        testimonialsData={testimonialsData}
        contactConfig={contactConfig}
        latestArticles={latestArticles}
        skillsSectionData={skillsSectionData}
      />
      <Footer siteConfig={siteConfig} />
    </HomepageLoaderManager>
  );
}
