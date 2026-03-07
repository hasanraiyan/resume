'use client';

import { useState } from 'react';
import { LayoutGrid, ArrowRight, Sparkles, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * @param {Object} props - Component props
 * @param {Object} props.section - CMS section data
 * @returns {JSX.Element} PPT Creator Teaser section
 */
export default function PPTCreatorTeaser({ section = {} }) {
  const [topic, setTopic] = useState('');
  const router = useRouter();

  const handleGenerate = () => {
    if (!topic.trim()) return;
    // Navigate to the presentation tool with the topic pre-filled as a URL param
    router.push(`/tools/presentation?topic=${encodeURIComponent(topic.trim())}`);
  };

  return (
    <section id="slides" className="py-24 relative overflow-hidden bg-white">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content Side */}
            <div className="space-y-8 animate-on-scroll">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-widest border border-indigo-100">
                <Brain className="w-3.5 h-3.5" />
                AI Presentation Engine
              </div>

              <h2 className="text-4xl md:text-6xl font-['Playfair_Display'] text-neutral-900 leading-tight">
                {section.presentationTitle ? (
                  <span dangerouslySetInnerHTML={{ __html: section.presentationTitle }} />
                ) : (
                  <>
                    Create <span className="text-indigo-500 italic">Slides</span> with AI
                  </>
                )}
              </h2>

              <p className="text-neutral-600 text-lg leading-relaxed max-w-md">
                {section.presentationDescription ||
                  'Just describe your topic. The AI agent researches, outlines, and generates complete visual presentation slides in seconds.'}
              </p>

              <div className="relative group">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder={
                    section.presentationPlaceholder || 'The Future of Quantum Computing...'
                  }
                  className="w-full bg-white border border-neutral-200 rounded-2xl py-5 pl-6 pr-16 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
                <button
                  onClick={handleGenerate}
                  disabled={!topic.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="pt-4">
                <a
                  href={section.presentationButtonLink || '/tools/presentation'}
                  className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors text-sm font-medium group"
                >
                  {section.presentationButtonText || 'Open Presentation Studio'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Preview Side */}
            <div className="relative aspect-video lg:aspect-[4/3] animate-on-scroll delay-200">
              <div className="absolute inset-0 bg-neutral-50 rounded-3xl border border-neutral-200 overflow-hidden group shadow-xl">
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                  {/* Mock slide preview */}
                  <div className="w-full max-w-sm space-y-4">
                    {/* Fake slide thumbnails */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm relative overflow-hidden">
                      <div className="aspect-video bg-gradient-to-br from-indigo-100 to-blue-50 rounded-lg flex items-center justify-center mb-3">
                        <LayoutGrid className="w-10 h-10 text-indigo-300" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-neutral-200 rounded-full w-3/4" />
                        <div className="h-2 bg-neutral-100 rounded-full w-full" />
                        <div className="h-2 bg-neutral-100 rounded-full w-5/6" />
                      </div>

                      {/* Animated shimmer overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    </div>

                    {/* Mini slide strip */}
                    <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`w-12 h-8 rounded-md border transition-all duration-310 ${
                            i === 1
                              ? 'border-indigo-300 bg-indigo-50 scale-110 shadow-sm'
                              : 'border-neutral-200 bg-white opacity-60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="animate-fade-in">
                    <h4 className="text-neutral-900 font-medium mb-2">AI-Powered Decks</h4>
                    <p className="text-neutral-500 text-sm">
                      Full visual slides generated from a single prompt.
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-600/20 blur-[40px] rounded-full animate-pulse" />
              <div
                className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-600/20 blur-[50px] rounded-full animate-pulse"
                style={{ animationDelay: '1s' }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Keyframe Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
