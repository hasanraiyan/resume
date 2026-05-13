'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Section, Button } from '@/components/custom-ui';
import { useLoadingStatus } from '@/context/LoadingContext';
import { PublicCourseCard } from '@/components/coursify/PublicCourseCard';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const FeaturedCourses = ({ courses = [], section = {} }) => {
  const swiperRef = useRef(null);
  const { registerComponent, markComponentAsLoaded } = useLoadingStatus();

  useEffect(() => {
    registerComponent('FeaturedCourses');
    markComponentAsLoaded('FeaturedCourses');
  }, [registerComponent, markComponentAsLoaded]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const timer = setTimeout(() => {
      try {
        const container = document.querySelector('#featured-courses');
        if (container) {
          const swiperContainer = container.querySelector('.featured-courses-swiper');
          if (swiperContainer) {
            gsap.set(swiperContainer, { opacity: 1, y: 0 });
            gsap.from(swiperContainer, {
              opacity: 0,
              y: 50,
              duration: 1,
              scrollTrigger: {
                trigger: '#courses',
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none reverse',
                refreshPriority: -1,
              },
            });
          }
        }
      } catch (error) {
        console.warn('GSAP animation error in FeaturedCourses:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      try {
        ScrollTrigger.getAll().forEach((trigger) => {
          if (trigger.trigger === '#courses') {
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

  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <Section
      id="courses"
      title={section.title || 'Featured Courses'}
      description={section.description || 'Curated courses to help you level up your skills'}
      centered={true}
    >
      <div className="max-w-7xl mx-auto" id="featured-courses">
        <div className="relative">
          {courses.length >= 3 && (
            <>
              <button
                onClick={handlePrev}
                className="hidden md:block absolute -left-12 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all text-black hover:text-black border border-gray-100"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNext}
                className="hidden md:block absolute -right-12 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all text-black hover:text-black border border-gray-100"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <Swiper
            modules={[Pagination, Autoplay]}
            slidesPerView={1}
            spaceBetween={30}
            loop={courses.length > 3}
            watchSlidesProgress={true}
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
            className="featured-courses-swiper !h-auto pb-16"
            wrapperClass="items-stretch"
          >
            {courses.map((course) => (
              <SwiperSlide key={course._id || course.id} className="h-auto flex">
                <PublicCourseCard course={course} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      <div className="text-center mt-10 sm:mt-14 md:mt-10">
        <Button
          href={section.viewAllLink || '/coursify'}
          variant="primary"
          className="px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg"
        >
          {section.viewAllText || 'View All Courses'} <i className="fas fa-arrow-right ml-3"></i>
        </Button>
      </div>
    </Section>
  );
};

export default FeaturedCourses;
