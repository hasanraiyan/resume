/**
 * @fileoverview Testimonials section component with carousel functionality.
 * Displays client testimonials in an interactive carousel similar to Achievements component.
 */

'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Section } from '@/components/custom-ui';
import { useRole } from '@/context/RoleContext';
import { useLoadingStatus } from '@/context/LoadingContext';
import TestimonialCard from '@/components/testimonials/TestimonialCard';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// --- REMOVED HARDCODED DATA: Driven by CMS ---

/**
 * Testimonials Carousel Component
 */
const TestimonialsCarousel = ({ testimonials = [] }) => {
  const swiperRef = useRef(null);

  const handlePrev = () => swiperRef.current?.slidePrev();
  const handleNext = () => swiperRef.current?.slideNext();

  const showNavButtons = testimonials.length >= 2;

  return (
    <div className="relative w-full testimonials-swiper-container">
      {showNavButtons && (
        <>
          <button
            onClick={handlePrev}
            className="hidden md:block absolute -left-12 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all text-black hover:text-black"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            className="hidden md:block absolute -right-12 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all text-black hover:text-black"
            aria-label="Next testimonial"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={1}
        spaceBetween={30}
        loop={testimonials.length > 1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-black',
          bulletActiveClass: 'swiper-pagination-bullet-active !bg-black',
        }}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        breakpoints={{
          640: { slidesPerView: testimonials.length < 2 ? 1 : 2 },
          1024: { slidesPerView: testimonials.length < 3 ? testimonials.length : 3 },
        }}
        className="testimonials-swiper !pb-14"
      >
        {testimonials.map((testimonial, index) => (
          <SwiperSlide key={index} className="h-auto">
            <TestimonialCard testimonial={testimonial} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

const Testimonials = ({ testimonials = [], section = {} }) => {
  const { registerComponent, markComponentAsLoaded } = useLoadingStatus();
  const { isBusiness } = useRole();

  useEffect(() => {
    registerComponent('Testimonials');
    markComponentAsLoaded('Testimonials');
  }, [registerComponent, markComponentAsLoaded]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const timer = setTimeout(() => {
      try {
        const container = document.querySelector('.testimonials-swiper-container');
        if (container) {
          gsap.from(container, {
            opacity: 0,
            y: 50,
            duration: 1,
            scrollTrigger: {
              trigger: '#testimonials-section',
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

  // Don't render if no testimonials data
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  // Business owner: optional social proof banner above the carousel
  const BusinessProofBanner = isBusiness ? (
    <div className="max-w-2xl mx-auto mb-8 p-4 bg-white rounded-xl border border-emerald-100 text-center">
      <p className="text-sm text-emerald-700 font-medium">
        ⭐ Trusted by startups, educators, and business owners — {testimonials.length} client{'('}s
        {')'} recommend working with me
      </p>
    </div>
  ) : null;

  return (
    <Section
      id="testimonials-section"
      title={section.title || (isBusiness ? 'What Clients Say' : 'Client Testimonials')}
      description={
        section.description ||
        (isBusiness
          ? 'Real feedback from real people I have worked with'
          : 'What my clients say about working with me')
      }
      centered={true}
      className={`py-16 sm:py-20 md:py-24 ${isBusiness ? 'bg-white' : 'bg-neutral-50'}`}
    >
      <div className="max-w-7xl mx-auto px-4">
        {BusinessProofBanner}
        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </Section>
  );
};

export default Testimonials;
