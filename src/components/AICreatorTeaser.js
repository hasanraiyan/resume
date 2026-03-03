// src/components/AICreatorTeaser.js
'use client';

import { useState } from 'react';
import { Wand2, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/utils/classNames';
import Link from 'next/link';

export default function AICreatorTeaser() {
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleQuickGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/media/public-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), aspectRatio: '1:1' }),
      });

      const data = await response.json();
      if (data.success) {
        setResultImage(data.image);
      } else {
        setError(data.error || 'Failed to generate.');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden bg-white">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content Side */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest border border-blue-100 animate-fade-in">
                <Sparkles className="w-3.5 h-3.5" />
                Live AI Engine
              </div>

              <h2 className="text-4xl md:text-6xl font-['Playfair_Display'] text-neutral-900 leading-tight">
                Try My <span className="text-blue-500 italic">AI Artist</span>
              </h2>

              <p className="text-neutral-600 text-lg leading-relaxed max-w-md">
                Experience the same AI technology I use for my projects. Describe anything, and
                watch it manifest in seconds.
              </p>

              <div className="relative group">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickGenerate()}
                  placeholder="A futuristic city in a glass bottle..."
                  className="w-full bg-white border border-neutral-200 rounded-2xl py-5 pl-6 pr-16 text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                />
                <button
                  onClick={handleQuickGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Wand2 className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>

              {error && <p className="text-red-500 text-sm italic">{error}</p>}

              <div className="pt-4">
                <Link
                  href="/tools/image-ai"
                  className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors text-sm font-medium group"
                >
                  Enter full AI Creative Studio
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Preview Side */}
            <div className="relative aspect-square">
              <div className="absolute inset-0 bg-neutral-50 rounded-3xl border border-neutral-200 overflow-hidden group shadow-xl">
                {resultImage ? (
                  <img
                    src={resultImage}
                    alt="AI Generated Artwork"
                    className="w-full h-full object-cover animate-in fade-in zoom-in duration-1000"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-md">
                      <Wand2 className="w-8 h-8 text-neutral-300" />
                    </div>
                    <div>
                      <h4 className="text-neutral-900 font-medium mb-2">Manifest Imagination</h4>
                      <p className="text-neutral-500 text-sm">Your generation will appear here.</p>
                    </div>
                    {isGenerating && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-blue-600 text-sm font-bold uppercase tracking-widest">
                            Generating...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-600/20 blur-[40px] rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-600/20 blur-[50px] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
