'use client';

import { useEffect, useMemo, useState } from 'react';
import ClientMarquee from './ClientMarquee';
import About from '@/components/About';
import Skills from '@/components/Skills';
import Achievements from '@/components/Achievements';
import Services from '@/components/Services';
import FeaturedWorks from '@/components/FeaturedWorks';
import Stats from '@/components/Stats';
import Testimonials from '@/components/Testimonials';
import Contact from '@/components/Contact';
import { getHomepagePersona, PERSONA_KEYS } from '@/config/homepagePersonas';
import PersonaHero from './PersonaHero';
import AudienceProofBar from './AudienceProofBar';
import ProcessSection from './ProcessSection';
import FAQSection from './FAQSection';
import LatestArticles from './LatestArticles';
import PersonaFinalCTA from './PersonaFinalCTA';

const STORAGE_KEY = 'homepage-persona-view';

export default function PersonaAwareHome({
  heroData,
  aboutData,
  technologies,
  certifications,
  achievementsData,
  services,
  serviceSectionData,
  featuredProjects,
  projectSection,
  statsData,
  testimonialsData,
  contactConfig,
  latestArticles,
  skillsSectionData,
}) {
  const [activePersona, setActivePersona] = useState(PERSONA_KEYS.business);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const hash = window.location.hash.replace('#', '');
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const requested = [view, hash, stored].find((value) =>
      [PERSONA_KEYS.business, PERSONA_KEYS.developer].includes(value)
    );

    if (requested) {
      setActivePersona(requested);
    }
  }, []);

  const persona = useMemo(() => getHomepagePersona(activePersona), [activePersona]);

  const handlePersonaChange = (nextPersona) => {
    setActivePersona(nextPersona);
    window.localStorage.setItem(STORAGE_KEY, nextPersona);

    const url = new URL(window.location.href);
    url.searchParams.set('view', nextPersona);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <main>
      <PersonaHero
        persona={persona}
        heroData={heroData}
        activePersona={activePersona}
        onPersonaChange={handlePersonaChange}
      />
      <AudienceProofBar persona={persona} />
      <ClientMarquee services={services} />

      {activePersona === PERSONA_KEYS.business ? (
        <>
          <Services services={services} section={serviceSectionData || {}} />
          <FeaturedWorks featuredProjects={featuredProjects} section={projectSection || {}} />
          <div style={{ overflow: 'hidden', width: '100%' }}>
            <Stats statsData={statsData} />
          </div>
          <Testimonials
            testimonials={testimonialsData?.testimonials || []}
            section={testimonialsData?.section || {}}
          />
          <ProcessSection persona={persona} />
          <FAQSection faq={persona.faq} />
          <About aboutData={aboutData} />
        </>
      ) : (
        <>
          <Skills
            technologies={technologies}
            certifications={certifications}
            section={skillsSectionData || {}}
          />
          <FeaturedWorks featuredProjects={featuredProjects} section={projectSection || {}} />
          <LatestArticles articles={latestArticles} />
          <Achievements
            achievements={achievementsData?.achievements || []}
            certifications={achievementsData?.certifications || []}
            section={achievementsData?.section || {}}
          />
          <ProcessSection persona={persona} />
          <Services services={services} section={serviceSectionData || {}} />
          <About aboutData={aboutData} />
        </>
      )}

      <PersonaFinalCTA persona={persona} />
      <Contact config={contactConfig} />
    </main>
  );
}
