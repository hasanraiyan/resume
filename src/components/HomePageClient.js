'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
