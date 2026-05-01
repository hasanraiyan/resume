/**
 * @fileoverview Hero section component for homepage.
 * Displays main heading, introduction, call-to-action buttons, social links,
 * and profile image with GSAP animations and real-time data updates.
 *
 * Data flow:
 * - Primary: heroData from SiteContext (fetched server-side in layout.js — no extra request)
 * - Real-time: listens for 'heroDataUpdated' events from the admin panel and re-fetches
 *   only when an admin saves changes, keeping the live-preview experience intact.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button, Badge } from '@/components/custom-ui';
import { useSiteContext } from '@/context/SiteContext';
/**
 * Default hero data structure used as fallback when API data is unavailable.
 * Provides complete default configuration for all hero section elements.
 *
 * @constant {Object}
 */
const defaultHeroData = {
  badge: {
    text: 'CREATIVE DEVELOPER',
  },

  heading: {
    line1: 'Crafting',
    line2: 'Digital', // This has the stroke effect
    line3: 'Excellence',
  },

  introduction: {
    text: "I'm John Doe, a creative developer focused on building beautiful and functional digital experiences that make a difference.",
    name: 'John Doe', // Separate for easy replacement
    role: 'creative developer',
  },

  cta: {
    primary: {
      text: 'View My Work',
      link: '#work',
    },
    secondary: {
      text: 'Contact Me',
      link: '#contact',
    },
  },

  socialLinks: [
    {
      id: 1,
      name: 'Dribbble',
      url: 'https://dribbble.com/yourusername', // Replace with actual URL
      icon: 'fab fa-dribbble',
    },
    {
      id: 2,
      name: 'Behance',
      url: 'https://behance.net/yourusername',
      icon: 'fab fa-behance',
    },
    {
      id: 3,
      name: 'Instagram',
      url: 'https://instagram.com/yourusername',
      icon: 'fab fa-instagram',
    },
    {
      id: 4,
      name: 'LinkedIn',
      url: 'https://linkedin.com/in/yourusername',
      icon: 'fab fa-linkedin',
    },
  ],

  profile: {
    image: {
      url: '',
      alt: 'Portrait',
    },
    badge: {
      value: '5+',
      label: 'Years Experience',
    },
  },
};

/**
 * Main Hero component for the homepage.
 * Displays the primary landing section with animated heading, introduction,
 * call-to-action buttons, social links, and profile image.
 *
 * @component
 * @returns {JSX.Element} Hero section with full-screen layout and animations
 *
 * @example
 * ```jsx
 * // Standard usage in homepage layout
 * <Hero />
 *
 * // In Next.js page component
 * export default function HomePage() {
 *   return (
 *     <main>
 *       <Hero />
 *       <About />
 *       <Work />
 *       <Contact />
 *     </main>
 *   );
 * }
 * ```
 *
 * @features
 * - Dynamic content loading from `/api/hero`
 * - Fallback to default data if API fails
 * - GSAP scroll-triggered animations with stagger effects
 * - Real-time updates via custom events from admin interface
 * - Responsive two-column layout (content left, image right)
 * - Loading states with skeleton placeholders
 * - Social media links with hover effects
 * - Profile image with experience badge overlay
 * - Text stroke effect on middle heading line
 *
 * @animations
 * - Staggered fade-in animations for content sections
 * - Scroll-triggered entrance effects
 * - Automatic GSAP cleanup on unmount
 * - Image reveal effects on hover
 *
 * @responsiveness
 * - Mobile: Single column with image first, content second
 * - Desktop: Two-column layout (content left, image right)
 * - Responsive typography scaling (text-4xl to text-7xl)
 * - Adaptive spacing and button layouts
 * - Mobile-optimized social links positioning
 *
 * @dependencies
 * - React hooks (useState, useEffect, useCallback)
 * - GSAP for animations and ScrollTrigger
 * - SiteContext (heroData from server-side fetch in layout.js)
 *
 * @dataflow
 * 1. layout.js fetches HeroSection from MongoDB server-side
 * 2. heroData is passed into SiteContext and consumed here — no client fetch
 * 3. GSAP animations initialize on mount
 * 4. Real-time admin preview: 'heroDataUpdated' events trigger a single re-fetch
 */
/**
 * Main Hero component for the homepage.
 * @param {Object} props - Component props
 * @param {Object} props.data - Hero section data from CMS
 * @returns {JSX.Element} Hero section with full-screen layout and animations
 */
