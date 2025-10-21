// src/components/admin/MediaLibraryClient.js
'use client';

import { useState, useEffect } from 'react';
import { deleteAsset } from '@/app/actions/mediaActions';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
// CustomDropdown removed due to width issues
import ImageLightbox from '@/components/ui/ImageLightbox';

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
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('flux');
  const [seed, setSeed] = useState('');
  const [preset, setPreset] = useState('square');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const presetOptions = [
    { value: 'square', label: 'Square (1024x1024)' },
    { value: 'landscape', label: 'Landscape (1280x720)' },
    { value: 'portrait', label: 'Portrait (720x1280)' },
    { value: 'wide', label: 'Wide (1280x720)' },
    { value: 'tall', label: 'Tall (720x1280)' },
  ];

  const promptTemplates = [
    {
      category: 'Photography',
      templates: [
        {
          name: 'Portrait',
          prompt:
            'Professional portrait photography, studio lighting, sharp focus, photorealistic, 8k resolution',
        },
        {
          name: 'Landscape',
          prompt:
            'Stunning landscape photography, golden hour, dramatic lighting, highly detailed, nature scenery',
        },
        {
          name: 'Street',
          prompt:
            'Candid street photography, urban environment, people in motion, documentary style, natural lighting',
        },
        {
          name: 'Product',
          prompt:
            'Commercial product photography, clean white background, professional lighting, high detail, commercial quality',
        },
      ],
    },
    {
      category: 'Art & Illustration',
      templates: [
        {
          name: 'Digital Art',
          prompt:
            'Digital artwork, vibrant colors, artistic composition, detailed illustration, modern art style',
        },
        {
          name: 'Watercolor',
          prompt:
            'Beautiful watercolor painting, soft colors, artistic style, flowing brushstrokes, artistic composition',
        },
        {
          name: 'Sketch',
          prompt:
            'Detailed pencil sketch, monochrome, artistic drawing, fine lines, professional illustration',
        },
        {
          name: 'Anime',
          prompt:
            'Anime style illustration, vibrant colors, detailed character design, Japanese animation style',
        },
      ],
    },
    {
      category: 'Design & Graphics',
      templates: [
        {
          name: 'Logo',
          prompt:
            'Minimalist logo design, clean typography, professional branding, vector style, modern design',
        },
        {
          name: 'Poster',
          prompt:
            'Vintage poster design, bold typography, artistic layout, retro style, graphic design',
        },
        {
          name: 'Icon',
          prompt:
            'Flat design icon, minimal style, scalable vector, clean lines, professional iconography',
        },
        {
          name: 'Banner',
          prompt:
            'Social media banner design, eye-catching, modern typography, vibrant colors, marketing design',
        },
      ],
    },
    {
      category: 'Nature & Environment',
      templates: [
        {
          name: 'Wildlife',
          prompt:
            'Wildlife photography, animal in natural habitat, sharp focus, nature documentary, high detail',
        },
        {
          name: 'Ocean',
          prompt:
            'Ocean scene, underwater photography, marine life, coral reefs, crystal clear water, aquatic photography',
        },
        {
          name: 'Mountain',
          prompt:
            'Mountain landscape, dramatic peaks, alpine scenery, panoramic view, nature photography',
        },
        {
          name: 'Forest',
          prompt:
            'Forest landscape, woodland scenery, trees, natural lighting, peaceful atmosphere, nature photography',
        },
      ],
    },
  ];

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  // Bulk operations state
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Process a single file upload
  const processFileUpload = async (file) => {
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
      throw new Error(
        `File size too large. Maximum allowed size is 10MB. Your file is ${Math.round(file.size / (1024 * 1024))}MB.`
      );
    }

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
        return { success: true, asset: result.asset };
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error details:', error);
      throw error;
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setIsUploading(true);
    setUploadError('');

    let successCount = 0;
    let errorMessages = [];

    // Process files sequentially
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        await processFileUpload(file);
        successCount++;
      } catch (error) {
        errorMessages.push(`${file.name}: ${error.message}`);
        console.error(`Upload failed for ${file.name}:`, error);
      }
    }

    // Show results
    if (successCount > 0) {
      if (errorMessages.length === 0) {
        setUploadError(''); // Clear any previous errors
      } else {
        setUploadError(
          `Uploaded ${successCount} file(s). Some failed: ${errorMessages.join(', ')}`
        );
      }
    } else {
      setUploadError(`All uploads failed: ${errorMessages.join(', ')}`);
    }

    setIsUploading(false);
  };

  // Handle file input change (legacy support)
  const handleFileInputChange = (event) => {
    const files = event.target.files;
    if (files) {
      handleFileUpload(files);
      event.target.value = ''; // Reset input
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set drag over to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
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

  // Bulk operations functions
  const handleSelectAsset = (assetId, isSelected) => {
    setSelectedAssets((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(assetId);
      } else {
        newSet.delete(assetId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedAssets(new Set(paginatedAssets.map((asset) => asset._id)));
    } else {
      setSelectedAssets(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.size === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedAssets.size} selected asset(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    setBulkActionLoading(true);
    let successCount = 0;
    let errorMessages = [];

    // Delete assets sequentially
    for (const assetId of selectedAssets) {
      try {
        const result = await deleteAsset(assetId);
        if (result.success) {
          successCount++;
          setAssets((prev) => prev.filter((asset) => asset._id !== assetId));
          if (result.warning) {
            errorMessages.push(`Warning for asset ${assetId}: ${result.warning}`);
          }
        } else {
          errorMessages.push(`Failed to delete asset ${assetId}: ${result.error}`);
        }
      } catch (error) {
        errorMessages.push(`Network error for asset ${assetId}: ${error.message}`);
      }
    }

    setBulkActionLoading(false);
    setSelectedAssets(new Set());

    // Show results
    if (successCount > 0) {
      alert(
        `Successfully deleted ${successCount} asset(s).${errorMessages.length > 0 ? '\n\nWarnings/Errors:\n' + errorMessages.join('\n') : ''}`
      );
    } else {
      alert('All deletions failed:\n' + errorMessages.join('\n'));
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

  // Filter and sort assets
  const filteredAndSortedAssets = assets
    .filter((asset) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        asset.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.prompt?.toLowerCase().includes(searchQuery.toLowerCase());

      // Format filter
      const matchesFormat =
        formatFilter === 'all' || asset.format?.toLowerCase() === formatFilter.toLowerCase();

      // Source filter
      const matchesSource = sourceFilter === 'all' || asset.source === sourceFilter;

      return matchesSearch && matchesFormat && matchesSource;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'name':
          return (a.filename || '').localeCompare(b.filename || '');
        case 'size':
          return (b.size || 0) - (a.size || 0);
        default:
          return 0;
      }
    });

  // Pagination calculations
  const totalFilteredAssets = filteredAndSortedAssets.length;
  const totalPages = Math.ceil(totalFilteredAssets / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAndSortedAssets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, formatFilter, sourceFilter, sortBy]);

  // Clear selections when page changes or assets change
  useEffect(() => {
    setSelectedAssets(new Set());
  }, [currentPage, searchQuery, formatFilter, sourceFilter, sortBy]);

  // Lightbox functions
  const openLightbox = (filteredIndex) => {
    setCurrentImageIndex(filteredIndex);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setCurrentImageIndex(0);
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % paginatedAssets.length);
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + paginatedAssets.length) % paginatedAssets.length);
  };

  const handleTemplateSelect = (templatePrompt) => {
    setPrompt(templatePrompt);
    setSelectedTemplate(templatePrompt);
  };

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
    <div className="space-y-4">
      {/* Upload Section */}
      <div
        className={`p-6 border-2 border-dashed rounded-lg transition-all duration-200 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label htmlFor="file-upload" className="cursor-pointer block">
          <div className="text-center">
            <i
              className={`fas fa-cloud-upload-alt text-3xl mb-3 ${
                isDragOver ? 'text-blue-500' : 'text-gray-400'
              }`}
            ></i>
            <p className={`text-lg font-medium ${isDragOver ? 'text-blue-700' : 'text-gray-600'}`}>
              {isUploading
                ? isCompressing
                  ? 'Compressing files...'
                  : 'Uploading files...'
                : isDragOver
                  ? 'Drop files here to upload'
                  : 'Drag & drop files here, or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports: JPEG, PNG, GIF, WebP, SVG (max 10MB each)
            </p>
            {!isUploading && (
              <p className="text-xs text-gray-400 mt-1">You can select multiple files at once</p>
            )}
          </div>
        </label>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isUploading}
          accept="image/*"
          multiple
        />
      </div>

      {/* Enhanced Generate Media Section */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-dashed border-purple-200 rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-magic text-white text-lg"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">AI Image Generator</h3>
                <p className="text-sm text-gray-600">
                  Create stunning images with artificial intelligence
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
            >
              <i className={`fas fa-chevron-${showAdvanced ? 'up' : 'down'} text-xs`}></i>
              {showAdvanced ? 'Less Options' : 'More Options'}
            </button>
          </div>

          {/* Prompt Templates */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Quick Start Templates
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {promptTemplates.map((category) => (
                <div key={category.category} className="space-y-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {category.category}
                  </div>
                  {category.templates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => handleTemplateSelect(template.prompt)}
                      className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors duration-200"
                      disabled={isGenerating}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Main Prompt Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Describe Your Image
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white shadow-sm"
                placeholder="A majestic lion standing on a mountain peak at sunset, photorealistic, dramatic lighting, 8k resolution..."
                rows={4}
                disabled={isGenerating}
              />
              {prompt && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {prompt.length} characters
                </div>
              )}
            </div>
          </div>

          {/* Basic Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dimensions</label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                disabled={isGenerating}
              >
                {presetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">AI Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                disabled={isGenerating}
              >
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model.charAt(0).toUpperCase() + model.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Seed (Optional)
              </label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
                placeholder="Random"
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Advanced Options (Collapsible) */}
          {showAdvanced && (
            <div className="border-t border-purple-200 pt-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <i className="fas fa-cog text-purple-500"></i>
                Advanced Options
              </h4>
              <div className="bg-white p-4 rounded-lg border border-purple-100">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Tip:</strong> Advanced options will be available in future updates,
                  including style presets, quality settings, and negative prompts.
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-4 px-6 rounded-lg transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
              isGenerating || !prompt.trim()
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:shadow-xl'
            }`}
          >
            {isGenerating ? (
              <>
                <div
                  className={`animate-spin rounded-full h-5 w-5 border-2 ${
                    isGenerating || !prompt.trim()
                      ? 'border-gray-300 border-t-gray-200'
                      : 'border-white border-t-transparent'
                  }`}
                ></div>
                Generating Your Image...
              </>
            ) : (
              <>
                <i className="fas fa-sparkles"></i>
                Generate Image
              </>
            )}
          </button>

          {/* Generation Tips */}
          {!isGenerating && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-2">
                <i className="fas fa-lightbulb text-purple-500 mt-0.5"></i>
                <div className="text-sm text-purple-800">
                  <strong>Pro Tips:</strong> Be specific in your prompts. Include style details,
                  lighting, mood, and technical specifications for better results.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {generateError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{generateError}</p>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Assets</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by filename or AI prompt..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Format Filter */}
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                name="formatFilter"
              >
                <option value="all">All Formats</option>
                <option value="jpg">JPEG</option>
                <option value="png">PNG</option>
                <option value="gif">GIF</option>
                <option value="webp">WebP</option>
                <option value="svg">SVG</option>
              </select>
            </div>

            {/* Source Filter */}
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                name="sourceFilter"
              >
                <option value="all">All Sources</option>
                <option value="upload">Uploaded</option>
                <option value="pollinations">AI Generated</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                name="sortBy"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="size">Largest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>
            Showing {startIndex + 1}-{Math.min(endIndex, totalFilteredAssets)} of{' '}
            {totalFilteredAssets} assets
            {totalFilteredAssets !== assets.length && ` (filtered from ${assets.length} total)`}
          </div>
          <div className="flex items-center gap-4">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span>Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
            </div>
            {(searchQuery || formatFilter !== 'all' || sourceFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFormatFilter('all');
                  setSourceFilter('all');
                  setSortBy('newest');
                  setCurrentPage(1);
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedAssets.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-800">
              {selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedAssets(new Set())}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {bulkActionLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Deleting...
                </>
              ) : (
                <>
                  <i className="fas fa-trash"></i>
                  Delete Selected
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Gallery Section */}
      {paginatedAssets.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  paginatedAssets.length > 0 &&
                  paginatedAssets.every((asset) => selectedAssets.has(asset._id))
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({paginatedAssets.length} shown)
              </span>
            </label>
          </div>
          <div className="text-xs text-gray-500">
            Click images to preview • Check boxes to select for bulk actions
          </div>
        </div>
      )}
      <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {paginatedAssets.length === 0 ? (
            <div className="col-span-full text-center py-6 text-gray-500">
              <i className="fas fa-image text-4xl mb-3"></i>
              <p>
                {assets.length === 0
                  ? 'No assets uploaded yet. Upload some images to get started!'
                  : 'No assets match your current filters. Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            paginatedAssets.map((asset, index) => {
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
                  className="relative flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                  onClick={() => openLightbox(index)}
                >
                  {/* Selection Checkbox Overlay */}
                  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="flex items-center gap-1 bg-white bg-opacity-90 rounded px-2 py-1 shadow-sm">
                      <input
                        type="checkbox"
                        checked={selectedAssets.has(asset._id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectAsset(asset._id, e.target.checked);
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>

                  {/* Selected Indicator */}
                  {selectedAssets.has(asset._id) && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    </div>
                  )}

                  {/* Image Section - Uniform height for clean grid layout */}
                  <div
                    className="relative bg-gray-100 overflow-hidden"
                    style={{
                      height: '180px', // Fixed height for all images
                    }}
                  >
                    {/* Loading skeleton */}
                    <div className="absolute inset-0 bg-gray-200 animate-pulse z-1"></div>
                    {/* Regular img tag for testing */}
                    <img
                      src={asset.secure_url}
                      alt={asset.filename || 'Uploaded image'}
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                      style={{ zIndex: 1 }}
                      data-asset-id={asset._id}
                      onLoad={() => {
                        console.log('Regular img loaded successfully:', asset.secure_url);
                        // Hide loading skeleton
                        const skeleton = document
                          .querySelector(`[data-asset-id="${asset._id}"]`)
                          ?.parentElement?.querySelector('.animate-pulse');
                        if (skeleton) skeleton.style.display = 'none';
                      }}
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
                      className="object-cover transition-all duration-300 group-hover:scale-105"
                      style={{ zIndex: 2, opacity: 1 }}
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      priority={false}
                      quality={75}
                      loading="lazy"
                      onLoadStart={() =>
                        console.log('Next.js Image load started:', asset.secure_url)
                      }
                      onLoad={() => {
                        console.log('Next.js Image loaded successfully:', asset.secure_url);
                        // Hide the regular img when Next.js image loads
                        const regularImg = document.querySelector(`[data-asset-id="${asset._id}"]`);
                        if (regularImg) regularImg.style.display = 'none';
                        // Hide loading skeleton
                        const skeleton = regularImg?.parentElement?.querySelector('.animate-pulse');
                        if (skeleton) skeleton.style.display = 'none';
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

                    {/* Delete Button Overlay */}
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(asset._id);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium transition-colors shadow-lg"
                        title="Delete image"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>

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
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 text-sm border border-gray-300 ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        asset={paginatedAssets[currentImageIndex]}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNext={goToNextImage}
        onPrevious={goToPreviousImage}
      />
    </div>
  );
}
