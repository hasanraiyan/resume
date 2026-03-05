// src/components/tools/ImageAIPlayground.js
'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Camera, Wand2, RefreshCw, Download, Sparkles, X } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { clearImageHistory, pushImageHistory, readImageHistory } from '@/lib/imageHistoryStorage';

export default function ImageAIPlayground() {
  const [prompt, setPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState(null); // base64
  const [resultImage, setResultImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [previewAspectRatio, setPreviewAspectRatio] = useState('1 / 1');
  const [isPreviewPortrait, setIsPreviewPortrait] = useState(false);
  const [error, setError] = useState('');
  const [historyItems, setHistoryItems] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!resultImage) {
      setPreviewAspectRatio('1 / 1');
      setIsPreviewPortrait(false);
      return;
    }

    const image = new window.Image();
    image.onload = () => {
      const width = image.naturalWidth || 1;
      const height = image.naturalHeight || 1;
      setPreviewAspectRatio(`${width} / ${height}`);
      setIsPreviewPortrait(width < height);
    };
    image.onerror = () => {
      setPreviewAspectRatio('1 / 1');
      setIsPreviewPortrait(false);
    };
    image.src = resultImage;
  }, [resultImage]);

  useEffect(() => {
    const storedHistory = readImageHistory();
    setHistoryItems(storedHistory);

    if (!resultImage && storedHistory.length > 0) {
      const latest = storedHistory[0];
      setResultImage(latest.imageDataUrl);
      if (latest.prompt) setPrompt(latest.prompt);
      if (latest.aspectRatio && latest.aspectRatio !== 'n/a') {
        setAspectRatio(latest.aspectRatio);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setError('Please describe what you want to create.');
      return;
    }

    setIsGenerating(true);
    setError('');
    const generationMode = sourceImage ? 'edit' : 'generate';

    const endpoint = sourceImage ? '/api/media/public-edit' : '/api/media/public-generate';
    const body = sourceImage
      ? { image: sourceImage, prompt: trimmedPrompt, aspectRatio }
      : { prompt: trimmedPrompt, aspectRatio };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        setResultImage(data.image);
        const updatedHistory = await pushImageHistory({
          imageDataUrl: data.image,
          prompt: trimmedPrompt,
          mode: generationMode,
          aspectRatio: generationMode === 'edit' ? 'n/a' : aspectRatio,
          source: 'playground',
          createdAt: Date.now(),
        });
        setHistoryItems(updatedHistory);
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

  const handleSelectHistoryItem = (item) => {
    setResultImage(item.imageDataUrl);
    setPrompt(item.prompt || '');
    setSourceImage(null);
    if (item.aspectRatio && item.aspectRatio !== 'n/a') {
      setAspectRatio(item.aspectRatio);
    }
    setError('');
  };

  const handleClearHistory = () => {
    clearImageHistory();
    setHistoryItems([]);
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
                <div className="absolute inset-0 p-6 sm:p-8 flex items-center justify-center">
                  <div
                    className={cn(
                      'relative rounded-[2rem] overflow-hidden bg-neutral-100 border border-white/70 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.35)]',
                      isPreviewPortrait ? 'h-full max-h-full max-w-full' : 'w-full max-w-full'
                    )}
                    style={{ aspectRatio: previewAspectRatio }}
                  >
                    <img
                      src={resultImage}
                      alt="AI Result"
                      className="w-full h-full object-contain animate-in fade-in duration-1000"
                    />
                  </div>
                </div>
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
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 z-20">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #fef0e7 0%, #fce4ec 25%, #f3e5f5 50%, #ede7f6 75%, #fef0e7 100%)',
                    backgroundSize: '400% 400%',
                    animation: 'meshGradient 6s ease infinite',
                  }}
                />
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <p className="text-sm font-medium text-gray-700/80 tracking-wide">
                      {sourceImage ? 'Transforming image' : 'Creating image'}
                    </p>
                    <div className="flex gap-1 justify-center">
                      <span
                        className="w-1.5 h-1.5 bg-gray-500/60 rounded-full"
                        style={{ animation: 'dotPulse 1.4s ease-in-out infinite' }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-gray-500/60 rounded-full"
                        style={{ animation: 'dotPulse 1.4s ease-in-out 0.2s infinite' }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-gray-500/60 rounded-full"
                        style={{ animation: 'dotPulse 1.4s ease-in-out 0.4s infinite' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/5 blur-[80px] rounded-full -z-10" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full -z-10" />
        </div>
      </div>

      {historyItems.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-500">
              Recent Generations
            </h2>
            <button
              onClick={handleClearHistory}
              className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400 hover:text-red-500 transition-colors"
            >
              Clear History
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 custom-chat-scrollbar">
            {historyItems.map((item) => {
              const isActive = resultImage === item.imageDataUrl;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectHistoryItem(item)}
                  className={cn(
                    'shrink-0 w-[116px] text-left transition-all',
                    isActive ? 'scale-[1.02]' : 'hover:scale-[1.02]'
                  )}
                  title={item.prompt || 'Untitled generation'}
                >
                  <div
                    className={cn(
                      'w-full aspect-square rounded-2xl overflow-hidden border-2 shadow-sm',
                      isActive
                        ? 'border-blue-500 shadow-blue-200'
                        : 'border-neutral-200 hover:border-neutral-300'
                    )}
                  >
                    <img
                      src={item.imageDataUrl}
                      alt={item.prompt || 'Generated image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-2 px-0.5">
                    <p className="text-[10px] uppercase tracking-widest font-black text-neutral-400">
                      {item.mode === 'edit' ? 'Edit' : item.aspectRatio}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{item.prompt || 'Untitled'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Note Section */}
      <div className="mt-24 max-w-2xl mx-auto flex items-center gap-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 text-neutral-400 text-xs italic">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <p>
          Note: Generated images are now persisted in your recent history and hosted via
          UploadThing. Use the Save button to download a copy, or use Clear History to remove local
          history from this browser.
        </p>
      </div>

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
    </div>
  );
}
