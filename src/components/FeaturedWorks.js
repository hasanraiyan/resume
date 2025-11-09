/**
 * @fileoverview Featured Works section component for homepage.
 * Displays featured projects in an interactive carousel with autoplay and navigation.
 * Features Swiper integration, hover animations, and responsive design.
 */

'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Section, Button } from '@/components/ui';
import { useLoadingStatus } from '@/context/LoadingContext';
import Link from 'next/link';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// ========================================
// 📦 DYNAMIC DATA (Backend-Ready)
// ========================================
const workData = {
  cta: {
    text: 'View All Projects',
    link: '/projects',
    icon: 'fas fa-arrow-right',
  },
};

/**
 * Featured Works section component that displays projects in an interactive carousel.
 * Features Swiper carousel with autoplay, pagination, and custom navigation controls.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.featuredProjects - Array of project objects to display
 * @returns {JSX.Element} Featured works carousel section
 * @example
 * ```jsx
 * // Basic usage in homepage
 * <FeaturedWorks featuredProjects={projects} />
 *
 * // In layout with other sections
 * <main>
 *   <Hero />
 *   <About />
 *   <FeaturedWorks featuredProjects={projects} />
 *   <Achievements />
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
const FeaturedWorks = ({ featuredProjects = [] }) => {
  const swiperRef = useRef(null);
  const { registerComponent, markComponentAsLoaded } = useLoadingStatus();

  // Helper function to truncate text
  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  useEffect(() => {
    // Register this component as "loaded" since it has no async data
    registerComponent('FeaturedWorks');
    markComponentAsLoaded('FeaturedWorks');
  }, [registerComponent, markComponentAsLoaded]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        const container = document.querySelector('#featured-works');
        if (container) {
          const swiperContainer = container.querySelector('.featured-works-swiper');
          if (swiperContainer) {
            // Reset any existing transforms
            gsap.set(swiperContainer, { opacity: 1, y: 0 });

            gsap.from(swiperContainer, {
              opacity: 0,
              y: 50,
              duration: 1,
              scrollTrigger: {
                trigger: '#work',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse',
                refreshPriority: -1,
              },
            });
          }
        }
      } catch (error) {
        console.warn('GSAP animation error in FeaturedWorks:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      // Clean up GSAP animations
      try {
        ScrollTrigger.getAll().forEach((trigger) => {
          if (trigger.trigger === '#work') {
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
      id="work"
      title="Featured Works"
      description="A curated selection of my best projects"
      className="p-0 m-0"
      centered={true}
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          {/* Render navigation buttons only if there are 3 or more works */}
          {featuredProjects.length >= 3 && (
            <>
              <button
                onClick={handlePrev}
                className="hidden md:block absolute -left-10 top-1/3 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all text-black hover:text-black"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNext}
                className="hidden md:block absolute -right-10 top-1/3 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all text-black hover:text-black"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <Swiper
            modules={[Pagination, Autoplay]}
            slidesPerView={1}
            spaceBetween={30}
            loop
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet !bg-black',
              bulletActiveClass: 'swiper-pagination-bullet-active !bg-black',
            }}
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="featured-works-swiper"
          >
            {featuredProjects.map((project) => (
              <SwiperSlide key={project.id}>
                <Link href={`/projects/${project.slug}`}>
                  <div className="relative group overflow-hidden rounded-2xl shadow-lg mb-8 cursor-pointer">
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/40 to-transparent backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end items-start p-6 text-left">
                      <div className="text-xs font-semibold tracking-widest mb-2 text-black">
                        {project.projectNumber} — {project.category}
                      </div>
                      <h3 className="font-semibold text-lg text-black mb-1 translate-y-3 group-hover:translate-y-0 transition-all duration-500 hover:text-black transition">
                        {project.title}
                      </h3>
                      <p className="text-sm text-black opacity-80 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                        {truncateText(project.description)}
                      </p>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* View All Projects Button */}
      <div className="text-center mt-10 sm:mt-14 md:mt-10">
        <Button
          href={workData.cta.link}
          variant="primary"
          className="px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg"
        >
          {workData.cta.text} <i className={`${workData.cta.icon} ml-3`}></i>
        </Button>
      </div>
    </Section>
  );
};

export default FeaturedWorks;
