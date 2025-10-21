'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Client-side wrapper component for the homepage with GSAP ScrollTrigger management.
 *
 * This component ensures proper cleanup of GSAP ScrollTrigger instances between page
 * navigations and handles hash-based smooth scrolling to sections. It prevents
 * ScrollTrigger conflicts when navigating between pages and provides smooth
 * anchor link navigation to page sections.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} Wrapper component with ScrollTrigger management
 */
export default function HomePageClient({ children }) {
  // Cleanup ScrollTriggers on component mount for fresh state
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Kill any existing ScrollTriggers from other pages
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    ScrollTrigger.refresh();

    // Cleanup on unmount
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Handle scroll to section from hash navigation
  useEffect(() => {
    // Check if there's a hash in the URL
    const hash = window.location.hash.replace('#', '');

    if (hash) {
      // Scroll to the section after a small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  return <>{children}</>;
}
