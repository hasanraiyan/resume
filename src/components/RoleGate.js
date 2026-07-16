'use client';

import { useState, useEffect, useRef } from 'react';
import { useRole } from '@/context/RoleContext';
import { gsap } from 'gsap';

/**
 * RoleGate — A full-screen white overlay that asks the user:
 * "Are you a developer or a business owner?"
 *
 * Once a choice is made, it fades out revealing the main content beneath.
 * The choice is persisted in localStorage via RoleContext.
 */
export default function RoleGate() {
  const { role, setRole, setRoleGateDone, isRoleGateDone, hydrated } = useRole();
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(true);
  const gateRef = useRef(null);
  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const textRef = useRef(null);

  // Gate entrance animation
  useEffect(() => {
    if (!gateRef.current) return;
    gsap.fromTo(
      gateRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.6, ease: 'power2.out' }
    );
  }, []);

  // If role is already set (returning visitor), skip the gate entirely
  if (!hydrated) {
    // Don't render anything until we know if the user has a stored role
    return null;
  }

  if (role && isRoleGateDone) {
    return null;
  }

  const handleSelect = (selectedRole) => {
    setExiting(true);
    // Animate cards out
    if (card1Ref.current && card2Ref.current && textRef.current) {
      gsap.to([card1Ref.current, card2Ref.current], {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        stagger: 0.08,
        ease: 'power2.in',
      });
      gsap.to(textRef.current, { opacity: 0, y: -20, duration: 0.25, ease: 'power2.in' });
    }

    // After exit animation, set role and dismiss gate
    setTimeout(() => {
      setRole(selectedRole);
      setRoleGateDone(true);
      setVisible(false);
    }, 400);
  };

  if (!visible) return null;

  return (
    <div
      ref={gateRef}
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center min-h-screen"
      style={{ opacity: 0, visibility: 'hidden' }}
    >
      {/* Main content */}
      <div className="max-w-3xl mx-auto px-6 text-center">
        {/* Welcome text */}
        <div ref={textRef} className="mb-12 md:mb-16">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-4 font-medium">
            Welcome to my portfolio
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight">
            Are you a developer
            <br />
            <span className="text-gray-400">or a business owner?</span>
          </h1>
          <p className="mt-4 text-gray-400 text-sm sm:text-base max-w-md mx-auto">
            I'll tailor this experience to show you what matters most.
          </p>
        </div>

        {/* Two cards */}
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 justify-center items-stretch">
          {/* Developer card */}
          <button
            ref={card1Ref}
            onClick={() => handleSelect('developer')}
            className="group flex-1 max-w-xs px-8 py-10 sm:py-12 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-900 hover:bg-gray-50 transition-all duration-300 text-center cursor-pointer"
          >
            <div className="text-5xl sm:text-6xl mb-5">👨‍💻</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Developer</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              See my tech stack, projects, code, certifications, and technical work.
            </p>
          </button>

          {/* Business Owner card */}
          <button
            ref={card2Ref}
            onClick={() => handleSelect('business')}
            className="group flex-1 max-w-xs px-8 py-10 sm:py-12 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-900 hover:bg-gray-50 transition-all duration-300 text-center cursor-pointer"
          >
            <div className="text-5xl sm:text-6xl mb-5">💼</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Business Owner</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              See case studies, results, services, and how I can help your business grow.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
