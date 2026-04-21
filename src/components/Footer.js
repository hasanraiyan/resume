'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSiteContext } from '@/context/SiteContext'; // Import the context hook
import NewsletterForm from './NewsletterForm';

/**
 * Footer component with dynamic content, social links, and newsletter subscription.
 *
 * This component renders the site footer with dynamic data from the site context,
 * including logo initials, social media links, and user name. It conditionally
 * shows the newsletter subscription form on non-blog pages and provides navigation
 * links and copyright information.
 *
 * @returns {JSX.Element} Footer section with social links and optional newsletter form
 */
/**
 * Footer component with dynamic content, social links, and newsletter subscription.
 * @param {Object} props - Component props
 * @param {Object} props.siteConfig - Global site configuration from CMS
 */
export default function Footer({ siteConfig }) {
  const pathname = usePathname();
  const { heroData, initials } = useSiteContext(); // Use context to get dynamic data

  // Check if we're on a blog page
  const isBlogPage = pathname?.startsWith('/blog');

  // --- Dynamically build footer data ---
  const logo = {
    text:
      siteConfig?.ownerName
        ?.split(' ')
        .map((n) => n[0])
        .join('') ||
      initials ||
      'JD',
    link: '/',
  };

  // Use social links from the heroData object
  const socialLinks = heroData?.socialLinks || [];

  const copyright = {
    year: new Date().getFullYear(),
    name: siteConfig?.ownerName || heroData?.introduction?.name || 'Your Name',
    text: 'All rights reserved',
  };

  return (
    <footer className="py-8 sm:py-10 border-t-2 border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Newsletter Subscription Section - Hide on blog pages */}
        {!isBlogPage && (
          <div className="mb-12 pb-8 border-b border-gray-200">
            <div className="max-w-md mx-auto text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {siteConfig?.newsletterTitle || 'Stay Updated'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {siteConfig?.newsletterDescription ||
                  'Subscribe to our newsletter for the latest projects, articles, and insights.'}
              </p>
              <NewsletterForm
                source="footer"
                placeholder={siteConfig?.newsletterPlaceholder || 'Enter your email address'}
                buttonText={siteConfig?.newsletterButtonText || 'Subscribe'}
                privacyText={siteConfig?.privacyText}
                className="newsletter-footer-form"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <Link href={logo.link} className="text-xl sm:text-2xl font-bold hover-target">
            {logo.text}
          </Link>

          {/* Social Links & Admin */}
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-7">
            {socialLinks.map((social) => (
              <a
                // Use MongoDB's _id if available, otherwise fall back to id or name
                key={social._id || social.id || social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition hover-target text-sm"
                aria-label={social.name}
              >
                {social.name}
              </a>
            ))}

            {/* Admin Login Link */}
            <Link
              href="/login"
              className="text-gray-500 hover:text-gray-700 transition hover-target text-xs uppercase tracking-wider font-medium"
              aria-label="Admin Login"
            >
              Admin Login
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-gray-600 text-xs sm:text-sm text-center md:text-right">
            &copy; {copyright.year} {copyright.name}. {copyright.text}.<br />
            Built by{' '}
            <a href="/r/hasanraiyan" target="_blank" rel="noopener noreferrer">
              Raiyan Hasan
            </a>
            .
          </div>
        </div>
      </div>
    </footer>
  );
}
