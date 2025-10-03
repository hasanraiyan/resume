'use client'

import { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { LoadingProvider, useLoadingStatus } from '@/context/LoadingContext';
import LoaderUI from './LoaderUI';

// The Controller component that listens to the context
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
          delay: 0.2
        })
        .to("#homepage-content", {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out'
        }, "-=0.2")
        .to('#loader-ui', {
            display: 'none'
        });
    }
  }, [isReadyForExit]);

  // Initial setup
  useEffect(() => {
    gsap.set("#homepage-content", { opacity: 0 });
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

// The main export wraps everything in the provider
export default function HomepageLoaderManager({ children }) {
  return (
    <LoadingProvider>
      <LoaderController>
        {children}
      </LoaderController>
    </LoadingProvider>
  );
}
