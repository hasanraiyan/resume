import { useState, useEffect } from 'react';

export function useTableOfContents(content, contentRef, scrollContainerRef) {
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);

  // Extract headings from markdown content
  useEffect(() => {
    if (!content) {
      setHeadings([]);
      setActiveHeading(null);
      return;
    }

    const lines = content.split('\n');
    const extracted = [];
    for (const line of lines) {
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);
      if (h2Match) {
        const text = h2Match[1].trim();
        extracted.push({
          level: 2,
          text,
          slug: text.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        });
      } else if (h3Match) {
        const text = h3Match[1].trim();
        extracted.push({
          level: 3,
          text,
          slug: text.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        });
      }
    }
    setHeadings(extracted);
    setActiveHeading(extracted[0]?.text || null);
  }, [content]);

  // Scroll-spy logic
  useEffect(() => {
    if (headings.length === 0 || !contentRef.current || !scrollContainerRef?.current) return;

    const scrollEl = scrollContainerRef.current;

    const updateActive = () => {
      const headingEls = contentRef.current?.querySelectorAll('[data-heading]');
      if (!headingEls?.length) return;

      // Threshold = 30% down from the top of the scroll container
      const containerTop = scrollEl.getBoundingClientRect().top;
      const threshold = containerTop + scrollEl.clientHeight * 0.3;

      let active = null;
      for (const el of headingEls) {
        if (el.getBoundingClientRect().top <= threshold) {
          active = el.getAttribute('data-heading');
        } else {
          break;
        }
      }

      setActiveHeading(active ?? headingEls[0]?.getAttribute('data-heading') ?? null);
    };

    scrollEl.addEventListener('scroll', updateActive, { passive: true });
    // Run once on mount so the first heading is highlighted immediately
    updateActive();

    return () => scrollEl.removeEventListener('scroll', updateActive);
  }, [headings, contentRef, scrollContainerRef]);

  return { headings, activeHeading, setActiveHeading };
}
