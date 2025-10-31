import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import ProjectDetailClient from '@/components/projects/ProjectDetailClient';
import { getProjectBySlug, getAllPublishedProjects } from '@/app/actions/projectActions';

// ========================================
//  GENERATE STATIC PARAMS (Optional but recommended)
// Pre-render all published project pages at build time
// ========================================
export async function generateStaticParams() {
  const { projects } = await getAllPublishedProjects(false);

  return projects.map((project) => ({
    slug: project.slug,
  }));
}

// ========================================
// 🎯 GENERATE METADATA (SEO)
// ========================================
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { project } = await getProjectBySlug(slug, false);

  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }

  return {
    title: `${project.title} - Portfolio`,
    description: project.description,
  };
}

// ========================================
// 🎨 SERVER COMPONENT (Handles async params)
// ========================================
export default async function ProjectDetailPage({ params }) {
  // Await params to unwrap the Promise
  const { slug } = await params;
  const { project } = await getProjectBySlug(slug, false);

  // If project not found, show 404
  if (!project) {
    notFound();
  }

  // Get related projects from the same category (limit to 3)
  const { projects: relatedProjectsData } = await getAllPublishedProjects(false);
  const relatedProjects = relatedProjectsData
    .filter((p) => p.category === project.category && p._id !== project._id)
    .slice(0, 3);

  return (
    <>
      <CustomCursor />
      <Navbar />

      {/* Pass data to Client Component for animations */}
      <ProjectDetailClient project={project} relatedProjects={relatedProjects} />

      <Footer />
    </>
  );
}
