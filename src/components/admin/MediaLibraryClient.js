// src/components/admin/MediaLibraryClient.js
'use client';

import { useState, useEffect } from 'react';
import { deleteAsset } from '@/app/actions/mediaActions';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import CustomDropdown from '@/components/CustomDropdown';
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
  const presetOptions = [
    { value: 'square', label: 'Square (1024x1024)' },
    { value: 'landscape', label: 'Landscape (1280x720)' },
    { value: 'portrait', label: 'Portrait (720x1280)' },
    { value: 'wide', label: 'Wide (1280x720)' },
    { value: 'tall', label: 'Tall (720x1280)' },
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
              <CustomDropdown
                label=""
                options={[
                  { value: 'all', label: 'All Formats' },
                  { value: 'jpg', label: 'JPEG' },
                  { value: 'png', label: 'PNG' },
                  { value: 'gif', label: 'GIF' },
                  { value: 'webp', label: 'WebP' },
                  { value: 'svg', label: 'SVG' },
                ]}
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                name="formatFilter"
              />
            </div>

            {/* Source Filter */}
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <CustomDropdown
                label=""
                options={[
                  { value: 'all', label: 'All Sources' },
                  { value: 'upload', label: 'Uploaded' },
                  { value: 'pollinations', label: 'AI Generated' },
                ]}
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                name="sourceFilter"
              />
            </div>

            {/* Sort Options */}
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <CustomDropdown
                label=""
                options={[
                  { value: 'newest', label: 'Newest First' },
                  { value: 'oldest', label: 'Oldest First' },
                  { value: 'name', label: 'Name A-Z' },
                  { value: 'size', label: 'Largest First' },
                ]}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                name="sortBy"
              />
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-max">
        {paginatedAssets.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
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
                className="relative flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
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

                {/* Image Section - Use actual aspect ratio */}
                <div
                  className="relative bg-gray-100 overflow-hidden"
                  style={{
                    aspectRatio:
                      asset.width && asset.height ? `${asset.width}/${asset.height}` : '1/1',
                    minHeight: '120px',
                    maxHeight: '300px',
                  }}
                >
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
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent lightbox from opening
                        handleDelete(asset._id);
                      }}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
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
