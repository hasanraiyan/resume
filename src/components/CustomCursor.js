'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useCursor } from '@/context/CursorContext';

/**
 * Custom cursor component that provides animated cursor effects.
 *
 * This component creates a custom cursor with two elements: a fast-moving cursor
 * and a slower follower. It responds to different cursor variants (default, text, link)
 * from the cursor context, animating size, color, and displaying optional text.
 * Uses GSAP for smooth animations and transitions.
 *
 * @returns {JSX.Element} Custom cursor elements
 */
export default function CustomCursor() {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);
  const { cursorText, cursorVariant } = useCursor();

  // Handle mouse movement
  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;

    if (!cursor || !follower) return;

    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    gsap.set(follower, { xPercent: -50, yPercent: -50 });

    const handleMouseMove = (e) => {
      gsap.to(cursor, { duration: 0.2, x: e.clientX, y: e.clientY });
      gsap.to(follower, { duration: 0.6, x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Handle cursor variant changes
  useEffect(() => {
    const cursor = cursorRef.current;
    const textElement = cursor.querySelector('.cursor-text');
    const tl = gsap.timeline();

    switch (cursorVariant) {
      case 'text':
        tl.to(cursor, {
          width: '80px',
          height: '80px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderWidth: '2px',
          borderColor: '#000',
        });
        textElement.innerHTML = cursorText;
        tl.to(textElement, { opacity: 1 }, '<');
        break;
      case 'link':
        tl.to(cursor, {
          width: '50px',
          height: '50px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderWidth: '2px',
          borderColor: '#000',
        });
        textElement.innerHTML = '';
        tl.to(textElement, { opacity: 0 }, '<');
        break;
      case 'default':
      default:
        tl.to(cursor, {
          width: '20px',
          height: '20px',
          backgroundColor: 'transparent',
          borderWidth: '2px',
          borderColor: '#000',
        });
        textElement.innerHTML = '';
        tl.to(textElement, { opacity: 0 }, '<');
        break;
    }
  }, [cursorVariant, cursorText]);

  return (
    <>
      <div ref={cursorRef} className="cursor">
        <span className="cursor-text"></span>
      </div>
      <div ref={followerRef} className="cursor-follower"></div>
    </>
  );
}
