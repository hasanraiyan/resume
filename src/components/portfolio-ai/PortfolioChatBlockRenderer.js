'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import * as LucideIcons from 'lucide-react';
import {
  ExternalLink,
  Github,
  BadgeCheck,
  Star,
  Mail,
  CheckCircle2,
  ArrowUpRight,
  Download,
} from 'lucide-react';

function renderTechIcon(iconType, iconName, className = 'w-4 h-4') {
  if (!iconName) return null;
  if (iconType === 'fa') {
    const icon = fas[iconName] || fab[iconName];
    return icon ? <FontAwesomeIcon icon={icon} className={className} /> : null;
  }
  if (iconType === 'lucide') {
    const Icon = LucideIcons[iconName];
    return Icon ? <Icon className={className} /> : null;
  }
  return null;
}

function ProfileCardBlock({ block }) {
  const data = block.data || {};
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center text-white/60 text-xl font-bold">
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            (data.name || '?').charAt(0)
          )}
        </div>
        <div className="min-w-0">
          <p className="text-white text-lg font-bold truncate">{data.name}</p>
          {data.role && <p className="text-white/50 text-sm">{data.role}</p>}
        </div>
      </div>
      {data.bio && <p className="mt-4 text-white/70 text-sm leading-relaxed">{data.bio}</p>}
      {data.tags?.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {data.socialLinks?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {data.socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
            >
              {link.icon && <i className={link.icon} />}
              {link.name}
            </a>
          ))}
        </div>
      )}
      {data.resume?.url && (
        <a
          href={data.resume.url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          {data.resume.text || 'Download Resume'}
        </a>
      )}
    </div>
  );
}

function ResumeCardBlock({ block }) {
  const data = block.data || {};
  if (!data.url) return null;

  // Prefer the server-resolved content-type (many hosts serve files with no
  // extension in the URL at all) and fall back to sniffing the URL itself.
  const isPdf = data.contentType ? data.contentType.includes('pdf') : /\.pdf(\?|$)/i.test(data.url);
  const isImage = data.contentType
    ? data.contentType.startsWith('image/')
    : /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(data.url);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 shrink-0 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
          <Download className="w-5 h-5" />
        </div>
        <p className="text-white text-sm font-semibold">{data.text || 'Resume'}</p>
      </div>

      {isPdf && (
        <iframe
          src={data.url}
          title={data.text || 'Resume'}
          className="w-full h-96 rounded-2xl border border-white/10 bg-white"
        />
      )}
      {isImage && (
        <img
          src={data.url}
          alt={data.text || 'Resume'}
          className="w-full max-h-96 object-contain rounded-2xl border border-white/10 bg-white"
        />
      )}

      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
      >
        <Download className="w-4 h-4" />
        {data.text || 'Download Resume'}
      </a>
    </div>
  );
}

