import { useState, useEffect, useMemo } from 'react';

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

export function useTableOfContents(blocks, contentRef, scrollContainerRef) {
  const [activeHeading, setActiveHeading] = useState(null);

  // Memoize heading extraction to prevent unnecessary re-renders and infinite loops
  const headings = useMemo(() => {
    if (!blocks || !Array.isArray(blocks)) return [];

    const extracted = [];
    blocks.forEach((block) => {
      if (block.type === 'MdBlock' && block.content) {
        const lines = block.content.split('\n');
        for (const line of lines) {
          const h2Match = line.match(/^##\s+(.+)$/);
          const h3Match = line.match(/^###\s+(.+)$/);
          if (h2Match) {
            const text = h2Match[1].trim().replace(/[*_~`]/g, '');
            extracted.push({ level: 2, text, slug: getSlug(text), type: 'md' });
          } else if (h3Match) {
            const text = h3Match[1].trim().replace(/[*_~`]/g, '');
            extracted.push({ level: 3, text, slug: getSlug(text), type: 'md' });
          }
        }
      } else if (block.type === 'StepByStepBlock' && block.title) {
        extracted.push({ level: 3, text: block.title, slug: getSlug(block.title), type: 'step' });
      } else if (block.type === 'VideoBlock' && block.video?.title) {
        extracted.push({
          level: 3,
          text: block.video.title,
          slug: getSlug(block.video.title),
          type: 'video',
        });
      } else if (block.type === 'MindMapBlock' && block.title) {
        extracted.push({
          level: 3,
          text: block.title,
          slug: getSlug(block.title),
          type: 'mindmap',
        });
      } else if (block.type === 'ResourceBlock' && block.resource?.title) {
        extracted.push({
          level: 3,
          text: block.resource.title,
          slug: getSlug(block.resource.title),
          type: 'resource',
        });
      } else if (block.type === 'QuizBlock') {
        const text = block.title || 'Knowledge Check';
        extracted.push({ level: 3, text, slug: getSlug(text), type: 'quiz' });
      }
    });
    return extracted;
  }, [blocks]);

  // Update initial active heading when headings change
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
      const headingEls = contentRef.current?.querySelectorAll('[data-heading]');
      if (!headingEls?.length) return;

      const containerTop = scrollEl.getBoundingClientRect().top;
      const threshold = containerTop + 120;

      let active = null;
      for (const el of headingEls) {
        if (el.getBoundingClientRect().top <= threshold) {
          active = el.getAttribute('data-heading');
        } else {
          break;
        }
      }

      const currentActive = active ?? headingEls[0]?.getAttribute('data-heading') ?? null;
      setActiveHeading((prev) => (prev !== currentActive ? currentActive : prev));
    };

    scrollEl.addEventListener('scroll', updateActive, { passive: true });
    updateActive();

    return () => scrollEl.removeEventListener('scroll', updateActive);
  }, [headings, contentRef, scrollContainerRef]);

  return { headings, activeHeading, setActiveHeading };
}
