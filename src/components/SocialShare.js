'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faLinkedin, faFacebook, faReddit } from '@fortawesome/free-brands-svg-icons';
import { faLink, faEnvelope, faCheck } from '@fortawesome/free-solid-svg-icons';

/**
 * SocialShare component for sharing articles and projects on social media platforms
 * @param {Object} props
 * @param {string} props.title - Content title
 * @param {string} props.slug - Content slug for URL generation
 * @param {string} props.excerpt - Content excerpt for sharing
 * @param {string} props.type - Content type ('article' or 'project')
 * @param {string} [props.className] - Additional CSS classes
 */
export default function SocialShare({ title, slug, excerpt, type = 'article', className = '' }) {
  const [copied, setCopied] = useState(false);
  const [linkedinLoaded, setLinkedinLoaded] = useState(false);

  // Get base URL with better fallbacks
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    // Fallback for SSR - you might want to set this via environment variable
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  };

  const baseUrl = getBaseUrl();

  // Configure URL structure based on content type
  const getContentPath = () => {
    switch (type) {
      case 'project':
        return `/projects/${slug}`;
      case 'article':
      default:
        return `/blog/${slug}`;
    }
  };

  const contentUrl = `${baseUrl}${getContentPath()}`;

  // Load LinkedIn SDK
  useEffect(() => {
    // Check if LinkedIn script is already loaded
    if (window.IN && window.IN.parse) {
      setLinkedinLoaded(true);
      return;
    }

    // Load LinkedIn script
    const script = document.createElement('script');
    script.src = 'https://platform.linkedin.com/in.js';
    script.type = 'text/javascript';
    script.lang = 'en_US';
    script.onload = () => {
      // Initialize LinkedIn when script loads
      if (window.IN && window.IN.parse) {
        window.IN.parse();
        setLinkedinLoaded(true);
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(contentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(contentUrl)}`,
    reddit: `https://reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(contentUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this ${type}: ${contentUrl}\n\n${excerpt || ''}`)}`,
    copy: contentUrl,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(contentUrl);
      setCopied(true);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = contentUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
        alert('Unable to copy link. Please copy manually: ' + contentUrl);
      }
    }
  };

  const handleLinkedInShare = () => {
    // Ensure HTTPS URL (LinkedIn requirement)
    const secureUrl = contentUrl.startsWith('https://')
      ? contentUrl
      : contentUrl.replace('http://', 'https://');

    // Debug logging (remove in production)
    console.log('LinkedIn Share Debug:', {
      originalUrl: contentUrl,
      secureUrl: secureUrl,
      isHttps: secureUrl.startsWith('https://'),
      title: title,
      type: type,
    });

    // Try LinkedIn's current sharing method first
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(secureUrl)}`;

    console.log('LinkedIn URL generated:', linkedinUrl);

    try {
      // Open in new window with specific dimensions
      const shareWindow = window.open(
        linkedinUrl,
        '_blank',
        'width=600,height=400,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
      );

      // Check if popup was blocked
      if (!shareWindow) {
        console.log('LinkedIn popup blocked, copying to clipboard');
        // Fallback: copy URL to clipboard
        navigator.clipboard
          .writeText(linkedinUrl)
          .then(() => {
            alert(
              'LinkedIn popup blocked! URL copied to clipboard. Please paste in LinkedIn manually.'
            );
          })
          .catch(() => {
            alert(`LinkedIn sharing: ${linkedinUrl}`);
          });
      } else {
        console.log('LinkedIn share window opened successfully');
      }
    } catch (error) {
      console.error('LinkedIn sharing failed:', error);
      // Final fallback: show URL for manual copying
      alert(`LinkedIn sharing isn't working. Please copy this URL manually: ${linkedinUrl}`);
    }
  };

  const handleShare = (platform) => {
    if (platform === 'copy') {
      handleCopyLink();
      return;
    }

    if (platform === 'linkedin') {
      handleLinkedInShare();
      return;
    }

    const url = shareLinks[platform];
    if (url) {
      try {
        const shareWindow = window.open(
          url,
          '_blank',
          'width=600,height=400,scrollbars=yes,resizable=yes'
        );

        if (!shareWindow || shareWindow.closed || typeof shareWindow.closed === 'undefined') {
          navigator.clipboard
            .writeText(url)
            .then(() => {
              alert(`Popup blocked! Link copied to clipboard instead.`);
            })
            .catch(() => {
              alert(`Popup blocked! Please copy this URL manually: ${url}`);
            });
        }
      } catch (error) {
        console.error(`Error opening ${platform} share window:`, error);
        alert(`Unable to open ${platform} share window. Please copy the link manually.`);
      }
    }
  };

  const shareButtons = [
    { key: 'twitter', icon: faTwitter, label: 'Share on Twitter', color: 'hover:text-blue-400' },
    { key: 'linkedin', icon: faLinkedin, label: 'Share on LinkedIn', color: 'hover:text-blue-600' },
    { key: 'facebook', icon: faFacebook, label: 'Share on Facebook', color: 'hover:text-blue-700' },
    { key: 'reddit', icon: faReddit, label: 'Share on Reddit', color: 'hover:text-orange-500' },
    { key: 'email', icon: faEnvelope, label: 'Share via Email', color: 'hover:text-gray-600' },
    {
      key: 'copy',
      icon: copied ? faCheck : faLink,
      label: copied ? 'Link Copied!' : 'Copy Link',
      color: copied ? 'text-green-600 bg-green-50' : 'hover:text-green-500',
    },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <span className="text-sm font-medium text-gray-600 mr-2">Share:</span>
      <div className="flex items-center gap-2">
        {shareButtons.map(({ key, icon, label, color }) => (
          <button
            key={key}
            onClick={() => handleShare(key)}
            className={`p-2 rounded-full bg-gray-100 ${color} transition-all duration-200 hover:bg-gray-200 ${
              copied && key === 'copy' ? 'animate-pulse' : ''
            }`}
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
