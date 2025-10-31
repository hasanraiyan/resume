/** @fileoverview Skills & Expertise section component with interactive skill bars, technology stack, and certifications. */

'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Card } from '@/components/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReact, faNodeJs, faDocker, faAws, faMdb } from '@fortawesome/free-brands-svg-icons';
import { Database, Code, Server } from 'lucide-react';

/** Helper to render icon */
function renderIcon(iconType, icon, size = 16) {
  if (iconType === 'fa') {
    return <FontAwesomeIcon icon={icon} />;
  } else if (iconType === 'lucide') {
    const IconComponent = icon;
    return <IconComponent size={size} />;
  }
  return null;
}

/** Static skills data with proficiency levels */
const skillsData = [
  { name: 'JavaScript', level: 95, color: 'bg-gray-800' },
  { name: 'React', level: 90, color: 'bg-gray-700' },
  { name: 'Node.js', level: 85, color: 'bg-gray-600' },
  { name: 'Python', level: 80, color: 'bg-gray-500' },
  { name: 'TypeScript', level: 85, color: 'bg-gray-400' },
  { name: 'CSS/HTML', level: 90, color: 'bg-gray-300' },
];

/** Static technology stack data */
const technologies = [
  'React',
  'Next.js',
  'Node.js',
  'MongoDB',
  'PostgreSQL',
  'Docker',
  'AWS',
  'GraphQL',
];

/** Static certifications data */
const certifications = [
  {
    name: 'AWS Certified Solutions Architect',
    issuer: 'Amazon Web Services',
    date: '2023',
    iconType: 'fa',
    icon: faAws,
  },
  {
    name: 'React Developer Certification',
    issuer: 'Meta',
    date: '2022',
    iconType: 'fa',
    icon: faReact,
  },
  {
    name: 'Node.js Certified Developer',
    issuer: 'Node.js Foundation',
    date: '2021',
    iconType: 'fa',
    icon: faNodeJs,
  },
];

/**
 * Skill bar component with animation
 * @param {Object} props
 * @param {string} props.name - Skill name
 * @param {number} props.level - Proficiency level (0-100)
 * @param {string} props.color - Tailwind color class
 */
function SkillBar({ name, level, color }) {
  const barRef = useRef();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    gsap.set(bar, { width: 0 });
    gsap.to(bar, {
      width: `${level}%`,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: bar,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
  }, [level]);

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <span className="text-sm text-gray-500">{level}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div ref={barRef} className={`h-2.5 rounded-full ${color}`} />
      </div>
    </div>
  );
}

/** Main Skills component */
export default function Skills() {
  const sectionRef = useRef();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    gsap.from(section.querySelectorAll('.skill-section'), {
      opacity: 0,
      y: 50,
      duration: 1,
      stagger: 0.2,
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
  }, []);

  return (
    <section ref={sectionRef} id="skills" className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Skills & Expertise</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A comprehensive overview of my technical skills, expertise areas, and professional
            certifications.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 sm:gap-12">
          {/* Skills with progress bars */}
          <div className="skill-section">
            <h3 className="text-xl font-semibold mb-6">Core Skills</h3>
            <div>
              {skillsData.map((skill, index) => (
                <SkillBar key={index} name={skill.name} level={skill.level} color={skill.color} />
              ))}
            </div>
          </div>

          {/* Technology Stack */}
          <div className="skill-section">
            <h3 className="text-xl font-semibold mb-6">Technology Stack</h3>
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white rounded-full text-sm font-medium border border-gray-200 hover:border-gray-400 transition-colors"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="skill-section">
            <h3 className="text-xl font-semibold mb-6">Certifications</h3>
            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <Card
                  key={index}
                  variant="bordered"
                  className="p-4 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-gray-900 text-lg">
                      {renderIcon(cert.iconType, cert.icon)}
                    </div>
                    <h4 className="font-medium text-gray-900">{cert.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{cert.issuer}</p>
                  <p className="text-xs text-gray-500 mt-1">{cert.date}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