export default function Hero({ data }) {
  // Use data prop if provided, otherwise fallback to context or defaults
  const { heroData: siteHeroData } = useSiteContext();

  // Initialise from props, then context, then defaults
  const [heroData, setHeroData] = useState(data || siteHeroData || defaultHeroData);

  // Keep data in sync if props change
  useEffect(() => {
    if (data) {
      setHeroData(data);
    } else if (siteHeroData) {
      setHeroData(siteHeroData);
    }
  }, [data, siteHeroData]);

  // Keep data in sync if SiteContext value changes (e.g. during hydration).
  useEffect(() => {
    if (siteHeroData) {
      setHeroData(siteHeroData);
    }
  }, [siteHeroData]);

  // Real-time admin preview: re-fetch only when an admin saves a change.
  // This avoids the full initial fetch while preserving the live-preview experience.
  const refreshFromApi = useCallback(async () => {
    try {
      const response = await fetch('/api/hero', { cache: 'no-store' });
      const result = await response.json();
      if (result.success && result.data) {
        setHeroData(result.data);
      }
    } catch (err) {
      console.warn('Hero: could not refresh data from admin update', err);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('heroDataUpdated', refreshFromApi);
    return () => window.removeEventListener('heroDataUpdated', refreshFromApi);
  }, [refreshFromApi]);

  // GSAP Animation — runs once on mount (data is already available from SiteContext).
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        const elements = document.querySelectorAll('#home .max-w-6xl > div > div');
        if (elements.length > 0) {
          // Reset any existing transforms
          gsap.set(elements, { opacity: 1, y: 0 });

          gsap.from(elements, {
            opacity: 0,
            y: 50,
            duration: 1,
            stagger: 0.2,
            scrollTrigger: {
              trigger: '#home',
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
              refreshPriority: -1,
            },
          });
        }
      } catch (error) {
        console.warn('GSAP animation error in Hero:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      try {
        ScrollTrigger.getAll().forEach((trigger) => {
          if (trigger.trigger === '#home') {
            trigger.kill();
          }
        });
      } catch (error) {
        console.warn('GSAP cleanup error:', error);
      }
    };
  }, []);

  return (
    <section id="home" className="min-h-screen pt-10 md:p-0 flex items-center w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Left Column - Content */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            <div className="mb-4 sm:mb-5">
              <Badge variant="category">{heroData.badge.text}</Badge>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-5 leading-none">
              {heroData.heading.line1}
              <span className="block text-stroke">{heroData.heading.line2}</span>
              {heroData.heading.line3}
            </h1>

            {/* Introduction */}
            <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-lg text-justify leading-relaxed">
              {heroData.introduction.text}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              <Button
                href={heroData.cta.primary.link}
                variant="primary"
                className="px-6 sm:px-7 py-3 sm:py-3.5 text-center"
              >
                {heroData.cta.primary.text}
              </Button>
              <Button
                href={heroData.cta.secondary.link}
                variant="secondary"
                className="px-6 sm:px-7 py-3 sm:py-3.5 text-center"
              >
                {heroData.cta.secondary.text}
              </Button>
            </div>

            {/* Social Links */}
            <div className="flex gap-6 sm:gap-7 mt-8 sm:mt-10 justify-center sm:justify-start">
              {heroData.socialLinks.map((social, index) => (
                <a
                  key={social.id || social._id || index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl hover:opacity-60 transition hover-target"
                  aria-label={social.name}
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Right Column - Profile Image */}
          <div className="relative order-1 lg:order-2 max-w-sm mx-auto lg:max-w-none">
            <div className="aspect-square bg-black rounded-full overflow-hidden image-reveal hover-target">
              {heroData.profile.image.url ? (
                <img
                  src={heroData.profile.image.url}
                  alt={heroData.profile.image.alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-lg font-semibold">
                  No Image
                </div>
              )}
            </div>

            {/* Experience Badge */}
            <div className="absolute -bottom-4 sm:-bottom-7 -right-4 sm:-right-7 bg-white p-4 sm:p-6 shadow-2xl rounded-lg">
              <div className="text-3xl sm:text-4xl font-bold">{heroData.profile.badge.value}</div>
              <div className="text-gray-600 text-xs sm:text-sm">{heroData.profile.badge.label}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
