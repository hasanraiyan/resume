export const PERSONA_KEYS = {
  business: 'business',
  developer: 'developer',
};

export const homepagePersonas = {
  business: {
    key: PERSONA_KEYS.business,
    label: 'Business Owner',
    shortLabel: 'Business',
    eyebrow: 'For business owners',
    switchQuestion: 'I am a...',
    hero: {
      badge: 'FOR BUSINESS OWNERS',
      title: {
        line1: 'Websites and apps',
        line2: 'built to',
        line3: 'grow your business',
      },
      description:
        'I design and build fast, reliable digital products for founders, local businesses, and growing teams — from high-converting landing pages to full-stack web apps.',
      primaryCta: { text: 'Start a Project', href: '#contact' },
      secondaryCta: { text: 'See Client Work', href: '#work' },
    },
    proofPoints: [
      {
        title: 'Launch-ready builds',
        description: 'Production-focused websites and apps that are ready for real users.',
        icon: 'fas fa-rocket',
      },
      {
        title: 'Clear communication',
        description: 'Simple updates, practical planning, and no unnecessary technical confusion.',
        icon: 'fas fa-comments',
      },
      {
        title: 'Conversion-focused UX',
        description: 'Pages structured to guide visitors toward enquiries, bookings, and sales.',
        icon: 'fas fa-chart-line',
      },
      {
        title: 'Support after launch',
        description: 'Help with improvements, fixes, integrations, and ongoing product iteration.',
        icon: 'fas fa-handshake',
      },
    ],
    process: {
      title: 'A clear path from idea to launch',
      description: 'A simple business-friendly workflow so you always know what is happening next.',
      steps: [
        {
          title: 'Discover',
          description:
            'We define your goal, audience, content, must-have features, and success metrics.',
        },
        {
          title: 'Plan',
          description:
            'You get a practical roadmap with scope, priorities, timeline, and launch path.',
        },
        {
          title: 'Build',
          description:
            'I design and develop the product with regular updates and review checkpoints.',
        },
        {
          title: 'Launch',
          description:
            'The site or app goes live with performance, responsiveness, and SEO basics handled.',
        },
        {
          title: 'Improve',
          description:
            'We refine based on feedback, analytics, user needs, and future business goals.',
        },
      ],
    },
    faq: {
      title: 'Questions business owners usually ask',
      description: 'Quick answers before we start a project conversation.',
      items: [
        {
          question: 'Can you build a full website for my business?',
          answer:
            'Yes. I can help with landing pages, portfolio sites, business websites, dashboards, booking flows, and custom web apps.',
        },
        {
          question: 'Will you help after launch?',
          answer:
            'Yes. I can support improvements, bug fixes, small feature additions, content updates, and technical maintenance.',
        },
        {
          question: 'Can you work with an existing website or idea?',
          answer:
            'Yes. I can redesign an existing website, improve performance, add new features, or turn a rough idea into a clear product plan.',
        },
        {
          question: 'What should I send before contacting you?',
          answer:
            'Share your business goal, examples you like, your ideal timeline, and what you want visitors or users to do.',
        },
      ],
    },
    finalCta: {
      eyebrow: 'Ready to build?',
      title: 'Tell me what your business needs next.',
      description:
        'Send the idea, the problem, or the current website. I will help turn it into a clear build plan.',
      primaryCta: { text: 'Start the Conversation', href: '#contact' },
      secondaryCta: { text: 'View Projects First', href: '#work' },
    },
  },
  developer: {
    key: PERSONA_KEYS.developer,
    label: 'Developer',
    shortLabel: 'Developer',
    eyebrow: 'For developers',
    switchQuestion: 'I am a...',
    hero: {
      badge: 'FOR DEVELOPERS',
      title: {
        line1: 'Full-stack builds,',
        line2: 'AI tools,',
        line3: 'and clean DX',
      },
      description:
        'Explore my projects, stack, technical writing, experiments, and the systems behind my work — from Next.js apps to AI-assisted tooling.',
      primaryCta: { text: 'Explore Projects', href: '/projects' },
      secondaryCta: { text: 'Read Technical Posts', href: '/blog' },
    },
    proofPoints: [
      {
        title: 'Modern full-stack systems',
        description: 'Next.js, React, MongoDB, APIs, auth, dashboards, and production workflows.',
        icon: 'fas fa-layer-group',
      },
      {
        title: 'Component architecture',
        description:
          'Reusable UI, clear data flow, maintainable patterns, and CMS-ready structures.',
        icon: 'fas fa-cubes',
      },
      {
        title: 'AI/tooling experiments',
        description:
          'Practical experiments with agents, search, automation, and developer workflows.',
        icon: 'fas fa-wand-magic-sparkles',
      },
      {
        title: 'Documented thinking',
        description: 'Technical notes, articles, and breakdowns that explain how things are built.',
        icon: 'fas fa-file-code',
      },
    ],
    process: {
      title: 'How I approach technical builds',
      description: 'A developer-friendly view of my implementation workflow.',
      steps: [
        {
          title: 'Requirements',
          description: 'Clarify product goals, user flows, constraints, APIs, and technical risks.',
        },
        {
          title: 'Architecture',
          description:
            'Choose data models, component boundaries, server/client responsibilities, and integrations.',
        },
        {
          title: 'Implementation',
          description:
            'Build iteratively with reusable components, clear actions, and production-minded defaults.',
        },
        {
          title: 'Review',
          description: 'Check UX, responsiveness, performance, error states, and maintainability.',
        },
        {
          title: 'Iterate',
          description:
            'Refine based on real usage, feedback, analytics, and new technical requirements.',
        },
      ],
    },
    finalCta: {
      eyebrow: 'Want to collaborate?',
      title: 'Let’s talk code, architecture, or product ideas.',
      description:
        'If you are building something technical, exploring AI workflows, or need another full-stack perspective, reach out.',
      primaryCta: { text: 'Contact Me', href: '#contact' },
      secondaryCta: { text: 'Open Projects', href: '/projects' },
    },
  },
};

export const getHomepagePersona = (key) => homepagePersonas[key] || homepagePersonas.business;
