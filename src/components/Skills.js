/** @fileoverview Skills & Expertise section component with interactive skill bars, technology stack, and certifications. */

'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Card } from '@/components/ui';
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
 * @returns {JSX.Element} The Skills section JSX element.
 */
export default function Skills() {
  const sectionRef = useRef();

  // Static data
  const skillsData = [
    { name: 'JavaScript', iconType: 'fa', iconName: 'faCode' },
    { name: 'TypeScript', iconType: 'fa', iconName: 'faCode' },
    { name: 'React', iconType: 'fa', iconName: 'faReact' },
    { name: 'React Native', iconType: 'fa', iconName: 'faReact' },
    { name: 'Node.js', iconType: 'fa', iconName: 'faNodeJs' },
    { name: 'Express.js', iconType: 'fa', iconName: 'faServer' },
    { name: 'Next.js', iconType: 'lucide', iconName: 'Server' },
    { name: 'MongoDB', iconType: 'fa', iconName: 'faMdb' },
    { name: 'Expo', iconType: 'lucide', iconName: 'Code' },
  ];
  const technologies = [
    { name: 'Python', iconType: 'fa', iconName: 'faPython' },
    { name: 'Git', iconType: 'fa', iconName: 'faGitAlt' },
    { name: 'Vercel', iconType: 'lucide', iconName: 'Server' },
    { name: 'Tailwind CSS', iconType: 'fa', iconName: 'faCss3' },
    { name: 'LLM', iconType: 'lucide', iconName: 'Code' },
    { name: 'MERN Stack', iconType: 'lucide', iconName: 'Code' },
    { name: 'OpenAI', iconType: 'lucide', iconName: 'Code' },
    { name: 'Gemini', iconType: 'lucide', iconName: 'Code' },
    { name: 'Generative AI', iconType: 'lucide', iconName: 'Code' },
    { name: 'React Query', iconType: 'lucide', iconName: 'Zap' },
    { name: 'Framer Motion', iconType: 'lucide', iconName: 'Layers' },
    { name: 'Firebase', iconType: 'fa', iconName: 'faServer' },
    // { name: 'GraphQL', iconType: 'lucide', iconName: 'Code' },
    // { name: 'Prisma', iconType: 'fa', iconName: 'faDatabase' },
    // { name: 'CI/CD', iconType: 'lucide', iconName: 'Settings' },
    // { name: 'Sentry', iconType: 'lucide', iconName: 'Code' },
    { name: 'Supabase', iconType: 'fa', iconName: 'faDatabase' },
  ];
  const certifications = [
    {
      name: 'Programming Essentials in Python',
      issuer: 'Cisco Networking Academy',
      date: '2024',
      iconType: 'fa',
      iconName: 'faPython',
      url: 'https://www.linkedin.com/in/hasanraiyan/details/certifications/1722432407762/single-media-viewer/?type=DOCUMENT&profileId=ACoAAEcTpDkBEHLR25S1YoTbGMRi5VN6VjEQktU',
    },
    {
      name: 'Solutions Arch. Job Simulation',
      issuer: 'Forage',
      date: 'Sep 2025',
      iconType: 'fa',
      iconName: 'faAws',
      url: 'https://www.theforage.com/completion-certificates/pmnMSL4QiQ9JCgE3W/kkE9HyeNcw6rwCRGw_pmnMSL4QiQ9JCgE3W_ZmrAkWpQ7BESxJBFN_1758676838457_completion_certificate.pdf',
    },
    {
      name: 'Introduction to Cybersecurity',
      issuer: 'Cisco Networking Academy',
      date: '2024',
      iconType: 'fa',
      iconName: 'faShieldAlt',
      url: 'https://www.linkedin.com/in/hasanraiyan/details/certifications/1722432567935/single-media-viewer/?type=DOCUMENT&profileId=ACoAAEcTpDkBEHLR25S1YoTbGMRi5VN6VjEQktU&lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_certifications_details%3BQYndfy81Q2GXd9wGDpDXhA%3D%3D',
    },
    {
      name: 'Python (Basic)',
      issuer: 'HackerRank',
      date: '2024',
      iconType: 'fa',
      iconName: 'faPython',
      url: 'https://www.hackerrank.com/certificates/bb25b2ccfbf1',
    },
    {
      name: 'SQL (Basic)',
      issuer: 'HackerRank',
      date: '2024',
      iconType: 'fa',
      iconName: 'faDatabase',
      url: 'https://www.hackerrank.com/certificates/96328a48b49a',
    },
  ];

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

  if (!skillsData.length && !technologies.length && !certifications.length) {
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
              {/* Skills */}
              {skillsData.length > 0 && (
                <div className="skill-section">
                  <h3 className="text-xl font-semibold mb-6">Core Skills</h3>
                  <div className="flex flex-wrap gap-3">
                    {skillsData.map((skill, index) => (
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
