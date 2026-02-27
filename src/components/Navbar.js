'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui';
import { useSiteContext } from '@/context/SiteContext';
import SearchOverlay from '@/components/search/SearchOverlay';

/**
 * "Floating Pill" Navbar
 * A premium, glassmorphism navigation bar centered at the bottom or top.
 */
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const { initials, heroData } = useSiteContext();

  const logo = {
    text: initials || 'JD',
    link: '/',
  };

  const navigationLinks = [
    { id: 1, label: 'Home', href: '/' },
    { id: 2, label: 'About', href: '/#about' },
    { id: 3, label: 'Work', href: '/#work' },
    { id: 4, label: 'Projects', href: '/projects' },
    { id: 5, label: 'Blog', href: '/blog' },
  ];

  const cta = {
    text: "Let's Talk",
    href: '/#contact',
  };

  // Mobile menu combines navigation and social links
  const mobileMenu = {
    menuItems: [...navigationLinks, { id: 6, label: 'Contact', href: '/#contact' }],
    cta: cta,
    socialLinks: heroData?.socialLinks || [],
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  return (
    <>
      {/* FLOATING PILL CONTAINER (Desktop) */}
      <nav className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 z-50 items-center gap-1">
        <div className="flex items-center gap-8 px-8 py-4 rounded-full premium-shadow shadow-[0_20px_60px_rgba(15,23,42,0.2)] transition-all duration-500 hover:scale-[1.02] bg-white">
          {/* Logo (Minimal) */}
          <Link
            href={logo.link}
            className="font-bold text-lg tracking-tight hover:opacity-50 transition-opacity"
          >
            {logo.text}
          </Link>

          <span className="w-px h-4 bg-black/10 mx-2"></span>

          {/* Links */}
          <div className="flex items-center gap-6">
            {navigationLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-300 ${
                  (link.href === '/' && pathname === '/') ||
                  (link.href !== '/' && pathname.startsWith(link.href))
                    ? 'text-black'
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <span className="w-px h-4 bg-black/10 mx-2"></span>

          {/* Search Icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="text-gray-500 hover:text-black transition-colors"
            aria-label="Search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* CTA (Ghost Button inside Pill) */}
          <Button
            href={cta.href}
            variant="ghost"
            className="text-xs uppercase tracking-wider font-bold ml-2 !p-0 whitespace-nowrap"
          >
            {cta.text}
          </Button>
        </div>
      </nav>

      {/* MOBILE HEADER (Top) */}
      <div className="md:hidden fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center pointer-events-none drop-shadow-[0_10px_35px_rgba(15,23,42,0.15)]">
        <Link
          href={logo.link}
          className="font-bold text-xl pointer-events-auto px-4 py-2 rounded-full bg-white shadow-md"
        >
          {logo.text}
        </Link>

        <div className="pointer-events-auto flex gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-black bg-white shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            className="w-10 h-10 rounded-full flex items-center justify-center focus:outline-none bg-white shadow-md"
          >
            <div className="w-5 h-4 flex flex-col justify-between items-end">
              <span
                className={`w-full h-0.5 bg-black transition-all ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}
              ></span>
              <span
                className={`w-2/3 h-0.5 bg-black transition-all ${isMenuOpen ? 'opacity-0' : ''}`}
              ></span>
              <span
                className={`w-full h-0.5 bg-black transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-[#FAFAF9] transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="flex flex-col h-full justify-center px-8 space-y-6">
          {mobileMenu.menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className="text-5xl font-serif italic text-black hover:text-gray-600 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
