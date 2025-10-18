import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import { Section } from '@/components/ui';
import ProjectsPageClient from '@/components/projects/ProjectsPageClient';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { serializeProjects } from '@/lib/serialize';

export default async function ProjectsPage() {
  await dbConnect();

  // Fetch all projects from MongoDB, convert to plain objects
  const allProjects = await Project.find({}).sort({ createdAt: -1 }).lean();

  // Serialize all ObjectIds recursively for client components
  const projects = serializeProjects(allProjects);

  return (
    <>
      <CustomCursor />
      <Navbar />

      <main className=" min-h-screen">
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
  );
}
