/** @fileoverview Timeline component displaying product development roadmap with status indicators and animations. */

'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  CheckCircle,
  Clock,
  Calendar,
  Users,
  Mail,
  DollarSign,
  Cog,
  FileText,
  Camera,
  Search,
  Zap,
  Award,
} from 'lucide-react';

// Static timeline data
const timelineData = [
  {
    id: 1,
    date: 'Nov 2024',
    title: 'Skills & Expertise Section',
    description:
      'Implemented interactive skill bars, certifications display, and comprehensive technology stack showcase with smooth animations.',
    status: 'completed',
    icon: CheckCircle,
    subFeatures: [
      'Interactive skill bars with GSAP animations',
      'Certifications display with external links',
      'Technology stack with categorized icons',
      'Responsive design for all devices',
    ],
  },
  {
    id: 2,
    date: 'Dec 2024',
    title: 'Client Testimonials Section',
    description:
      'Building testimonials component with client photos, star ratings, company affiliations, and admin management interface for social proof.',
    status: 'in-progress',
    icon: Users,
    subFeatures: [
      'Client photo integration',
      'Star rating system',
      'Company and role display',
      'Admin testimonial management',
      'Social proof badges',
    ],
  },
  {
    id: 3,
    date: 'Jan 2025',
    title: 'Newsletter Signup System',
    description:
      'Implement email validation, GDPR-compliant consent, success/error states, and integration with email marketing service.',
    status: 'upcoming',
    icon: Mail,
    subFeatures: [
      'Real-time email validation',
      'GDPR consent checkbox',
      'Success/error state handling',
      'Email service integration',
      'Subscription management',
    ],
  },
  {
    id: 4,
    date: 'Feb 2025',
    title: 'Pricing Packages Section',
    description:
      'Create service packages with 3-4 pricing tiers, feature comparisons, call-to-action buttons, and admin management.',
    status: 'upcoming',
    icon: DollarSign,
    subFeatures: [
      '3-4 pricing tier options',
      'Feature comparison table',
      'Call-to-action integration',
      'Admin pricing management',
      'Payment gateway setup',
    ],
  },
  {
    id: 5,
    date: 'Mar 2025',
    title: 'Process Explanation Section',
    description:
      'Build "How I Work" section with 4-6 step development process visualization, timeline indicators, and process illustrations.',
    status: 'upcoming',
    icon: Cog,
    subFeatures: [
      '4-6 step process visualization',
      'Timeline/progress indicators',
      'Custom process illustrations',
      'Interactive step navigation',
      'Process customization options',
    ],
  },
  {
    id: 6,
    date: 'Apr 2025',
    title: 'Enhanced Project Case Studies',
    description:
      'Add detailed case studies with problem statements, solutions, technical challenges, metrics, and before/after comparisons.',
    status: 'upcoming',
    icon: FileText,
  },
  {
    id: 7,
    date: 'May 2025',
    title: 'Professional Headshot Integration',
    description:
      'Add high-quality professional headshot to About section with image optimization and responsive design.',
    status: 'upcoming',
    icon: Camera,
  },
  {
    id: 8,
    date: 'Jun 2025',
    title: 'SEO Optimization & Meta Tags',
    description:
      'Implement comprehensive SEO with dynamic meta tags, Open Graph, Twitter cards, and JSON-LD structured data.',
    status: 'upcoming',
    icon: Search,
  },
  {
    id: 9,
    date: 'Jul 2025',
    title: 'Performance Optimization',
    description:
      'Implement WebP/AVIF images, lazy loading, Core Web Vitals optimization, and performance monitoring.',
    status: 'upcoming',
    icon: Zap,
  },
  {
    id: 10,
    date: 'Aug 2025',
    title: 'Social Proof Elements',
    description:
      'Add client logos, technology certifications, industry badges, and credibility indicators throughout the site.',
    status: 'upcoming',
    icon: Award,
  },
];

/**
 * Timeline component displaying development roadmap
 * @returns {JSX.Element} The timeline JSX element
 */
export default function Timeline() {
  const timelineRef = useRef();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const timeline = timelineRef.current;
    if (!timeline) return;

    gsap.from(timeline.querySelectorAll('.timeline-item'), {
      opacity: 0,
      x: -50,
      duration: 0.8,
      stagger: 0.2,
      scrollTrigger: {
        trigger: timeline,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
  }, []);

  /**
   * Get status styling for timeline item
   * @param {string} status - The status of the item
   * @returns {object} Styling object with bg and border classes
   */
  const getStatusStyling = (status) => {
    switch (status) {
      case 'completed':
        return { bg: 'bg-black', border: '', iconColor: 'text-white' };
      case 'in-progress':
        return { bg: 'bg-white', border: 'border-2 border-black', iconColor: 'text-black' };
      case 'upcoming':
        return {
          bg: 'bg-gray-100',
          border: 'border-2 border-gray-400',
          iconColor: 'text-gray-600',
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-2 border-gray-400',
          iconColor: 'text-gray-600',
        };
    }
  };

  /**
   * Get status text
   * @param {string} status - The status of the item
   * @returns {string} Status text
   */
  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'upcoming':
        return 'Upcoming';
      default:
        return 'Unknown';
    }
  };

  return (
    <div ref={timelineRef} className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-black"></div>

      <div className="space-y-12">
        {timelineData.map((item, index) => {
          const IconComponent = item.icon;
          const styling = getStatusStyling(item.status);
          return (
            <div key={item.id} className="timeline-item relative flex items-start">
              {/* Timeline dot */}
              <div
                className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full ${styling.bg} ${styling.border} flex items-center justify-center shadow-lg`}
              >
                <IconComponent className={`w-8 h-8 ${styling.iconColor}`} />
              </div>

              {/* Content */}
              <div className="ml-8 flex-1 bg-white rounded-lg shadow-md p-6 border-l-4 border-black">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                  <div className="flex items-center gap-3 mt-2 sm:mt-0">
                    <span className="text-sm font-medium text-gray-500">{item.date}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'completed'
                          ? 'bg-black text-white'
                          : item.status === 'in-progress'
                            ? 'bg-white border border-black text-black'
                            : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {getStatusText(item.status)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
                {item.subFeatures && item.subFeatures.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {item.subFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-black mt-1">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
