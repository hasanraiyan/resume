// ========================================
// 📦 CENTRALIZED PROJECT DATABASE
// Backend-ready structure
// ========================================

export const projectsData = {
    // All projects with full details
    projects: [
        {
            id: 1,
            slug: 'luxury-fashion-store',
            featured: true, // Show on homepage

            // Basic Info
            projectNumber: '01',
            category: 'e-commerce',
            title: 'Luxury Fashion Store',
            tagline: 'Premium Shopping Experience',

            // Short description (for cards/homepage)
            description: 'A sophisticated e-commerce platform for a luxury fashion brand, featuring immersive product galleries, seamless checkout experience, and advanced filtering systems.',

            // Full description (for detail page)
            fullDescription: `
          The platform features stunning product galleries, personalized recommendations, and a seamless checkout process.
          
          The project required careful attention to performance optimization while maintaining beautiful visuals and animations.
        `,

            // Images
            thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&crop=center',
            images: [
                {
                    id: 1,
                    url: 'https://picsum.photos/1200/800?random=20',
                    alt: 'Fashion Store Homepage',
                    caption: 'Homepage with hero section'
                },
                {
                    id: 2,
                    url: 'https://picsum.photos/1200/800?random=21',
                    alt: 'Product Listing',
                    caption: 'Product grid with filters'
                },
                {
                    id: 3,
                    url: 'https://picsum.photos/1200/800?random=22',
                    alt: 'Product Detail',
                    caption: 'Product detail page'
                },
                {
                    id: 4,
                    url: 'https://picsum.photos/1200/800?random=23',
                    alt: 'Shopping Cart',
                    caption: 'Cart and checkout flow'
                }
            ],

            // Tech Stack
            tags: [
                { id: 1, name: 'React', category: 'frontend' },
                { id: 2, name: 'Shopify', category: 'platform' },
                { id: 3, name: 'GSAP', category: 'animation' },
                { id: 4, name: 'Tailwind CSS', category: 'styling' }
            ],

            // Links
            links: {
                live: 'https://example.com',
                github: 'https://github.com/yourusername/project',
                // case_study: '/projects/luxury-fashion-store' // Auto-generated from slug
            },

            // Case Study Details
            details: {
                client: 'Luxury Fashion Brand',
                year: '2024',
                duration: '3 months',
                role: 'Lead Developer & Designer',

                challenge: 'Create a high-performance e-commerce platform that maintains luxury brand aesthetics while providing smooth user experience across all devices.',

                solution: 'Implemented advanced lazy loading, optimized images with next-gen formats, and created custom animations that enhance rather than hinder performance.',

                results: [
                    '45% increase in conversion rate',
                    '60% faster page load times',
                    '3x increase in mobile transactions',
                    '92% customer satisfaction score'
                ]
            },

            // Related project IDs
            relatedProjects: [2, 3]
        },

        {
            id: 2,
            slug: 'creative-agency-site',
            featured: true,

            projectNumber: '02',
            category: 'portfolio',
            title: 'Creative Agency Site',
            tagline: 'Bold & Dynamic Web Presence',

            description: 'A bold and dynamic website for a creative agency, showcasing their portfolio with stunning animations and interactive elements that engage visitors.',

            fullDescription: `
          A cutting-edge portfolio website for a creative agency that pushes the boundaries of web design.
          Features include 3D elements, scroll-triggered animations, and an immersive project showcase.
          
          Built with performance in mind, the site maintains 90+ Lighthouse scores despite heavy animations.
        `,

            thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center',
            images: [
                {
                    id: 1,
                    url: 'https://picsum.photos/1200/800?random=24',
                    alt: 'Agency Homepage',
                    caption: 'Hero with 3D elements'
                },
                {
                    id: 2,
                    url: 'https://picsum.photos/1200/800?random=25',
                    alt: 'Portfolio Grid',
                    caption: 'Interactive project grid'
                },
                {
                    id: 3,
                    url: 'https://picsum.photos/1200/800?random=26',
                    alt: 'Team Section',
                    caption: 'Meet the team'
                }
            ],

            tags: [
                { id: 1, name: 'Next.js', category: 'frontend' },
                { id: 2, name: 'Three.js', category: 'animation' },
                { id: 3, name: 'Framer Motion', category: 'animation' },
                { id: 4, name: 'TypeScript', category: 'language' }
            ],

            links: {
                live: 'https://example.com',
                github: 'https://github.com/yourusername/project'
            },

            details: {
                client: 'Creative Agency Co.',
                year: '2024',
                duration: '2 months',
                role: 'Full Stack Developer',

                challenge: 'Balance heavy animations and 3D elements with performance requirements while maintaining cross-browser compatibility.',

                solution: 'Progressive enhancement approach with fallbacks, code-splitting, and optimized asset delivery.',

                results: [
                    '200% increase in visitor engagement',
                    'Featured on Awwwards',
                    '95+ Lighthouse performance score',
                    '40% increase in client inquiries'
                ]
            },

            relatedProjects: [1, 4]
        },

        {
            id: 3,
            slug: 'analytics-dashboard',
            featured: true,

            projectNumber: '03',
            category: 'saas',
            title: 'Analytics Dashboard',
            tagline: 'Data Visualization Platform',

            description: 'A comprehensive analytics platform with real-time data visualization, customizable dashboards, and powerful reporting tools for business intelligence.',

            fullDescription: `
          An enterprise-grade analytics dashboard that processes millions of data points in real-time.
          Features include customizable widgets, advanced filtering, export capabilities, and role-based access control.
          
          The platform integrates with multiple data sources and provides actionable insights through interactive visualizations.
        `,

            thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center',
            images: [
                {
                    id: 1,
                    url: 'https://picsum.photos/1200/800?random=27',
                    alt: 'Dashboard Overview',
                    caption: 'Main dashboard view'
                },
                {
                    id: 2,
                    url: 'https://picsum.photos/1200/800?random=28',
                    alt: 'Data Visualization',
                    caption: 'Interactive charts'
                },
                {
                    id: 3,
                    url: 'https://picsum.photos/1200/800?random=29',
                    alt: 'Reports',
                    caption: 'Custom report builder'
                }
            ],

            tags: [
                { id: 1, name: 'Vue.js', category: 'frontend' },
                { id: 2, name: 'D3.js', category: 'visualization' },
                { id: 3, name: 'Node.js', category: 'backend' },
                { id: 4, name: 'PostgreSQL', category: 'database' }
            ],

            links: {
                live: 'https://example.com',
                github: null // Private repo
            },

            details: {
                client: 'SaaS Startup',
                year: '2023',
                duration: '6 months',
                role: 'Senior Full Stack Developer',

                challenge: 'Handle real-time data updates for thousands of concurrent users while maintaining responsive UI and accurate visualizations.',

                solution: 'Implemented WebSocket connections, data aggregation layers, and optimized rendering with virtual scrolling.',

                results: [
                    'Handles 10K+ concurrent users',
                    '99.9% uptime',
                    'Sub-second query response times',
                    '$2M ARR within first year'
                ]
            },

            relatedProjects: [5, 6]
        },

        // Additional non-featured projects
        {
            id: 4,
            slug: 'restaurant-booking-app',
            featured: false,

            projectNumber: '04',
            category: 'mobile',
            title: 'Restaurant Booking App',
            tagline: 'Seamless Dining Reservations',

            description: 'Mobile-first restaurant reservation platform with real-time availability, menu browsing, and integrated payment system.',
            fullDescription: `
          A comprehensive booking solution for restaurants that streamlines the reservation process.
          Features include real-time table availability, waitlist management, and customer preferences tracking.
        `,

            thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&crop=center',
            images: [
                {
                    id: 1,
                    url: 'https://picsum.photos/1200/800?random=30',
                    alt: 'App Interface',
                    caption: 'Mobile app screens'
                }
            ],

            tags: [
                { id: 1, name: 'React Native', category: 'frontend' },
                { id: 2, name: 'Firebase', category: 'backend' },
                { id: 3, name: 'Stripe', category: 'payment' }
            ],

            links: {
                live: 'https://example.com',
                github: 'https://github.com/yourusername/project'
            },

            details: {
                client: 'Restaurant Chain',
                year: '2023',
                duration: '4 months',
                role: 'Mobile Developer',

                challenge: 'Create intuitive booking flow that works offline and syncs when connection is restored.',

                solution: 'Implemented offline-first architecture with conflict resolution and optimistic updates.',

                results: [
                    '80% reduction in no-shows',
                    '50K+ active users',
                    '4.8★ app store rating',
                    '30% increase in bookings'
                ]
            },

            relatedProjects: [1]
        },

        {
            id: 5,
            slug: 'real-estate-platform',
            featured: false,

            projectNumber: '05',
            category: 'web-app',
            title: 'Real Estate Platform',
            tagline: 'Property Discovery Made Easy',

            description: 'Full-featured real estate marketplace with advanced search, virtual tours, and mortgage calculator integration.',

            fullDescription: `
          A modern real estate platform that connects buyers, sellers, and agents.
          Features include map-based search, 3D virtual tours, and comprehensive property management tools.
        `,

            thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&crop=center',
            images: [
                {
                    id: 1,
                    url: 'https://picsum.photos/1200/800?random=31',
                    alt: 'Platform Interface',
                    caption: 'Property listings'
                }
            ],

            tags: [
                { id: 1, name: 'Angular', category: 'frontend' },
                { id: 2, name: 'Google Maps', category: 'integration' },
                { id: 3, name: 'MongoDB', category: 'database' }
            ],

            links: {
                live: 'https://example.com',
                github: null
            },

            details: {
                client: 'Real Estate Agency',
                year: '2023',
                duration: '5 months',
                role: 'Lead Developer',

                challenge: 'Manage large dataset of properties with complex filtering and real-time updates.',

                solution: 'Implemented Elasticsearch for fast queries and WebSockets for live updates.',

                results: [
                    '100K+ property listings',
                    '500K+ monthly visitors',
                    '35% faster search results',
                    '25% increase in conversions'
                ]
            },

            relatedProjects: [3]
        },

        {
            id: 6,
            slug: 'fitness-tracking-app',
            featured: false,

            projectNumber: '06',
            category: 'mobile',
            title: 'Fitness Tracking App',
            tagline: 'Your Personal Workout Companion',

            description: 'Comprehensive fitness app with workout tracking, nutrition planning, and social features for motivation.',

            fullDescription: `
          A complete fitness solution that helps users track workouts, plan meals, and connect with fitness community.
          Integrates with wearable devices and provides personalized workout recommendations.
        `,

            thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center',
            images: [
                {
                    id: 1,
                    url: 'https://picsum.photos/1200/800?random=32',
                    alt: 'Fitness App',
                    caption: 'App dashboard'
                }
            ],

            tags: [
                { id: 1, name: 'Flutter', category: 'frontend' },
                { id: 2, name: 'HealthKit', category: 'integration' },
                { id: 3, name: 'GraphQL', category: 'backend' }
            ],

            links: {
                live: 'https://example.com',
                github: 'https://github.com/yourusername/project'
            },

            details: {
                client: 'Fitness Startup',
                year: '2024',
                duration: '4 months',
                role: 'Mobile Developer',

                challenge: 'Seamless integration with multiple fitness devices and platforms while maintaining user privacy.',

                solution: 'Built unified API layer with strong encryption and user-controlled data sharing.',

                results: [
                    '75K+ downloads',
                    '4.7★ rating',
                    '85% user retention',
                    'Featured by Apple'
                ]
            },

            relatedProjects: [4]
        },

        {
            id: 7,
            slug: 'event-management-platform',
            featured: false,

            projectNumber: '07',
            category: 'saas',
            title: 'Event Management Platform',
            tagline: 'Organize Events Effortlessly',

            description: 'End-to-end event management solution with ticketing, attendee management, and analytics.',

            fullDescription: `
          A comprehensive platform for event organizers to manage everything from ticket sales to post-event analytics.
          Features include customizable event pages, email marketing, and check-in management.
        `,

            thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop&crop=center',
            images: [
                {
                    id: 1,
                    url: 'https://picsum.photos/1200/800?random=33',
                    alt: 'Event Platform',
                    caption: 'Event dashboard'
                }
            ],

            tags: [
                { id: 1, name: 'React', category: 'frontend' },
                { id: 2, name: 'Django', category: 'backend' },
                { id: 3, name: 'PostgreSQL', category: 'database' },
                { id: 4, name: 'AWS', category: 'infrastructure' }
            ],

            links: {
                live: 'https://example.com',
                github: null
            },

            details: {
                client: 'Event Tech Company',
                year: '2023',
                duration: '5 months',
                role: 'Full Stack Developer',

                challenge: 'Handle high traffic during ticket sales with zero downtime and accurate inventory management.',

                solution: 'Implemented queue system, database optimization, and auto-scaling infrastructure.',

                results: [
                    '1M+ tickets sold',
                    'Zero downtime during launches',
                    '99.99% payment success rate',
                    '500+ events hosted'
                ]
            },

            relatedProjects: [3, 5]
        },

        {
            id: 8,
            slug: 'online-learning-platform',
            featured: false,

            projectNumber: '08',
            category: 'education',
            title: 'Online Learning Platform',
            tagline: 'Education For Everyone',

            description: 'Interactive e-learning platform with video courses, quizzes, progress tracking, and certification.',

            fullDescription: `
          A modern learning management system that provides engaging educational experiences.
          Features include video streaming, interactive quizzes, discussion forums, and progress analytics.
        `,

            thumbnail: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=600&fit=crop&crop=center',
            images: [
                {
                    id: 1,
                    url: 'https://picsum.photos/1200/800?random=34',
                    alt: 'Learning Platform',
                    caption: 'Course interface'
                }
            ],

            tags: [
                { id: 1, name: 'Next.js', category: 'frontend' },
                { id: 2, name: 'Node.js', category: 'backend' },
                { id: 3, name: 'MongoDB', category: 'database' },
                { id: 4, name: 'AWS S3', category: 'storage' }
            ],

            links: {
                live: 'https://example.com',
                github: 'https://github.com/yourusername/project'
            },

            details: {
                client: 'EdTech Startup',
                year: '2024',
                duration: '6 months',
                role: 'Lead Developer',

                challenge: 'Deliver smooth video streaming and interactive content to users with varying internet speeds.',

                solution: 'Adaptive bitrate streaming, content CDN, and progressive video loading.',

                results: [
                    '200K+ enrolled students',
                    '5K+ courses available',
                    '90% completion rate',
                    '4.9★ average rating'
                ]
            },

            relatedProjects: [3, 7]
        }
    ],

    // Available categories for filtering
    categories: [
        { id: 'all', name: 'All Projects', count: 8 },
        { id: 'e-commerce', name: 'E-Commerce', count: 1 },
        { id: 'portfolio', name: 'Portfolio', count: 1 },
        { id: 'saas', name: 'SaaS', count: 3 },
        { id: 'mobile', name: 'Mobile', count: 2 },
        { id: 'web-app', name: 'Web App', count: 1 },
        { id: 'education', name: 'Education', count: 1 }
    ],

    // Available tech tags for filtering
    techTags: [
        'React', 'Next.js', 'Vue.js', 'Angular', 'React Native', 'Flutter',
        'Node.js', 'Django', 'GraphQL',
        'GSAP', 'Three.js', 'Framer Motion', 'D3.js',
        'Tailwind CSS', 'TypeScript',
        'MongoDB', 'PostgreSQL', 'Firebase',
        'AWS', 'Shopify', 'Stripe'
    ]
}

