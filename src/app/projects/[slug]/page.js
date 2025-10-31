import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import ProjectDetailClient from '@/components/projects/ProjectDetailClient';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Contributor from '@/models/Contributor';
import { serializeProject, serializeProjects } from '@/lib/serialize';

// ========================================
//  GENERATE STATIC PARAMS (Optional but recommended)
// Pre-render all project pages at build time
// ========================================
export async function generateStaticParams() {
  await dbConnect();
  const projects = await Project.find({}, 'slug').lean();

  return projects.map((project) => ({
    slug: project.slug,
  }));
}

// ========================================
// 🎯 GENERATE METADATA (SEO)
// ========================================
export async function generateMetadata({ params }) {
  await dbConnect();
  const { slug } = await params;
  const project = await Project.findOne({ slug }).lean();

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
  await dbConnect();

  // Await params to unwrap the Promise
  const { slug } = await params;
  const project = await Project.findOne({ slug }).populate('contributors.contributor').lean();

  // If project not found, show 404
  if (!project) {
    notFound();
  }

  // Serialize project data to remove MongoDB-specific objects
  const projectData = serializeProject(project);

  // Get related projects from the same category (limit to 3)
  const relatedProjectsData = await Project.find({
    category: project.category,
    _id: { $ne: project._id },
  })
    .populate('contributors.contributor')
    .limit(3)
    .lean();

  // Serialize related projects data
  const relatedProjects = serializeProjects(relatedProjectsData);

  return (
    <>
      <CustomCursor />
      <Navbar />

      {/* Pass data to Client Component for animations */}
      <ProjectDetailClient project={projectData} relatedProjects={relatedProjects} />

      <Footer />
    </>
  );
}
