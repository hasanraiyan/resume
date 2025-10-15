'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faLinkedin, faFacebook, faReddit } from '@fortawesome/free-brands-svg-icons';
import { faLink, faEnvelope } from '@fortawesome/free-solid-svg-icons';

/**
 * SocialShare component for sharing articles on social media platforms
 * @param {Object} props
 * @param {string} props.title - Article title
 * @param {string} props.slug - Article slug for URL generation
 * @param {string} props.excerpt - Article excerpt for sharing
 * @param {string} [props.className] - Additional CSS classes
 */
export default function SocialShare({ title, slug, excerpt, className = '' }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const articleUrl = `${baseUrl}/blog/${slug}`;

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(articleUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
    reddit: `https://reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(articleUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this article: ${articleUrl}`)}`,
    copy: articleUrl,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleShare = (platform) => {
    if (platform === 'copy') {
      handleCopyLink();
      return;
    }

    const url = shareLinks[platform];
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const shareButtons = [
    { key: 'twitter', icon: faTwitter, label: 'Share on Twitter', color: 'hover:text-blue-400' },
    { key: 'linkedin', icon: faLinkedin, label: 'Share on LinkedIn', color: 'hover:text-blue-600' },
    { key: 'facebook', icon: faFacebook, label: 'Share on Facebook', color: 'hover:text-blue-700' },
    { key: 'reddit', icon: faReddit, label: 'Share on Reddit', color: 'hover:text-orange-500' },
    { key: 'email', icon: faEnvelope, label: 'Share via Email', color: 'hover:text-gray-600' },
    { key: 'copy', icon: faLink, label: 'Copy Link', color: 'hover:text-green-500' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <span className="text-sm font-medium text-gray-600 mr-2">Share:</span>
      <div className="flex items-center gap-2">
        {shareButtons.map(({ key, icon, label, color }) => (
          <button
            key={key}
            onClick={() => handleShare(key)}
            className={`p-2 rounded-full bg-gray-100 ${color} transition-colors duration-200 hover:bg-gray-200`}
            title={label}
            aria-label={label}
          >
            <FontAwesomeIcon icon={icon} className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
