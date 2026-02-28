'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Github,
  FolderGit2,
  BookOpen,
  Search,
  Send,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createContactSubmission } from '@/app/actions/contactActions';

/**
 * Renders a specific generative UI component block
 */
export default function StaticGenUI({ block, onInteract }) {
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
    case 'contact_prefill':
      return <ContactPrefillCard payload={block.payload} onInteract={onInteract} />;
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
// CONTACT PREFILL COMPONENTS
// ---------------------------------------------------------------------------

function ContactPrefillCard({ payload, onInteract }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: payload.name || '',
    email: payload.email || '',
    projectType:
      payload.projectType && payload.projectType !== 'other' ? payload.projectType : 'web-design',
    message: payload.message || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendDirectly = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const data = new FormData();
      data.append('name', formData.name || 'Anonymous User');
      data.append('email', formData.email || 'no-email@example.com');
      data.append('projectType', formData.projectType);
      data.append('message', formData.message || 'Draft message from Chatbot.');

      const res = await createContactSubmission(data);

      if (res.success) {
        if (onInteract) onInteract('sent');
      } else {
        setErrorMsg(res.message || 'Failed to send message.');
        setIsSubmitting(false); // only reset on error, on success unmounts
      }
    } catch (error) {
      console.error('Error submitting contact form from bot:', error);
      setErrorMsg('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    if (onInteract) onInteract('discard');
  };

  return (
    <div className="flex flex-col w-full mt-3 overflow-hidden rounded-2xl border border-neutral-200/50 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest">
            Draft Contact
          </span>
        </div>

        <h4 className="font-bold text-neutral-900 text-base mb-2 leading-tight">Ready to send?</h4>
        <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
          I've drafted a message with the details you provided.
        </p>

        {!isEditing ? (
          <div className="space-y-2 mb-4 text-xs bg-neutral-50 p-3 rounded-lg border border-neutral-100">
            <div className="flex">
              <span className="w-16 font-semibold text-neutral-500">Name:</span>
              <span className="text-neutral-900 truncate">
                {formData.name || <span className="text-neutral-400 italic">Not provided</span>}
              </span>
            </div>
            <div className="flex">
              <span className="w-16 font-semibold text-neutral-500">Email:</span>
              <span className="text-neutral-900 truncate">
                {formData.email || <span className="text-neutral-400 italic">Not provided</span>}
              </span>
            </div>
            <div className="flex">
              <span className="w-16 font-semibold text-neutral-500">Project:</span>
              <span className="text-neutral-900">
                {formData.projectType !== 'other' ? (
                  formData.projectType
                ) : (
                  <span className="text-neutral-400 italic">Not specified</span>
                )}
              </span>
            </div>
            <div className="flex">
              <span className="w-16 font-semibold text-neutral-500 shrink-0">Message:</span>
              <span className="text-neutral-900 line-clamp-3">
                {formData.message || (
                  <span className="text-neutral-400 italic">No message drafted</span>
                )}
              </span>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSendDirectly}
            className="space-y-3 mb-4 text-xs p-3 rounded-lg border border-neutral-200 bg-neutral-50"
          >
            <div>
              <label className="block text-neutral-600 font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full px-2 py-1.5 border border-neutral-300 rounded focus:outline-none focus:border-black"
                required
              />
            </div>
            <div>
              <label className="block text-neutral-600 font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email"
                className="w-full px-2 py-1.5 border border-neutral-300 rounded focus:outline-none focus:border-black"
                required
              />
            </div>
            <div>
              <label className="block text-neutral-600 font-medium mb-1">Project Type</label>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="w-full px-2 py-1.5 border border-neutral-300 rounded focus:outline-none focus:border-black bg-white"
                required
              >
                <option value="web-design">Web Design</option>
                <option value="web-development">Web Development</option>
                <option value="ecommerce">E-commerce</option>
                <option value="mobile-app">Mobile App</option>
                <option value="ui-ux">UI/UX Design</option>
                <option value="seo-optimization">SEO Optimization</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-600 font-medium mb-1">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell me about your project..."
                rows="3"
                className="w-full px-2 py-1.5 border border-neutral-300 rounded focus:outline-none focus:border-black resize-none"
                required
              />
            </div>
          </form>
        )}

        <div className="space-y-2">
          {!isEditing ? (
            <>
              <button
                onClick={handleSendDirectly}
                disabled={isSubmitting}
                className="inline-flex justify-center items-center w-full py-2 px-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {isSubmitting ? 'Sending...' : 'Send to Raiyan'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isSubmitting}
                  className="flex-1 inline-flex justify-center items-center py-2 px-3 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-xs font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-colors disabled:opacity-50"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleDiscard}
                  disabled={isSubmitting}
                  className="flex-1 inline-flex justify-center items-center py-2 px-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Discard
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSendDirectly}
                disabled={isSubmitting}
                className="flex-1 inline-flex justify-center items-center py-2 px-3 bg-black text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {isSubmitting ? 'Sending...' : 'Save & Send'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
                className="flex-1 inline-flex justify-center items-center py-2 px-3 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-xs font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-colors disabled:opacity-50"
              >
                Cancel Edit
              </button>
            </div>
          )}
        </div>
        {errorMsg && (
          <p className="text-red-500 text-[10px] mt-2 text-center bg-red-50 p-2 rounded-lg">
            {errorMsg}
          </p>
        )}
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
