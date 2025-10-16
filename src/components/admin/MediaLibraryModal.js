// src/components/admin/MediaLibraryModal.js
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function MediaLibraryModal({ isOpen, onClose, onSelect }) {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Fetch assets when the modal opens
      const fetchAssets = async () => {
        try {
          console.log('Fetching assets for modal...');
          const res = await fetch('/api/media');
          const data = await res.json();
          console.log('Modal assets fetched:', data.assets?.length || 0, 'assets');
          setAssets(data.assets || []);
        } catch (error) {
          console.error('Failed to fetch assets for modal:', error);
          setAssets([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAssets();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Select an Asset</h3>
          <button onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Loading assets...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-image text-4xl mb-3"></i>
              <p>No assets found. Upload some images first!</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset._id}
                  className="relative aspect-square border rounded-lg overflow-hidden cursor-pointer bg-gray-100"
                  onClick={() => onSelect(asset)}
                >
                  <div className="aspect-square relative">
                    <Image
                      src={asset.secure_url}
                      alt={asset.filename}
                      fill
                      className="object-cover transition-opacity duration-200"
                      sizes="(max-width: 640px) 25vw, (max-width: 768px) 16vw, (max-width: 1024px) 12vw, 12vw"
                      onError={(e) => {
                        console.error('Modal image failed to load:', asset.secure_url);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
