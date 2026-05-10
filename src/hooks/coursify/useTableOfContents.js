import { useState, useEffect, useMemo } from 'react';

/**
 * Standardizes slug generation for TOC anchors.
 * Must match the implementation in components like MarkdownRenderer.
 */
function getSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Robustly extracts headings from a list of blocks.
 */
export function useTableOfContents(blocks, contentRef, scrollContainerRef) {
  const [activeHeading, setActiveHeading] = useState(null);

  const headings = useMemo(() => {
    if (!blocks || !Array.isArray(blocks)) return [];

    // 1. Sort blocks by order to ensure TOC follows document flow
    const sortedBlocks = [...blocks].sort((a, b) => (a.order || 0) - (b.order || 0));

    const extracted = [];
    sortedBlocks.forEach((block) => {
      if (block.type === 'MdBlock' && block.content) {
        // Support both \n and \r\n
        const lines = block.content.split(/\r?\n/);
        for (const line of lines) {
          const trimmedLine = line.trim();
          // Regex for headings: Level 1-4
          // Allows 1-3 spaces before hashes as per Markdown spec
          const headingMatch = trimmedLine.match(/^(#{1,4})\s+(.+)$/);

          if (headingMatch) {
            const level = headingMatch[1].length;
            // Clean markdown formatting from heading text
            const text = headingMatch[2].trim().replace(/[*_~`]/g, '');
            extracted.push({ level, text, slug: getSlug(text), type: 'md' });
          }
        }
      } else if (block.type === 'StepByStepBlock' && block.title) {
        const text = block.title.trim();
        extracted.push({ level: 2, text, slug: getSlug(text), type: 'step' });
      } else if (block.type === 'VideoBlock' && block.video?.title) {
        const text = block.video.title.trim();
        extracted.push({
          level: 2,
          text,
          slug: getSlug(text),
          type: 'video',
        });
      } else if (block.type === 'ResourceBlock' && block.resource?.title) {
        const text = block.resource.title.trim();
        extracted.push({
          level: 3,
          text,
          slug: getSlug(text),
          type: 'resource',
        });
      } else if (block.type === 'QuizBlock') {
        const text = (block.title || 'Knowledge Check').trim();
        extracted.push({ level: 2, text, slug: getSlug(text), type: 'quiz' });
      }
    });
    return extracted;
  }, [blocks]);

  // Update initial active heading
  useEffect(() => {
    if (headings.length > 0 && !activeHeading) {
      setActiveHeading(headings[0].text);
    }
  }, [headings, activeHeading]);

  // Scroll-spy logic
  useEffect(() => {
    if (headings.length === 0 || !contentRef.current || !scrollContainerRef?.current) return;

    const scrollEl = scrollContainerRef.current;

    const updateActive = () => {
      // Find all elements with data-heading in the content article
      const headingEls = contentRef.current?.querySelectorAll('[data-heading]');
      if (!headingEls?.length) return;

      const containerTop = scrollEl.getBoundingClientRect().top;
      const threshold = containerTop + 120; // 120px offset for active detection

      let active = null;
      for (const el of headingEls) {
        if (el.getBoundingClientRect().top <= threshold) {
          active = el.getAttribute('data-heading');
        } else {
          // Once we pass the threshold, the previous one was the active one
          break;
        }
      }

      const currentActive = active ?? headingEls[0]?.getAttribute('data-heading') ?? null;
      if (currentActive) {
        setActiveHeading(currentActive);
      }
    };

    scrollEl.addEventListener('scroll', updateActive, { passive: true });
    // Initial check
    updateActive();

    return () => scrollEl.removeEventListener('scroll', updateActive);
  }, [headings, contentRef, scrollContainerRef]);

  return { headings, activeHeading, setActiveHeading };
}
