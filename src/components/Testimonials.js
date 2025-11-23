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

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// --- DATA: TESTIMONIALS ---
const TESTIMONIALS = [
  {
    name: 'Sarah Johnson',
    company: 'TechStart Inc.',
    position: 'CEO',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    rating: 5,
    content:
      'Raiyan delivered an exceptional e-commerce platform that exceeded our expectations. The attention to detail and user experience design was outstanding.',
    project: 'E-commerce Platform Development',
  },
  {
    name: 'Michael Chen',
    company: 'Digital Agency Pro',
    position: 'Creative Director',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    rating: 5,
    content:
      'Working with Raiyan was a game-changer for our agency. His React expertise and problem-solving skills helped us deliver a complex project on time.',
    project: 'Custom Dashboard Application',
  },
  {
    name: 'Emily Rodriguez',
    company: 'Fashion Forward',
    position: 'Marketing Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    rating: 4,
    content:
      'Raiyan transformed our online presence with a stunning website that perfectly captures our brand. The responsive design works flawlessly across all devices.',
    project: 'Brand Website Redesign',
  },
  {
    name: 'David Kim',
    company: 'StartupHub',
    position: 'Product Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    rating: 5,
    content:
      'The AI-powered chatbot Raiyan developed has revolutionized our customer support. Response times are down 80% and customer satisfaction is at an all-time high.',
    project: 'AI Chatbot Implementation',
  },
  {
    name: 'Lisa Thompson',
    company: 'HealthTech Solutions',
    position: 'CTO',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    rating: 5,
    content:
      "Raiyan's technical expertise and professional approach made our complex healthcare application project a success. Highly recommended for any project.",
    project: 'Healthcare Application Development',
  },
  {
    name: 'James Wilson',
    company: 'RealEstate Plus',
    position: 'Operations Director',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    rating: 4,
    content:
      'The property management system Raiyan built has streamlined our entire workflow. Great communication throughout the project development process.',
    project: 'Property Management System',
  },
];

/**
 * Testimonial Card Component
 */
const TestimonialCard = ({ testimonial }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 h-full flex flex-col relative">
      {/* Quote Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute top-6 right-6 text-blue-100 w-10 h-10"
        aria-hidden="true"
      >
        <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>
        <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path>
      </svg>

      {/* Rating */}
      <div className="flex items-center mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-lg">
            ★
          </span>
        ))}
        {[...Array(5 - testimonial.rating)].map((_, i) => (
          <span key={i} className="text-neutral-300 text-lg">
            ★
          </span>
        ))}
      </div>

      {/* Content */}
      <blockquote className="text-neutral-700 mb-6 leading-relaxed flex-grow">
        "{testimonial.content}"
      </blockquote>

      {/* Client Info */}
      <div className="flex items-center space-x-4 pt-4 border-t border-neutral-100">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-grow">
          <div className="font-semibold text-black">{testimonial.name}</div>
          <div className="text-sm text-neutral-600">{testimonial.position}</div>
          <div className="text-sm text-neutral-500">{testimonial.company}</div>
        </div>
      </div>

      {/* Project Tag */}
      <div className="mt-4">
        <span className="text-xs text-neutral-500 font-medium bg-neutral-50 px-3 py-1 rounded-full">
          {testimonial.project}
        </span>
      </div>
    </div>
  );
};

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
