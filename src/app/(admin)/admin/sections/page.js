'use client'

import Link from 'next/link';
import { Card } from '@/components/ui';

export default function SectionsAdminPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-2 border-neutral-200 pb-6">
        <h1 className="text-4xl font-bold text-black font-['Playfair_Display'] mb-2">
          Manage Sections
        </h1>
        <p className="text-neutral-600 text-lg">
          Configure and customize different sections of your portfolio website.
        </p>
      </div>

      {/* Section Cards */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black font-['Playfair_Display']">Available Sections</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

          <Link href="/admin/hero" className="group">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group-hover:bg-neutral-50">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-black group-hover:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user text-white group-hover:text-white text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black group-hover:text-black mb-1">Hero Section</h3>
                  <p className="text-sm text-neutral-600 group-hover:text-neutral-700">Customize your main introduction, profile image, and call-to-action buttons</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/about" className="group">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group-hover:bg-neutral-50">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-black group-hover:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <i className="fas fa-code text-white group-hover:text-white text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black group-hover:text-black mb-1">About Section</h3>
                  <p className="text-sm text-neutral-600 group-hover:text-neutral-700">Customize your bio, skills, and feature highlights</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/stats" className="group">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group-hover:bg-neutral-50">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-black group-hover:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-bar text-white group-hover:text-white text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black group-hover:text-black mb-1">Stats Section</h3>
                  <p className="text-sm text-neutral-600 group-hover:text-neutral-700">Update your achievement numbers, awards, and experience stats</p>
                </div>
              </div>
            </Card>
          </Link>

          <div className="group">
            <Card className="p-6 opacity-60 border-2 border-dashed border-neutral-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-neutral-300 rounded-lg flex items-center justify-center">
                  <i className="fas fa-palette text-neutral-500 text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-500 mb-1">Design Process</h3>
                  <p className="text-sm text-neutral-400">Coming soon - showcase your creative workflow</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="group">
            <Card className="p-6 opacity-60 border-2 border-dashed border-neutral-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-neutral-300 rounded-lg flex items-center justify-center">
                  <i className="fas fa-comments text-neutral-500 text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-500 mb-1">Testimonials</h3>
                  <p className="text-sm text-neutral-400">Coming soon - client reviews and feedback</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="group">
            <Card className="p-6 opacity-60 border-2 border-dashed border-neutral-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-neutral-300 rounded-lg flex items-center justify-center">
                  <i className="fas fa-newspaper text-neutral-500 text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-500 mb-1">Blog/News</h3>
                  <p className="text-sm text-neutral-400">Coming soon - share insights and updates</p>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>

      {/* Additional Actions */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black font-['Playfair_Display']">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

          <Link href="/admin/marquee" className="group">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black group-hover:bg-neutral-50">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-black group-hover:bg-neutral-800 rounded-lg flex items-center justify-center">
                  <i className="fas fa-text-width text-white group-hover:text-white text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black group-hover:text-black mb-1">Marquee Text</h3>
                  <p className="text-sm text-neutral-600 group-hover:text-neutral-700">Update the scrolling text banner</p>
                </div>
              </div>
            </Card>
          </Link>

        </div>
      </div>
    </div>
  );
}
