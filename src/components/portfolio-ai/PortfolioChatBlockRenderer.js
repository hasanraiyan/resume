'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import * as LucideIcons from 'lucide-react';
import { ExternalLink, Github, Award, BadgeCheck, Star, Mail, CheckCircle2 } from 'lucide-react';

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
              </div>
            </div>
          </div>
        ))}
      </div>
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

function MilestoneTimelineBlock({ block }) {
  const items = block.data?.items || [];
  if (items.length === 0) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 shadow-lg">
      <p className="text-white text-sm font-semibold mb-4">{block.title || 'Milestones'}</p>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-blue-400">
              {item.kind === 'certification' ? (
                <BadgeCheck className="w-4 h-4" />
              ) : (
                <Award className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-white text-sm font-semibold truncate">{item.title}</p>
                {item.date && (
                  <span className="text-white/40 text-[11px] shrink-0">
                    {typeof item.date === 'string' ? item.date : new Date(item.date).getFullYear()}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{item.description}</p>
              )}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-[11px] font-medium hover:underline mt-1 inline-block"
                >
                  View credential
                </a>
              )}
            </div>
          </div>
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
    case 'project_carousel':
      return <ProjectCarouselBlock block={block} />;
    case 'skills_grid':
      return <SkillsGridBlock block={block} />;
    case 'milestone_timeline':
      return <MilestoneTimelineBlock block={block} />;
    case 'testimonials':
      return <TestimonialsBlock block={block} />;
    case 'contact_card':
      return <ContactCardBlock block={block} />;
    default:
      return null;
  }
}
