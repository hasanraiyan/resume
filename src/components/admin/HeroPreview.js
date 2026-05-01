'use client';

import { Button, Badge } from '@/components/custom-ui';

export default function HeroPreview({ heroData, isPreview = false }) {
  if (!heroData) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-neutral-100 rounded-lg">
        <p className="text-neutral-500">Loading preview...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Preview Header */}
      <div
        className={`px-4 py-3 border-b border-neutral-200 ${
          isPreview ? 'bg-blue-50' : 'bg-neutral-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <h4
            className={`text-sm font-semibold ${isPreview ? 'text-blue-900' : 'text-neutral-700'}`}
          >
            {isPreview ? (
              <>
                <i className="fas fa-eye mr-2"></i>Live Preview
              </>
            ) : (
              <>
                <i className="fas fa-check-circle mr-2"></i>Current Version
              </>
            )}
          </h4>
          {isPreview && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
              <i className="fas fa-circle text-xs mr-1 animate-pulse"></i>
              Unsaved Changes
            </span>
          )}
        </div>
      </div>

      {/* Hero Preview Content */}
      <div className="p-6 lg:p-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Content */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            <div className="mb-4">
              <Badge variant="category">{heroData.badge?.text || 'CREATIVE DEVELOPER'}</Badge>
            </div>

            {/* Main Heading */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 leading-none">
              {heroData.heading?.line1 || 'Crafting'}
              <span className="block text-stroke">{heroData.heading?.line2 || 'Digital'}</span>
              {heroData.heading?.line3 || 'Excellence'}
            </h1>

            {/* Introduction */}
            <p className="text-sm lg:text-base text-gray-600 mb-6 leading-relaxed">
              {heroData.introduction?.text ||
                "I'm John Doe, a creative developer focused on building beautiful and functional digital experiences that make a difference."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm">
                {heroData.cta?.primary?.text || 'View My Work'}
              </button>
              <button className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-sm">
                {heroData.cta?.secondary?.text || 'Contact Me'}
              </button>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 justify-start">
              {heroData.socialLinks && heroData.socialLinks.length > 0 ? (
                heroData.socialLinks.map((social, index) => (
                  <div
                    key={social.id || social._id || index}
                    className="text-lg text-neutral-600 hover:text-black transition-colors"
                    title={social.name}
                  >
                    <i className={social.icon}></i>
                  </div>
                ))
              ) : (
                <div className="flex gap-4">
                  <i className="fab fa-dribbble text-lg text-neutral-600"></i>
                  <i className="fab fa-behance text-lg text-neutral-600"></i>
                  <i className="fab fa-instagram text-lg text-neutral-600"></i>
                  <i className="fab fa-linkedin text-lg text-neutral-600"></i>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Profile Image */}
          <div className="relative order-1 lg:order-2 max-w-sm mx-auto lg:max-w-none">
            <div className="aspect-square bg-black rounded-full overflow-hidden">
              <img
                src={
                  heroData.profile?.image?.url ||
                  'https://api.dicebear.com/7.x/personas/svg?seed=Creative'
                }
                alt={heroData.profile?.image?.alt || 'Portrait'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://api.dicebear.com/7.x/personas/svg?seed=Creative';
                }}
              />
            </div>

            {/* Experience Badge */}
            <div className="absolute -bottom-2 -right-2 bg-white p-3 shadow-lg rounded-lg">
              <div className="text-2xl font-bold">{heroData.profile?.badge?.value || '5+'}</div>
              <div className="text-gray-600 text-xs">
                {heroData.profile?.badge?.label || 'Years Experience'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
