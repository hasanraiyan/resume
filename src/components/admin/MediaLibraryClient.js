// src/components/admin/MediaLibraryClient.js
'use client';

import { useState, useEffect } from 'react';
import { deleteAsset } from '@/app/actions/mediaActions';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import ImageLightbox from '@/components/ui/ImageLightbox';
import BeforeAfterSlider from '@/components/ui/BeforeAfterSlider';
import MultiImagePreview from '@/components/ui/MultiImagePreview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import MediaAgentSettingsModal from './MediaAgentSettingsModal';
import { useRouter } from 'next/navigation';
import AdminPageWrapper from './AdminPageWrapper';
import { Settings, Zap, Play, Loader2, Bot, Plus, Upload } from 'lucide-react';

// (This is a simplified version. You can add more features like search, filters, etc. later)
export default function MediaLibraryClient({ initialAssets, title, description }) {
  console.log('=== MEDIA LIBRARY CLIENT DEBUG ===');
  console.log(
    'MediaLibraryClient initialized with initialAssets:',
    initialAssets?.length || 0,
    'assets'
  );
  console.log('Initial assets preview:', initialAssets?.slice(0, 3));

  const router = useRouter();
  const [assets, setAssets] = useState(initialAssets);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiMode, setAiMode] = useState('generate'); // 'generate' or 'edit'
  const [generateError, setGenerateError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedAssetsForEdit, setSelectedAssetsForEdit] = useState([]); // Support multiple images
  const [previewData, setPreviewData] = useState(null); // { before, after, mode }
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [fetchingModels, setFetchingModels] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedTemplate, setSelectedTemplate] = useState('');

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
  const [uploadProgress, setUploadProgress] = useState(new Map()); // Map<fileName, progress>

  // AI Image Processing Agent state
  const [isAgentSettingsOpen, setIsAgentSettingsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState(null);

  const aspectRatioOptions = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Tall (3:4)' },
    { value: '3:2', label: 'Wide (3:2)' },
    { value: '2:3', label: 'Narrow (2:3)' },
    { value: '5:4', label: 'Photo (5:4)' },
    { value: '4:5', label: 'Photo Tall (4:5)' },
    { value: '4:1', label: 'Ultra Wide (4:1)' },
    { value: '1:4', label: 'Ultra Tall (1:4)' },
    { value: '8:1', label: 'Panoramic (8:1)' },
    { value: '1:8', label: 'Skyscraper (1:8)' },
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

  // Synchronize local assets state when initialAssets prop changes (via router.refresh)
  useEffect(() => {
    setAssets(initialAssets);
  }, [initialAssets]);

  // Polling for AI Background Processing Status
  useEffect(() => {
    // Initial fetch of processing status
    const fetchInitialStatus = async () => {
      try {
        const response = await fetch('/api/admin/media/settings');
        if (response.ok) {
          const data = await response.json();
          setIsProcessing(data.isProcessing || false);
        }
      } catch (err) {
        console.error('Initial status fetch failed:', err);
      }
    };
    fetchInitialStatus();
  }, []);

  useEffect(() => {
    let pollInterval;

    const checkStatus = async () => {
      try {
        const response = await fetch('/api/admin/media/settings');
        if (response.ok) {
          const data = await response.json();
          const processingNow = data.isProcessing;

          // If it was processing and now it's finished
          if (isProcessing && !processingNow) {
            console.log('Background processing finished! Refreshing gallery...');
            setProcessingResults({
              message: 'Full batch processing complete! All images have been analyzed.',
              isComplete: true,
            });
            router.refresh();
          }

          setIsProcessing(processingNow);
        }
      } catch (error) {
        console.error('Error polling AI status:', error);
      }
    };

    if (isProcessing) {
      pollInterval = setInterval(checkStatus, 3000); // Poll every 3 seconds
    } else {
      clearInterval(pollInterval);
    }

    return () => clearInterval(pollInterval);
  }, [isProcessing, router]);

  // Process a single file upload
  const processFileUpload = async (file, onProgress) => {
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

      // Use XMLHttpRequest for progress tracking
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseData = JSON.parse(xhr.responseText);
              resolve(responseData);
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during upload'));
        };

        xhr.open('POST', '/api/media/upload');
        xhr.send(formData);
      });

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
    setUploadProgress(new Map()); // Reset progress

    // Initialize progress for each file
    const initialProgress = new Map();
    fileList.forEach((file) => {
      initialProgress.set(file.name, 0);
    });
    setUploadProgress(initialProgress);

    // Upload files in parallel
    const uploadPromises = fileList.map(async (file) => {
      const onProgress = (progress) => {
        setUploadProgress((prev) => new Map(prev).set(file.name, progress));
      };

      try {
        const result = await processFileUpload(file, onProgress);
        return { file, success: true, asset: result.asset };
      } catch (error) {
        return { file, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(uploadPromises);

    let successCount = 0;
    let errorMessages = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successCount++;
      } else if (result.status === 'fulfilled' && !result.value.success) {
        errorMessages.push(`${result.value.file.name}: ${result.value.error}`);
      } else {
        errorMessages.push(`${result.value?.file?.name || 'Unknown file'}: ${result.reason}`);
      }
    });

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
    setUploadProgress(new Map()); // Clear progress
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

  // Persist provider/model/aspectRatio selections to localStorage
  const saveSelection = (key, value) => {
    try {
      localStorage.setItem(`media-gen-${key}`, value);
    } catch {}
  };

  // Update aiMode based on selectedAssetsForEdit
  useEffect(() => {
    if (selectedAssetsForEdit.length > 0) {
      setAiMode('edit');

      // Auto-select best matching aspect ratio based on the first selected image
      const firstAsset = selectedAssetsForEdit[0];
      if (firstAsset.width && firstAsset.height) {
        const ratio = firstAsset.width / firstAsset.height;
        let bestMatch = '1:1';
        let minDiff = Math.abs(ratio - 1);

        const ratios = [
          { val: '1:1', n: 1 },
          { val: '16:9', n: 16 / 9 },
          { val: '9:16', n: 9 / 16 },
          { val: '4:3', n: 4 / 3 },
          { val: '3:4', n: 3 / 4 },
          { val: '3:2', n: 3 / 2 },
          { val: '2:3', n: 2 / 3 },
          { val: '5:4', n: 5 / 4 },
          { val: '4:5', n: 4 / 5 },
          { val: '4:1', n: 4 / 1 },
          { val: '1:4', n: 1 / 4 },
          { val: '8:1', n: 8 / 1 },
          { val: '1:8', n: 1 / 8 },
        ];

        ratios.forEach((r) => {
          const diff = Math.abs(ratio - r.n);
          if (diff < minDiff) {
            minDiff = diff;
            bestMatch = r.val;
          }
        });
        setAspectRatio(bestMatch);
      }
    } else {
      setAiMode('generate');
    }
  }, [selectedAssetsForEdit]);
  // Fetch available providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/media/models');
        const data = await response.json();
        if (data.providers && data.providers.length > 0) {
          setProviders(data.providers);
          const saved = localStorage.getItem('media-gen-provider');
          const match = saved && data.providers.find((p) => p.id === saved);
          if (match) {
            setSelectedProvider(saved);
          } else {
            const google = data.providers.find((p) => p.isGoogle);
            setSelectedProvider(google ? google.id : data.providers[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      }
    };

    // Restore aspect ratio
    const savedRatio = localStorage.getItem('media-gen-aspectRatio');
    if (savedRatio) setAspectRatio(savedRatio);

    fetchProviders();
  }, []);

  // Fetch models when selected provider changes
  useEffect(() => {
    if (!selectedProvider) return;
    saveSelection('provider', selectedProvider);
    const fetchModelsForProvider = async () => {
      setFetchingModels(true);
      setModels([]);
      setSelectedModel('');
      try {
        const response = await fetch(`/api/media/models?providerId=${selectedProvider}`);
        const data = await response.json();
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          const saved = localStorage.getItem('media-gen-model');
          if (saved && data.models.includes(saved)) {
            setSelectedModel(saved);
          } else {
            const imageModel = data.models.find((m) => m.includes('image'));
            setSelectedModel(imageModel || data.models[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setFetchingModels(false);
      }
    };
    fetchModelsForProvider();
  }, [selectedProvider]);

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

  const handleAiAction = async () => {
    if (!prompt.trim()) {
      setGenerateError('Prompt is required');
      return;
    }

    if (aiMode === 'edit' && selectedAssetsForEdit.length === 0) {
      setGenerateError('Please select at least one image to edit from the gallery below');
      return;
    }

    setIsGenerating(true);
    setGenerateError('');

    try {
      const endpoint = aiMode === 'generate' ? '/api/media/generate' : '/api/media/edit';
      const body =
        aiMode === 'generate'
          ? {
              prompt: prompt.trim(),
              aspectRatio,
              providerId: selectedProvider,
              model: selectedModel,
            }
          : {
              assetIds: selectedAssetsForEdit.map((a) => a._id),
              editPrompt: prompt.trim(),
              aspectRatio,
              providerId: selectedProvider,
              model: selectedModel,
            };

      console.log('Sending AI action request:', { endpoint, body });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        setAssets((prev) => [result.asset, ...prev]);
        setPrompt('');

        // Prepare preview data
        setPreviewData({
          befores: aiMode === 'edit' ? selectedAssetsForEdit.map((a) => a.secure_url) : [],
          after: result.asset.secure_url,
          mode: aiMode,
          aspectRatio: aspectRatio,
        });
        setIsPreviewOpen(true);

        if (aiMode === 'edit') {
          setSelectedAssetsForEdit([]);
          setAiMode('generate');
        }
      } else {
        setGenerateError(
          result.error || `${aiMode === 'generate' ? 'Generation' : 'Editing'} failed`
        );
      }
    } catch (error) {
      setGenerateError('Network error. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProcessImages = async () => {
    setIsProcessing(true);
    setProcessingResults(null);
    try {
      const response = await fetch('/api/admin/media/process', {
        method: 'POST',
      });
      const result = await response.json();

      if (response.ok) {
        setProcessingResults(result);

        // If background processing started (HTTP 202)
        if (response.status === 202) {
          console.log('Background processing started:', result.message);
        } else if (result.results) {
          // If legacy synchronous processing completed (HTTP 200)
          setAssets((prev) =>
            prev.map((asset) => {
              const match = result.results.find((r) => r.id === asset._id);
              if (match && match.success) {
                return { ...asset, aiDescription: match.description };
              }
              return asset;
            })
          );
        }
      } else {
        alert(result.error || 'Failed to process images');
      }
    } catch (error) {
      console.error('Error processing images:', error);
      alert('Internal server error during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  console.log('Rendering MediaLibraryClient with assets:', assets?.length || 0, 'assets');
  console.log('Assets data sample:', assets?.slice(0, 2));

  return (
    <AdminPageWrapper
      title={title || 'Media Library'}
      description={description || 'Upload and manage your images and assets.'}
      actionButton={
        <Button
          onClick={() => document.getElementById('file-upload').click()}
          disabled={isUploading}
          className="bg-black hover:bg-neutral-800 text-white rounded-xl px-6 py-2.5 flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload Images'}
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Upload Section (Hidden Input & Dropzone) */}
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isUploading}
          accept="image/*"
          multiple
        />

        <div
          className={`p-6 border-2 border-dashed rounded-lg transition-all duration-200 ${
            isDragOver
              ? 'border-blue-400 bg-blue-50 scale-102 shadow-lg shadow-blue-500/5'
              : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/30'
          } ${assets.length > 0 ? 'py-4' : 'py-12'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            {assets.length === 0 ? (
              <>
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-200">
                  <Upload className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-lg font-medium text-neutral-700">
                  {isUploading
                    ? 'Processing your files...'
                    : 'Drag & drop files here, or click upload'}
                </p>
                <p className="text-sm text-neutral-500 mt-2">
                  Supports JPEG, PNG, GIF, WebP, SVG (max 10MB each)
                </p>
              </>
            ) : (
              <p className="text-sm text-neutral-500">
                {isDragOver ? (
                  <span className="text-blue-600 font-medium">Drop to add more files</span>
                ) : (
                  'Drag and drop more files here to add them to your library'
                )}
              </p>
            )}
          </div>
        </div>

        {/* Upload Progress Section */}
        {uploadProgress.size > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Progress</h3>
            <div className="space-y-3">
              {Array.from(uploadProgress.entries()).map(([fileName, progress]) => (
                <div key={fileName} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 truncate" title={fileName}>
                        {fileName}
                      </span>
                      <span className="text-sm text-gray-500">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Image Panel (Generate & Edit) */}
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="pb-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-black mb-1 font-['Playfair_Display']">
                  AI Media Studio
                </h3>
                <p className="text-sm text-neutral-500">
                  {aiMode === 'generate'
                    ? 'Generate new images from scratch.'
                    : 'Edit existing images with AI instructions.'}
                </p>
              </div>

              <div className="flex bg-neutral-100 p-1 rounded-xl w-fit self-start pointer-events-none opacity-60">
                <div
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    aiMode === 'generate' ? 'bg-white text-black shadow-sm' : 'text-neutral-500'
                  }`}
                >
                  Generate
                </div>
                <div
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    aiMode === 'edit' ? 'bg-white text-black shadow-sm' : 'text-neutral-500'
                  }`}
                >
                  Edit
                </div>
              </div>
            </div>

            {/* Selected Assets for Editing Preview */}
            {aiMode === 'edit' && (
              <div
                className={`p-4 rounded-xl border transition-all ${
                  selectedAssetsForEdit.length > 0
                    ? 'bg-blue-50 border-blue-100'
                    : 'bg-orange-50 border-orange-100'
                }`}
              >
                {selectedAssetsForEdit.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-blue-900">
                        {selectedAssetsForEdit.length} Image
                        {selectedAssetsForEdit.length > 1 ? 's' : ''} Selected
                      </p>
                      <button
                        onClick={() => setSelectedAssetsForEdit([])}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedAssetsForEdit.map((asset) => (
                        <div key={asset._id} className="relative group">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-blue-200 shadow-sm">
                            <img
                              src={asset.secure_url}
                              alt="Selected"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() =>
                              setSelectedAssetsForEdit((prev) =>
                                prev.filter((a) => a._id !== asset._id)
                              )
                            }
                            className="absolute -top-1.5 -right-1.5 bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center shadow-md border border-neutral-100 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <i className="fas fa-times text-[10px]"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-orange-700">
                    <i className="fas fa-info-circle"></i>
                    <p className="text-sm font-medium">
                      Please select one or more images from the gallery below to start editing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {generateError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <div className="p-1.5 rounded-full bg-red-100">
                  <i className="fas fa-exclamation-circle text-red-600 text-xs"></i>
                </div>
                <p className="text-red-800 text-sm font-medium">{generateError}</p>
              </div>
            )}

            {/* Prompt Templates (Only for Generate) */}
            {aiMode === 'generate' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-800">
                  Quick Start Templates
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {promptTemplates.map((category) => (
                    <div key={category.category} className="space-y-1.5">
                      <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                        {category.category}
                      </div>
                      {category.templates.map((template) => (
                        <button
                          key={template.name}
                          onClick={() => handleTemplateSelect(template.prompt)}
                          className="w-full text-left px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
                          disabled={isGenerating}
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Prompt Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-800">
                {aiMode === 'generate' ? 'Describe Your Image' : 'Describe Changes'}
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none bg-neutral-50 text-sm"
                  placeholder={
                    aiMode === 'generate'
                      ? 'A majestic lion standing on a mountain peak at sunset...'
                      : 'Combine these images into a collage, or change the background of all images...'
                  }
                  rows={3}
                  disabled={
                    isGenerating || (aiMode === 'edit' && selectedAssetsForEdit.length === 0)
                  }
                />
                {prompt && (
                  <div className="absolute bottom-2 right-3 text-[10px] text-neutral-400">
                    {prompt.length} chars
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-neutral-50/50 border border-neutral-200 rounded-2xl">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-600">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  disabled={isGenerating}
                >
                  {providers.length === 0 && <option value="">No providers configured</option>}
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-600">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    saveSelection('model', e.target.value);
                  }}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  disabled={isGenerating || fetchingModels}
                >
                  {fetchingModels ? (
                    <option value="">Loading models...</option>
                  ) : models.length === 0 ? (
                    <option value="">No models available</option>
                  ) : (
                    models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-600">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => {
                    setAspectRatio(e.target.value);
                    saveSelection('aspectRatio', e.target.value);
                  }}
                  className="w-full px-3 py-2.5 border border-neutral-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  disabled={isGenerating}
                >
                  {aspectRatioOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAiAction}
              disabled={
                isGenerating ||
                !prompt.trim() ||
                (aiMode === 'edit' && selectedAssetsForEdit.length === 0)
              }
              className={`w-full py-3 px-6 rounded-xl transition-all text-sm font-medium flex items-center justify-center gap-2.5 ${
                isGenerating ||
                !prompt.trim() ||
                (aiMode === 'edit' && selectedAssetsForEdit.length === 0)
                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                  : aiMode === 'generate'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/10'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin"></div>
                  {aiMode === 'generate' ? 'Generating...' : 'Editing...'}
                </>
              ) : (
                <>
                  <i
                    className={`fas ${aiMode === 'generate' ? 'fa-sparkles' : 'fa-magic'} text-xs`}
                  ></i>
                  {aiMode === 'generate' ? 'Generate Image' : 'Apply AI Edits'}
                </>
              )}
            </button>
          </div>
        </div>

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
                  <option value="gemini">AI Generated</option>
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
          <div className="flex flex-col gap-3 mb-4">
            {/* AI Processing Banner (Only show if images need processing or is currently processing) */}
            {(assets.filter((a) => !a.aiDescription).length > 0 || isProcessing) && (
              <div className="flex items-center gap-4 p-3 px-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <div className="flex -space-x-2 overflow-hidden">
                  {assets
                    .filter((a) => !a.aiDescription)
                    .slice(0, 3)
                    .map((asset, i) => (
                      <img
                        key={i}
                        src={asset.secure_url}
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                  {assets.filter((a) => !a.aiDescription).length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">
                      +{assets.filter((a) => !a.aiDescription).length - 3}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-900">
                    {isProcessing
                      ? 'AI Agent is currently analyzing your images...'
                      : `${assets.filter((a) => !a.aiDescription).length} images need processing for AI search`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsAgentSettingsOpen(true)}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Agent Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <Button
                    onClick={handleProcessImages}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-xl h-8 px-4 text-xs font-semibold shadow-sm flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                    {isProcessing ? 'Processing...' : 'Process All'}
                  </Button>
                </div>
              </div>
            )}

            {processingResults && (
              <div className="p-3 px-4 bg-green-50 border border-green-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-medium text-green-800">
                  {processingResults.message}
                  {processingResults.results &&
                    ` ${processingResults.results.filter((r) => r.success).length} successful.`}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl">
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
                          const regularImg = document.querySelector(
                            `[data-asset-id="${asset._id}"]`
                          );
                          if (regularImg) regularImg.style.display = 'none';
                          // Hide loading skeleton
                          const skeleton =
                            regularImg?.parentElement?.querySelector('.animate-pulse');
                          if (skeleton) skeleton.style.display = 'none';
                        }}
                        onError={(e) => {
                          console.error('Next.js Image failed to load:', asset.secure_url);
                          // Show regular img if Next.js fails
                          const regularImg = document.querySelector(
                            `[data-asset-id="${asset._id}"]`
                          );
                          if (regularImg) regularImg.style.display = 'block';
                        }}
                      />

                      {/* Source Badge */}
                      {(asset.source === 'gemini' || asset.source === 'pollinations') && (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full z-10">
                          AI Generated
                        </div>
                      )}

                      {/* Delete Button Overlay */}
                      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(asset.secure_url);
                            // Optional: Show a toast or temporary success state
                            const btn = e.currentTarget;
                            const originalIcon = btn.innerHTML;
                            btn.innerHTML = '<i class="fas fa-check"></i>';
                            setTimeout(() => {
                              btn.innerHTML = originalIcon;
                            }, 2000);
                          }}
                          className="bg-white hover:bg-gray-100 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium transition-colors shadow-lg"
                          title="Copy URL"
                        >
                          <i className="fas fa-link"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssetsForEdit((prev) => {
                              if (prev.some((a) => a._id === asset._id)) return prev;
                              return [...prev, asset];
                            });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="bg-black hover:bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium transition-colors shadow-lg border border-white/20"
                          title="Add to AI Edit"
                        >
                          <i className="fas fa-magic"></i>
                        </button>
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
                      {(asset.source === 'gemini' || asset.source === 'pollinations') &&
                        asset.prompt && (
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[10px] p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm"
                            title={asset.prompt}
                          >
                            <p className="truncate font-medium">Prompt: {asset.prompt}</p>
                          </div>
                        )}

                      {/* AI Description Overlay (New) */}
                      {asset.aiDescription && (
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-black/90 text-white text-[10px] p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-sm border-t border-white/10"
                          title={asset.aiDescription}
                        >
                          <p className="line-clamp-2 font-medium">AI: {asset.aiDescription}</p>
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

        {/* AI Result Preview Modal */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="sm:max-w-2xl bg-neutral-900 border-neutral-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-['Playfair_Display'] text-white">
                {previewData?.mode === 'edit' ? 'AI Edit Result' : 'AI Generation Result'}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-white">
              {previewData?.mode === 'edit' && previewData?.befores?.length > 0 ? (
                <div className="space-y-6">
                  <div className="space-y-4 text-white">
                    <p className="text-sm text-neutral-400">
                      {previewData.befores.length > 1
                        ? 'You used multiple images as input. Here is the comparison with the primary image.'
                        : 'Slide to compare the original and the AI-edited version.'}
                    </p>
                    <BeforeAfterSlider
                      before={previewData.befores[0]}
                      after={previewData.after}
                      aspectRatio={previewData.aspectRatio}
                    />
                  </div>

                  {previewData.befores.length > 1 && (
                    <div className="space-y-4 pt-4 border-t border-neutral-800">
                      <p className="text-sm font-medium text-neutral-200">All Input Images</p>
                      <MultiImagePreview
                        images={previewData.befores}
                        aspectRatio={previewData.aspectRatio}
                      />
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-neutral-800 text-white">
                    <p className="text-sm font-medium text-neutral-200">Final Result</p>
                    <div
                      className={`relative w-full overflow-hidden rounded-xl border border-neutral-800 ${
                        previewData?.aspectRatio === '16:9'
                          ? 'aspect-video'
                          : previewData?.aspectRatio === '9:16'
                            ? 'aspect-[9/16]'
                            : 'aspect-square'
                      }`}
                    >
                      <Image
                        src={previewData?.after}
                        alt="Generated Result"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-white">
                  <p className="text-sm text-neutral-400">Your new AI-generated image is ready.</p>
                  <div
                    className={`relative w-full overflow-hidden rounded-xl border border-neutral-800 ${
                      previewData?.aspectRatio === '16:9'
                        ? 'aspect-video'
                        : previewData?.aspectRatio === '9:16'
                          ? 'aspect-[9/16]'
                          : 'aspect-square'
                    }`}
                  >
                    <Image
                      src={previewData?.after}
                      alt="Generated Result"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
              >
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Lightbox */}
        <ImageLightbox
          asset={paginatedAssets[currentImageIndex]}
          isOpen={lightboxOpen}
          onClose={closeLightbox}
          onNext={goToNextImage}
          onPrevious={goToPreviousImage}
          currentIndex={currentImageIndex}
          totalCount={paginatedAssets.length}
        />

        <MediaAgentSettingsModal
          isOpen={isAgentSettingsOpen}
          onClose={() => setIsAgentSettingsOpen(false)}
          onSave={() => {
            // Could show a toast here
          }}
        />
      </div>
    </AdminPageWrapper>
  );
}
