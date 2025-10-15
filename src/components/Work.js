'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Section, Button, Badge, ForSaleBadge } from '@/components/ui';
// ========================================
// 📦 DYNAMIC DATA (Backend-Ready)
// ========================================
const workData = {
  heading: {
    title: 'Featured Works',
    description: 'A curated selection of my best projects',
  },
  cta: {
    text: 'View All Projects',
    link: '/projects',
    icon: 'fas fa-arrow-right',
  },
};

// ========================================
// 🎨 COMPONENT
// ========================================
export default function Work({ featuredProjects = [] }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const container = document.querySelector('#work');
      if (container) {
        const projectsContainer = container.querySelector('.space-y-12');
        if (projectsContainer && projectsContainer.children.length > 0) {
          // Reset any existing transforms
          gsap.set(projectsContainer.children, { opacity: 1, y: 0 });

          gsap.from(projectsContainer.children, {
            opacity: 0,
            y: 50,
            duration: 1,
            stagger: 0.2,
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
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <Section
      id="work"
      title={workData.heading.title}
      description={workData.heading.description}
      centered={true}
      className="py-16 sm:py-20 md:py-24 bg-white"
    >
      {/* Featured Projects List */}
      <div className="space-y-12 sm:space-y-16 md:space-y-20">
        {featuredProjects.map((project, index) => (
          <div
            key={project.id}
            className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center"
          >
            {/* Project Image */}
            <div
              className={`image-reveal rounded-lg overflow-hidden shadow-2xl hover-target relative ${
                index % 2 === 0 ? '' : 'lg:order-2'
              }`}
            >
              <Link href={`/projects/${project.slug}`}>
                <img src={project.thumbnail} alt={project.title} className="w-full" />
              </Link>
              {/* For Sale Badge */}
              {project.isForSale && <ForSaleBadge className="top-3 right-3" />}
            </div>

            {/* Project Content */}
            <div className={index % 2 === 0 ? '' : 'lg:order-1'}>
              {/* Category Badge */}
              <div className="text-xs font-semibold tracking-widest mb-2 sm:mb-3 text-gray-600">
                {project.projectNumber} — {project.category}
              </div>

              {/* Project Title */}
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-5">
                <Link href={`/projects/${project.slug}`} className="hover:text-gray-600 transition">
                  {project.title}
                </Link>
              </h3>

              {/* Project Description */}
              <p className="text-sm sm:text-base text-gray-700 mb-5 sm:mb-7 text-justify leading-relaxed">
                {project.description}
              </p>

              {/* Technology Tags */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-5 sm:mb-7">
                {project.tags?.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="tag">
                    {tag.name}
                  </Badge>
                ))}
                {project.tags && project.tags.length > 3 && (
                  <Badge variant="tag">+{project.tags.length - 3} more</Badge>
                )}
              </div>

              {/* View Project Link */}
              <Button
                href={`/projects/${project.slug}`}
                variant="ghost"
                className="inline-flex items-center"
              >
                View Case Study <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* View All Projects Button */}
      <div className="text-center mt-12 sm:mt-16 md:mt-20">
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
}