// ========================================
// 🛠️ HELPER FUNCTIONS
// ========================================


// Get featured projects only
export const getFeaturedProjects = () => {
    return projectsData.projects.filter(project => project.featured)
}

// Get project by slug
export const getProjectBySlug = (slug) => {
    return projectsData.projects.find(project => project.slug === slug)
}

// Get related projects
export const getRelatedProjects = (projectId, limit = 3) => {
    const project = projectsData.projects.find(p => p.id === projectId)
    if (!project || !project.relatedProjects) return []

    return project.relatedProjects
        .map(id => projectsData.projects.find(p => p.id === id))
        .filter(Boolean)
        .slice(0, limit)
}

// Filter projects by category
export const getProjectsByCategory = (category) => {
    if (category === 'all') return projectsData.projects
    return projectsData.projects.filter(
        project => project.category.toLowerCase() === category.toLowerCase()
    )
}

// Filter projects by tech tag
export const getProjectsByTech = (tech) => {
    return projectsData.projects.filter(
        project => project.tags.some(tag => tag.name.toLowerCase() === tech.toLowerCase())
    )
}

// Search projects
export const searchProjects = (query) => {
    const lowerQuery = query.toLowerCase()
    return projectsData.projects.filter(
        project =>
            project.title.toLowerCase().includes(lowerQuery) ||
            project.description.toLowerCase().includes(lowerQuery) ||
            project.category.toLowerCase().includes(lowerQuery) ||
            project.tags.some(tag => tag.name.toLowerCase().includes(lowerQuery))
    )
}


// At the bottom of the file, make sure this exists:

// Get all projects
export const getAllProjects = () => {
    return projectsData.projects
}

export default projectsData