import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProjectDetailClient from '@/components/projects/ProjectDetailClient';
import { getProjectBySlug, getAllPublishedProjects } from '@/app/actions/projectActions';
import { getSiteConfig } from '@/app/actions/siteActions';

import ReadingProgressBar from '@/components/blog/ReadingProgressBar';
import { getBaseUrl } from '@/lib/mcp/oauth';

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
    alternates: {
      canonical: `/projects/${project.slug}`,
    },
    openGraph: {
      title: `${project.title} - Portfolio`,
      description: project.description,
      type: 'website',
      url: `${getBaseUrl()}/projects/${project.slug}`,
      images: project.thumbnail
        ? [
            {
              url: project.thumbnail,
              alt: project.title,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} - Portfolio`,
      description: project.description,
      images: project.thumbnail ? [project.thumbnail] : [],
    },
  };
}

// ========================================
// 🎨 SERVER COMPONENT (Handles async params)
// ========================================
export default async function ProjectDetailPage({ params }) {
  // Await params to unwrap the Promise
  const { slug } = await params;
  const [{ project }, siteConfig] = await Promise.all([
    getProjectBySlug(slug, false),
    getSiteConfig(),
  ]);

  // If project not found, show 404
  if (!project) {
    notFound();
  }

  // Get related projects from the same category (limit to 3)
  const { projects: relatedProjectsData } = await getAllPublishedProjects(false);
  const relatedProjects = relatedProjectsData
    .filter((p) => p.category === project.category && p._id !== project._id)
    .slice(0, 3);

  const getProjectIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'web':
      case 'website':
        return 'Globe';
      case 'mobile':
      case 'app':
        return 'Smartphone';
      case 'design':
        return 'Palette';
      case 'development':
      case 'code':
        return 'Code';
      default:
        return 'FileText';
    }
  };

  const breadcrumbs = [
    { label: 'Home', path: '/', icon: 'Home' },
    { label: 'Projects', path: '/projects', icon: 'FolderOpen' },
    { label: project.title, icon: getProjectIcon(project.category) },
  ];

  return (
    <>
      <Navbar siteConfig={siteConfig} />
      <ReadingProgressBar />

      {/* Pass data to Client Component for animations */}
      <ProjectDetailClient
        project={project}
        relatedProjects={relatedProjects}
        breadcrumbs={breadcrumbs}
      />

      <Footer />
    </>
  );
}
