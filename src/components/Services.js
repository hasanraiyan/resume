'use client';

import { useEffect, useRef } from 'react';
import { Section, Card } from '@/components/custom-ui';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRole } from '@/context/RoleContext';
import { useLoadingStatus } from '@/context/LoadingContext';

export default function Services({ services = [], section = {} }) {
  const cardsRef = useRef(null);
  const { registerComponent, markComponentAsLoaded } = useLoadingStatus();
  const { isBusiness } = useRole();

  useEffect(() => {
    registerComponent('Services');
    markComponentAsLoaded('Services');
  }, [registerComponent, markComponentAsLoaded]);

  // Business owner: show outcome-focused services
  const businessServices = [
    {
      _id: 'biz-svc-1',
      icon: 'fas fa-laptop-code',
      title: 'Web Application Development',
      description:
        'Custom web apps, SaaS platforms, and dashboards built with React, Next.js, and Node.js. Fast, SEO-friendly, scalable.',
    },
    {
      _id: 'biz-svc-2',
      icon: 'fas fa-mobile-alt',
      title: 'Mobile App Development',
      description:
        'Cross-platform Android & iOS apps with React Native. Native performance, rapid development, smooth backend integration.',
    },
    {
      _id: 'biz-svc-3',
      icon: 'fas fa-robot',
      title: 'AI & Chatbot Integration',
      description:
        'LLM-powered chatbots, AI automation, intelligent document processing, and custom AI solutions for your business workflows.',
    },
    {
      _id: 'biz-svc-4',
      icon: 'fas fa-cloud-upload-alt',
      title: 'Cloud & API Development',
      description:
        'Scalable backend APIs, cloud deployment on AWS/Vercel, database architecture, and third-party integrations.',
    },
    {
      _id: 'biz-svc-5',
      icon: 'fas fa-lightbulb',
      title: 'MVP & Prototyping',
      description:
        'Take your idea from concept to working prototype fast. Validate your business idea with a functional MVP in weeks, not months.',
    },
    {
      _id: 'biz-svc-6',
      icon: 'fas fa-sync-alt',
      title: 'Maintenance & Optimization',
      description:
        'Ongoing support, performance optimization, feature updates, and security patches to keep your digital products running smoothly.',
    },
  ];

  const displayServices = isBusiness ? businessServices : services;

  if (!displayServices || displayServices.length === 0) {
    return null;
  }

  return (
    <Section
      id="services"
      title={section.title || (isBusiness ? 'How I Can Help Your Business' : 'My Services')}
      description={
        section.description ||
        (isBusiness
          ? 'Practical solutions that solve real business problems'
          : 'Specialized solutions for your digital needs')
      }
      centered={true}
      className="bg-white"
    >
      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayServices.map((service) => (
          <Card
            key={service._id}
            variant="bordered"
            interactive={true}
            className={`p-8 text-center service-card transition-transform hover:-translate-y-2 hover:shadow-lg ${isBusiness ? 'hover:border-emerald-300' : ''}`}
          >
            <div className={`text-4xl mb-4 ${isBusiness ? 'text-emerald-600' : 'text-black'}`}>
              <i className={service.icon}></i>
            </div>
            <h3 className="text-xl font-bold mb-2">{service.title}</h3>
            <p className="text-neutral-600 text-justify">{service.description}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
