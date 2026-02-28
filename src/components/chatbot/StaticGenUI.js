'use client';

import React from 'react';
import { ExternalLink, Github, FolderGit2, BookOpen, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Renders a specific generative UI component block
 */
export default function StaticGenUI({ block }) {
  if (!block || !block.component || !block.payload) return null;

  switch (block.component) {
    case 'project_list':
      return <ProjectList items={block.payload.items} />;
    case 'project_card':
      return <ProjectCard {...block.payload} />;
    case 'article_list':
      return <ArticleList items={block.payload.items} />;
    case 'article_card':
      return <ArticleCard {...block.payload} />;
    case 'search_results':
      return <SearchResults items={block.payload.items} />;
    default:
      console.warn('Unknown UI block component:', block.component);
      return null;
  }
}

// ---------------------------------------------------------------------------
// PROJECT COMPONENTS
// ---------------------------------------------------------------------------

function ProjectList({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-3">
      <h3 className="flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
        <FolderGit2 className="w-3.5 h-3.5" />
        Projects
      </h3>
      <div className="flex overflow-x-auto gap-3 w-full pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1">
        {items.map((project) => (
          <Link
            key={project.slug}
            href={`/projects/${project.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200/50 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-all text-left shadow-sm hover:shadow-md w-[180px] sm:w-[200px] snap-start shrink-0"
          >
            {project.thumbnail ? (
              <div className="relative w-full aspect-video shrink-0 bg-neutral-100 border-b border-neutral-100">
                <Image
                  src={project.thumbnail}
                  alt={project.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-full aspect-video shrink-0 bg-neutral-100 flex items-center justify-center border-b border-neutral-100 transition-colors group-hover:bg-neutral-200">
                <FolderGit2 className="w-6 h-6 text-neutral-400" />
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1 p-2.5">
              <h4 className="font-semibold text-neutral-900 text-[13px] line-clamp-2 leading-tight mb-1">
                {project.title}
              </h4>
              <p className="text-[11px] text-neutral-500 truncate mt-auto">
                {project.tagline || project.category || 'View Project'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProjectCard(project) {
  return (
    <div className="flex flex-col w-full mt-3 overflow-hidden rounded-2xl border border-neutral-200/50 bg-white shadow-sm hover:shadow-md transition-shadow">
      {project.thumbnail && (
        <div className="relative w-full h-32 bg-neutral-100 border-b border-neutral-100">
          {/* Attempt to load image if thumbnail exists, fallback to placeholder if it fails */}
          <Image
            src={project.thumbnail}
            alt={project.title}
            fill
            className="object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h4 className="font-bold text-neutral-900 text-base">{project.title}</h4>
            {(project.category || project.tagline) && (
              <p className="text-xs text-brand-600 font-medium mt-1 uppercase tracking-wider">
                {project.category || 'Project'} • {project.tagline}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-neutral-600 line-clamp-3 mb-4 leading-relaxed">
          {project.description}
        </p>

        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-neutral-100">
          <Link
            href={`/projects/${project.slug}`}
            className="flex-1 inline-flex justify-center items-center py-2 px-3 bg-neutral-900 text-white rounded-xl text-xs font-medium hover:bg-neutral-800 transition-colors"
          >
            View Full Case Study
          </Link>

          {(project.liveUrl || project.githubUrl) && (
            <div className="flex gap-2">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                  title="Live Website"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                  title="GitHub Repository"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ARTICLE COMPONENTS
// ---------------------------------------------------------------------------

function ArticleList({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-3">
      <h3 className="flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-wider text-orange-600 mb-2">
        <BookOpen className="w-3.5 h-3.5" />
        Articles
      </h3>
      <div className="flex overflow-x-auto gap-3 w-full pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1">
        {items.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200/50 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-all text-left shadow-sm hover:shadow-md w-[180px] sm:w-[200px] snap-start shrink-0"
          >
            {article.coverImage ? (
              <div className="relative w-full aspect-video shrink-0 bg-neutral-100 border-b border-neutral-100">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-full aspect-video shrink-0 bg-orange-50 flex items-center justify-center border-b border-neutral-100 transition-colors group-hover:bg-orange-100">
                <BookOpen className="w-6 h-6 text-orange-400" />
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1 p-2.5">
              <h4 className="font-semibold text-neutral-900 text-[13px] line-clamp-2 leading-tight mb-1">
                {article.title}
              </h4>
              <p className="text-[11px] text-neutral-500 truncate mt-auto">
                {article.excerpt || 'Read Article'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ArticleCard(article) {
  return (
    <div className="flex flex-col w-full mt-3 overflow-hidden rounded-2xl border border-neutral-200/50 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-[10px] font-bold uppercase tracking-widest">
            Article
          </span>
          {article.publishedDate && (
            <span className="text-xs text-neutral-400">
              {new Date(article.publishedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        <h4 className="font-bold text-neutral-900 text-base mb-2 leading-tight">{article.title}</h4>

        <p className="text-sm text-neutral-600 line-clamp-3 mb-4 leading-relaxed">
          {article.excerpt || article.content?.substring(0, 150) + '...'}
        </p>

        <Link
          href={`/blog/${article.slug}`}
          className="inline-flex justify-center items-center w-full py-2 px-3 bg-neutral-900 text-white rounded-xl text-xs font-medium hover:bg-neutral-800 transition-colors"
        >
          Read Full Article
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SEARCH COMPONENTS
// ---------------------------------------------------------------------------

function SearchResults({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="mt-3 p-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-center">
        <Search className="w-5 h-5 text-neutral-400 mx-auto mb-2" />
        <p className="text-sm text-neutral-600 font-medium">No results found.</p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <h3 className="flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
        <Search className="w-3.5 h-3.5" />
        Search Results
      </h3>
      <div className="flex overflow-x-auto gap-3 w-full pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1">
        {items.map((item, idx) => {
          const isProject = item.type === 'project';
          const Icon = isProject ? FolderGit2 : BookOpen;
          const fallbackBg = isProject
            ? 'bg-neutral-100 hover:bg-neutral-200'
            : 'bg-orange-50 hover:bg-orange-100';
          const iconColor = isProject ? 'text-neutral-400' : 'text-orange-400';

          return (
            <Link
              key={`${item.type}-${item.slug}-${idx}`}
              href={item.url}
              className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200/50 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-all text-left shadow-sm hover:shadow-md w-[180px] sm:w-[200px] snap-start shrink-0"
            >
              {item.thumbnail ? (
                <div className="relative w-full aspect-video shrink-0 bg-neutral-100 border-b border-neutral-100">
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div
                  className={`w-full aspect-video shrink-0 flex items-center justify-center border-b border-neutral-100 transition-colors ${fallbackBg}`}
                >
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
              )}
              <div className="flex flex-col min-w-0 flex-1 p-2.5">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="shrink-0 text-[8px] font-bold uppercase tracking-widest text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                    {item.type}
                  </span>
                </div>
                <h4 className="font-semibold text-neutral-900 text-[13px] line-clamp-2 leading-tight mb-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-neutral-500 truncate mt-auto">
                  {item.excerpt || item.description || 'View details'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
