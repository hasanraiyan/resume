'use client';

import Breadcrumb from '@/components/custom-ui/Breadcrumb';
import { ForSaleBadge } from '@/components/custom-ui';
import ProjectGallery from './ProjectGallery';
import RelatedProjects from './RelatedProjects';
import MarkdownRenderer from '@/components/custom-ui/MarkdownRenderer';
import LikeButton from '@/components/LikeButton';
import SocialShare from '@/components/SocialShare';

const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 mb-8">
    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 shrink-0">
      {children}
    </span>
    <div className="h-px flex-1 bg-neutral-200" />
  </div>
);

const SocialLink = ({ href, icon, title }) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-neutral-400 hover:text-black transition-colors text-xs"
      title={title}
    >
      <i className={icon}></i>
    </a>
  ) : null;

export default function ProjectDetailClient({ project, relatedProjects, breadcrumbs }) {
  const allContributors =
    project.contributors?.map((item) => ({
      _id: item.contributor._id,
      name: item.contributor.name,
      avatar: item.contributor.avatar || '/images/avatar-placeholder.png',
      bio: item.contributor.bio,
      role: item.role,
      isActive: item.isActive !== false,
      socialLinks: item.contributor.socialLinks || {},
    })) || [];

  const currentTeam = allContributors.filter((c) => c.isActive);
  const pastContributors = allContributors.filter((c) => !c.isActive);

  const tagsByCategory = project.tags?.reduce((acc, tag) => {
    const cat = tag.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tag.name);
    return acc;
  }, {});

  return (
    <main>
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-neutral-200">
        {/* Breadcrumb + eyebrow strip */}
        <div className="border-b border-neutral-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            {breadcrumbs && <Breadcrumb breadcrumbs={breadcrumbs} />}
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 shrink-0">
              {project.projectNumber}
            </span>
          </div>
        </div>

        {/* Title + meta */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-0 sm:pt-20">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-[0.25em] uppercase text-neutral-400 mb-4">
                {project.category}
              </p>
              <div className="relative inline-block">
                <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-[3.75rem] font-bold leading-[1.05] tracking-tight text-black">
                  {project.title}
                </h1>
                {project.isForSale && (
                  <span className="absolute -top-2 -right-4">
                    <ForSaleBadge size="sm" />
                  </span>
                )}
              </div>
              <p className="text-lg sm:text-xl text-neutral-500 mt-4 leading-relaxed">
                {project.tagline}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end lg:shrink-0">
              {project.isForSale && project.links?.sales && (
                <a
                  href={project.links.sales}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 bg-green-600 text-white text-xs font-bold tracking-wide hover:bg-green-700 transition-colors"
                >
                  <i className="fas fa-shopping-cart mr-2"></i> Purchase
                </a>
              )}
              {project.links?.live && (
                <a
                  href={project.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 bg-black text-white text-xs font-bold tracking-wide hover:bg-neutral-800 transition-colors"
                >
                  <i className="fas fa-external-link-alt mr-2"></i> Live Site
                </a>
              )}
              {project.links?.github && (
                <a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 border-2 border-black text-black text-xs font-bold tracking-wide hover:bg-black hover:text-white transition-colors"
                >
                  <i className="fab fa-github mr-2"></i> Source Code
                </a>
              )}
              {project.links?.figma && (
                <a
                  href={project.links.figma}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 border border-neutral-300 text-neutral-600 text-xs font-bold tracking-wide hover:border-black hover:text-black transition-colors"
                >
                  <i className="fab fa-figma mr-2"></i> Figma
                </a>
              )}
            </div>
          </div>

          {/* Metadata + engagement row */}
          <div className="mt-10 pt-5 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {project.details?.year && (
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                    Year
                  </span>
                  <span className="text-sm font-semibold text-black">{project.details.year}</span>
                </div>
              )}
              {project.details?.duration && (
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                    Duration
                  </span>
                  <span className="text-sm font-semibold text-black">
                    {project.details.duration}
                  </span>
                </div>
              )}
              {project.details?.role && (
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                    Role
                  </span>
                  <span className="text-sm font-semibold text-black">{project.details.role}</span>
                </div>
              )}
              {project.details?.client && (
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                    Client
                  </span>
                  <span className="text-sm font-semibold text-black">{project.details.client}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <SocialShare
                title={project.title}
                slug={project.slug}
                excerpt={project.tagline}
                type="project"
              />
              <LikeButton
                type="project"
                slug={project.slug}
                engagementType="like"
                initialCount={project.likes || 0}
              />
              <LikeButton
                type="project"
                slug={project.slug}
                engagementType="clap"
                initialCount={project.claps || 0}
              />
            </div>
          </div>
        </div>

        {/* Tags strip */}
        {project.tags?.length > 0 && (
          <div className="border-t border-neutral-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-2">
              {project.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] font-semibold tracking-wide text-neutral-500 bg-neutral-100 px-2.5 py-1"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── GALLERY ──────────────────────────────────────────────── */}
      {project.images?.length > 0 && (
        <div className="bg-neutral-950 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProjectGallery images={project.images} />
          </div>
        </div>
      )}

      {/* ── OVERVIEW ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7">
              <SectionLabel>Overview</SectionLabel>
              <div className="prose prose-lg max-w-none text-neutral-700 leading-relaxed prose-headings:font-['Playfair_Display'] prose-headings:font-bold">
                <MarkdownRenderer content={project.fullDescription || ''} />
              </div>
            </div>

            {(project.details?.challenge || project.details?.solution) && (
              <div className="lg:col-span-5 space-y-10 lg:border-l lg:border-neutral-200 lg:pl-12">
                {project.details.challenge && (
                  <div>
                    <SectionLabel>The Challenge</SectionLabel>
                    <div className="prose prose-sm max-w-none text-neutral-600 leading-relaxed">
                      <MarkdownRenderer content={project.details.challenge} />
                    </div>
                  </div>
                )}
                {project.details.solution && (
                  <div>
                    <SectionLabel>The Solution</SectionLabel>
                    <div className="prose prose-sm max-w-none text-neutral-600 leading-relaxed">
                      <MarkdownRenderer content={project.details.solution} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── RESULTS ──────────────────────────────────────────────── */}
      {project.details?.results?.length > 0 && (
        <section className="bg-black text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-neutral-800" />
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-500 shrink-0">
                Results & Impact
              </span>
              <div className="h-px flex-1 bg-neutral-800" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.details.results.map((result, i) => (
                <div
                  key={i}
                  className="border border-neutral-800 p-6 hover:border-neutral-600 transition-colors"
                >
                  <div className="font-['Playfair_Display'] text-4xl font-bold text-neutral-700 mb-3 leading-none">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <p className="text-sm text-neutral-300 leading-relaxed">{result}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TECHNOLOGY STACK ─────────────────────────────────────── */}
      {tagsByCategory && Object.keys(tagsByCategory).length > 0 && (
        <section className="bg-white border-b border-neutral-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-black" />
              <h2 className="text-xl sm:text-2xl font-bold shrink-0">Technology Stack</h2>
              <div className="h-px flex-1 bg-black" />
            </div>
            <div className="divide-y divide-neutral-200 border-t border-neutral-200">
              {Object.entries(tagsByCategory).map(([category, names]) => (
                <div
                  key={category}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 py-4"
                >
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 sm:w-32 shrink-0">
                    {category}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {names.map((name, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-black text-white text-xs font-semibold tracking-wide"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CONTRIBUTORS ─────────────────────────────────────────── */}
      {(currentTeam.length > 0 || pastContributors.length > 0) && (
        <section className="bg-neutral-50 border-b border-neutral-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            {currentTeam.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-px flex-1 bg-black" />
                  <h2 className="text-xl sm:text-2xl font-bold shrink-0">
                    {pastContributors.length > 0 ? 'Current Team' : 'Contributors'}
                  </h2>
                  <div className="h-px flex-1 bg-black" />
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentTeam.map((c, i) => (
                    <div
                      key={i}
                      className="bg-white border border-neutral-200 p-5 flex items-start gap-4 hover:border-black transition-colors group"
                    >
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-black leading-tight">{c.name}</h4>
                        <p className="text-xs text-neutral-500 mt-0.5 mb-2">{c.role}</p>
                        <div className="flex gap-3">
                          <SocialLink
                            href={c.socialLinks?.portfolio}
                            icon="fas fa-globe"
                            title="Portfolio"
                          />
                          <SocialLink
                            href={c.socialLinks?.linkedin}
                            icon="fab fa-linkedin"
                            title="LinkedIn"
                          />
                          <SocialLink
                            href={c.socialLinks?.github}
                            icon="fab fa-github"
                            title="GitHub"
                          />
                          <SocialLink
                            href={c.socialLinks?.twitter}
                            icon="fab fa-twitter"
                            title="Twitter"
                          />
                          <SocialLink
                            href={c.socialLinks?.dribbble}
                            icon="fab fa-dribbble"
                            title="Dribbble"
                          />
                          <SocialLink
                            href={c.socialLinks?.behance}
                            icon="fab fa-behance"
                            title="Behance"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {pastContributors.length > 0 && (
              <div className={currentTeam.length > 0 ? 'mt-14' : ''}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-black" />
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-black shrink-0">
                    Project Alumni
                  </span>
                  <div className="h-px flex-1 bg-black" />
                </div>
                <div className="grid sm:grid-cols-2 gap-x-12">
                  {pastContributors.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-3 border-b border-neutral-200"
                    >
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-8 h-8 rounded-full object-cover grayscale shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-['Playfair_Display'] font-bold text-sm text-black">
                          {c.name}
                        </span>
                        <span className="mx-2 text-neutral-300 select-none">·</span>
                        <span className="text-xs text-neutral-400 italic">{c.role}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto shrink-0">
                        <SocialLink
                          href={c.socialLinks?.github}
                          icon="fab fa-github"
                          title="GitHub"
                        />
                        <SocialLink
                          href={c.socialLinks?.linkedin}
                          icon="fab fa-linkedin"
                          title="LinkedIn"
                        />
                        <SocialLink
                          href={c.socialLinks?.portfolio}
                          icon="fas fa-globe"
                          title="Portfolio"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-black text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
          <div>
            <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-neutral-600 mb-4">
              What&apos;s next?
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Interested in
              <br />
              working together?
            </h2>
          </div>
          <a
            href="/#contact"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black text-xs font-bold tracking-widest uppercase hover:bg-neutral-100 transition-colors shrink-0"
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
          </a>
        </div>
      </section>

      <RelatedProjects projects={relatedProjects} />
    </main>
  );
}
