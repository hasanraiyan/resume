'use client';

import { useMemo } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { QuizPlayer } from './QuizPlayer';
import { VideoBlock } from './VideoBlock';
import { StepByStepBlock } from './StepByStepBlock';
import { AccordionBlock } from './AccordionBlock';
import { TabsBlock } from './TabsBlock';
import { CalloutBlock } from './CalloutBlock';
import { PlayCircle, ExternalLink, FileText } from 'lucide-react';
import { parseMarkdownToBlocks } from '@/utils/coursify-parser';

function ResourceBlock({ block }) {
  const { url, title, type } = block.resource || {};
  if (!url) return null;

  const Icon = type === 'video' ? PlayCircle : type === 'doc' ? FileText : ExternalLink;
  const displayTitle = title || 'Resource';

  return (
    <div className="my-4" id={getSlug(displayTitle)} data-heading={displayTitle}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-xl border border-[#e5e3d8] bg-white hover:border-[#1f644e] hover:bg-[#f0f5f2] transition-all group"
      >
        <div className="h-10 w-10 rounded-lg bg-[#f0f5f2] text-[#1f644e] flex items-center justify-center group:hover:bg-[#1f644e] group-hover:text-white transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1e3a34] truncate">{displayTitle}</p>
          <p className="text-xs text-[#7c8e88] capitalize">{type || 'link'}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-[#b5c4be]" />
      </a>
    </div>
  );
}

/**
 * Standardizes slug generation for TOC anchors.
 */
function getSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function CoursifyBlockRenderer({ blocks, content }) {
  const resolvedBlocks = useMemo(() => {
    if (content) return parseMarkdownToBlocks(content);
    return blocks || [];
  }, [content, blocks]);

  if (!resolvedBlocks.length) return null;

  // Sort by order if available
  const sortedBlocks = [...resolvedBlocks].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-6">
      {sortedBlocks.map((block, idx) => {
        switch (block.type) {
          case 'MdBlock':
            return <MarkdownRenderer key={block._id || idx} content={block.content} />;
          case 'QuizBlock':
            return (
              <QuizPlayer
                key={block._id || idx}
                questions={block.quiz?.questions || []}
                title={block.title}
              />
            );
          case 'VideoBlock':
            return <VideoBlock key={block._id || idx} block={block} />;
          case 'ResourceBlock':
            return <ResourceBlock key={block._id || idx} block={block} />;
          case 'StepByStepBlock':
            return <StepByStepBlock key={block._id || idx} block={block} />;
          case 'AccordionBlock':
            return <AccordionBlock key={block._id || idx} block={block} />;
          case 'TabsBlock':
            return <TabsBlock key={block._id || idx} block={block} />;
          case 'CalloutBlock':
            return <CalloutBlock key={block._id || idx} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
