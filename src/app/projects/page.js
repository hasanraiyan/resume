import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Breadcrumb from '@/components/custom-ui/Breadcrumb';
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

      <main className="min-h-screen bg-white">
        {/* ── Editorial Header ── */}
        <div className="border-b border-neutral-200">
          <div className="border-b border-neutral-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <Breadcrumb breadcrumbs={breadcrumbs} />
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-3">
                  Portfolio
                </p>
                <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-black">
                  All Projects
                </h1>
                <p className="text-lg text-neutral-500 mt-3">
                  Web apps, mobile products, and design work.
                </p>
              </div>
              <span className="text-sm font-semibold text-neutral-400 shrink-0 pb-1">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <ProjectsPageClient projects={projects} />
        </div>
      </main>

      <Footer />
    </>
  );
}
