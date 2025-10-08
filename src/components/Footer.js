'use client';

import Link from 'next/link';
import { useSiteContext } from '@/context/SiteContext'; // Import the context hook

export default function Footer() {
  const { heroData, initials } = useSiteContext(); // Use context to get dynamic data

  // --- Dynamically build footer data ---
  const logo = {
    text: initials || 'JD', // Use initials from context
    link: '/',
  };

  // Use social links from the heroData object
  const socialLinks = heroData?.socialLinks || [];

  const copyright = {
    year: new Date().getFullYear(),
    name: heroData?.introduction?.name || 'Your Name', // Use name from context
    text: 'All rights reserved',
  };

  return (
    <footer className="py-8 sm:py-10 border-t-2 border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
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
            &copy; {copyright.year} {copyright.name}. {copyright.text}.
          </div>
        </div>
      </div>
    </footer>
  );
}
