// src/components/admin/MediaLibraryClient.js
'use client';

import { useState, useEffect } from 'react';
import { deleteAsset } from '@/app/actions/mediaActions';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import CustomDropdown from '@/components/CustomDropdown';

// (This is a simplified version. You can add more features like search, filters, etc. later)
export default function MediaLibraryClient({ initialAssets }) {
  console.log('=== MEDIA LIBRARY CLIENT DEBUG ===');
  console.log(
    'MediaLibraryClient initialized with initialAssets:',
    initialAssets?.length || 0,
    'assets'
  );
  console.log('Initial assets preview:', initialAssets?.slice(0, 3));

  const [assets, setAssets] = useState(initialAssets);
  const [isUploading, setIsUploading] = useState(false);
  // FIX 1: Added missing 'isCompressing' state, which caused a crash on large file uploads.
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('flux');
  const [seed, setSeed] = useState('');
  const [preset, setPreset] = useState('square');
  const presetOptions = [
    { value: 'square', label: 'Square (1024x1024)' },
    { value: 'landscape', label: 'Landscape (1280x720)' },
    { value: 'portrait', label: 'Portrait (720x1280)' },
    { value: 'wide', label: 'Wide (1280x720)' },
    { value: 'tall', label: 'Tall (720x1280)' },
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Original file:', {
      name: file.name,
      size: file.size,
      sizeMB: Math.round((file.size / (1024 * 1024)) * 100) / 100,
      type: file.type,
    });

    // Basic client-side validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError(
        `File size too large. Maximum allowed size is 10MB. Your file is ${Math.round(file.size / (1024 * 1024))}MB.`
      );
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      let fileToUpload = file;

      // Compress images larger than 1MB
      if (file.size > 1024 * 1024 && file.type.startsWith('image/')) {
        console.log('Starting compression for large file...');
        setIsCompressing(true);
        try {
          const compressionOptions = {
            maxSizeMB: 2, // Maximum file size in MB
            maxWidthOrHeight: 1920, // Maximum width or height
            useWebWorker: true, // Use web worker for better performance
            fileType: 'image/jpeg', // Convert to JPEG for better compression
          };

          const compressionStart = Date.now();
          fileToUpload = await imageCompression(file, compressionOptions);
          const compressionEnd = Date.now();

          console.log('Compression completed:', {
            originalSize: Math.round(file.size / 1024),
            compressedSize: Math.round(fileToUpload.size / 1024),
            compressionRatio: Math.round((fileToUpload.size / file.size) * 100),
            compressionTime: compressionEnd - compressionStart,
          });
        } catch (error) {
          console.warn('Compression failed, using original file:', error);
        }
        setIsCompressing(false);
      }

      console.log('Final file to upload:', {
        name: fileToUpload.name,
        size: fileToUpload.size,
        sizeMB: Math.round((fileToUpload.size / (1024 * 1024)) * 100) / 100,
        type: fileToUpload.type,
      });

      const formData = new FormData();
      formData.append('file', fileToUpload);

      console.log('FormData created, about to call upload API...');

      // Use API route instead of Server Action for better large file handling
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      console.log('Upload API result:', result);

      if (result.success) {
        console.log('Upload successful, new asset:', result.asset);
        setAssets((prev) => [result.asset, ...prev]);
        console.log('Assets updated, new count:', assets.length + 1);
        // Reset file input
        event.target.value = '';
      } else {
        setUploadError(result.error || 'Upload failed');
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      console.error('Upload error details:', error);
      setUploadError('Network error. Please check your connection and try again.');
    }

    setIsUploading(false);
  };

  const handleDelete = async (assetId) => {
    console.log('Delete requested for asset:', assetId);
    const asset = assets.find((a) => a._id === assetId);
    console.log('Asset to delete:', asset);

    // Show confirmation dialog
    if (!confirm(`Delete "${asset?.filename || 'this image'}"? This action cannot be undone.`)) {
      console.log('Delete cancelled by user');
      return;
    }

    console.log('Proceeding with delete operation...');

    try {
      const result = await deleteAsset(assetId);
      console.log('Delete result:', result);

      if (result.success) {
        console.log('Delete successful, updating UI');
        setAssets((prev) => prev.filter((asset) => asset._id !== assetId));
        console.log('Assets updated, remaining count:', assets.length - 1);

        // Show warning if Cloudinary deletion failed
        if (result.warning) {
          alert(`Warning: ${result.warning}`);
        }
      } else {
        console.error('Delete failed with error:', result.error);
        alert(`Deletion failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete error details:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/media/models');
        const data = await response.json();
        if (data.models) {
          setModels(data.models);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };
    fetchModels();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setGenerateError('Prompt is required');
      return;
    }

    setIsGenerating(true);
    setGenerateError('');

    try {
      const response = await fetch('/api/media/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          preset,
          model: selectedModel,
          seed: seed ? parseInt(seed) : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAssets((prev) => [result.asset, ...prev]);
        setPrompt('');
        setSeed('');
      } else {
        setGenerateError(result.error || 'Generation failed');
      }
    } catch (error) {
      setGenerateError('Network error. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  console.log('Rendering MediaLibraryClient with assets:', assets?.length || 0, 'assets');
  console.log('Assets data sample:', assets?.slice(0, 2));

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="p-4 border-2 border-dashed rounded-lg">
        <label htmlFor="file-upload" className="cursor-pointer">
          <p className="text-center text-gray-600">
            {isUploading
              ? isCompressing
                ? 'Compressing...'
                : 'Uploading...'
              : 'Click here or drag a file to upload'}
          </p>
          <p className="text-xs text-gray-500 text-center mt-1">
            Supports: JPEG, PNG, GIF, WebP, SVG (max 10MB)
          </p>
        </label>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isUploading}
          accept="image/*"
        />
      </div>

      {/* Generate Media Section */}
      <div className="p-4 border-2 border-dashed rounded-lg bg-blue-50">
        <h3 className="text-lg font-semibold mb-3">Generate Media with AI</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the image you want to generate..."
              rows={3}
              disabled={isGenerating}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <CustomDropdown
                label="Dimensions"
                options={presetOptions}
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                name="preset"
              />
            </div>
            <div>
              <CustomDropdown
                label="Model"
                options={models.map((model) => ({
                  value: model,
                  label: model.charAt(0).toUpperCase() + model.slice(1),
                }))}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                name="model"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seed (Optional)
              </label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Random"
                disabled={isGenerating}
              />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate Image'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {generateError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{generateError}</p>
        </div>
      )}

      {/* Gallery Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {assets.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <i className="fas fa-image text-4xl mb-3"></i>
            <p>No assets uploaded yet. Upload some images to get started!</p>
          </div>
        ) : (
          assets.map((asset) => {
            console.log('Rendering asset:', {
              id: asset._id,
              filename: asset.filename,
              secure_url: asset.secure_url,
              format: asset.format,
              size: asset.size,
            });

            return (
              <div
                key={asset._id}
                className="flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm"
              >
                {/* Image Section - Square aspect ratio */}
                <div className="aspect-square relative bg-gray-100">
                  {/* Regular img tag for testing */}
                  <img
                    src={asset.secure_url}
                    alt={asset.filename || 'Uploaded image'}
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
                    style={{ zIndex: 1 }}
                    data-asset-id={asset._id}
                    onLoad={() => console.log('Regular img loaded successfully:', asset.secure_url)}
                    onError={(e) => {
                      console.error('Regular img failed to load:', asset.secure_url);
                      e.target.style.display = 'none';
                    }}
                  />

                  {/* Next.js Image as overlay for optimization */}
                  <Image
                    src={asset.secure_url}
                    alt={asset.filename || 'Uploaded image'}
                    fill
                    className="object-cover transition-opacity duration-200"
                    style={{ zIndex: 2, opacity: 1 }}
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    priority={false}
                    quality={75}
                    onLoadStart={() => console.log('Next.js Image load started:', asset.secure_url)}
                    onLoad={() => {
                      console.log('Next.js Image loaded successfully:', asset.secure_url);
                      // Hide the regular img when Next.js image loads
                      const regularImg = document.querySelector(`[data-asset-id="${asset._id}"]`);
                      if (regularImg) regularImg.style.display = 'none';
                    }}
                    onError={(e) => {
                      console.error('Next.js Image failed to load:', asset.secure_url);
                      // Show regular img if Next.js fails
                      const regularImg = document.querySelector(`[data-asset-id="${asset._id}"]`);
                      if (regularImg) regularImg.style.display = 'block';
                    }}
                  />

                  {/* Source Badge */}
                  {asset.source === 'pollinations' && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full z-10">
                      AI Generated
                    </div>
                  )}

                  {/* Prompt Tooltip for Generated Assets */}
                  {asset.source === 'pollinations' && asset.prompt && (
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 rounded-b opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title={asset.prompt}
                    >
                      <p className="truncate">{asset.prompt}</p>
                    </div>
                  )}
                </div>

                {/* FIX 3: Moved content section OUT of the image container to fix the layout. It's now a sibling. */}
                <div className="p-3 border-t">
                  {/* Top row: Filename and Delete button */}
                  <div className="flex justify-between items-start mb-2">
                    {/* Filename */}
                    <p
                      className="text-sm font-medium text-gray-900 truncate flex-1 mr-2"
                      title={asset.filename}
                    >
                      {asset.filename}
                    </p>

                    {/* Delete button */}
                    <button
                      // FIX 2: Simplified onClick to prevent double confirmation dialog.
                      onClick={() => handleDelete(asset._id)}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-md px-2 py-1 text-xs font-medium transition-colors flex-shrink-0"
                      title="Delete image"
                    >
                      <i className="fas fa-trash mr-1"></i>
                      Delete
                    </button>
                  </div>

                  {/* File details */}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      {asset.format?.toUpperCase()} • {Math.round(asset.size / 1024)}KB
                    </span>
                    <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
