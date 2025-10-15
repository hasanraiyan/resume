// ========================================
// 📦 CENTRALIZED PROJECT DATABASE
// Backend-ready structure
// ========================================

export const projectsData = {
  // Available categories for filtering
  categories: [
    { id: 'all', name: 'All Projects', count: 8 },
    { id: 'e-commerce', name: 'E-Commerce', count: 1 },
    { id: 'portfolio', name: 'Portfolio', count: 1 },
    { id: 'saas', name: 'SaaS', count: 3 },
    { id: 'mobile', name: 'Mobile', count: 2 },
    { id: 'web-app', name: 'Web App', count: 1 },
    { id: 'education', name: 'Education', count: 1 },
  ],

  // Available tech tags for filtering
  techTags: [
    'React',
    'Next.js',
    'Vue.js',
    'Angular',
    'React Native',
    'Flutter',
    'Node.js',
    'Django',
    'GraphQL',
    'GSAP',
    'Three.js',
    'Framer Motion',
    'D3.js',
    'Tailwind CSS',
    'TypeScript',
    'MongoDB',
    'PostgreSQL',
    'Firebase',
    'AWS',
    'Shopify',
    'Stripe',
  ],
};

export default projectsData;
