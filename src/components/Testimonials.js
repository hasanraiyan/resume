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
import { Section } from '@/components/ui';
import { useLoadingStatus } from '@/context/LoadingContext';
import TestimonialCard from '@/components/testimonials/TestimonialCard';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// --- DATA: TESTIMONIALS ---
const TESTIMONIALS = [
  {
    name: 'Shivam Kumar Singh',
    company: 'Career Simplify Multi Utility Private Limited',
    companyLink: 'https://careersimplify.in',
    // position: 'CEO',
    avatar: 'https://careersimplify.in/assets/cslogo-C1vdCqlW.svg',
    rating: 5,
    content:
      'Raiyan demonstrated exceptional ownership by independently building our platform from the ground up and delivering a  functional, stable product. He managed every stage of development backend, frontend, database architecture, and deployment while resolving major performance bottlenecks with practical and scalable solutions. The platform is now live and expanding on the solid technical foundation he created. Raiyan consistently proved to be reliable, proactive, and continues to provide valuable support and improvements post-launch.',
    project: 'Career Simplify Website',
    projectLink: '/projects/careersimplify',
  },
];

/**
 * Testimonials Carousel Component
 */
const TestimonialsCarousel = () => {
  const swiperRef = useRef(null);

  const handlePrev = () => swiperRef.current?.slidePrev();
  const handleNext = () => swiperRef.current?.slideNext();

  const showNavButtons = TESTIMONIALS.length >= 2;

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
        loop={TESTIMONIALS.length > 1}
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
          640: { slidesPerView: TESTIMONIALS.length < 2 ? 1 : 2 },
          1024: { slidesPerView: TESTIMONIALS.length < 3 ? TESTIMONIALS.length : 3 },
        }}
        className="testimonials-swiper !pb-14"
      >
        {TESTIMONIALS.map((testimonial, index) => (
          <SwiperSlide key={index} className="h-auto">
            <TestimonialCard testimonial={testimonial} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

const Testimonials = () => {
  const { registerComponent, markComponentAsLoaded } = useLoadingStatus();

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
  if (!TESTIMONIALS || TESTIMONIALS.length === 0) {
    return null;
  }

  return (
    <Section
      id="testimonials-section"
      title="Client Testimonials"
      description="What my clients say about working with me"
      centered={true}
      className="py-16 sm:py-20 md:py-24 bg-neutral-50"
    >
      <div className="max-w-7xl mx-auto px-4">
        <TestimonialsCarousel />
      </div>
    </Section>
  );
};

export default Testimonials;