function ProjectDetailBlock({ block }) {
  const data = block.data || {};

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden shadow-lg">
      {data.thumbnail && (
        <div className="relative h-40 w-full">
          <img
            src={data.thumbnail}
            alt={data.title}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
      )}
      <div className="p-5">
        {data.category && (
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-1">
            {data.category}
          </p>
        )}
        <p className="text-white text-lg font-bold mb-1">{data.title}</p>
        {data.tagline && <p className="text-white/60 text-sm mb-3">{data.tagline}</p>}
        {data.description && (
          <p className="text-white/70 text-sm leading-relaxed mb-4">{data.description}</p>
        )}
        {data.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          {data.liveUrl && (
            <a
              href={data.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Live Demo
            </a>
          )}
          {data.githubUrl && (
            <a
              href={data.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 transition-colors"
            >
              <Github className="w-3 h-3" /> Source
            </a>
          )}
          {data.projectUrl && (
            <a
              href={data.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 transition-colors"
            >
              <ArrowUpRight className="w-3 h-3" /> Project Page
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleDetailBlock({ block }) {
  const data = block.data || {};

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden shadow-lg">
      {data.coverImage && (
        <div className="relative h-32 w-full">
          <img
            src={data.coverImage}
            alt={data.title}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
      )}
      <div className="p-5">
        <p className="text-white text-lg font-bold mb-1">{data.title}</p>
        {data.excerpt && (
          <p className="text-white/60 text-sm leading-relaxed mb-3">{data.excerpt}</p>
        )}
        {data.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {data.url && (
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Read Article <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function ProjectCarouselBlock({ block }) {
  const items = block.data?.items || [];
  if (items.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 shadow-lg">
      <p className="text-white text-sm font-semibold mb-3 px-1">{block.title || 'Projects'}</p>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <div
            key={item.slug}
            className="shrink-0 w-56 h-64 rounded-2xl overflow-hidden relative snap-start bg-neutral-900 border border-white/10"
          >
            {item.thumbnail && (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            <div className="relative z-10 flex flex-col h-full p-4">
              <div className="flex-1">
                {item.featured && (
                  <span className="inline-block mb-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500 text-white">
                    Featured
                  </span>
                )}
                <p className="text-white font-bold text-lg leading-tight">{item.title}</p>
                <p className="text-white/60 text-xs mt-1 line-clamp-2">{item.tagline}</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {item.liveUrl && (
                  <a
                    href={item.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="View live"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {item.githubUrl && (
                  <a
                    href={item.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="View source"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                )}
                {item.projectUrl && (
                  <a
                    href={item.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="View project page"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {block.action?.type === 'link' && block.action.url && (
        <a
          href={block.action.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 transition-colors"
        >
          {block.action.label || 'See more'}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

function ArticleCarouselBlock({ block }) {
  const items = block.data?.items || [];
  if (items.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 shadow-lg">
      <p className="text-white text-sm font-semibold mb-3 px-1">{block.title || 'Articles'}</p>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <a
            key={item.slug}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block shrink-0 w-60 rounded-2xl overflow-hidden relative snap-start bg-neutral-900 border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className="relative h-36 w-full">
              {item.coverImage ? (
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                />
              ) : (
                <div className="absolute inset-0 bg-white/5" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>
            <div className="p-3">
              <p className="text-white font-semibold text-sm leading-tight line-clamp-2">
                {item.title}
              </p>
              {item.excerpt && (
                <p className="text-white/50 text-xs mt-1.5 line-clamp-2">{item.excerpt}</p>
              )}
            </div>
          </a>
        ))}
      </div>
      {block.action?.type === 'link' && block.action.url && (
        <a
          href={block.action.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 transition-colors"
        >
          {block.action.label || 'See more'}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

function SkillsGridBlock({ block }) {
  const items = block.data?.items || [];
  if (items.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 shadow-lg">
      <p className="text-white text-sm font-semibold mb-3">{block.title || 'Skills'}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 text-white/80 text-xs font-medium"
          >
            <span className="text-white/60">
              {renderTechIcon(item.iconType, item.iconName, 'w-3.5 h-3.5')}
            </span>
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementPhotoCard({ item }) {
  // Matches the homepage's Achievements.js carousel treatment (full-bleed photo,
  // bottom gradient, title/description over the image) — but always visible
  // instead of hover-only, since hover doesn't work well in a scrolling chat.
  return (
    <div className="shrink-0 w-64 snap-start relative rounded-3xl overflow-hidden shadow-lg border border-white/10 group">
      <img
        src={item.src}
        alt={item.alt || item.title}
        className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <p className="text-white text-lg font-bold leading-snug mb-1">{item.title}</p>
        {item.description && (
          <p className="text-white/70 text-sm leading-relaxed line-clamp-3">{item.description}</p>
        )}
      </div>
    </div>
  );
}

function CertificationCard({ item }) {
  const dateLabel =
    item.date && (typeof item.date === 'string' ? item.date : new Date(item.date).getFullYear());

  return (
    <div className="shrink-0 w-64 snap-start rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 shadow-lg transition-colors hover:border-white/20">
      <div className="flex items-start justify-between gap-3 mb-3">
        {dateLabel ? (
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-600 text-white shadow-sm">
            {dateLabel}
          </span>
        ) : (
          <span />
        )}
        <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
          <BadgeCheck className="w-4 h-4" />
        </div>
      </div>

      {item.issuer && <p className="text-white/40 text-xs font-medium mb-1">{item.issuer}</p>}
      <p className="text-white text-base font-bold leading-snug mb-1.5">{item.title}</p>
      {item.description && (
        <p className="text-white/60 text-sm leading-relaxed">{item.description}</p>
      )}

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 transition-colors"
        >
          View credential
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

function AchievementsGalleryBlock({ block }) {
  const items = block.data?.items || [];
  if (items.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 shadow-lg">
      <p className="text-white text-sm font-semibold mb-3 px-1">{block.title || 'Achievements'}</p>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <AchievementPhotoCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function CertificationsListBlock({ block }) {
  const items = block.data?.items || [];
  if (items.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 shadow-lg">
      <p className="text-white text-sm font-semibold mb-3 px-1">
        {block.title || 'Certifications'}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <CertificationCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function TestimonialsBlock({ block }) {
  const items = block.data?.items || [];
  if (items.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 shadow-lg">
      <p className="text-white text-sm font-semibold mb-3 px-1">{block.title || 'Testimonials'}</p>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => (
          <div
            key={`${item.name}-${i}`}
            className="shrink-0 w-64 rounded-2xl bg-white/5 border border-white/10 p-4 snap-start"
          >
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`w-3 h-3 ${idx < (item.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
                />
              ))}
            </div>
            <p className="text-white/70 text-xs leading-relaxed line-clamp-4">"{item.content}"</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-white/60 text-[10px] font-bold">
                {item.avatar ? (
                  <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  (item.name || '?').charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{item.name}</p>
                <p className="text-white/40 text-[10px] truncate">{item.company}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactCardBlock({ block }) {
  const data = block.data || {};
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
          {data.success ? <CheckCircle2 className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
        </div>
        <div>
          <p className="text-white text-sm font-semibold">
            {data.success ? 'Message sent' : 'Contact'}
          </p>
          {data.email && <p className="text-white/50 text-xs">{data.email}</p>}
        </div>
      </div>
    </div>
  );
}

export default function PortfolioChatBlockRenderer({ block }) {
  if (!block?.kind) return null;

  switch (block.kind) {
    case 'profile_card':
      return <ProfileCardBlock block={block} />;
    case 'resume_card':
      return <ResumeCardBlock block={block} />;
    case 'project_detail':
      return <ProjectDetailBlock block={block} />;
    case 'article_detail':
      return <ArticleDetailBlock block={block} />;
    case 'project_carousel':
      return <ProjectCarouselBlock block={block} />;
    case 'article_carousel':
      return <ArticleCarouselBlock block={block} />;
    case 'skills_grid':
      return <SkillsGridBlock block={block} />;
    case 'achievements_gallery':
      return <AchievementsGalleryBlock block={block} />;
    case 'certifications_list':
      return <CertificationsListBlock block={block} />;
    case 'testimonials':
      return <TestimonialsBlock block={block} />;
    case 'contact_card':
      return <ContactCardBlock block={block} />;
    default:
      return null;
  }
}
