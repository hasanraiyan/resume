'use client';

import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui';
import { useHeroData } from '@/hooks/useHeroData';
import { useLoadingStatus } from '@/context/LoadingContext';

const defaultHeroData = {
  heading: {
    line1: 'Crafting',
    line2: 'Digital',
    line3: 'Excellence',
  },
  introduction: {
    text: "I'm John Doe, a creative developer focused on building beautiful and functional digital experiences.",
    role: 'creative developer',
  },
  cta: {
    primary: { text: 'View My Work', link: '#work' },
    secondary: { text: 'Contact Me', link: '#contact' },
  },
};

export default function Hero() {
  const { heroData: fetchedHeroData, loading } = useHeroData();
  const [heroData, setHeroData] = useState(defaultHeroData);
  const { registerComponent, markComponentAsLoaded } = useLoadingStatus();

  useEffect(() => {
    registerComponent('Hero');
  }, [registerComponent]);

  useEffect(() => {
    if (!loading) markComponentAsLoaded('Hero');
  }, [loading, markComponentAsLoaded]);

  useEffect(() => {
    if (fetchedHeroData) setHeroData(fetchedHeroData);
  }, [fetchedHeroData]);

  // GSAP Animations
  useEffect(() => {
    if (loading) return;
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline();

    // Animate Heading Lines
    tl.from('.hero-line', {
      y: 100,
      opacity: 0,
      rotationX: -45,
      stagger: 0.1,
      duration: 1.2,
      ease: 'power4.out',
    });

    // Animate Intro & Buttons
    tl.from(
      '.hero-fade',
      {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out',
      },
      '-=0.8'
    );
  }, [loading]);

  if (loading) return <div className="h-screen w-full bg-[#FAFAF9]" />; // Minimal loader

  return (
    <section
      id="home"
      className="min-h-screen flex flex-col justify-center relative overflow-hidden px-6"
    >
      {/* Background Gradient Orb (Subtle) */}
      <div className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-gray-200/50 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />

      <div className="max-w-[90rem] mx-auto w-full z-10">
        {/* Main Heading - Massive Display */}
        <h1 className="flex flex-col text-[12vw] leading-[0.85] tracking-tighter font-serif text-black mb-12">
          <span className="hero-line block overflow-hidden">{heroData.heading.line1}</span>
          <span className="hero-line block overflow-hidden italic text-gray-400">
            {heroData.heading.line2}
          </span>
          <span className="hero-line block overflow-hidden">{heroData.heading.line3}</span>
        </h1>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-end border-t border-black/10 pt-8">
          {/* Role / Badge */}
          <div className="hero-fade hidden lg:block">
            <span className="text-xs font-mono uppercase tracking-widest">
              ( {heroData.introduction.role || 'Developer'} )
            </span>
          </div>

          {/* Introduction */}
          <div className="hero-fade">
            <p className="text-xl md:text-2xl leading-relaxed text-gray-600 max-w-md">
              {heroData.introduction.text}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="hero-fade flex flex-col sm:flex-row gap-8 lg:justify-end">
            <Button href={heroData.cta.primary.link} variant="primary">
              {heroData.cta.primary.text}
            </Button>
            <Button href={heroData.cta.secondary.link} variant="ghost">
              {heroData.cta.secondary.text}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
