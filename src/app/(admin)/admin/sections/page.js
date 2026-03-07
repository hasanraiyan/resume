'use client';

import Link from 'next/link';
import { Card } from '@/components/ui';

function SectionCard({ href, icon, title, description, comingSoon }) {
  const cardContent = (
    <Card
      className={
        comingSoon
          ? 'p-6 opacity-60 border-2 border-dashed border-neutral-300'
          : 'p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group-hover:bg-neutral-50'
      }
    >
      <div className="flex items-start space-x-4">
        <div
          className={
            comingSoon
              ? 'w-12 h-12 bg-neutral-300 rounded-lg flex items-center justify-center'
              : 'w-12 h-12 bg-black group-hover:bg-neutral-800 rounded-lg flex items-center justify-center'
          }
        >
          <i
            className={`fas ${icon} ${
              comingSoon ? 'text-neutral-500' : 'text-white group-hover:text-white'
            } text-lg`}
          ></i>
        </div>
        <div className="flex-1">
          <h3
            className={`font-semibold ${
              comingSoon ? 'text-neutral-500' : 'text-black group-hover:text-black'
            } mb-1`}
          >
            {title}
          </h3>
          <p
            className={`text-sm ${
              comingSoon ? 'text-neutral-400' : 'text-neutral-600 group-hover:text-neutral-700'
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="group">
        {cardContent}
      </Link>
    );
  }

  return <div className="group">{cardContent}</div>;
}

export default function SectionsAdminPage() {
  const sections = [
    {
      href: '/admin/hero',
      icon: 'fa-user',
      title: 'Hero Section',
      description: 'Main introduction, profile image, and social buttons',
    },
    {
      href: '/admin/sections/about',
      icon: 'fa-info-circle',
      title: 'About Section',
      description: 'Bio, skills, and highlights titles',
    },
    {
      href: '/admin/sections/services',
      icon: 'fa-concierge-bell',
      title: 'Services Section',
      description: 'Manage your service offerings and section titles',
    },
    {
      href: '/admin/sections/stats',
      icon: 'fa-chart-bar',
      title: 'Stats Section',
      description: 'Update achievement numbers and status stats',
    },
    {
      href: '/admin/sections/skills',
      icon: 'fa-code',
      title: 'Skills Section',
      description: 'Customize skills section title and description',
    },
    {
      href: '/admin/sections/projects',
      icon: 'fa-briefcase',
      title: 'Project Section',
      description: 'Customize featured projects title and view all CTR',
    },
    {
      href: '/admin/sections/achievements',
      icon: 'fa-trophy',
      title: 'Achievements',
      description: 'Customize achievements and certifications headings',
    },
    {
      href: '/admin/sections/testimonials',
      icon: 'fa-comments',
      title: 'Testimonials',
      description: 'Client reviews and feedback section titles',
    },
    {
      href: '/admin/sections/tool-teaser',
      icon: 'fa-magic',
      title: 'AI Tool Teasers',
      description: 'Customize titles and placeholders for AI Artist and PPT Generator',
    },
    {
      href: '/admin/technologies',
      icon: 'fa-microchip',
      title: 'Tech Stack',
      description: 'Manage individual technology items and icons',
    },
    {
      href: '/admin/certifications',
      icon: 'fa-certificate',
      title: 'Certifications List',
      description: 'Manage individual certification items',
    },
    {
      href: '/admin/articles',
      icon: 'fa-newspaper',
      title: 'Blog/News',
      description: 'Manage articles and posts',
    },
  ];

  const quickActions = [
    {
      href: '/admin/marquee',
      icon: 'fa-text-width',
      title: 'Marquee Text',
      description: 'Update the scrolling text banner',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-neutral-200 pb-6">
        <h1 className="text-4xl font-bold text-black font-['Playfair_Display'] mb-2">
          Manage Sections
        </h1>
        <p className="text-neutral-600 text-lg">
          Configure and customize different sections of your portfolio website.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black font-['Playfair_Display']">
          Available Sections
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, index) => (
            <SectionCard key={index} {...section} />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black font-['Playfair_Display']">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <SectionCard key={index} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
}
