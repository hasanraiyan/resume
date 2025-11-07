'use client';

import { Button, Card, Section } from '@/components/ui';

export default function AboutPreview({ aboutData, isPreview = false }) {
  if (!aboutData) {
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

      {/* About Preview Content */}
      <div className="p-6 lg:p-8">
        <Section id="about" title={aboutData.sectionTitle || 'About Me'} className="py-0">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-center">
            {/* Left Column - Bio */}
            <div>
              <div className="space-y-4 sm:space-y-5 text-sm sm:text-base text-gray-700 leading-relaxed">
                {(aboutData.bio?.paragraphs || []).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-8 sm:mt-10">
                <Button
                  href={aboutData.resume?.url || '#'}
                  variant="secondary"
                  className="inline-flex items-center"
                >
                  {aboutData.resume?.text || 'Download Resume'}
                  <i className={`${aboutData.resume?.icon || 'fas fa-download'} ml-2`}></i>
                </Button>
              </div>
            </div>

            {/* Right Column - Features Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {(aboutData.features || []).map((feature) => (
                <Card key={feature.id} variant="elevated" interactive={true} className="p-4 sm:p-6">
                  <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
                    <i className={feature.icon}></i>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
