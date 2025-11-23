import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import { Section } from '@/components/ui';
import ProjectsPageClient from '@/components/projects/ProjectsPageClient';
import { getAllPublishedProjects } from '@/app/actions/projectActions';

export default async function ProjectsPage() {
  // Fetch published projects with public visibility
  const { projects } = await getAllPublishedProjects(false);

  const breadcrumbs = [
    { label: 'Home', path: '/', icon: 'Home' },
    { label: 'Projects', icon: 'FolderOpen' },
  ];

  return (
    <>
      <CustomCursor />
      <Navbar />

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
