'use client';

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

export function VideoBlock({ block }) {
  const { url, title, platform } = block.video || {};
  if (!url) return null;

  if (!url.startsWith('http://') && !url.startsWith('https://')) return null;

  let embedUrl = url;
  if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    // 1. Explicitly reject search result URLs
    if (url.includes('/results') || url.includes('/search') || url.includes('search_query=')) {
      console.warn('[VideoBlock] Rejected a search result URL:', url);
      return null;
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      embedUrl = `https://www.youtube.com/embed/${match[2]}`;
    } else {
      // If we can't extract a valid 11-char video ID, don't try to render
      return null;
    }
  }

  return (
    <div className="my-8">
      {title && (
        <h4
          id={getSlug(title)}
          data-heading={title}
          className="text-lg font-bold text-[#1e3a34] mb-3 scroll-mt-24"
        >
          {title}
        </h4>
      )}
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#e5e3d8] bg-black">
        <iframe
          src={embedUrl}
          title={title || 'Course video'}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
  );
}
