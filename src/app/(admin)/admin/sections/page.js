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
      description: 'Customize your main introduction, profile image, and call-to-action buttons',
    },
    {
      href: '/admin/about',
      icon: 'fa-code',
      title: 'About Section',
      description: 'Customize your bio, skills, and feature highlights',
    },
    {
      href: '/admin/services',
      icon: 'fa-cogs',
      title: 'Services Section',
      description: 'Manage your service offerings, pricing, and descriptions',
    },
    {
      href: '/admin/stats',
      icon: 'fa-chart-bar',
      title: 'Stats Section',
      description: 'Update your achievement numbers, awards, and experience stats',
    },
    {
      href: '/admin/technologies',
      icon: 'fa-cogs',
      title: 'Technologies Management',
      description: 'Manage your technology stack and tools',
    },
    {
      href: '/admin/certifications',
      icon: 'fa-certificate',
      title: 'Certifications Management',
      description: 'Manage your professional certifications and credentials',
    },
    {
      href: '/admin/articles',
      icon: 'fa-newspaper',
      title: 'Blog/News',
      description: 'Create and manage your blog articles and news posts',
    },
    {
      icon: 'fa-palette',
      title: 'Design Process',
      description: 'Coming soon - showcase your creative workflow',
      comingSoon: true,
    },
    {
      icon: 'fa-comments',
      title: 'Testimonials',
      description: 'Coming soon - client reviews and feedback',
      comingSoon: true,
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
