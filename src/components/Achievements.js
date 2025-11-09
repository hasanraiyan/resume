/**
 * @fileoverview Achievements section component for homepage.
 * Displays achievements in an interactive carousel with autoplay and navigation.
 * Features Swiper integration, hover animations, and responsive design.
 */

'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Section } from '@/components/ui';
import { useLoadingStatus } from '@/context/LoadingContext';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const ACHIEVEMENTS = [
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762678856/portfolio_assets/u9vr8j427iy1wocnrm6n.png',
    alt: 'Featured in MIT Muzaffarpur Magazine 2025 Edition',
    title: 'MIT Muzaffarpur Magazine 2025 — Featured Innovator',
    description:
      'Recognized in the 2025 edition of the MIT Muzaffarpur magazine for developing PYQDeck — an AI-powered platform helping students simplify exam preparation.',
  },
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762675267/portfolio_assets/smq6q7fn18ruw6lx38mg.jpg',
    alt: 'Smart India Hackathon Finalist 2025',
    title: 'Smart India Hackathon 2025 — Finalist',
    description:
      'Selected as a finalist in the Smart India Hackathon 2025 (Hardware Edition) for building an innovative real-world prototype.',
  },
];

/**
 * Achievements section component that displays accomplishments in an interactive carousel.
 * Features Swiper carousel with autoplay, pagination, and custom navigation controls.
 *
 * @component
 * @example
 * ```jsx
 * // Basic usage in homepage
 * <Achievements />
 *
 * // In layout with other sections
 * <main>
 *   <Hero />
 *   <About />
 *   <Achievements />
 *   <Work />
 *   <Contact />
 * </main>
 * ```
 *
 * @features
 * - Interactive Swiper carousel with autoplay
 * - Custom navigation arrows
 * - Pagination dots
 * - Hover animations with image scaling and overlay effects
 * - GSAP scroll-triggered animations
 * - Loading state coordination with LoadingContext
 * - Responsive breakpoints (1-3 slides per view)
 *
 * @animations
 * - Fade-in animation for the entire section
 * - Scroll-triggered entrance effects
 * - Hover scale effects on images
 * - Overlay fade-in on hover
 *
 * @responsiveness
 * - Mobile: Single slide per view
 * - Tablet: Two slides per view
 * - Desktop: Three slides per view
 * - Responsive spacing and typography
 *
 * @dependencies
 * - Swiper for carousel functionality
 * - GSAP for animations
 * - LoadingContext for coordinated loading states
 * - UI components (Section, Button)
 * - Lucide React for navigation icons
 */
const Achievements = () => {
  const swiperRef = useRef(null);
  const { registerComponent, markComponentAsLoaded } = useLoadingStatus();

  useEffect(() => {
    // Register this component as "loaded" since it has no async data
    registerComponent('Achievements');
    markComponentAsLoaded('Achievements');
  }, [registerComponent, markComponentAsLoaded]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        const container = document.querySelector('#achievements');
        if (container) {
          const swiperContainer = container.querySelector('.achievements-swiper');
          if (swiperContainer) {
            // Reset any existing transforms
            gsap.set(swiperContainer, { opacity: 1, y: 0 });

            gsap.from(swiperContainer, {
              opacity: 0,
              y: 50,
              duration: 1,
              scrollTrigger: {
                trigger: '#achievements',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse',
                refreshPriority: -1,
              },
            });
          }
        }
      } catch (error) {
        console.warn('GSAP animation error in Achievements:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      // Clean up GSAP animations
      try {
        ScrollTrigger.getAll().forEach((trigger) => {
          if (trigger.trigger === '#achievements') {
            trigger.kill();
          }
        });
      } catch (error) {
        console.warn('GSAP cleanup error:', error);
      }
    };
  }, []);

  const handlePrev = () => swiperRef.current?.slidePrev();
  const handleNext = () => swiperRef.current?.slideNext();

  return (
    <Section
      id="achievements"
      title="Achievements"
      subtitle="Milestones that inspire"
      className="p-0 m-0"
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          {/* Render navigation buttons only if there are 3 or more achievements */}
          {ACHIEVEMENTS.length >= 3 && (
            <>
              <button
                onClick={handlePrev}
                className="hidden md:block absolute -left-10 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-gray-900"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNext}
                className="hidden md:block absolute -right-10 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-gray-900"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Conditional rendering: static cards if < 3, Swiper otherwise */}
          {ACHIEVEMENTS.length < 3 ? (
            <div className="flex justify-center flex-wrap gap-8">
              {ACHIEVEMENTS.map((item, index) => (
                <div
                  key={index}
                  className="relative group overflow-hidden rounded-2xl shadow-lg mb-8 max-w-sm"
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/40 to-transparent backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end items-start p-6 text-left">
                    <h3 className="font-semibold text-lg text-gray-800 mb-1 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-700 opacity-80 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Pagination, Autoplay]}
              slidesPerView={3}
              spaceBetween={30}
              loop
              autoplay={{
                delay: 3500,
                disableOnInteraction: false,
              }}
              pagination={{ clickable: true }}
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="achievements-swiper"
            >
              {ACHIEVEMENTS.map((item, index) => (
                <SwiperSlide key={index}>
                  <div className="relative group overflow-hidden rounded-2xl shadow-lg mb-8">
                    <img
                      src={item.src}
                      alt={item.alt}
                      className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/40 to-transparent backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end items-start p-6 text-left">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-700 opacity-80 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>
    </Section>
  );
};

export default Achievements;
