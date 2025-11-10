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
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762698762/portfolio_assets/v9hfuc3gdddi1pj9qxeg.jpg',
    alt: 'Receiving the Coder of the Month award at MIT Muzaffarpur',
    title: 'Coder of the Month — MIT Muzaffarpur',
    description:
      'Awarded “Coder of the Month” for outstanding problem-solving and consistent performance in coding challenges at MIT Muzaffarpur.',
  },
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762685373/portfolio_assets/hxdyhklql3ohq4n8yxre.jpg',
    alt: 'Newspaper Feature - SIH 2025 Selection',
    title: 'Newspaper Feature — SIH 2025 Selection',
    description:
      'Featured in newspaper for being selected as a finalist in the Smart India Hackathon 2025.',
  },
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762785755/portfolio_assets/qgkdrzy7nrlnzighzrck.jpg',
    alt: 'NIELIT Internship Certificate on Machine Learning using Python',
    title: 'Machine Learning Internship — NIELIT, Patna',
    description:
      'Completed a 4-week internship on “Machine Learning using Python” conducted by NIELIT EC Muzaffarpur under the National Institute of Electronics & Information Technology (NIELIT), Patna. Gained hands-on experience with data preprocessing, model building, and ML algorithms using Python libraries like NumPy, Pandas, and scikit-learn.',
  },
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762785972/portfolio_assets/a4senp6qn7fli89vfysk.jpg',
    alt: 'Certificate of Participation in SUSTAIN-A-THON 2024 by Indian Oil Corporation Ltd.',
    title: 'SUSTAIN-A-THON 2024 — Sustainability Hackathon',
    description:
      'Participated in “SUSTAIN-A-THON 2024,” a national-level sustainability hackathon organized by Indian Oil Corporation Ltd. The event focused on fostering innovation and developing sustainable solutions for a greener future.',
  },
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762786062/portfolio_assets/hlvoafwqjlacyglrj9zc.jpg',
    alt: 'Certificate of Appreciation for securing 2nd place in Hackstack’23 by Moxie Club, MIT Muzaffarpur',
    title: 'Hackstack’23 — 2nd Place Winner',
    description:
      'Secured 2nd place in Hackstack’23, a coding and innovation competition organized by Moxie — the Technical Club of MIT Muzaffarpur. Recognized for creativity, teamwork, and technical problem-solving skills.',
  },
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762786166/portfolio_assets/irvixzesg7dbuz1glezp.jpg',
    alt: 'Certificate of Participation in SCIFE’24 Science Exhibition by Moxie, MIT Muzaffarpur',
    title: 'SCIFE’24 — Science Exhibition Participant',
    description:
      'Actively participated in the Science Exhibition “SCIFE’24,” organized by Moxie — the Technical Club of MIT Muzaffarpur. Presented innovative tech ideas as part of Team Tech Thinkers on 28th February 2024.',
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
      description="Milestones that inspire"
      className=""
      centered={true}
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          {/* Render navigation buttons only if there are 3 or more achievements */}
          {ACHIEVEMENTS.length >= 3 && (
            <>
              <button
                onClick={handlePrev}
                className="hidden md:block absolute -left-10 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all text-black hover:text-black"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNext}
                className="hidden md:block absolute -right-10 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all text-black hover:text-black"
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
                    <h3 className="font-semibold text-lg text-black mb-1 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                      {item.title}
                    </h3>
                    <p className="text-sm text-black opacity-80 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                      {item.description}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </Section>
  );
};

export default Achievements;
