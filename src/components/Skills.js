/** @fileoverview Skills & Expertise section component with interactive skill bars, technology stack, and certifications. */

'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Card, Section } from '@/components/custom-ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faReact,
  faNodeJs,
  faDocker,
  faAws,
  faMdb,
  faGitAlt,
  faCss3,
  faPython,
} from '@fortawesome/free-brands-svg-icons';
import { faCode, faDatabase, faServer, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { Database, Code, Server, Zap, Settings, Layers } from 'lucide-react';
import { useLoadingStatus } from '@/context/LoadingContext';

/** Icon mappings for dynamic rendering */
const faIcons = {
  faReact,
  faNodeJs,
  faDocker,
  faAws,
  faMdb,
  faGitAlt,
  faCode,
  faCss3,
  faDatabase,
  faServer,
  faPython,
  faShieldAlt,
};

const lucideIcons = {
  Database,
  Code,
  Server,
  Zap,
  Settings,
  Layers,
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

/**
 * Skills component displaying core skills, technology stack, and certifications with animations.
 * @param {Object} props - Component props
 * @param {Array} props.technologies - Array of technology objects from CMS
 * @param {Array} props.certifications - Array of certification objects from CMS
 * @returns {JSX.Element} The Skills section JSX element.
 */
export default function Skills({ technologies = [], certifications = [], section = {} }) {
  const { registerComponent, markComponentAsLoaded } = useLoadingStatus();

  useEffect(() => {
    registerComponent('Skills');
    markComponentAsLoaded('Skills');
  }, [registerComponent, markComponentAsLoaded]);

  // Split technologies into categories if necessary, or just use as is.
  // The seeding script put the first 9 into 'skills' (0-8) and the rest into 'technologies' (9+).
  const coreSkills = technologies.filter((t) => t.displayOrder < 9);
  const techStack = technologies.filter((t) => t.displayOrder >= 9);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const timer = setTimeout(() => {
      try {
        const container = document.querySelector('#skills-section');
        if (container) {
          const contents = container.querySelectorAll('.animate-on-scroll');
          gsap.from(contents, {
            opacity: 0,
            y: 30,
            duration: 0.8,
            stagger: 0.2,
            scrollTrigger: {
              trigger: '#skills-section',
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          });
        }
      } catch (error) {
        console.warn('GSAP animation error in Skills:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!coreSkills.length && !techStack.length && !certifications.length) {
    return null;
  }

  return (
    <Section
      id="skills"
      title={section.title || 'Technical Skills'}
      description={
        section.description || 'The technology stack and tools I use to bring ideas to life'
      }
      centered={true}
      className="bg-neutral-50"
    >
      <div className="space-y-12">
        {/* Skills and Technology Stack in one row on xl */}
        {(coreSkills.length > 0 || techStack.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
            {/* Skills */}
            {coreSkills.length > 0 && (
              <div className="skill-section">
                <h3 className="text-xl font-semibold mb-6">Core Skills</h3>
                <div className="flex flex-wrap gap-3">
                  {coreSkills.map((skill, index) => (
                    <div
                      key={skill._id || index}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-full text-sm font-medium border border-gray-200 hover:border-gray-400 transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="text-gray-700">
                        {renderIcon(skill.iconType, skill.iconName, 16)}
                      </div>
                      <span>{skill.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technology Stack */}
            {techStack.length > 0 && (
              <div className="skill-section">
                <h3 className="text-xl font-semibold mb-6">Technology Stack</h3>
                <div className="flex flex-wrap gap-3">
                  {techStack.map((tech, index) => (
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
    </Section>
  );
}
