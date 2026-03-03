'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

export default function ImageLightbox({
  asset,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  currentIndex = 0,
  totalCount = 0,
}) {
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef(null);
  const containerRef = useRef(null);

  // Reset state on asset change
  useEffect(() => {
    setZoom(1);
    setImageLoaded(false);
    setCopied(false);
    showControlsTemporarily();
  }, [asset]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Auto-hide controls
  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  const handleMouseMove = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Copy URL
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(asset?.secure_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [asset]);

  // Download
  const handleDownload = useCallback(async () => {
    if (!asset?.secure_url) return;
    try {
      const res = await fetch(asset.secure_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.filename || 'image';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(asset.secure_url, '_blank');
    }
  }, [asset]);

  // Keyboard
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      showControlsTemporarily();
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevious();
          break;
        case '+':
        case '=':
          e.preventDefault();
          setZoom((z) => Math.min(z + 0.25, 3));
          break;
        case '-':
          e.preventDefault();
          setZoom((z) => Math.max(z - 0.25, 0.5));
          break;
        case '0':
          e.preventDefault();
          setZoom(1);
          break;
        case 'i':
        case 'I':
          setShowInfo((v) => !v);
          break;
        case 'd':
        case 'D':
          handleDownload();
          break;
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, onNext, onPrevious, showControlsTemporarily, handleDownload]);

  // Touch swipe support
  const touchStartX = useRef(0);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 60) {
      if (delta > 0) onPrevious();
      else onNext();
    }
  };

  if (!isOpen || !asset) return null;

  const formatSize = (bytes) => {
    if (!bytes) return null;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isGenerated = asset.source === 'gemini' || asset.source === 'pollinations';
  const controlsClass = `transition-all duration-500 ${controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none'}`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100]"
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop — deep dark with blur */}
      <div
        className="absolute inset-0 bg-neutral-950/95 backdrop-blur-2xl"
        style={{ animation: 'fadeIn 0.3s ease' }}
        onClick={onClose}
      />

      {/* ─── Top bar ─── */}
      <div className={`absolute top-0 left-0 right-0 z-30 ${controlsClass}`}>
        <div className="flex items-center justify-between p-4 sm:px-6 bg-gradient-to-b from-black/60 to-transparent">
          {/* Left: info */}
          <div className="flex items-center gap-3 min-w-0">
            {isGenerated && (
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20">
                AI
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-white/90 truncate leading-tight">
                {asset.filename || 'Untitled'}
              </p>
              {asset.prompt && (
                <p className="text-[11px] text-white/30 truncate mt-0.5 max-w-xs sm:max-w-lg">
                  {asset.prompt}
                </p>
              )}
            </div>
          </div>

          {/* Center: counter */}
          {totalCount > 1 && (
            <div className="absolute left-1/2 -translate-x-1/2 text-[11px] text-white/30 tabular-nums font-medium hidden sm:block">
              {currentIndex + 1} / {totalCount}
            </div>
          )}

          {/* Right: actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowInfo((v) => !v)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-[11px] ${
                showInfo
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
              title="Info (I)"
              aria-label="Toggle info"
            >
              <i className="fas fa-info"></i>
            </button>
            <button
              onClick={handleDownload}
              className="w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all text-[11px]"
              title="Download (D)"
              aria-label="Download image"
            >
              <i className="fas fa-download"></i>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all ml-1"
              aria-label="Close lightbox"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Nav arrows ─── */}
      {totalCount > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/15 ring-1 ring-white/[0.06] hover:ring-white/15 flex items-center justify-center transition-all duration-300 group ${controlsClass}`}
            aria-label="Previous image"
          >
            <svg
              className="w-4 h-4 text-white/40 group-hover:text-white transition-colors -translate-x-px"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/15 ring-1 ring-white/[0.06] hover:ring-white/15 flex items-center justify-center transition-all duration-300 group ${controlsClass}`}
            aria-label="Next image"
          >
            <svg
              className="w-4 h-4 text-white/40 group-hover:text-white transition-colors translate-x-px"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* ─── Image ─── */}
      <div
        className="absolute inset-0 z-20 flex items-center justify-center p-14 sm:p-20"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: `scale(${zoom})`,
            transition: 'transform 0.3s cubic-bezier(.22,1,.36,1)',
          }}
          className="relative"
        >
          <Image
            src={asset.secure_url}
            alt={asset.filename || 'Preview'}
            width={asset.width || 800}
            height={asset.height || 600}
            className="max-w-[85vw] max-h-[80vh] w-auto h-auto object-contain rounded-lg cursor-zoom-in select-none"
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease',
              boxShadow: '0 0 80px rgba(0,0,0,0.5)',
            }}
            onLoad={() => setImageLoaded(true)}
            onClick={() => setZoom(zoom === 1 ? 2 : 1)}
            draggable={false}
            priority
            quality={90}
          />

          {/* Loading placeholder */}
          {!imageLoaded && (
            <div className="w-[min(85vw,600px)] aspect-[4/3] rounded-lg bg-white/[0.03] ring-1 ring-white/[0.06] flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
              <span className="text-[11px] text-white/20 font-medium">Loading image...</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom bar ─── */}
      <div
        className={`absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 ${controlsClass}`}
      >
        <div className="flex items-center gap-px p-1 rounded-2xl bg-white/[0.06] backdrop-blur-2xl ring-1 ring-white/[0.08]">
          <button
            onClick={handleCopy}
            className="text-[11px] px-3.5 py-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white font-medium transition-all flex items-center gap-1.5"
            aria-label="Copy image URL"
          >
            {copied ? (
              <>
                <svg
                  className="w-3 h-3 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <i className="fas fa-link text-[9px] opacity-60"></i>
                URL
              </>
            )}
          </button>

          <div className="w-px h-4 bg-white/[0.08]" />

          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all text-[13px] font-light"
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 text-[11px] text-white/40 hover:text-white/70 tabular-nums min-w-[40px] text-center transition-colors cursor-pointer rounded-lg hover:bg-white/5"
            aria-label="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all text-[13px] font-light"
            aria-label="Zoom in"
          >
            +
          </button>

          {/* Mobile counter */}
          {totalCount > 1 && (
            <>
              <div className="w-px h-4 bg-white/[0.08] sm:hidden" />
              <div className="px-2.5 py-1.5 text-[11px] text-white/30 tabular-nums sm:hidden">
                {currentIndex + 1}/{totalCount}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Info panel ─── */}
      {showInfo && (
        <div
          className="absolute bottom-20 right-4 sm:right-6 z-30 w-56 bg-neutral-900/90 backdrop-blur-2xl ring-1 ring-white/[0.08] rounded-2xl overflow-hidden"
          style={{ animation: 'slideUp 0.25s ease' }}
        >
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.12em]">
                Details
              </h4>
              {asset.format && (
                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">
                  {asset.format}
                </span>
              )}
            </div>

            {asset.width && asset.height && (
              <InfoRow label="Dimensions" value={`${asset.width} × ${asset.height}`} />
            )}
            {asset.size && <InfoRow label="File size" value={formatSize(asset.size)} />}
            {asset.createdAt && <InfoRow label="Created" value={formatDate(asset.createdAt)} />}
            {asset.source && (
              <InfoRow
                label="Source"
                value={
                  asset.source === 'gemini'
                    ? 'Gemini AI'
                    : asset.source === 'pollinations'
                      ? 'Pollinations AI'
                      : 'Upload'
                }
              />
            )}
            {asset.prompt && (
              <div className="pt-1.5 border-t border-white/[0.05]">
                <p className="text-[10px] text-white/25 mb-1">Prompt</p>
                <p className="text-[11px] text-white/60 leading-relaxed line-clamp-4">
                  {asset.prompt}
                </p>
              </div>
            )}
          </div>
          <div className="px-4 py-2 bg-white/[0.02] border-t border-white/[0.04]">
            <p className="text-[9px] text-white/15 text-center">
              I info · D download · ← → nav · +− zoom
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10px] text-white/25 shrink-0">{label}</span>
      <span className="text-[11px] text-white/70 text-right truncate">{value}</span>
    </div>
  );
}
