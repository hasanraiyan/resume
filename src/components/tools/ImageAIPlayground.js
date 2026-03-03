// src/components/tools/ImageAIPlayground.js
'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  Camera,
  Wand2,
  RefreshCw,
  Download,
  Sparkles,
  X,
  ChevronRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/utils/classNames';

export default function ImageAIPlayground() {
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState(null); // base64
  const [resultImage, setResultImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe what you want to create.');
      return;
    }

    setIsGenerating(true);
    setError('');

    const endpoint = sourceImage ? '/api/media/public-edit' : '/api/media/public-generate';
    const body = sourceImage
      ? { image: sourceImage, prompt, aspectRatio }
      : { prompt, aspectRatio };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        setResultImage(data.image);
      } else {
        setError(
          data.error || 'The AI engine encountered an issue. Please try a different prompt.'
        );
      }
    } catch (err) {
      setError('Connection lost. Please check your internet and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    setPrompt('');
    setSourceImage(null);
    setResultImage(null);
    setError('');
  };

  const downloadImage = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `ai-creation-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Control Panel (Teaser Style) */}
        <div className="space-y-10 animate-in fade-in slide-in-from-left duration-1000">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100 shadow-sm">
              <Sparkles className="w-3 h-3" />
              AI Creative Studio
            </div>

            <h1 className="text-5xl md:text-7xl font-['Playfair_Display'] text-neutral-900 leading-[1.1]">
              Limitless <span className="text-blue-600 italic">Imagination</span>
            </h1>

            <p className="text-neutral-500 text-lg leading-relaxed max-w-md">
              From simple text to complex visual transformations. Use my direct AI pipe to bring
              your ideas to life.
            </p>
          </div>

          <div className="space-y-6">
            {/* Unified Chatbot-style Input Container */}
            <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-3 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.06)] focus-within:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] transition-all duration-500">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())
                }
                placeholder={
                  sourceImage
                    ? 'Describe how to transform this image...'
                    : 'Manifest your imagination...'
                }
                className="w-full bg-transparent border-none focus:ring-0 outline-none px-6 pt-6 pb-2 text-neutral-900 placeholder-neutral-400 min-h-[140px] resize-none text-xl leading-relaxed font-['Playfair_Display']"
              />

              <div className="flex items-center justify-between px-3 pb-3">
                {/* Left Actions: Reference */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => !sourceImage && fileInputRef.current?.click()}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm',
                      sourceImage
                        ? 'bg-blue-50 border-blue-100 text-blue-600'
                        : 'bg-neutral-50 border-neutral-100 text-neutral-500 hover:bg-neutral-100 hover:border-neutral-200'
                    )}
                  >
                    {sourceImage ? (
                      <>
                        <div className="w-4 h-4 rounded-sm overflow-hidden border border-blue-200">
                          <img src={sourceImage} className="w-full h-full object-cover" />
                        </div>
                        <span>Image Added</span>
                        <X
                          className="w-3 h-3 hover:text-red-500 ml-1 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSourceImage(null);
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add Reference</span>
                      </>
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                  />
                </div>

                {/* Right Actions: Ratio & Send */}
                <div className="flex items-center gap-3">
                  {!sourceImage && (
                    <div className="hidden sm:flex bg-neutral-50 p-1 rounded-full border border-neutral-100 shadow-inner">
                      {['1:1', '16:9', '9:16'].map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer',
                            aspectRatio === ratio
                              ? 'bg-white text-blue-600 shadow-sm'
                              : 'text-neutral-400 hover:text-neutral-600 hover:bg-white/50'
                          )}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:grayscale group"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Wand2 className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              {error}
            </div>
          )}
        </div>

        {/* Display Area (Teaser Style Preview) */}
        <div className="relative aspect-square animate-in fade-in zoom-in duration-1000 delay-200">
          <div className="absolute inset-0 bg-neutral-50 rounded-[3rem] border-4 border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden group">
            {resultImage ? (
              <>
                <img
                  src={resultImage}
                  alt="AI Result"
                  className="w-full h-full object-cover animate-in fade-in duration-1000"
                />
                {/* Quick Actions Overlay */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <button
                    onClick={downloadImage}
                    className="px-8 py-4 bg-white/90 backdrop-blur-xl rounded-2xl text-neutral-900 font-bold text-sm shadow-2xl hover:bg-white flex items-center gap-3 active:scale-95 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Save Artwork
                  </button>
                  <button
                    onClick={clearAll}
                    className="p-4 bg-white/90 backdrop-blur-xl rounded-2xl text-neutral-900 shadow-2xl hover:bg-white active:scale-95 transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
                <div className="absolute top-8 left-8 bg-blue-600/90 backdrop-blur-md text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                  Masterpiece Manifested
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-28 h-28 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500">
                  <Camera className="w-10 h-10 text-neutral-200" />
                </div>
                <h3 className="text-2xl font-['Playfair_Display'] text-neutral-900 mb-4 tracking-tight">
                  Where Logic Meets <span className="text-blue-600 italic">Magic</span>
                </h3>
                <p className="text-neutral-400 max-w-[280px] text-sm leading-relaxed">
                  Your generated assets are processed in real-time and never leave this session
                  unless you save them.
                </p>

                {isGenerating && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <div className="w-20 h-20 border-4 border-blue-100 rounded-full" />
                        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-blue-600 font-['Playfair_Display'] italic text-3xl">
                          Igniting...
                        </p>
                        <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em]">
                          Consulting the neural network
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/5 blur-[80px] rounded-full -z-10" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full -z-10" />
        </div>
      </div>

      {/* Note Section */}
      <div className="mt-24 max-w-2xl mx-auto flex items-center gap-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 text-neutral-400 text-xs italic">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <p>
          Note: This playground follows a strict "No-Trace" policy. Images generated here are
          transient and will be permanently cleared from memory upon browser refresh. Please use the
          'Save' button for anything you wish to retain.
        </p>
      </div>
    </div>
  );
}
