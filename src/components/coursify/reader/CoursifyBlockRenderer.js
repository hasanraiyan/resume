'use client';

import { MarkdownRenderer } from './MarkdownRenderer';
import { QuizPlayer } from './QuizPlayer';
import { PlayCircle, ExternalLink, FileText } from 'lucide-react';

function VideoBlock({ block }) {
  const { url, title, platform } = block.video || {};
  if (!url) return null;

  // Ensure url is absolute to prevent relative path hijacking
  if (!url.startsWith('http://') && !url.startsWith('https://')) return null;

  // Simple YouTube embed logic
  let embedUrl = url;
  if (platform === 'youtube') {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      embedUrl = `https://www.youtube.com/embed/${match[2]}`;
    }
  }

  return (
    <div className="my-8">
      {title && <h4 className="text-lg font-bold text-[#1e3a34] mb-3">{title}</h4>}
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#e5e3d8] bg-black">
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
  );
}

function ResourceBlock({ block }) {
  const { url, title, type } = block.resource || {};
  if (!url) return null;

  const Icon = type === 'video' ? PlayCircle : type === 'doc' ? FileText : ExternalLink;

  return (
    <div className="my-4">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-xl border border-[#e5e3d8] bg-white hover:border-[#1f644e] hover:bg-[#f0f5f2] transition-all group"
      >
        <div className="h-10 w-10 rounded-lg bg-[#f0f5f2] text-[#1f644e] flex items-center justify-center group-hover:bg-[#1f644e] group-hover:text-white transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1e3a34] truncate">{title || 'Resource'}</p>
          <p className="text-xs text-[#7c8e88] capitalize">{type || 'link'}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-[#b5c4be]" />
      </a>
    </div>
  );
}

export function CoursifyBlockRenderer({ blocks }) {
  if (!blocks || !Array.isArray(blocks)) return null;

  // Sort by order if available
  const sortedBlocks = [...blocks].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-6">
      {sortedBlocks.map((block, idx) => {
        switch (block.type) {
          case 'MdBlock':
            return <MarkdownRenderer key={block._id || idx} content={block.content} />;
          case 'QuizBlock':
            return <QuizPlayer key={block._id || idx} questions={block.quiz?.questions || []} />;
          case 'VideoBlock':
            return <VideoBlock key={block._id || idx} block={block} />;
          case 'ResourceBlock':
            return <ResourceBlock key={block._id || idx} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
