// src/components/AICreatorTeaser.js
'use client';

import { useState } from 'react';
import { Wand2, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { pushImageHistory } from '@/lib/imageHistoryStorage';

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
        await pushImageHistory({
          imageDataUrl: data.image,
          prompt: prompt.trim(),
          mode: 'generate',
          aspectRatio: '1:1',
          source: 'teaser',
          createdAt: Date.now(),
        });
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
    <section id="image" className="py-24 relative overflow-hidden bg-white">
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
                ) : isGenerating ? (
                  <div className="w-full h-full relative">
                    {/* Animated Mesh Gradient */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(135deg, #fef0e7 0%, #fce4ec 25%, #f3e5f5 50%, #ede7f6 75%, #fef0e7 100%)',
                        backgroundSize: '400% 400%',
                        animation: 'meshGradient 6s ease infinite',
                      }}
                    />
                    {/* Floating orbs for depth */}
                    <div
                      className="absolute w-[60%] h-[60%] rounded-full blur-[80px] opacity-60"
                      style={{
                        background: 'radial-gradient(circle, #f8bbd0 0%, transparent 70%)',
                        animation: 'orbFloat1 8s ease-in-out infinite',
                        top: '10%',
                        left: '10%',
                      }}
                    />
                    <div
                      className="absolute w-[50%] h-[50%] rounded-full blur-[70px] opacity-50"
                      style={{
                        background: 'radial-gradient(circle, #e1bee7 0%, transparent 70%)',
                        animation: 'orbFloat2 10s ease-in-out infinite',
                        bottom: '10%',
                        right: '5%',
                      }}
                    />
                    <div
                      className="absolute w-[40%] h-[40%] rounded-full blur-[60px] opacity-40"
                      style={{
                        background: 'radial-gradient(circle, #ffe0b2 0%, transparent 70%)',
                        animation: 'orbFloat3 7s ease-in-out infinite',
                        top: '40%',
                        left: '50%',
                      }}
                    />
                    {/* Centered label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <p className="text-sm font-medium text-gray-600/80 tracking-wide">
                          Creating image
                        </p>
                        <div className="flex gap-1 justify-center">
                          <span
                            className="w-1.5 h-1.5 bg-gray-400/60 rounded-full"
                            style={{ animation: 'dotPulse 1.4s ease-in-out infinite' }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-gray-400/60 rounded-full"
                            style={{ animation: 'dotPulse 1.4s ease-in-out 0.2s infinite' }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-gray-400/60 rounded-full"
                            style={{ animation: 'dotPulse 1.4s ease-in-out 0.4s infinite' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-md">
                      <Wand2 className="w-8 h-8 text-neutral-300" />
                    </div>
                    <div>
                      <h4 className="text-neutral-900 font-medium mb-2">Manifest Imagination</h4>
                      <p className="text-neutral-500 text-sm">Your generation will appear here.</p>
                    </div>
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

      {/* Keyframe Animations */}
      <style jsx>{`
        @keyframes meshGradient {
          0% {
            background-position: 0% 50%;
          }
          25% {
            background-position: 100% 0%;
          }
          50% {
            background-position: 100% 100%;
          }
          75% {
            background-position: 0% 100%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes orbFloat1 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30%, 20%) scale(1.1);
          }
          66% {
            transform: translate(-10%, 30%) scale(0.95);
          }
        }
        @keyframes orbFloat2 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-25%, -15%) scale(1.05);
          }
          66% {
            transform: translate(15%, -25%) scale(1.1);
          }
        }
        @keyframes orbFloat3 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-30%, 20%) scale(1.15);
          }
        }
        @keyframes dotPulse {
          0%,
          80%,
          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </section>
  );
}
