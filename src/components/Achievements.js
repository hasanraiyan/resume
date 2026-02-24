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
import { Section } from '@/components/ui';
import { useLoadingStatus } from '@/context/LoadingContext';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// --- DATA: CERTIFICATIONS ---
const CERTIFICATES = [
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1763631873/portfolio_assets/iaeau07wjimbx3vlbhhw.png',
    alt: 'LangChain Essentials Certificate',
    title: 'LangChain Essentials — TypeScript',
    description:
      'Completed the LangChain Academy course on building LLM applications using TypeScript and LangChain.js.',
  },
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762785755/portfolio_assets/qgkdrzy7nrlnzighzrck.jpg',
    alt: 'NIELIT ML Internship',
    title: 'ML Intern — NIELIT Patna',
    description:
      '4-week internship on ML with Python, covering data pipelines, models, and scikit-learn.',
  },

  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762785972/portfolio_assets/a4senp6qn7fli89vfysk.jpg',
    alt: 'SUSTAIN-A-THON 2024',
    title: 'SUSTAIN-A-THON 2024 — Participant',
    description: 'National sustainability hackathon by Indian Oil, creating green tech solutions.',
  },
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762786166/portfolio_assets/irvixzesg7dbuz1glezp.jpg',
    alt: 'SCIFE 24 Exhibition',
    title: 'SCIFE’24 — Exhibitor',
    description: 'Showcased tech innovations with Team Tech Thinkers at MIT’s science expo.',
  },
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1763960607/portfolio_assets/cj3fmc7qu8hsbmhovk12.png',
    alt: 'Foundation: Intro to the LangGraph Certificate',
    title: 'Foundation — Intro to LangGraph',
    description:
      'Completed foundational training on LangGraph, focusing on graph-based LLM workflows and agentic development.',
  },
  {
  src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1771931409/portfolio_assets/kec3i8yr1pcp0dutteck.jpg',
  alt: 'MITMAAI Certificate of Appreciation',
  title: 'Alumni Meet 2025 — Event Coordinator (MITMAAI)',
  description:
    'Recognized by MIT Muzaffarpur Alumni Association International (MITMAAI) for serving as Event Coordinator for Alumni Meet 2025 and contributing to the successful planning and execution of “Connections – 2025”.',
},
  {
  src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1771932622/portfolio_assets/m7jnhoas5xsi9xqxfhnn.jpg',
  alt: 'CLIMB 3rd Position Certificate',
  title: 'C.L.I.M.B — 3rd Position (Team DOSTIFY)',
  description:
    'Secured 3rd position at C.L.I.M.B (Campus Leadership & Innovation Movement for Betterment) with Team DOSTIFY, recognized by MIT Muzaffarpur and MITMAAI USA for innovation and leadership.',
},
];

// --- DATA: ACHIEVEMENTS ---
const ACHIEVEMENTS = [
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762678856/portfolio_assets/u9vr8j427iy1wocnrm6n.png',
    alt: 'MIT Muzaffarpur Magazine 2025',
    title: 'MIT Magazine 2025 — Featured Innovator',
    description:
      'Featured for building PYQDeck, an AI platform that streamlines exam prep for students.',
  },
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762675267/portfolio_assets/smq6q7fn18ruw6lx38mg.jpg',
    alt: 'Smart India Hackathon 2025 Finalist',
    title: 'Smart India Hackathon 2025 — Finalist',
    description:
      'National finalist in the Hardware Edition for an innovative real-world prototype.',
  },
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762698762/portfolio_assets/v9hfuc3gdddi1pj9qxeg.jpg',
    alt: 'Coder of the Month MIT',
    title: 'Coder of the Month — MIT Muzaffarpur',
    description: 'Earned for top coding performance and consistent problem-solving.',
  },
  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762685373/portfolio_assets/hxdyhklql3ohq4n8yxre.jpg',
    alt: 'Newspaper SIH 2025',
    title: 'Press Feature — SIH 2025 Selection',
    description: 'Local newspaper covered my selection as a SIH 2025 finalist.',
  },

  {
    src: 'https://res.cloudinary.com/djkpavwmp/image/upload/v1762786062/portfolio_assets/hlvoafwqjlacyglrj9zc.jpg',
    alt: 'Hackstack 23 2nd Place',
    title: 'Hackstack’23 — 2nd Place',
    description: 'Runner-up in MIT’s flagship hackathon for creative problem-solving and teamwork.',
  },
];

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

const Achievements = () => {
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

  return (
    <div className="space-y-24">
      {/* --- SECTION 1: ACHIEVEMENTS --- */}
      <Section
        id="achievements-section"
        title="Achievements"
        description="Milestones that inspire"
        className=""
        centered={true}
      >
        <div className="max-w-7xl mx-auto px-4">
          <Carousel id="achievements" data={ACHIEVEMENTS} delay={3500} />
        </div>
      </Section>

      {/* --- SECTION 2: CERTIFICATIONS --- */}
      <Section
        id="certificates-section"
        title="Certifications"
        description="Continuous learning & professional growth"
        className=""
        centered={true}
      >
        <div className="max-w-7xl mx-auto px-4">
          <Carousel id="certificates" data={CERTIFICATES} delay={4500} />
        </div>
      </Section>
    </div>
  );
};

export default Achievements;
