import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Section } from '@/components/ui';
import ProjectsPageClient from '@/components/projects/ProjectsPageClient';
import { getAllPublishedProjects } from '@/app/actions/projectActions';
import { getSiteConfig } from '@/app/actions/siteActions';

export const metadata = {
  title: 'Portfolio Projects - Custom Web & Mobile Applications',
  description:
    'Showcase of recent web development projects, SaaS MVPs, and UI/UX designs built with Next.js and React.',
  alternates: {
    canonical: '/projects',
  },
};

export default async function ProjectsPage() {
  const [{ projects }, siteConfig] = await Promise.all([
    getAllPublishedProjects(false),
    getSiteConfig(),
  ]);

  const breadcrumbs = [
    { label: 'Home', path: '/', icon: 'Home' },
    { label: 'Projects', icon: 'FolderOpen' },
  ];

  return (
    <>
      <Navbar siteConfig={siteConfig} />

      <main className=" min-h-screen">
        <Section
          title="All Projects"
          description="Explore my complete portfolio of web and mobile applications"
          centered={true}
          className="py-12 sm:py-18 md:py-16"
          breadcrumbs={breadcrumbs}
        >
          <ProjectsPageClient projects={projects} />
        </Section>
      </main>

      <Footer />
    </>
  );
}
