/** @fileoverview Skills & Expertise section component with interactive skill bars, technology stack, and certifications. */

'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Card } from '@/components/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReact, faNodeJs, faDocker, faAws, faMdb } from '@fortawesome/free-brands-svg-icons';
import { Database, Code, Server } from 'lucide-react';

/** Icon mappings for dynamic rendering */
const faIcons = {
  faReact,
  faNodeJs,
  faDocker,
  faAws,
  faMdb,
};

const lucideIcons = {
  Database,
  Code,
  Server,
};

/** Helper to render icon */
function renderIcon(iconType, iconName, size = 16) {
  if (iconType === 'fa') {
    const icon = faIcons[iconName];
    return icon ? <FontAwesomeIcon icon={icon} style={{ fontSize: size }} /> : null;
  } else if (iconType === 'lucide') {
    const IconComponent = lucideIcons[iconName];
    return IconComponent ? <IconComponent size={size} /> : null;
  }
  return null;
}

/** Color mapping for skills based on level */
function getSkillColor(level) {
  if (level >= 90) return 'bg-gray-800';
  if (level >= 80) return 'bg-gray-700';
  if (level >= 70) return 'bg-gray-600';
  if (level >= 60) return 'bg-gray-500';
  if (level >= 50) return 'bg-gray-400';
  return 'bg-gray-300';
}

/**
 * Skill bar component with animation
 * @param {Object} props
 * @param {string} props.name - Skill name
 * @param {number} props.level - Proficiency level (0-100)
 * @param {string} [props.iconType] - Icon library type ('fa' or 'lucide')
 * @param {string} [props.icon] - Icon name/key
 */
function SkillBar({ name, level, iconType, icon }) {
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
        <div className="flex items-center gap-2">
          {icon && renderIcon(iconType, icon, 14)}
          <span className="text-sm font-medium text-gray-700">{name}</span>
        </div>
        <span className="text-sm text-gray-500">{level}%</span>
      </div>
      <div
        className="w-full bg-gray-200 rounded-full h-2.5"
        role="progressbar"
        aria-valuenow={level}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          ref={barRef}
          className="h-2.5 rounded-full bg-gradient-to-r from-gray-300 to-gray-800"
        />
      </div>
    </div>
  );
}

/**
 * Skills component displaying core skills, technology stack, and certifications with animations.
 * @returns {JSX.Element} The Skills section JSX element.
 */
export default function Skills() {
  const sectionRef = useRef();
  const [skillsData, setSkillsData] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [skillsRes, techRes, certRes] = await Promise.all([
          fetch('/api/skills'),
          fetch('/api/technologies'),
          fetch('/api/certifications'),
        ]);

        const skills = await skillsRes.json();
        const tech = await techRes.json();
        const cert = await certRes.json();

        setSkillsData(skills.map((skill) => ({ ...skill, color: getSkillColor(skill.level) })));
        setTechnologies(tech);
        setCertifications(cert);
      } catch (error) {
        console.error('Error fetching skills data:', error);
        // Fallback to static data if API fails
        setSkillsData([
          { name: 'JavaScript', level: 95, color: getSkillColor(95) },
          { name: 'React', level: 90, color: getSkillColor(90) },
          { name: 'Node.js', level: 85, color: getSkillColor(85) },
        ]);
        setTechnologies([
          { name: 'React', iconType: 'fa', iconName: 'faReact' },
          { name: 'Next.js', iconType: 'lucide', iconName: 'Server' },
          { name: 'Node.js', iconType: 'fa', iconName: 'faNodeJs' },
        ]);
        setCertifications([
          {
            name: 'AWS Certified',
            issuer: 'AWS',
            date: '2023',
            iconType: 'fa',
            iconName: 'faAws',
            url: '#',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
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
    }
  }, [loading]);

  if (!loading && !skillsData.length && !technologies.length && !certifications.length) {
    return null;
  }

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

        <div className="space-y-12">
          {/* Skills and Technology Stack in one row on xl */}
          {(skillsData.length > 0 || technologies.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
              {/* Skills with progress bars */}
              {skillsData.length > 0 && (
                <div className="skill-section">
                  <h3 className="text-xl font-semibold mb-6">Core Skills</h3>
                  <div>
                    {skillsData.map((skill, index) => (
                      <SkillBar
                        key={skill._id || index}
                        name={skill.name}
                        level={skill.level}
                        iconType={skill.iconType}
                        icon={skill.icon}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Technology Stack */}
              {technologies.length > 0 && (
                <div className="skill-section">
                  <h3 className="text-xl font-semibold mb-6">Technology Stack</h3>
                  <div className="flex flex-wrap gap-3">
                    {technologies.map((tech, index) => (
                      <div
                        key={tech._id || index}
                        className="flex items-center gap-2 px-3 py-2 bg-white rounded-full text-sm font-medium border border-gray-200 hover:border-gray-400 transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="text-gray-700">
                          {renderIcon(tech.iconType, tech.iconName, 16)}
                        </div>
                        <span>{tech.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Certifications on new line */}
          {certifications.length > 0 && (
            <div className="skill-section">
              <h3 className="text-xl font-semibold mb-6">Certifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {certifications.map((cert, index) => (
                  <a
                    key={cert._id || index}
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card
                      variant="bordered"
                      className="p-4 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-gray-900 text-lg">
                          {renderIcon(cert.iconType, cert.iconName)}
                        </div>
                        <h4 className="font-medium text-gray-900">{cert.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{cert.issuer}</p>
                      <p className="text-xs text-gray-500 mt-1">{cert.date}</p>
                    </Card>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
