'use client';

import { useEffect, useRef } from 'react';
import { Section, Card } from '@/components/ui';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function Services({ services }) {
  const cardsRef = useRef(null);

  useEffect(() => {
    if (!services || services.length === 0) return;

    gsap.registerPlugin(ScrollTrigger);

    // Get all .service-card inside the container after DOM updates
    const cards = cardsRef.current.querySelectorAll('.service-card');

    gsap.from(cards, {
      opacity: 0,
      y: 50,
      duration: 0.8,
      stagger: 0.2,
      scrollTrigger: {
        trigger: '#services-section',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });

    // Cleanup GSAP/ScrollTrigger on unmount
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      gsap.killTweensOf(cards);
    };
  }, [services]); // update animations if services change

  if (!services || services.length === 0) {
    return null;
  }

  return (
    <Section
      id="services-section"
      title="What I Do"
      description="Crafting digital solutions from concept to deployment."
      centered
      className="bg-white"
    >
      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <Card
            key={service._id}
            variant="bordered"
            interactive={true}
            className="p-8 text-center service-card transition-transform hover:-translate-y-2 hover:shadow-lg"
          >
            <div className="text-4xl text-black mb-4">
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
