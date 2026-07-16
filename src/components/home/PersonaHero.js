'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Badge, Button } from '@/components/custom-ui';
import PersonaSwitcher from './PersonaSwitcher';

export default function PersonaHero({ persona, heroData = {}, activePersona, onPersonaChange }) {
  const profile = heroData?.profile || {};
  const image = profile?.image || {};
  const profileBadge = profile?.badge || {};
  const socialLinks = heroData?.socialLinks || [];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const timer = setTimeout(() => {
      try {
        const elements = document.querySelectorAll('#home .persona-hero-animate');
        if (elements.length > 0) {
          gsap.set(elements, { opacity: 1, y: 0 });
          gsap.from(elements, {
            opacity: 0,
            y: 38,
            duration: 0.8,
            stagger: 0.12,
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
        console.warn('GSAP animation error in PersonaHero:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen w-full overflow-hidden pt-28 md:pt-10 lg:pt-0 flex items-center"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.08),transparent_34%),linear-gradient(135deg,#f7f7f4_0%,#ffffff_42%,#efefec_100%)]" />
      <div className="absolute right-0 top-20 -z-10 h-72 w-72 rounded-full bg-black/5 blur-3xl" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10 sm:py-16">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 sm:gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="persona-hero-animate mb-5">
              <Badge variant="category">{persona.hero.badge}</Badge>
            </div>

            <h1 className="persona-hero-animate text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 leading-[0.95] tracking-tight">
              {persona.hero.title.line1}
              <span className="block text-stroke">{persona.hero.title.line2}</span>
              {persona.hero.title.line3}
            </h1>

            <p className="persona-hero-animate text-base sm:text-lg text-gray-600 mb-8 max-w-2xl leading-relaxed">
              {persona.hero.description}
            </p>

            <div className="persona-hero-animate flex flex-col sm:flex-row gap-4 sm:gap-5 mb-8">
              <Button href={persona.hero.primaryCta.href} variant="primary" className="px-7 py-3.5">
                {persona.hero.primaryCta.text}
              </Button>
              <Button
                href={persona.hero.secondaryCta.href}
                variant="secondary"
                className="px-7 py-3.5"
              >
                {persona.hero.secondaryCta.text}
              </Button>
            </div>

            <div className="persona-hero-animate flex flex-col lg:flex-row lg:items-end gap-6">
              <PersonaSwitcher activePersona={activePersona} onPersonaChange={onPersonaChange} />

              {socialLinks.length > 0 && (
                <div className="flex gap-5 justify-center sm:justify-start pb-2">
                  {socialLinks.map((social, index) => (
                    <a
                      key={social.id || social._id || index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg shadow-sm transition hover:-translate-y-1 hover:shadow-md hover-target"
                      aria-label={social.name}
                    >
                      <i className={social.icon}></i>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="persona-hero-animate relative order-1 lg:order-2 max-w-sm mx-auto lg:max-w-none">
            <div className="absolute -left-5 top-8 z-10 hidden rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold shadow-xl sm:block">
              {persona.eyebrow}
            </div>
            <div className="aspect-square rounded-[2rem] bg-black overflow-hidden image-reveal hover-target shadow-2xl shadow-black/15 rotate-2">
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.alt || 'Profile portrait'}
                  className="w-full h-full object-cover -rotate-2 scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center text-white text-lg font-semibold">
                  Portfolio
                </div>
              )}
            </div>

            <div className="absolute -bottom-4 sm:-bottom-7 -right-4 sm:-right-7 bg-white p-4 sm:p-6 shadow-2xl rounded-2xl border border-black/5">
              <div className="text-3xl sm:text-4xl font-bold">{profileBadge.value || '5+'}</div>
              <div className="text-gray-600 text-xs sm:text-sm">
                {profileBadge.label || 'Years Experience'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
