import { useState, useEffect } from 'react';

/**
 * Hook to manage Table of Contents generation and scroll-spy.
 * @param {string} content - The markdown content to parse for headings.
 * @param {React.RefObject} contentRef - Ref to the scrollable container.
 */
export function useTableOfContents(content, contentRef) {
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
    if (headings.length === 0 || !contentRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const text = entry.target.getAttribute('data-heading');
            if (text) setActiveHeading(text);
          }
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    );

    const headingEls = contentRef.current.querySelectorAll('[data-heading]');
    headingEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [headings, contentRef]);

  return { headings, activeHeading, setActiveHeading };
}
