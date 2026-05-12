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
 * Robustly extracts headings from a Markdown string.
 */
export function useTableOfContents(content, contentRef, scrollContainerRef) {
  const [activeHeading, setActiveHeading] = useState(null);

  const headings = useMemo(() => {
    if (!content || typeof content !== 'string') return [];

    const extracted = [];
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 1. Standard Markdown Headings (#)
      const headingMatch = trimmedLine.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        let text = headingMatch[2].trim().replace(/[*_~`]/g, '');

        // 2. Specialized Block Detection in Headings
        // e.g. ## [QuizBlock] ->Knowledge Check
        const blockMatch = text.match(
          /^\[(MdBlock|QuizBlock|VideoBlock|ResourceBlock|StepByStepBlock)\]/
        );

        if (blockMatch) {
          const type = blockMatch[1];
          // For block headers, we look at the next lines for a title: if available
          // But for TOC we can use a friendly name
          if (type === 'QuizBlock') text = 'Knowledge Check';
          else if (type === 'StepByStepBlock') text = 'Process Flow';
          else if (type === 'VideoBlock') text = 'Video Lesson';
          else if (type === 'ResourceBlock') text = 'Resource';
          else continue; // Skip generic MdBlock headers in TOC
        }

        extracted.push({ level, text, slug: getSlug(text), type: 'md' });
      }
    }
    return extracted;
  }, [content]);

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
