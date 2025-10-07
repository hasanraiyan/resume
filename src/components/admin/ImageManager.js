'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

export default function ImageManager({ images, setImages }) {
  const [editingIndex, setEditingIndex] = useState(null);

  const addImage = () => {
    setImages([...images, { url: '', alt: '', caption: '' }]);
    setEditingIndex(images.length);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const updateImage = (index, field, value) => {
    const newImages = [...images];
    newImages[index][field] = value;
    setImages(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {images.map((image, index) => (
          <div key={index} className="p-4 border border-neutral-200 rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm truncate pr-4">
                {image.url || `Image ${index + 1}`}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  className="text-sm text-neutral-600 hover:text-black"
                >
                  {editingIndex === index ? 'Collapse' : 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
            {editingIndex === index && (
              <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    value={image.url}
                    onChange={(e) => updateImage(index, 'url', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase">
                    Alt Text
                  </label>
                  <input
                    type="text"
                    value={image.alt}
                    onChange={(e) => updateImage(index, 'alt', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase">
                    Caption
                  </label>
                  <input
                    type="text"
                    value={image.caption}
                    onChange={(e) => updateImage(index, 'caption', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <Button type="button" onClick={addImage} variant="secondary" size="small">
        <i className="fas fa-plus mr-2"></i> Add Image
      </Button>
    </div>
  );
}
