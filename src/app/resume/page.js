import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Breadcrumb from '@/components/custom-ui/Breadcrumb';
import { getSiteConfig } from '@/app/actions/siteActions';
import Link from 'next/link';

export const metadata = {
  title: 'Resume — Raiyan Hasan',
  description: "View Raiyan Hasan's professional resume.",
  alternates: { canonical: '/resume' },
};

const breadcrumbs = [
  { label: 'Home', path: '/', icon: 'Home' },
  { label: 'Resume', icon: 'FileText' },
];

const RESUME_URL =
  'https://res.cloudinary.com/djkpavwmp/image/upload/v1762505345/portfolio_assets/lm7rjwgpatligdjlkqau.jpg';

export default async function ResumePage() {
  const siteConfig = await getSiteConfig();

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
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-3">
                  Document
                </p>
                <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-black">
                  Resume
                </h1>
                <p className="text-lg text-neutral-500 mt-3">
                  My professional background, skills, and experience.
                </p>
              </div>
              <a
                href={RESUME_URL}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-bold tracking-widest uppercase hover:bg-neutral-800 transition-colors shrink-0"
              >
                <i className="fas fa-download text-xs"></i> Download
              </a>
            </div>
          </div>
        </div>

        {/* ── Resume Image ── */}
        <div className="bg-neutral-100 border-b border-neutral-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="shadow-2xl">
              <img src={RESUME_URL} alt="Resume" className="w-full h-auto block" />
            </div>
          </div>
        </div>

        {/* ── CTA strip ── */}
        <div className="bg-black text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-neutral-600 mb-2">
                Open to opportunities
              </p>
              <p className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-white">
                Let&apos;s work together.
              </p>
            </div>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-3 px-7 py-3.5 bg-white text-black text-xs font-bold tracking-widest uppercase hover:bg-neutral-100 transition-colors shrink-0"
            >
              Get In Touch
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
