'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ImageLightbox({ asset, isOpen, onClose, onNext, onPrevious }) {
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset zoom when asset changes
  useEffect(() => {
    setZoom(1);
    setImageLoaded(false);
  }, [asset]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
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
          setZoom((prev) => Math.min(prev + 0.25, 3));
          break;
        case '-':
          e.preventDefault();
          setZoom((prev) => Math.max(prev - 0.25, 0.5));
          break;
        case '0':
          e.preventDefault();
          setZoom(1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose, onNext, onPrevious]);

  if (!isOpen || !asset) return null;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-all duration-200 z-60 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 rounded-full p-2"
        aria-label="Close lightbox"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Navigation arrows */}
      <button
        onClick={onPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-200 z-60 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 rounded-full p-2"
        aria-label="Previous image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-200 z-60 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 rounded-full p-2"
        aria-label="Next image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Main image container */}
      <div className="relative max-w-full max-h-full flex items-center justify-center">
        <div
          className="relative overflow-hidden"
          style={{
            transform: `scale(${zoom})`,
            transition: 'transform 0.2s ease-in-out',
            maxWidth: '90vw',
            maxHeight: '80vh',
          }}
        >
          <Image
            src={asset.secure_url}
            alt={asset.filename || 'Preview image'}
            width={asset.width || 800}
            height={asset.height || 600}
            className="max-w-full max-h-full object-contain cursor-zoom-in"
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
            onLoad={() => setImageLoaded(true)}
            onClick={() => setZoom(zoom === 1 ? 2 : 1)}
            priority
            quality={90}
          />

          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center rounded-lg">
              <div className="text-white flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Loading...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image details panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm text-white p-6 border-t border-gray-700">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic info */}
            <div>
              <h3 className="text-lg font-semibold mb-2 truncate">{asset.filename}</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-gray-400">Size:</span> {formatFileSize(asset.size)}
                </p>
                <p>
                  <span className="text-gray-400">Format:</span> {asset.format?.toUpperCase()}
                </p>
                <p>
                  <span className="text-gray-400">Dimensions:</span> {asset.width} × {asset.height}
                  px
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div>
              <h4 className="text-md font-semibold mb-2">Details</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-gray-400">Uploaded:</span> {formatDate(asset.createdAt)}
                </p>
                <p>
                  <span className="text-gray-400">Source:</span>
                  <span
                    className={`ml-1 px-2 py-1 rounded text-xs ${
                      asset.source === 'pollinations'
                        ? 'bg-blue-600 text-white'
                        : 'bg-green-600 text-white'
                    }`}
                  >
                    {asset.source === 'pollinations' ? 'AI Generated' : 'Uploaded'}
                  </span>
                </p>
                {asset.prompt && (
                  <div className="mt-2">
                    <p className="text-gray-400 text-xs mb-1">AI Prompt:</p>
                    <p
                      className="text-xs bg-gray-800 p-2 rounded max-w-xs truncate"
                      title={asset.prompt}
                    >
                      {asset.prompt}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col justify-end">
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => setZoom(1)}
                  className="text-sm px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 font-medium"
                >
                  Fit to Screen
                </button>
                <div className="bg-gray-800 px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-300">
                    Zoom:{' '}
                    <span className="text-white font-semibold">{Math.round(zoom * 100)}%</span>
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-400 space-y-1 bg-gray-800 bg-opacity-50 p-3 rounded-lg">
                <p>
                  🖱️ <span className="text-gray-300">Click image to zoom in/out</span>
                </p>
                <p>
                  ⌨️ <span className="text-gray-300">+/- to zoom, 0 to reset</span>
                </p>
                <p>
                  ← → <span className="text-gray-300">to navigate, Esc to close</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
