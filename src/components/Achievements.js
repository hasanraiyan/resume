/**
 * @fileoverview Achievements and Certifications section component.
 * Displays two distinct carousels: one for achievements/awards and one for certifications.
 */

'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Section } from '@/components/custom-ui';
import { useLoadingStatus } from '@/context/LoadingContext';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// --- REMOVED HARDCODED DATA: Driven by CMS ---

/**
 * Reusable Carousel Component to handle Logic for both sections
 */
const Carousel = ({ id, data, delay = 3500 }) => {
  const swiperRef = useRef(null);

  const handlePrev = () => swiperRef.current?.slidePrev();
  const handleNext = () => swiperRef.current?.slideNext();

  // If only 1 item, we can center it or show 1 slide.
  // If data length < 3, navigation buttons might not be needed on desktop.
  const showNavButtons = data.length >= 3;

  return (
    <div className={`relative w-full swiper-container-${id}`}>
      {showNavButtons && (
        <>
          <button
            onClick={handlePrev}
            className="hidden md:block absolute -left-12 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all text-black hover:text-black"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            className="hidden md:block absolute -right-12 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all text-black hover:text-black"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={1}
        spaceBetween={30}
        loop={data.length > 1} // Only loop if more than 1 item
        autoplay={{
          delay: delay,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-black',
          bulletActiveClass: 'swiper-pagination-bullet-active !bg-black',
        }}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        breakpoints={{
          640: { slidesPerView: data.length < 2 ? 1 : 2 },
          1024: { slidesPerView: data.length < 3 ? data.length : 3 },
        }}
        className="achievements-swiper !pb-14" // Added padding bottom for pagination
      >
        {data.map((item, index) => (
          <SwiperSlide key={index} className="h-auto">
            <div className="relative group overflow-hidden rounded-2xl shadow-lg h-full">
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end items-start p-6 text-left">
                <h3 className="font-bold text-lg text-black mb-1 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                  {item.title}
                </h3>
                <p className="text-sm text-black font-medium opacity-90 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                  {item.description}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

const Achievements = ({ achievements = [], certifications = [], section = {} }) => {
  const { registerComponent, markComponentAsLoaded } = useLoadingStatus();

  useEffect(() => {
    registerComponent('Achievements');
    markComponentAsLoaded('Achievements');
  }, [registerComponent, markComponentAsLoaded]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const timer = setTimeout(() => {
      try {
        // Animate Achievement Container
        const achContainer = document.querySelector('.swiper-container-achievements');
        if (achContainer) {
          gsap.from(achContainer, {
            opacity: 0,
            y: 50,
            duration: 1,
            scrollTrigger: {
              trigger: '#achievements-section',
              start: 'top 85%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
            },
          });
        }

        // Animate Certificate Container
        const certContainer = document.querySelector('.swiper-container-certificates');
        if (certContainer) {
          gsap.from(certContainer, {
            opacity: 0,
            y: 50,
            duration: 1,
            scrollTrigger: {
              trigger: '#certificates-section',
              start: 'top 85%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
            },
          });
        }
      } catch (error) {
        console.warn('GSAP animation error:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  if (achievements.length === 0 && certifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-24">
      {/* --- SECTION 1: ACHIEVEMENTS --- */}
      {achievements.length > 0 && (
        <Section
          id="achievements-section"
          title={section.achievementTitle || 'Achievements'}
          description={section.achievementDescription || 'Milestones that inspire'}
          className=""
          centered={true}
        >
          <div className="max-w-7xl mx-auto px-4">
            <Carousel id="achievements" data={achievements} delay={3500} />
          </div>
        </Section>
      )}

      {/* --- SECTION 2: CERTIFICATIONS --- */}
      {certifications.length > 0 && (
        <Section
          id="certificates-section"
          title={section.certificationTitle || 'Certifications'}
          description={
            section.certificationDescription || 'Continuous learning & professional growth'
          }
          className=""
          centered={true}
        >
          <div className="max-w-7xl mx-auto px-4">
            <Carousel id="certificates" data={certifications} delay={4500} />
          </div>
        </Section>
      )}
    </div>
  );
};

export default Achievements;
