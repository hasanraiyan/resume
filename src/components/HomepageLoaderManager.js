'use client';

import { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { LoadingProvider, useLoadingStatus } from '@/context/LoadingContext';
import LoaderUI from './LoaderUI';

/**
 * Internal component that manages the loading animation sequence and transitions.
 *
 * This component monitors the loading status context and orchestrates the smooth
 * transition from the loading screen to the homepage content using GSAP animations.
 * It waits for all registered loading components to complete before triggering
 * the exit animation.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Homepage content to render
 * @returns {JSX.Element} Loader UI and homepage content with animation management
 */
function LoaderController({ children }) {
  const { loadingComponents } = useLoadingStatus();
  const [isReadyForExit, setIsReadyForExit] = useState(false);

  useEffect(() => {
    // This effect runs when the list of loading components changes
    if (loadingComponents.size === 0) {
      // All components have reported they are loaded.
      // Now, we can prepare to exit the animation.
      setIsReadyForExit(true);
    }
  }, [loadingComponents]);

  useEffect(() => {
    // This effect triggers the final exit animation.
    if (isReadyForExit) {
      const tl = gsap.timeline();

      tl.to('#loader-ui', {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        delay: 0.2,
      })
        .to(
          '#homepage-content',
          {
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out',
          },
          '-=0.2'
        )
        .to('#loader-ui', {
          display: 'none',
        });
    }
  }, [isReadyForExit]);

  // Initial setup
  useEffect(() => {
    gsap.set('#homepage-content', { opacity: 0 });
  }, []);

  return (
    <>
      <LoaderUI />
      <div id="homepage-content" className="opacity-0">
        {children}
      </div>
    </>
  );
}

/**
 * Homepage loader manager that coordinates loading states and smooth transitions.
 *
 * This component provides a complete loading management system for the homepage,
 * wrapping content in a loading context provider and managing the transition
 * from loading screen to content. It ensures all components report their loading
 * status before revealing the homepage with smooth GSAP animations.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Homepage content components
 * @returns {JSX.Element} Loading provider with loader controller
 */
export default function HomepageLoaderManager({ children }) {
  return (
    <LoadingProvider>
      <LoaderController>{children}</LoaderController>
    </LoadingProvider>
  );
}
