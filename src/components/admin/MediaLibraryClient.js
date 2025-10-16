// src/components/admin/MediaLibraryClient.js
'use client';

import { useState } from 'react';
import { deleteAsset } from '@/app/actions/mediaActions';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';

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
  const [uploadError, setUploadError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  console.log('Assets state initialized:', assets?.length || 0, 'assets');

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

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{uploadError}</p>
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
                className="relative group border rounded-lg overflow-hidden bg-gray-100"
              >
                {/* Image Section - Square aspect ratio */}
                <div className="aspect-square relative">
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
                    style={{ zIndex: 2, opacity: 0.8 }}
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

                  {/* Loading placeholder */}
                  <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                </div>

                {/* Content Section - Always visible */}
                <div className="p-3">
                  {/* Top row: Filename and Delete button */}
                  <div className="flex justify-between items-start mb-2">
                    {/* Filename */}
                    <p
                      className="text-sm font-medium text-gray-900 truncate flex-1 mr-2"
                      title={asset.filename}
                    >
                      {asset.filename}
                    </p>

                    {/* Delete button - completely separate from image */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${asset.filename}"? This action cannot be undone.`)) {
                          handleDelete(asset._id);
                        }
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
    </div>
  );
}
